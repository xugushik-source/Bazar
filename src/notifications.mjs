// Напоминания и диспетчерские списки для программ «Забота о близких» и курьеров.
//
// Что уходит кому (время — Asia/Tbilisi):
//  • плательщику программы: «заказ создан» (сразу), «завтра доставка» (19:00 накануне), «сегодня доставка» (09:00 в день),
//    «нужно ваше решение» (доставка застряла), «доставлено» (только после подтверждения заказа);
//  • общей курьерской группе: сводка на сегодня (09:00) и на завтра (19:00) — только количества по населённым пунктам,
//    без имён, адресов и телефонов;
//  • личному чату курьера: его назначенные заказы на сегодня с адресами и телефонами получателей.
//
// Правила:
//  • Одно сообщение — одна строка: dedup_key UNIQUE. Повторный запуск cron дубля не создаёт.
//  • Нет канала (нет чата или Telegram выключен) — строка становится OPERATOR_TASK: задача оператору, а не имитация отправки.
//  • Отправка: ошибка Telegram до доставки — повтор с паузой; неизвестный исход (ambiguous) — не повторяется автоматически,
//    помечается AMBIGUOUS для решения оператора.
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

// ---------- тексты (ru/hy/ka). Армянский и грузинский — черновики: нужна проверка носителем языка. ----------
const T={
  created:{
    ru:d=>`Заказ на ${d.day} в ${d.time} создан. Товаров: ${d.n}. Сумма ${d.sum} ₾ оплачена из средств программы.`,
    hy:d=>`${d.day}-ի ${d.time}-ի պատվերը ստեղծված է։ Ապրանքներ՝ ${d.n}։ Գումարը՝ ${d.sum} ₾, վճարված է ծրագրի միջոցներից։`,
    ka:d=>`შეკვეთა ${d.day}-ისთვის, ${d.time}-ზე შეიქმნა. პროდუქტები: ${d.n}. თანხა ${d.sum} ₾, გადახდილია პროგრამის სახსრებიდან.`},
  tomorrow:{
    ru:d=>`Завтра, ${d.day} в ${d.time}, доставка: ${d.n} товаров, ${d.sum} ₾. Ничего делать не нужно.`,
    hy:d=>`Վաղը, ${d.day}-ին, ժամը ${d.time}-ին, առաքում՝ ${d.n} ապրանք, ${d.sum} ₾։ Ոչինչ անելու կարիք չկա։`,
    ka:d=>`ხვალ, ${d.day}, ${d.time}-ზე, მიტანა: ${d.n} პროდუქტი, ${d.sum} ₾. არაფრის კეთება არ გჭირდებათ.`},
  today:{
    ru:d=>`Сегодня доставка получателю около ${d.time}. Товаров: ${d.n}, сумма ${d.sum} ₾.`,
    hy:d=>`Այսօր առաքում ստացողին՝ մոտ ժամը ${d.time}-ին։ Ապրանքներ՝ ${d.n}, գումար՝ ${d.sum} ₾։`,
    ka:d=>`დღეს მიტანა მიმღებთან დაახლოებით ${d.time}-ზე. პროდუქტები: ${d.n}, თანხა ${d.sum} ₾.`},
  action:{
    ru:d=>`Нужно ваше решение по доставке ${d.day}: ${d.reason}. Откройте программу на сайте.`,
    hy:d=>`Ձեր որոշումն է պետք ${d.day}-ի առաքման համար՝ ${d.reason}։ Բացեք ծրագիրը կայքում։`,
    ka:d=>`${d.day}-ის მიტანისთვის თქვენი გადაწყვეტილებაა საჭირო: ${d.reason}. გახსენით პროგრამა საიტზე.`},
  delivered:{
    ru:d=>`Доставка подтверждена: ${d.day}, ${d.n} товаров, сумма ${d.sum} ₾.`,
    hy:d=>`Առաքումը հաստատված է՝ ${d.day}, ${d.n} ապրանք, գումար՝ ${d.sum} ₾։`,
    ka:d=>`მიტანა დადასტურებულია: ${d.day}, ${d.n} პროდუქტი, თანხა ${d.sum} ₾.`},
  digest:{
    ru:d=>`${d.label}: всего заказов ${d.total}.${d.lines?' По населённым пунктам: '+d.lines+'.':''}`,
    hy:d=>`${d.label}՝ պատվերներ ընդամենը ${d.total}։${d.lines?' Բնակավայրերով՝ '+d.lines+'։':''}`,
    ka:d=>`${d.label}: შეკვეთები სულ ${d.total}.${d.lines?' დასახლებების მიხედვით: '+d.lines+'.':''}`},
  digestLabel:{
    ru:{am:'Заказы на сегодня',pm:'Заказы на завтра'},
    hy:{am:'Այսօրվա պատվերները',pm:'Վաղվա պատվերները'},
    ka:{am:'დღევანდელი შეკვეთები',pm:'ხვალინდელი შეკვეთები'}},
  route:{
    ru:d=>`Ваши заказы на ${d.day}:\n${d.lines}`,
    hy:d=>`Ձեր պատվերները ${d.day}-ի համար՝\n${d.lines}`,
    ka:d=>`თქვენი შეკვეთები ${d.day}-ისთვის:\n${d.lines}`},
  routeLine:{
    ru:d=>`${d.time} · ${d.area} · ${d.address} · ${d.name} ${d.phone} · ${d.n} тов.`,
    hy:d=>`${d.time} · ${d.area} · ${d.address} · ${d.name} ${d.phone} · ${d.n} ապր.`,
    ka:d=>`${d.time} · ${d.area} · ${d.address} · ${d.name} ${d.phone} · ${d.n} პრ.`},
};
const REASON={
  WAITING_APPROVAL:{ru:'новая цена выше допустимой суммы',hy:'նոր գինը գերազանցում է թույլատրելի գումարը',ka:'ახალი ფასი დასაშვებ თანხაზე მაღალია'},
  WAITING_FUNDS:{ru:'закончились средства программы',hy:'ծրագրի միջոցները սպառվել են',ka:'პროგრამის სახსრები ამოიწურა'},
  WAITING_STOCK:{ru:'часть товаров временно отсутствует',hy:'որոշ ապրանքներ ժամանակավորապես չկան',ka:'ზოგი პროდუქტი დროებით არ არის'},
  WAITING_SLOT:{ru:'нет свободного времени доставки',hy:'առաքման ազատ ժամանակ չկա',ka:'მიტანის თავისუფალი დრო არ არის'},
  WAITING_CHANGE:{ru:'не выполнено условие минимальной суммы заказа',hy:'պատվերի նվազագույն գումարի պայմանը չի կատարվել',ka:'შეკვეთის მინიმალური თანხის პირობა არ სრულდება'},
};

