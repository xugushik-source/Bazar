// Уведомления для поставщиков и курьеров. Клиенту ничего не отправляется: он заказал и забыл,
// доставка появляется у него в кабинете.
//
// Что уходит кому (время — Asia/Tbilisi):
//  • поставщику (чат SUPPLIER, ref_id = поставщик): вечером (19:00) — что подготовить на завтра;
//    утром (09:00) — что передать сегодня. Количества по его товарам, суммированные по всем заказам дня.
//  • курьерской группе (чат DRIVER): вечером (19:00) — полный список доставок на завтра по времени, с адресами
//    и телефонами; утром (09:00) — список на сегодня. Курьеры берут доставки заранее и развозят сами.
//    Группа должна состоять только из курьеров и владельца.
//  • личному чату курьера (PERSONAL): утром — его назначенные заказы на сегодня.
//
// Правила:
//  • Одно сообщение — одна строка: dedup_key UNIQUE. Повторный запуск cron дубля не создаёт.
//  • Нет чата или Telegram выключен — строка становится OPERATOR_TASK. Имитации отправки нет.
//  • Ошибка Telegram до доставки — повтор с паузой; неизвестный исход — AMBIGUOUS, без автоповтора.
import {q,clock,parse} from './commerce.mjs';
import {uuid,now} from './security.mjs';
import {addDays} from './subscriptions.mjs';
import {configured,telegramCall} from './telegram.mjs';

export const TZ='Asia/Tbilisi';
export const MORNING_MINUTE=540;   // 09:00
export const EVENING_MINUTE=1140;  // 19:00
export const MAX_ATTEMPTS=5;
const LANGS=['ru','hy','ka'];
const DEFAULT_AREA='Ахалкалаки';

// Тексты ru/hy/ka. Армянский и грузинский — черновики: нужна проверка носителем языка.
const UNIT={ru:{kg:'кг',g:'г',pc:'шт'},hy:{kg:'կգ',g:'գ',pc:'հատ'},ka:{kg:'კგ',g:'გ',pc:'ც'}};
const T={
  supplierLabel:{ru:{am:'Сегодня передать',pm:'Завтра подготовить'},hy:{am:'Այսօր հանձնել',pm:'Վաղը պատրաստել'},ka:{am:'დღეს გადასაცემად',pm:'ხვალისთვის მოსამზადებლად'}},
  supplier:{
    ru:d=>`${d.label} (${d.day}): ${d.lines}. Заказов: ${d.orders}.`,
    hy:d=>`${d.label} (${d.day})՝ ${d.lines}։ Պատվերներ՝ ${d.orders}։`,
    ka:d=>`${d.label} (${d.day}): ${d.lines}. შეკვეთები: ${d.orders}.`},
  driverLabel:{ru:{am:'Доставки на сегодня',pm:'Доставки на завтра'},hy:{am:'Այսօրվա առաքումները',pm:'Վաղվա առաքումները'},ka:{am:'დღევანდელი მიტანები',pm:'ხვალინდელი მიტანები'}},
  driverList:{
    ru:d=>`${d.label} (${d.day}): всего ${d.n}.\n${d.lines}`,
    hy:d=>`${d.label} (${d.day})՝ ընդամենը ${d.n}։\n${d.lines}`,
    ka:d=>`${d.label} (${d.day}): სულ ${d.n}.\n${d.lines}`},
  driverLine:{
    ru:d=>`${d.time} · ${d.area} · ${d.address} · ${d.name} ${d.phone} · ${d.n} тов.`,
    hy:d=>`${d.time} · ${d.area} · ${d.address} · ${d.name} ${d.phone} · ${d.n} ապր.`,
    ka:d=>`${d.time} · ${d.area} · ${d.address} · ${d.name} ${d.phone} · ${d.n} პრ.`},
  route:{
    ru:d=>`Ваши назначенные заказы на ${d.day}:\n${d.lines}`,
    hy:d=>`Ձեր նշանակված պատվերները ${d.day}-ի համար՝\n${d.lines}`,
    ka:d=>`თქვენთვის მინიჭებული შეკვეთები ${d.day}-ისთვის:\n${d.lines}`},
};

// Короткий хэш текста (FNV-1a) для ключа дедупликации. Коллизия безвредна: худший случай — одно лишнее сообщение.
export const textHash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(16)};

const pad=n=>String(n).padStart(2,'0');
const hhmm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const lang=v=>LANGS.includes(v)?v:'ru';
// Адрес заказа начинается с названия зоны («Бавра: ул. …»). Без зоны — город.
const areaOf=address=>{const a=String(address||'');const i=a.indexOf(':');return i>0?a.slice(0,i):DEFAULT_AREA};
const streetOf=address=>String(address||'').replace(/^[^:]*:\s*/,'');

