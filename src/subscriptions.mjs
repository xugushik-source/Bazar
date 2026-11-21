// «БАЗАР — Забота о близких»: регулярные программы доставки.
//
// Правила, которые держит этот модуль:
//  • Цена доставки считается тем же кодом, что и у обычного заказа: priceBasket() + deliveryFee().
//  • Каждая доставка становится обычным заказом через createOrder(); склад, слоты и часы приёма проверяет он.
//  • Деньги списываются только с ПОДТВЕРЖДЁННЫХ оператором пополнений (subscription_funds). Оплата сама не считается
//    подтверждённой по нажатию кнопки клиента.
//  • Заказ создаётся за ORDER_LEAD_DAYS дней до доставки, поэтому скоропортящиеся товары не резервируются на месяц вперёд.
//  • Пока заказ не создан, плательщик может менять доставку. Созданную доставку он уже не меняет автоматически (DELIVERY_LOCKED).
//  • Повторный запуск планировщика ничего не дублирует: UNIQUE(program_id, day) на плане и idem='sub-<id>' на заказе.
//  • Получатель не имеет ключа: он не распоряжается деньгами программы.
import {q,parse,priceBasket,deliveryFee,slots,createOrder,clock} from './commerce.mjs';
import {zones,zoneOf,detectZone} from './zones.mjs';
import {CONSENT_VERSION} from './legal.mjs';
import {Problem,fail,text,integer,uuid,now,token,sha,constant} from './security.mjs';

export const ORDER_LEAD_DAYS=2;            // заказ создаётся за 2 дня; после этого доставка для плательщика заблокирована
export const PLAN_DAYS=120;                // на сколько дней вперёд строится план (без резервирования товара)
export const CLAIM_TIMEOUT_MS=10*60*1000;  // «зависшая» заявка на заказ возвращается в план
export const TOWN_MIN_ORDER_MINOR=3000;    // 30 ₾ — условие ТЗ для Ахалкалаки (только для программ, см. docs)
export const MAX_BUDGET_MINOR=10000000;    // 100 000 ₾ на одну доставку — защита от опечатки
const MAX_ITEMS=30;
const MAX_FUNDS_MINOR=10000000;
const PHONE=/^[+0-9 ()-]{5,40}$/;
const UNLOCKED=['PLANNED','WAITING_FUNDS','WAITING_APPROVAL','WAITING_STOCK','WAITING_SLOT','WAITING_CHANGE'];
const UNLOCKED_SQL=UNLOCKED.map(s=>`'${s}'`).join(',');
const idemOf=deliveryId=>'sub-'+deliveryId;
const commandPay=deliveryId=>'sub-pay-'+deliveryId;

// Инвариант денег: занято = SUM(allocated_minor) по доставкам программы. Деньги выделяются при заявке (CLAIMED),
// остаются при создании заказа, при отмене заказа (FAILED) и у доставленных заказов; освобождаются только
// при пропуске/переносе до заказа или решением оператора (ownerResolve).
// Остаток: подтверждённые пополнения − подтверждённые возвраты − занято. Используется в условных UPDATE,
// чтобы не выделить одни и те же деньги дважды.
const BALANCE_SQL=`((SELECT COALESCE(SUM(CASE WHEN kind='PAYMENT' THEN amount_minor ELSE -amount_minor END),0) FROM subscription_funds WHERE program_id=? AND status='CONFIRMED') - (SELECT COALESCE(SUM(allocated_minor),0) FROM subscription_deliveries WHERE program_id=?))`;