const money=minor=>(Number(minor||0)/100).toFixed(2);
const pad=n=>String(n).padStart(2,'0');
const hhmm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const lang=v=>LANGS.includes(v)?v:'ru';
// Адрес заказа начинается с названия зоны («Бавра: ул. …»), если зона есть. Без зоны — город.
const areaOf=address=>{const a=String(address||'');const i=a.indexOf(':');return i>0?a.slice(0,i):DEFAULT_AREA};
const streetOf=address=>String(address||'').replace(/^[^:]*:\s*/,'');

// Строка создаётся один раз; dedup_key UNIQUE не даёт второго сообщения. Возвращает true, если строка новая.
async function insertOnce(db,{key,audience,programId,chatId,lang:L,text,status,reason}){
  const r=await q(db,'INSERT OR IGNORE INTO subscription_notifications(id,dedup_key,audience,program_id,chat_id,lang,text,status,reason,attempts,next_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,0,0,?)',
    uuid(),key,audience,programId||null,chatId||null,lang(L),text,status,reason||null,now()).run();
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
  const made={payer:0,driver:0};
  const add=async(bucket,args)=>{if(await insertOnce(db,args))made[bucket]++};

  // 1) Плательщик: по доставкам программ.
  const rows=(await db.prepare(`SELECT d.id,d.day,d.minute,d.status,d.order_id,p.id AS program_id,p.items,o.total AS order_total,o.status AS order_status
    FROM subscription_deliveries d JOIN subscription_programs p ON p.id=d.program_id
    LEFT JOIN orders o ON o.id=d.order_id
    WHERE p.status='ACTIVE' AND d.day>=? ORDER BY d.day`).bind(today).all()).results;
  for(const d of rows){
    const ch=await db.prepare("SELECT chat_id,lang FROM subscription_channels WHERE program_id=? AND active=1").bind(d.program_id).first();
    const L=lang(ch?.lang);
    const route=routeFor(ch?.chat_id,telegramOn);
    const base={audience:'PAYER',programId:d.program_id,chatId:ch?.chat_id,lang:L,...route};
    const data={day:d.day,time:hhmm(d.minute),n:parse(d.items,[]).length,sum:money(d.order_total??0)};
    if(d.status==='ORDERED'){
      await add('payer',{...base,key:`PAYER:CREATED:${d.id}`,text:T.created[L](data)});
      if(d.day===tomorrow&&minute>=EVENING_MINUTE)await add('payer',{...base,key:`PAYER:D1:${d.id}`,text:T.tomorrow[L](data)});
      if(d.day===today&&minute>=MORNING_MINUTE)await add('payer',{...base,key:`PAYER:D0:${d.id}`,text:T.today[L](data)});
      if(d.order_status==='COMPLETED')await add('payer',{...base,key:`PAYER:DONE:${d.order_id}`,text:T.delivered[L](data)});
    }else if(d.status.startsWith('WAITING_')){
      const reason=REASON[d.status]?.[L]||d.status;
      await add('payer',{...base,key:`PAYER:ACTION:${d.id}:${d.status}`,text:T.action[L]({day:d.day,reason})});
    }
  }

  // 2) Сводки общей курьерской группы: сегодня утром, завтра вечером. Только количества.
  const groups=(await db.prepare("SELECT * FROM tg_links WHERE kind='DRIVER' AND active=1").all()).results;
  for(const g of groups){
    if(minute>=MORNING_MINUTE)await digest(db,g,today,'am',telegramOn,add);
    if(minute>=EVENING_MINUTE)await digest(db,g,tomorrow,'pm',telegramOn,add);
  }

  // 3) Личный маршрут курьера на сегодня: только назначенные ему заказы, с адресами и телефонами.
  if(minute>=MORNING_MINUTE){
    const persons=(await db.prepare("SELECT * FROM tg_links WHERE kind='PERSONAL' AND active=1").all()).results;
    for(const p of persons){
      const L=lang(p.lang);
      const list=(await db.prepare("SELECT o.id,o.minute,o.customer,(SELECT COUNT(*) FROM order_lines l WHERE l.order_id=o.id) AS n FROM orders o WHERE o.day=? AND o.driver_id=? AND o.status NOT IN ('CANCELLED','COMPLETED') ORDER BY o.minute").bind(today,p.ref_id).all()).results;
      if(!list.length)continue;
      const lines=list.map(o=>{const cu=parse(o.customer,{});return T.routeLine[L]({time:hhmm(o.minute),area:areaOf(cu.address),address:streetOf(cu.address),name:cu.name||'',phone:cu.phone||'',n:o.n})}).join('\n');
      const route=routeFor(p.chat_id,telegramOn);
      await add('driver',{...route,audience:'DRIVER_PERSONAL',chatId:p.chat_id,lang:L,key:`DRIVER:AM:${today}:${p.id}`,text:T.route[L]({day:today,lines})});
    }
  }
  return made;
}

async function digest(db,g,day,slot,telegramOn,add){
  const L=lang(g.lang);
  const orders=(await db.prepare("SELECT customer FROM orders WHERE day=? AND status<>'CANCELLED' ORDER BY minute").bind(day).all()).results;
  const areas={};
  for(const o of orders){const a=areaOf(parse(o.customer,{}).address);areas[a]=(areas[a]||0)+1}
  const lines=Object.entries(areas).map(([a,n])=>`${a} — ${n}`).join('; ');
  const text=T.digest[L]({label:T.digestLabel[L][slot],total:orders.length,lines});
  const route=routeFor(g.chat_id,telegramOn);
  await add('driver',{...route,audience:'DRIVER_GROUP',chatId:g.chat_id,lang:L,key:`DISPATCH:${slot.toUpperCase()}:${day}:${g.id}`,text});
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
  return (await db.prepare("SELECT id,dedup_key,audience,program_id,chat_id,lang,text,status,reason,attempts,created_at FROM subscription_notifications WHERE status IN ('OPERATOR_TASK','FAILED','AMBIGUOUS') ORDER BY created_at DESC LIMIT ?").bind(limit).all()).results;
}