// Количество строки заказа: весовой товар — граммы, штучный — штуки.
function quantityOf(quote){
  const qt=parse(quote,{});
  if(Number.isInteger(qt.target_g))return {g:qt.target_g,pc:0};
  if(Number.isInteger(qt.count))return {g:0,pc:qt.count};
  return {g:0,pc:1};
}
function fmtQty(g,pc,L){
  const u=UNIT[L];
  const parts=[];
  if(g>=1000)parts.push((g/1000).toFixed(2).replace(/\.?0+$/,'').replace('.',',')+' '+u.kg);
  else if(g>0)parts.push(g+' '+u.g);
  if(pc>0)parts.push(pc+' '+u.pc);
  return parts.join(' + ')||'1 '+u.pc;
}

// Строка создаётся один раз; dedup_key UNIQUE не даёт второго сообщения. Возвращает true, если строка новая.
async function insertOnce(db,{key,audience,chatId,lang:L,text,status,reason}){
  // ON CONFLICT DO NOTHING: дубль пропускаем, а нарушение схемы (CHECK, FK) остаётся видимой ошибкой. INSERT OR IGNORE скрыл бы её.
  const r=await q(db,'INSERT INTO subscription_notifications(id,dedup_key,audience,program_id,chat_id,lang,text,status,reason,attempts,next_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,0,0,?) ON CONFLICT(dedup_key) DO NOTHING',
    uuid(),key,audience,null,chatId||null,lang(L),text,status,reason||null,now()).run();
  return r.meta?.changes>0;
}
// Нет чата или Telegram выключен → задача оператору, а не имитация отправки.
function routeFor(chatId,telegramOn){
  if(!chatId)return {status:'OPERATOR_TASK',reason:'NO_CHANNEL'};
  if(!telegramOn)return {status:'OPERATOR_TASK',reason:'TELEGRAM_OFF'};
  return {status:'PENDING',reason:null};
}

// ---------- генерация ----------
export async function buildNotifications(db,at=new Date(),{telegramOn=false}={}){
  const c=clock(TZ,at),today=c.day,minute=c.minute,tomorrow=addDays(today,1);
  const made={supplier:0,driver:0};
  const add=async(bucket,args)=>{if(await insertOnce(db,args))made[bucket]++};

  // 1) Поставщики: что подготовить / передать.
  const suppliers=(await db.prepare("SELECT * FROM tg_links WHERE kind='SUPPLIER' AND active=1").all()).results;
  for(const s of suppliers){
    const L=lang(s.lang);
    if(minute>=EVENING_MINUTE)await supplierDigest(db,s,tomorrow,'pm',L,telegramOn,add);
    if(minute>=MORNING_MINUTE)await supplierDigest(db,s,today,'am',L,telegramOn,add);
  }

  // 2) Курьерская группа: полный список доставок дня.
  const groups=(await db.prepare("SELECT * FROM tg_links WHERE kind='DRIVER' AND active=1").all()).results;
  for(const g of groups){
    const L=lang(g.lang);
    if(minute>=EVENING_MINUTE)await driverList(db,g,tomorrow,'pm',L,telegramOn,add);
    if(minute>=MORNING_MINUTE)await driverList(db,g,today,'am',L,telegramOn,add);
  }

  // 3) Личный чат курьера: только назначенные ему заказы на сегодня.
  if(minute>=MORNING_MINUTE){
    const persons=(await db.prepare("SELECT * FROM tg_links WHERE kind='PERSONAL' AND active=1").all()).results;
    for(const p of persons){
      const L=lang(p.lang);
      const list=(await db.prepare("SELECT o.id,o.minute,o.customer,(SELECT COUNT(*) FROM order_lines l WHERE l.order_id=o.id) AS n FROM orders o WHERE o.day=? AND o.driver_id=? AND o.status NOT IN ('CANCELLED','COMPLETED') ORDER BY o.minute").bind(today,p.ref_id).all()).results;
      if(!list.length)continue;
      const lines=list.map(o=>{const cu=parse(o.customer,{});return T.driverLine[L]({time:hhmm(o.minute),area:areaOf(cu.address),address:streetOf(cu.address),name:cu.name||'',phone:cu.phone||'',n:o.n})}).join('\n');
      await add('driver',{...routeFor(p.chat_id,telegramOn),audience:'DRIVER_PERSONAL',chatId:p.chat_id,lang:L,key:`DRIVER:AM:${today}:${p.id}`,text:T.route[L]({day:today,lines})});
    }
  }
  return made;
}