// ---------- даты и график (Asia/Tbilisi задаётся городом; дни — строки YYYY-MM-DD) ----------
// Дата YYYY-MM-DD, которая существует в календаре. Несуществующие даты (13-й месяц) возвращают false, а не бросают исключение.
export const isDay=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const t=Date.parse(v+'T00:00:00Z');return !Number.isNaN(t)&&new Date(t).toISOString().slice(0,10)===v};
export const addDays=(day,n)=>{const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const dayDiff=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
const isoWeekday=day=>{const w=new Date(day+'T00:00:00Z').getUTCDay();return w===0?7:w};
const dayOfMonth=day=>Number(day.slice(8,10));

// Поддерживаемые графики (ТЗ, раздел 4):
//  weekly   — определённые дни недели (1 = понедельник … 7 = воскресенье): один раз в неделю, два и более раз.
//  interval — каждые N дней, начиная с даты start.
//  monthly  — определённые числа месяца (1–28; 29–31 не поддерживаем, чтобы не решать, что делать в феврале).
//  dates    — произвольный список конкретных дат (не более 60, не раньше сегодня и не дальше PLAN_DAYS).
export function normalizeSchedule(s,today){
  const bad=()=>fail('INVALID_SCHEDULE',409);
  if(!s||typeof s!=='object')bad();
  // Необязательные границы: from (с какого дня) и until (по какой день включительно). Не раньше сегодня и не дальше PLAN_DAYS.
  const range=allowFrom=>{const o={},ok=d=>isDay(d)&&d>=today&&d<=addDays(today,PLAN_DAYS);if(allowFrom&&s.from!==undefined&&s.from!==''&&s.from!==null){if(!ok(s.from))bad();o.from=s.from}if(s.until!==undefined&&s.until!==''&&s.until!==null){if(!ok(s.until))bad();o.until=s.until}if(o.from&&o.until&&o.from>o.until)bad();return o};
  const ints=(v,min,max,limit)=>{if(!Array.isArray(v)||!v.length||v.length>limit)bad();const out=[...new Set(v)];if(out.some(x=>!Number.isInteger(x)||x<min||x>max))bad();return out.sort((a,b)=>a-b)};
  switch(s.type){
    case 'weekly':return {type:'weekly',days:ints(s.days,1,7,7),...range(true)};
    case 'monthly':return {type:'monthly',dates:ints(s.dates,1,28,28),...range(true)};
    case 'interval':{if(!Number.isInteger(s.every)||s.every<1||s.every>60||!isDay(s.start))bad();return {type:'interval',every:s.every,start:s.start,...range(false)}}
    case 'dates':{if(!Array.isArray(s.dates)||!s.dates.length||s.dates.length>60)bad();const dates=[...new Set(s.dates)];if(dates.some(d=>!isDay(d)||d<today||d>addDays(today,PLAN_DAYS)))bad();return {type:'dates',dates:dates.sort()}}
    default:bad();
  }
}
function matches(s,day){
  if((s.from&&day<s.from)||(s.until&&day>s.until))return false;
  switch(s.type){
    case 'weekly':return s.days.includes(isoWeekday(day));
    case 'monthly':return s.dates.includes(dayOfMonth(day));
    case 'interval':{const k=dayDiff(s.start,day);return k>=0&&k%s.every===0}
    case 'dates':return s.dates.includes(day);
    default:return false;
  }
}
export function scheduledDays(s,from,to){const out=[];for(let day=from;day<=to;day=addDays(day,1))if(matches(s,day))out.push(day);return out}

// ---------- цена одной доставки: единственный путь расчёта ----------
// Ахалкалаки-город: минимум 30 ₾ товаров (ТЗ 6.1). Сёла и «1 Городок» этим минимумом не ограничены: для сёл ТЗ
// запрещает вводить новый минимум без согласования, для «1 Городка» условие не задано — это вопрос владельцу.
export async function quoteFor(db,{city_id,zone,items}){
  const basket=await priceBasket(db,{city_id,items});
  const estimate=basket.estimate_minor;
  if(!zone&&city_id==='akhalkalaki'&&estimate<TOWN_MIN_ORDER_MINOR)fail('MIN_ORDER',409);
  const fee=deliveryFee(basket.city,'delivery',estimate,zone);
  return {basket,items,estimate,fee,total:estimate+fee,maximum:basket.maximum_minor+fee};
}

async function normalizeItems(db,cityId,raw){
  if(!Array.isArray(raw)||!raw.length||raw.length>MAX_ITEMS)fail('INVALID_ITEMS');
  const items=raw.map(i=>({product_id:text(i?.product_id,80,true),selection:i?.selection&&typeof i.selection==='object'?i.selection:null}));
  if(items.some(i=>!i.selection))fail('INVALID_ITEMS');
  await priceBasket(db,{city_id:cityId,items});   // проверяет наличие, остаток и выбор веса/штук
  return items;
}

async function cityOf(db,cityId){const c=await q(db,'SELECT * FROM cities WHERE id=? AND active=1',cityId).first();if(!c)fail('NOT_FOUND',404);return c}
async function todayOf(db,cityId,at){return clock((await cityOf(db,cityId)).timezone,at).day}

const event=(db,programId,actor,name,data={})=>db.prepare('INSERT INTO subscription_events(id,program_id,at,actor,event,data) VALUES(?,?,?,?,?,?)').bind(uuid(),programId,now(),actor,name,JSON.stringify(data));
async function bump(db,id,version){const r=await q(db,"UPDATE subscription_programs SET version=version+1,updated_at=? WHERE id=? AND version=?",now(),id,version).run();if(!r.meta?.changes)fail('STALE_VERSION',409)}

// План на PLAN_DAYS вперёд. INSERT OR IGNORE: уже существующие дни (включая SKIPPED и созданные заказы) не трогаются.
// Последним оператором фиксируем, на какой день план достроен (planned_on), чтобы планировщик не писал его каждый запуск.
function planStatements(db,p,today){
  const days=scheduledDays(parse(p.schedule),today,addDays(today,PLAN_DAYS));
  return [...days.map(day=>db.prepare("INSERT OR IGNORE INTO subscription_deliveries(id,program_id,day,minute,status,allocated_minor,version,updated_at) VALUES(?,?,?,?,'PLANNED',0,0,?)").bind(uuid(),p.id,day,p.minute,now())),
    db.prepare('UPDATE subscription_programs SET planned_on=? WHERE id=?').bind(today,p.id)];
}
async function runBatches(db,statements){for(let i=0;i<statements.length;i+=50)await db.batch(statements.slice(i,i+50))}

// ---------- создание программы ----------
// actor: null — плательщик сам (согласие сохраняем как CUSTOMER); owner — оператор оформляет по телефону и обязан указать,
// кто и когда дал согласие (consent_note).
export async function createProgram(db,b,actor=null,at=new Date()){
  const operator=actor?.owner===true;
  const city=await cityOf(db,text(b.city_id,60,true));
  if(b.privacy_consent!==true||b.accepted_weight_rules!==true)fail('CONSENT_REQUIRED',409);
  const consentNote=operator?text(b.consent_note,300,true):null;
  const payer={name:text(b.payer?.name,80,true),phone:text(b.payer?.phone,40,true)};
  const recipient={name:text(b.recipient?.name,80,true),phone:text(b.recipient?.phone,40,true)};
  if(!PHONE.test(payer.phone)||!PHONE.test(recipient.phone))fail('INVALID_PHONE');
  const address=text(b.address,300,true);
  if(address.length<5)fail('INVALID_INPUT');
  let zone=text(b.zone||'',40);
  if(zone&&!zoneOf(city,zone))fail('INVALID_ZONE');
  if(!zone)zone=detectZone(zones[city.id],address);   // та же логика, что в createOrder: село в адресе задаёт зону
  const minute=integer(b.minute??600,540,1439);
  // Время только из сетки слотов (каждые 30 минут от 09:00), как в каталоге. Иначе планировщик не найдёт точный слот.
  if((minute-540)%30)fail('INVALID_SLOT',409);
  const today=clock(city.timezone,at).day;
  const schedule=normalizeSchedule(b.schedule,today);
  const items=await normalizeItems(db,city.id,b.items);
  const max=integer(b.max_delivery_minor,1,MAX_BUDGET_MINOR);
  const preview=await quoteFor(db,{city_id:city.id,zone,items});   // минимум и цена уже сейчас, до сохранения
  const id=uuid(),key=token(),stamp=now();
  const scheduleJson=JSON.stringify(schedule),itemsJson=JSON.stringify(items);
  await db.batch([
    db.prepare(`INSERT INTO subscription_programs(id,city_id,status,payer_name,payer_phone,recipient_name,recipient_phone,address,zone,minute,schedule,items,max_delivery_minor,consent_version,consent_at,consent_by,consent_note,key_hash,created_at,updated_at,version) VALUES(?,?,'ACTIVE',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`)
      .bind(id,city.id,payer.name,payer.phone,recipient.name,recipient.phone,address,zone,minute,scheduleJson,itemsJson,max,CONSENT_VERSION,stamp,operator?'OPERATOR':'CUSTOMER',consentNote,await sha(key),stamp,stamp),
    event(db,id,operator?`OPERATOR:${actor.id}`:'CUSTOMER','CREATED',{schedule,zone,max}),
  ]);
  await runBatches(db,planStatements(db,{id,minute,schedule:scheduleJson},today));
  return {program:await viewProgram(db,id),key,preview:{items_total_minor:preview.estimate,delivery_fee_minor:preview.fee,total_minor:preview.total,maximum_total_minor:preview.maximum,zone}};
}

// ---------- доступ ----------
// Плательщик: только программа + её секретный ключ (как ключ заказа). Неверный ключ отвечает как «не найдено».
export async function payerProgram(db,id,key){
  const p=await q(db,'SELECT * FROM subscription_programs WHERE id=?',text(id,80,true)).first();
  if(!p)fail('NOT_FOUND',404);
  if(!key||!constant(p.key_hash,await sha(text(key,100,true))))fail('NOT_FOUND',404);
  return p;
}
async function ownerProgram(db,id){const p=await q(db,'SELECT * FROM subscription_programs WHERE id=?',text(id,80,true)).first();if(!p)fail('NOT_FOUND',404);return p}

// ---------- представление для плательщика и оператора (без ключа и секретов) ----------
export async function viewProgram(db,id){
  const p=await q(db,'SELECT * FROM subscription_programs WHERE id=?',id).first();
  if(!p)fail('NOT_FOUND',404);
  const items=parse(p.items,[]),ids=items.map(i=>i.product_id);
  const names=ids.length?Object.fromEntries((await db.prepare(`SELECT id,names FROM products WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all()).results.map(r=>[r.id,parse(r.names,{})])):{};
  const deliveries=(await db.prepare(`SELECT d.id,d.day,d.minute,d.status,d.reason,d.allocated_minor,d.quoted_total_minor,d.approved_max_minor,d.order_id,o.status AS order_status,o.total AS order_total,o.payment AS order_payment
    FROM subscription_deliveries d LEFT JOIN orders o ON o.id=d.order_id WHERE d.program_id=? ORDER BY d.day LIMIT 400`).bind(id).all()).results;
  const funds=(await db.prepare('SELECT id,kind,amount_minor,status,reference,requested_at,confirmed_at FROM subscription_funds WHERE program_id=? ORDER BY requested_at').bind(id).all()).results;
  const events=(await db.prepare('SELECT at,actor,event,data FROM subscription_events WHERE program_id=? ORDER BY at DESC LIMIT 50').bind(id).all()).results.map(e=>({...e,data:parse(e.data,{})}));
  return {id:p.id,city_id:p.city_id,status:p.status,version:p.version,created_at:p.created_at,
    payer:{name:p.payer_name,phone:p.payer_phone},recipient:{name:p.recipient_name,phone:p.recipient_phone},
    address:p.address,zone:p.zone,minute:p.minute,schedule:parse(p.schedule),
    items:items.map(i=>({product_id:i.product_id,selection:i.selection,name:names[i.product_id]?.ru||i.product_id,names:names[i.product_id]||{}})),
    max_delivery_minor:p.max_delivery_minor,cancel_reason:p.cancel_reason,consent:{version:p.consent_version,at:p.consent_at,by:p.consent_by,note:p.consent_note},
    deliveries,funds,events,summary:await summaryOf(db,id)};
}

// Деньги программы для отчёта плательщику и оператору (всё — в целых тетри).
export async function summaryOf(db,id){
  const f=await db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN kind='PAYMENT' AND status='CONFIRMED' THEN amount_minor END),0) AS paid,
      COALESCE(SUM(CASE WHEN kind='REFUND' AND status='CONFIRMED' THEN amount_minor END),0) AS refunded,
      COALESCE(SUM(CASE WHEN kind='REFUND' AND status='PENDING' THEN amount_minor END),0) AS refund_pending,
      COALESCE(SUM(CASE WHEN kind='PAYMENT' AND status='PENDING' THEN amount_minor END),0) AS pending
    FROM subscription_funds WHERE program_id=?`).bind(id).first();
  const r=await db.prepare("SELECT COALESCE(SUM(allocated_minor),0) AS reserved FROM subscription_deliveries WHERE program_id=?").bind(id).first();
  const d=await db.prepare("SELECT COALESCE(SUM(o.total),0) AS delivered FROM subscription_deliveries d JOIN orders o ON o.id=d.order_id WHERE d.program_id=? AND o.status='COMPLETED'").bind(id).first();
  // Ожидающий возврат уже не доступен плательщику: иначе его можно запросить второй раз.
  const unused=f.paid-f.refunded-f.refund_pending-r.reserved;
  return {paid_minor:f.paid,refunded_minor:f.refunded,refund_pending_minor:f.refund_pending,pending_top_up_minor:f.pending,reserved_minor:r.reserved,delivered_minor:d.delivered,unused_minor:unused};
}

// ---------- действия плательщика ----------
// Каждое действие сначала переводит версию программы (защита от двух вкладок и параллельных правок).
export async function payerAction(db,b,at=new Date()){
  const p=await payerProgram(db,b.id,b.key);
  const version=integer(b.version,0);
  const action=text(b.action,40,true);
  const today=await todayOf(db,p.city_id,at);
  const st=[];let extra={};
  const unlockedRow=async day=>{const row=await q(db,'SELECT * FROM subscription_deliveries WHERE program_id=? AND day=?',p.id,day).first();return row};
  const dayArg=v=>{if(!isDay(v)||v<today)fail('INVALID_DATE',409);return v};
  switch(action){
    case 'pause':{if(p.status!=='ACTIVE')fail('INVALID_TRANSITION',409);st.push(q(db,"UPDATE subscription_programs SET status='PAUSED' WHERE id=?",p.id),event(db,p.id,'CUSTOMER','PAUSED'));break}
    case 'resume':{if(p.status!=='PAUSED')fail('INVALID_TRANSITION',409);st.push(q(db,"UPDATE subscription_programs SET status='ACTIVE' WHERE id=?",p.id),event(db,p.id,'CUSTOMER','RESUMED'));st.push(...planStatements(db,p,today));break}
    case 'cancel':{if(p.status==='CANCELLED')fail('INVALID_TRANSITION',409);const reason=text(b.reason||'',300)||'PAYER_CANCEL';st.push(q(db,"UPDATE subscription_programs SET status='CANCELLED',cancel_reason=? WHERE id=?",reason,p.id),q(db,`UPDATE subscription_deliveries SET status='CANCELLED',reason='PROGRAM_CANCELLED',updated_at=? WHERE program_id=? AND status IN (${UNLOCKED_SQL})`,now(),p.id),event(db,p.id,'CUSTOMER','CANCELLED',{reason}));
      extra={locked:(await db.prepare("SELECT day,status,order_id FROM subscription_deliveries WHERE program_id=? AND status IN ('CLAIMED','ORDERED') AND day>=? ORDER BY day").bind(p.id,today).all()).results,note:'Уже созданные заказы остаются в работе: их меняет оператор. Неиспользованный остаток возвращается по запросу возврата.'};break}
    case 'skip':{const day=dayArg(b.day);const row=await unlockedRow(day);
      if(row){if(row.status==='SKIPPED')break;if(!UNLOCKED.includes(row.status))fail('DELIVERY_LOCKED',409);st.push(q(db,"UPDATE subscription_deliveries SET status='SKIPPED',reason='PAYER_SKIP',updated_at=?,version=version+1 WHERE id=? AND status IN ("+UNLOCKED_SQL+")",now(),row.id))}
      else st.push(q(db,"INSERT INTO subscription_deliveries(id,program_id,day,minute,status,reason,allocated_minor,version,updated_at) VALUES(?,?,?,?,'SKIPPED','PAYER_SKIP',0,0,?)",uuid(),p.id,day,p.minute,now()));
      st.push(event(db,p.id,'CUSTOMER','SKIPPED',{day}));break}
    case 'reschedule':{const from=dayArg(b.from),to=b.to;const dest=dayArg(to);if(dest>addDays(today,PLAN_DAYS))fail('INVALID_DATE',409);
      const row=await unlockedRow(from);if(!row||!UNLOCKED.includes(row.status))fail(row?'DELIVERY_LOCKED':'NOT_IN_SCHEDULE',409);
      const target=await unlockedRow(dest);if(target&&target.status!=='SKIPPED')fail('DAY_TAKEN',409);
      st.push(q(db,"UPDATE subscription_deliveries SET status='SKIPPED',reason=?,updated_at=?,version=version+1 WHERE id=? AND status IN ("+UNLOCKED_SQL+")",'MOVED_TO:'+dest,now(),row.id));
      if(target)st.push(q(db,'DELETE FROM subscription_deliveries WHERE id=? AND status=\'SKIPPED\'',target.id));
      st.push(q(db,"INSERT INTO subscription_deliveries(id,program_id,day,minute,status,reason,allocated_minor,version,updated_at) VALUES(?,?,?,?,'PLANNED','MOVED_FROM:'||?,0,0,?)",uuid(),p.id,dest,row.minute,from,now()));
      st.push(event(db,p.id,'CUSTOMER','RESCHEDULED',{from,to:dest}));break}
    case 'set_schedule':{const schedule=normalizeSchedule(b.schedule,today);
      st.push(q(db,`DELETE FROM subscription_deliveries WHERE program_id=? AND status IN (${UNLOCKED_SQL}) AND day>=?`,p.id,today));
      st.push(q(db,'UPDATE subscription_programs SET schedule=? WHERE id=?',JSON.stringify(schedule),p.id),event(db,p.id,'CUSTOMER','SCHEDULE_CHANGED',{schedule}));
      st.push(...planStatements(db,{...p,schedule:JSON.stringify(schedule)},today));break}
    case 'set_items':{const items=await normalizeItems(db,p.city_id,b.items);st.push(q(db,'UPDATE subscription_programs SET items=? WHERE id=?',JSON.stringify(items),p.id),event(db,p.id,'CUSTOMER','ITEMS_CHANGED',{count:items.length}));break}
    case 'set_profile':{const fields={};
      if(b.address!==undefined){const a=text(b.address,300,true);if(a.length<5)fail('INVALID_INPUT');fields.address=a}
      if(b.recipient_name!==undefined)fields.recipient_name=text(b.recipient_name,80,true);
      if(b.recipient_phone!==undefined){const ph=text(b.recipient_phone,40,true);if(!PHONE.test(ph))fail('INVALID_PHONE');fields.recipient_phone=ph}
      if(b.zone!==undefined){const z=text(b.zone||'',40);if(z&&!zoneOf(await cityOf(db,p.city_id),z))fail('INVALID_ZONE');fields.zone=z}
      if(b.minute!==undefined){const m=integer(b.minute,540,1439);if((m-540)%30)fail('INVALID_SLOT',409);fields.minute=m}
      if(b.max_delivery_minor!==undefined)fields.max_delivery_minor=integer(b.max_delivery_minor,1,MAX_BUDGET_MINOR);
      const keys=Object.keys(fields);if(!keys.length)fail('INVALID_INPUT');
      st.push(q(db,`UPDATE subscription_programs SET ${keys.map(k=>k+'=?').join(',')} WHERE id=?`,...keys.map(k=>fields[k]),p.id));
      if(fields.minute!==undefined)st.push(q(db,`UPDATE subscription_deliveries SET minute=?,updated_at=? WHERE program_id=? AND status IN (${UNLOCKED_SQL}) AND day>=?`,fields.minute,now(),p.id,today));
      st.push(event(db,p.id,'CUSTOMER','PROFILE_CHANGED',{fields:keys}));break}
    case 'approve_delivery':{const day=dayArg(b.day),total=integer(b.total_minor,1,MAX_BUDGET_MINOR);const row=await unlockedRow(day);
      if(!row||row.status!=='WAITING_APPROVAL')fail('NOT_WAITING_APPROVAL',409);
      if(row.quoted_total_minor!==total)fail('STALE_QUOTE',409);   // плательщик подтверждает ровно ту сумму, что видел
      st.push(q(db,"UPDATE subscription_deliveries SET status='PLANNED',approved_max_minor=?,reason=NULL,updated_at=?,version=version+1 WHERE id=? AND status='WAITING_APPROVAL' AND quoted_total_minor=?",total,now(),row.id,total));
      st.push(event(db,p.id,'CUSTOMER','PRICE_APPROVED',{day,total_minor:total}));break}
    case 'request_top_up':{const amount=integer(b.amount_minor,1,MAX_FUNDS_MINOR),reference=text(b.reference,200,true);
      st.push(q(db,"INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at) VALUES(?,?,'PAYMENT',?,'PENDING',?,?)",uuid(),p.id,amount,reference,now()),event(db,p.id,'CUSTOMER','TOP_UP_REQUESTED',{amount_minor:amount}));break}
    case 'request_refund':{const amount=integer(b.amount_minor,1,MAX_FUNDS_MINOR);const s=await summaryOf(db,p.id);if(amount>s.unused_minor)fail('INSUFFICIENT_FUNDS',409);
      st.push(q(db,"INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at) VALUES(?,?,'REFUND',?,'PENDING','запрос плательщика',?)",uuid(),p.id,amount,now()),event(db,p.id,'CUSTOMER','REFUND_REQUESTED',{amount_minor:amount}));break}
    default:fail('INVALID_ACTION');
  }
  await bump(db,p.id,version);
  if(st.length)await runBatches(db,st);
  return {...await viewProgram(db,p.id),...extra};
}

// ---------- действия оператора ----------
export async function ownerList(db,{status}={}){
  const rows=status?(await db.prepare('SELECT id FROM subscription_programs WHERE status=? ORDER BY created_at DESC LIMIT 200').bind(status).all()).results:(await db.prepare('SELECT id FROM subscription_programs ORDER BY created_at DESC LIMIT 200').all()).results;
  const out=[];for(const r of rows)out.push(await viewProgram(db,r.id));return out;
}

// Оператор подтверждает пополнение (после получения денег) или возврат (после фактической выплаты).
export async function ownerFund(db,b,owner,at=new Date()){
  const fund=await q(db,'SELECT * FROM subscription_funds WHERE id=?',text(b.fund_id,80,true)).first();
  if(!fund)fail('NOT_FOUND',404);
  if(fund.status!=='PENDING')fail('NOT_PENDING',409);
  const decision=text(b.decision,20,true);
  const stamp=at.toISOString();
  if(decision==='REJECT'){await q(db,"UPDATE subscription_funds SET status='REJECTED',confirmed_at=?,confirmed_by=? WHERE id=? AND status='PENDING'",stamp,owner.id,fund.id).run();await runBatches(db,[event(db,fund.program_id,`OPERATOR:${owner.id}`,'FUND_REJECTED',{fund_id:fund.id})]);return viewProgram(db,fund.program_id)}
  if(decision!=='CONFIRM')fail('INVALID_INPUT');
  if(fund.kind==='PAYMENT'){await q(db,"UPDATE subscription_funds SET status='CONFIRMED',confirmed_at=?,confirmed_by=? WHERE id=? AND status='PENDING'",stamp,owner.id,fund.id).run();}
  else{   // возврат: не может уйти больше подтверждённого остатка, даже если между запросом и подтверждением что-то заняли
    const r=await q(db,`UPDATE subscription_funds SET status='CONFIRMED',confirmed_at=?,confirmed_by=? WHERE id=? AND status='PENDING' AND amount_minor<=${BALANCE_SQL}`,stamp,owner.id,fund.id,fund.program_id,fund.program_id).run();
    if(!r.meta?.changes)fail('INSUFFICIENT_FUNDS',409);
  }
  await runBatches(db,[event(db,fund.program_id,`OPERATOR:${owner.id}`,'FUND_CONFIRMED',{fund_id:fund.id,kind:fund.kind,amount_minor:fund.amount_minor})]);
  return viewProgram(db,fund.program_id);
}

export async function ownerStatus(db,b,owner){
  const p=await ownerProgram(db,b.id);
  const action=text(b.action,20,true),reason=text(b.reason||'',300);
  const st=[];
  if(action==='pause'){if(p.status!=='ACTIVE')fail('INVALID_TRANSITION',409);st.push(q(db,"UPDATE subscription_programs SET status='PAUSED',updated_at=? WHERE id=?",now(),p.id))}
  else if(action==='resume'){if(p.status!=='PAUSED')fail('INVALID_TRANSITION',409);st.push(q(db,"UPDATE subscription_programs SET status='ACTIVE',updated_at=? WHERE id=?",now(),p.id))}
  else if(action==='cancel'){if(p.status==='CANCELLED')fail('INVALID_TRANSITION',409);if(!reason)fail('REASON_REQUIRED',409);st.push(q(db,"UPDATE subscription_programs SET status='CANCELLED',cancel_reason=?,updated_at=? WHERE id=?",reason,now(),p.id),q(db,`UPDATE subscription_deliveries SET status='CANCELLED',reason='OPERATOR_CANCEL',updated_at=? WHERE program_id=? AND status IN (${UNLOCKED_SQL})`,now(),p.id))}
  else fail('INVALID_ACTION');
  st.push(event(db,p.id,`OPERATOR:${owner.id}`,'STATUS_'+action.toUpperCase(),{reason}));
  await runBatches(db,st);
  return viewProgram(db,p.id);
}

// Оператор решает судьбу денег доставки, чей заказ отменили (статус FAILED, причина ORDER_CANCELLED):
//  RETURN_TO_BALANCE — деньги остаются у программы и доступны для следующих доставок;
//  REFUND            — создаётся ожидающий возврат; деньги уходят в выплату, когда оператор подтвердит её (ownerFund).
// Обе ветки в одном batch: либо всё, либо ничего.
export async function ownerResolve(db,b,owner,at=new Date()){
  const d=await q(db,'SELECT * FROM subscription_deliveries WHERE id=?',text(b.delivery_id,80,true)).first();
  if(!d)fail('NOT_FOUND',404);
  if(d.status!=='FAILED'||d.reason!=='ORDER_CANCELLED'||!(d.allocated_minor>0))fail('NOT_RESOLVABLE',409);
  const decision=text(b.decision,30,true);
  if(decision!=='RETURN_TO_BALANCE'&&decision!=='REFUND')fail('INVALID_INPUT');
  const stamp=at.toISOString();
  const st=[];
  // Вставка возврата и освобождение денег проверяют одно и то же состояние внутри одного batch.
  if(decision==='REFUND')st.push(q(db,"INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at) SELECT ?,program_id,'REFUND',allocated_minor,'PENDING',?,? FROM subscription_deliveries WHERE id=? AND status='FAILED' AND reason='ORDER_CANCELLED' AND allocated_minor>0",uuid(),'Отменённый заказ '+d.order_id,stamp,d.id));
  st.push(q(db,"UPDATE subscription_deliveries SET status='CANCELLED',allocated_minor=0,reason=?,updated_at=?,version=version+1 WHERE id=? AND status='FAILED' AND reason='ORDER_CANCELLED' AND allocated_minor>0",decision==='REFUND'?'CANCELLED_REFUND_PENDING':'CANCELLED_RETURNED_TO_BALANCE',stamp,d.id));
  st.push(event(db,d.program_id,`OPERATOR:${owner.id}`,'ORDER_CANCEL_RESOLVED',{delivery_id:d.id,decision,amount_minor:d.allocated_minor}));
  await db.batch(st);
  return viewProgram(db,d.program_id);
}

// ---------- планировщик ----------
// Вызывается по cron (src/cloudflare.mjs). Безопасен при повторных и параллельных запусках:
//  1) план создаётся через INSERT OR IGNORE;
//  2) доставка переходит в CLAIMED условным UPDATE (только из незанятых состояний и только при достаточном остатке);
//  3) заказ создаётся с idem='sub-<id>': повторный вызов вернёт уже созданный заказ;
//  4) оплата заказа записывается с command='sub-pay-<id>' (уникален в payments).
// Зависшие CLAIMED старше CLAIM_TIMEOUT_MS возвращаются в план; если заказ уже был создан, он найдётся по idem и будет привязан.
const RETRY_CODES=new Set(['ORDERS_CLOSED','QUOTE_CHANGED','INVALID_SLOT','VENDOR_CLOSED','BULK_LEAD_TIME','CAPACITY_CHANGED','STALE_VERSION']);
const STOCK_CODES=new Set(['OUT_OF_STOCK','PRODUCT_UNAVAILABLE','CLOSED_TODAY']);

export async function runSubscriptionPlanner(db,at=new Date(),{limit=50}={}){
  const report={programs:0,ordered:0,waiting:0,failed:0,errors:0,released:0};
  const stale=new Date(at.getTime()-CLAIM_TIMEOUT_MS).toISOString();
  report.released=(await db.prepare("UPDATE subscription_deliveries SET status='PLANNED',allocated_minor=0,reason='CLAIM_TIMEOUT',updated_at=?,version=version+1 WHERE status='CLAIMED' AND claimed_at<?").bind(now(),stale).run()).meta?.changes??0;
  const programs=(await db.prepare("SELECT p.*,c.timezone AS tz FROM subscription_programs p JOIN cities c ON c.id=p.city_id WHERE p.status IN ('ACTIVE','PAUSED')").all()).results;
  for(const p of programs){
    report.programs++;
    const today=clock(p.tz,at).day;
    if(p.status!=='ACTIVE')continue;
    if(p.planned_on!==today)await runBatches(db,planStatements(db,p,today));   // раз в сутки, а не каждые 2 минуты
    const due=(await db.prepare(`SELECT * FROM subscription_deliveries WHERE program_id=? AND status IN (${UNLOCKED_SQL}) AND day<=? ORDER BY day LIMIT ?`).bind(p.id,addDays(today,ORDER_LEAD_DAYS),limit).all()).results;
    for(const d of due){
      try{
        if(d.day<today){await park(db,p,d,'FAILED','MISSED_DAY');report.failed++;continue}
        const outcome=await processDelivery(db,p,d,today,at);
        report[outcome]=(report[outcome]??0)+1;
      }catch(e){
        // Неизвестная ошибка: состояние не меняем, заявка (если была) вернётся в план по таймауту.
        // Пишем в лог, чтобы сбой был виден в Cloudflare, а не тихо терялся.
        report.errors++;
        console.error('subscription planner', d.id, e?.message||e);
      }
    }
  }
  return report;
}

async function processDelivery(db,p,d,today,at){
  const existing=await q(db,'SELECT id,total,currency FROM orders WHERE idem=?',idemOf(d.id)).first();
  if(existing){await link(db,p,d,existing);return 'ordered'}
  let quote;
  try{quote=await quoteFor(db,{city_id:p.city_id,zone:p.zone,items:parse(p.items,[])})}
  catch(e){if(!(e instanceof Problem))throw e;return parkFor(db,p,d,e)}
  const cap=Math.max(p.max_delivery_minor,d.approved_max_minor||0);
  if(quote.total>cap){await park(db,p,d,'WAITING_APPROVAL','OVER_BUDGET',quote.total);return 'waiting'}
  const products=quote.items.map(i=>i.product_id).join(',');
  const free=(await slots(db,p.city_id,d.day,products,0)).slots.filter(s=>s.available>0);
  // Точный слот, если он свободен; иначе ближайший свободный (раньше при равенстве). Не самый ранний день:
  // так клиент не получит доставку на 09:00 вместо 11:40 молча.
  const pick=free.find(s=>s.minute===d.minute)||[...free].sort((a,b)=>Math.abs(a.minute-d.minute)-Math.abs(b.minute-d.minute)||a.minute-b.minute)[0];
  if(!pick){await park(db,p,d,'WAITING_SLOT','NO_FREE_SLOT');return 'waiting'}
  const claim=await q(db,`UPDATE subscription_deliveries SET status='CLAIMED',allocated_minor=?,claimed_at=?,updated_at=?,reason=NULL,version=version+1 WHERE id=? AND status IN (${UNLOCKED_SQL}) AND ?<=${BALANCE_SQL}`,
    quote.total,now(),now(),d.id,quote.total,p.id,p.id).run();
  if(!claim.meta?.changes){
    const cur=await q(db,'SELECT status FROM subscription_deliveries WHERE id=?',d.id).first();
    if(cur&&UNLOCKED.includes(cur.status)){await park(db,p,d,'WAITING_FUNDS','INSUFFICIENT_FUNDS',quote.total);return 'waiting'}
    return 'skipped';
  }
  try{
    await createOrder(db,orderBody(p,d,quote,pick.minute));
  }catch(e){
    if(!(e instanceof Problem))throw e;   // заказа нет (createOrder атомарен), заявка вернётся по таймауту
    const release=RETRY_CODES.has(e.code)?['PLANNED',e.code]:STOCK_CODES.has(e.code)?['WAITING_STOCK',e.code]:e.code==='MIN_ORDER'?['WAITING_CHANGE','MIN_ORDER']:['FAILED',e.code];
    await releaseClaim(db,p,d,release[0],release[1]);
    if(release[0]==='FAILED')return 'failed';
    return release[0]==='PLANNED'?'skipped':'waiting';
  }
  const order=await q(db,'SELECT id,total,currency FROM orders WHERE idem=?',idemOf(d.id)).first();
  if(!order)throw new Error('ORDER_NOT_FOUND_AFTER_CREATE');
  await link(db,p,d,order);
  return 'ordered';
}

function orderBody(p,d,quote,minute){
  return {
    city:p.city_id,city_id:p.city_id,fulfillment:'delivery',method:'transfer',zone:p.zone,
    day:d.day,minute,items:quote.items,idem:idemOf(d.id),
    customer:{name:p.recipient_name,phone:p.recipient_phone,address:p.address,note:'Программа «Забота о близких»: оплачено средствами программы'},
    expected_total:quote.total,maximum_total:quote.maximum,accepted_weight_rules:true,privacy_consent:true,marketing_consent:false,
  };
}

// Оплата заказа из средств программы. Идемпотентна: повторный вызов не создаёт второй платёж.
async function pay(db,deliveryId,order){
  const command=commandPay(deliveryId);
  if(await q(db,'SELECT 1 FROM payments WHERE command=?',command).first())return;
  await db.batch([
    q(db,'INSERT INTO payments(id,order_id,at,actor,amount,currency,command,reason) VALUES(?,?,?,?,?,?,?,?)',uuid(),order.id,now(),'SYSTEM',order.total,order.currency,command,'Оплата из подтверждённых средств программы «Забота о близких»'),
    q(db,"UPDATE orders SET paid=paid+?,payment=CASE WHEN paid+?>=total THEN 'PAID' ELSE 'PARTIAL' END WHERE id=? AND paid=0",order.total,order.total,order.id),
  ]);
}

async function link(db,p,d,order){
  await pay(db,d.id,order);
  await q(db,"UPDATE subscription_deliveries SET status='ORDERED',order_id=?,allocated_minor=?,reason=NULL,updated_at=?,version=version+1 WHERE id=? AND order_id IS NULL",order.id,order.total,now(),d.id).run();
  await runBatches(db,[event(db,p.id,'SYSTEM','ORDER_CREATED',{day:d.day,order_id:order.id,total_minor:order.total})]);
}

async function park(db,p,d,status,reason,quotedTotal=null){
  if(d.status===status&&d.reason===reason)return;
  await q(db,`UPDATE subscription_deliveries SET status=?,reason=?,quoted_total_minor=?,updated_at=?,version=version+1 WHERE id=? AND status IN (${UNLOCKED_SQL})`,status,reason,quotedTotal,now(),d.id).run();
  await runBatches(db,[event(db,p.id,'SYSTEM',status,{day:d.day,reason,quoted_total_minor:quotedTotal})]);
}
async function parkFor(db,p,d,e){
  const map=STOCK_CODES.has(e.code)?'WAITING_STOCK':e.code==='MIN_ORDER'?'WAITING_CHANGE':null;
  if(!map)return 'failed';
  await park(db,p,d,map,e.code);
  return 'waiting';
}
async function releaseClaim(db,p,d,status,reason){
  await q(db,"UPDATE subscription_deliveries SET status=?,allocated_minor=0,reason=?,updated_at=?,version=version+1 WHERE id=? AND status='CLAIMED'",status,reason,now(),d.id).run();
  await runBatches(db,[event(db,p.id,'SYSTEM',status,{day:d.day,reason})]);
}

// ---------- маршрутизация для worker.mjs ----------
// Возвращает {status, body}. Все входные данные проверяются в функциях выше.
export async function subscriptionApi(db,path,b,user,at=new Date()){
  if(path.startsWith('/api/manage/subscriptions')){
    if(!user)fail('LOGIN_REQUIRED',401);
    if(!user.owner)fail('FORBIDDEN',403);
    switch(path){
      case '/api/manage/subscriptions/list':return {status:200,body:{programs:await ownerList(db,{status:b?.status})}};
      case '/api/manage/subscriptions/view':return {status:200,body:await viewProgram(db,(await ownerProgram(db,b?.id)).id)};
      case '/api/manage/subscriptions/fund':return {status:200,body:await ownerFund(db,b,user,at)};
      case '/api/manage/subscriptions/status':return {status:200,body:await ownerStatus(db,b,user)};
      case '/api/manage/subscriptions/resolve':return {status:200,body:await ownerResolve(db,b,user,at)};
      case '/api/manage/subscriptions/create':return {status:201,body:await createProgram(db,b,user,at)};
      case '/api/manage/subscriptions/run':return {status:200,body:await runSubscriptionPlanner(db,at)};
      default:fail('NOT_FOUND',404);
    }
  }
  switch(path){
    case '/api/subscriptions/create':return {status:201,body:await createProgram(db,b,null,at)};
    case '/api/subscriptions/view':{const p=await payerProgram(db,b?.id,b?.key);return {status:200,body:await viewProgram(db,p.id)}};
    case '/api/subscriptions/action':return {status:200,body:await payerAction(db,b,at)};
    default:fail('NOT_FOUND',404);
  }
}