// Что поставщику подготовить на день: товары его ассортимента, суммированные по всем заказам дня.
async function supplierDigest(db,s,day,slot,L,telegramOn,add){
  const rows=(await db.prepare(`SELECT l.quote,p.names,o.id AS order_id FROM order_lines l
    JOIN orders o ON o.id=l.order_id JOIN products p ON p.id=l.product_id
    WHERE l.vendor_id=? AND o.day=? AND o.status<>'CANCELLED'`).bind(s.ref_id,day).all()).results;
  if(!rows.length)return;
  const byProduct=new Map(),orders=new Set();
  for(const r of rows){
    const name=parse(r.names,{})[L]||parse(r.names,{}).ru||'';
    const qty=quantityOf(r.quote);
    const cur=byProduct.get(name)||{g:0,pc:0};
    cur.g+=qty.g;cur.pc+=qty.pc;
    byProduct.set(name,cur);
    orders.add(r.order_id);
  }
  const lines=[...byProduct.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([n,v])=>`${n} — ${fmtQty(v.g,v.pc,L)}`).join('; ');
  const text=T.supplier[L]({label:T.supplierLabel[L][slot],day,lines,orders:orders.size});
  // Ключ содержит хэш текста: изменился состав заказов — уходит новая сводка, а не старая остаётся без обновления.
  await add('supplier',{...routeFor(s.chat_id,telegramOn),audience:'SUPPLIER',chatId:s.chat_id,lang:L,key:`SUPPLIER:${slot.toUpperCase()}:${day}:${s.id}:${textHash(text)}`,text});
}

// Полный список доставок дня для курьерской группы: время, адрес, получатель, телефон.
async function driverList(db,g,day,slot,L,telegramOn,add){
  const list=(await db.prepare("SELECT o.minute,o.customer,(SELECT COUNT(*) FROM order_lines l WHERE l.order_id=o.id) AS n FROM orders o WHERE o.day=? AND o.status NOT IN ('CANCELLED') ORDER BY o.minute").bind(day).all()).results;
  if(!list.length)return;
  const lines=list.map(o=>{const cu=parse(o.customer,{});return T.driverLine[L]({time:hhmm(o.minute),area:areaOf(cu.address),address:streetOf(cu.address),name:cu.name||'',phone:cu.phone||'',n:o.n})}).join('\n');
  const text=T.driverList[L]({label:T.driverLabel[L][slot],day,n:list.length,lines});
  await add('driver',{...routeFor(g.chat_id,telegramOn),audience:'DRIVER_GROUP',chatId:g.chat_id,lang:L,key:`DRIVER_LIST:${slot.toUpperCase()}:${day}:${g.id}:${textHash(text)}`,text});
}

// ---------- отправка ----------
// sender(env, method, body). По умолчанию — настоящий Telegram; в тестах подменяется.
export async function sendNotifications(db,env,{sender=telegramCall,at=new Date(),limit=20}={}){
  const report={sent:0,retry:0,ambiguous:0,failed:0};
  const due=(await db.prepare("SELECT * FROM subscription_notifications WHERE status='PENDING' AND next_at<=? ORDER BY created_at LIMIT ?").bind(at.getTime(),limit).all()).results;
  for(const n of due){
    if(!n.chat_id){await setStatus(db,n.id,'OPERATOR_TASK','NO_CHANNEL');continue}
    try{
      await sender(env,'sendMessage',{chat_id:n.chat_id,text:n.text});
      await q(db,"UPDATE subscription_notifications SET status='SENT',sent_at=?,attempts=attempts+1 WHERE id=?",now(),n.id).run();
      report.sent++;
    }catch(e){
      if(e.ambiguous){await setStatus(db,n.id,'AMBIGUOUS','SEND_UNKNOWN');report.ambiguous++;continue}
      const attempts=n.attempts+1;
      if(attempts>=MAX_ATTEMPTS){await setStatus(db,n.id,'FAILED',String(e.message||'SEND_FAILED'));report.failed++;continue}
      const pauseMs=(Number(e.retryAfter)||Math.min(3600,30*2**attempts))*1000;
      await q(db,"UPDATE subscription_notifications SET attempts=?,next_at=?,reason=? WHERE id=?",attempts,at.getTime()+pauseMs,String(e.message||'RETRY'),n.id).run();
      report.retry++;
    }
  }
  return report;
}
async function setStatus(db,id,status,reason){await q(db,'UPDATE subscription_notifications SET status=?,reason=? WHERE id=?',status,reason,id).run()}

// Один запуск по cron: генерация всегда, отправка — только если Telegram настроен.
export async function runNotifications(env,at=new Date(),sender=telegramCall){
  const telegramOn=configured(env);
  const built=await buildNotifications(env.DB,at,{telegramOn});
  const sent=telegramOn?await sendNotifications(env.DB,env,{sender,at}):null;
  return {built,sent,telegramOn};
}

// Задачи оператору: всё, что не ушло автоматически.
export async function operatorTasks(db,{limit=200}={}){
  return (await db.prepare("SELECT id,dedup_key,audience,chat_id,lang,text,status,reason,attempts,created_at FROM subscription_notifications WHERE status IN ('OPERATOR_TASK','FAILED','AMBIGUOUS') ORDER BY created_at DESC LIMIT ?").bind(limit).all()).results;
}
