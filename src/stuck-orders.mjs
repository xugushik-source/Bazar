// Owner 30.10: a stuck order must not go unnoticed. When an order has not moved for 5 minutes and its delivery is less than two hours
// away (or already late), the owner's bot says who is holding it and what has to be pressed; once per stop, again if it stalls later.
import {q,parse,clock}from './commerce.mjs';import {orderHours}from './order-hours.mjs';import {ctlWords,ownerRows}from './owner-control.mjs';
export const STUCK_MINUTES=5,AHEAD_MINUTES=120;
export const stuckWords={
 ru:{head:'⏰ Заказ {id} стоит {m} мин · доставка {time}',confirm:'Ждём: подтвердить заказ',supplier:'Ждём поставщика: {v} — взвесить и нажать «Готово»',approve:'Ждём: одобрить изменение (вес или замена)',check:'Ждём: проверить сборку',buyer:'Ждём покупателя: подтвердить сумму, или позвоните ему',courier:'Ждём курьера: забрать и доставить',nobody:'Курьер не назначен: никто не нажал «Беру»'},
 hy:{head:'⏰ Պատվեր {id}-ը կանգնած է {m} րոպե · առաքում {time}',confirm:'Սպասում ենք՝ հաստատել պատվերը',supplier:'Սպասում ենք մատակարարին՝ {v} — կշռել և սեղմել «Պատրաստ է»',approve:'Սպասում ենք՝ հաստատել փոփոխությունը (քաշ կամ փոխարինում)',check:'Սպասում ենք՝ ստուգել հավաքածուն',buyer:'Սպասում ենք գնորդին՝ հաստատել գումարը, կամ զանգահարեք նրան',courier:'Սպասում ենք առաքիչին՝ վերցնել և առաքել',nobody:'Առաքիչ նշանակված չէ՝ ոչ ոք չի սեղմել «Վերցնում եմ»'},
 ka:{head:'⏰ შეკვეთა {id} დგას {m} წთ · მიწოდება {time}',confirm:'ველოდებით: შეკვეთის დადასტურებას',supplier:'ველოდებით მომწოდებელს: {v} — აწონოს და დააჭიროს „მზადაა“',approve:'ველოდებით: ცვლილების დადასტურებას (წონა ან შეცვლა)',check:'ველოდებით: აწყობის შემოწმებას',buyer:'ველოდებით მყიდველს: თანხის დადასტურებას, ან დაურეკეთ მას',courier:'ველოდებით კურიერს: აიღოს და მიიტანოს',nobody:'კურიერი არ არის დანიშნული: არავინ დააჭირა „ვიღებ“'}};
const waitFor={NEW:'confirm',CLAIMED:'confirm',WEIGHING:'supplier',ASSEMBLING:'supplier',AWAITING_APPROVAL:'approve',CHECKING:'check',CUSTOMER_REVIEW:'buyer',READY:'courier',PICKED_UP:'courier',OUT_FOR_DELIVERY:'courier'};
const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
// Tbilisi has no daylight saving: a slot is day + minute at +04:00.
const slotAt=o=>Date.parse(o.day+'T'+hhmm(o.minute)+':00+04:00');
// Owner 10.11: the one who has to press is reminded first (3 min), the owner next (6 min) with «Назначить курьера» /
// «Готово за …» / «За курьера …». Any order of today inside the order hours counts, not only one due within two hours.
export const NUDGE_MINUTES=3,OWNER_MINUTES=6;
export async function stuckOrders(db,at=new Date()){const since=new Date(at.getTime()-NUDGE_MINUTES*60000).toISOString(),out=[],h=await orderHours(db),c=clock('Asia/Tbilisi',at);
 for(const o of(await q(db,"SELECT * FROM orders WHERE status NOT IN('COMPLETED','CANCELLED') AND updated_at<=?",since).all()).results){
  const today=!!h&&o.day===c.day&&c.minute>=h.from&&c.minute<h.to;
  if(o.day<c.day)continue;// owner 10.11: a test order of 08.11 must not remind on the 10th — only today's (or upcoming) orders
  if(!waitFor[o.status]||!today&&slotAt(o)-at.getTime()>AHEAD_MINUTES*60000)continue;
  const minutes=Math.floor((at.getTime()-Date.parse(o.updated_at))/60000),level=minutes>=OWNER_MINUTES?2:1;
  const seen=await q(db,'SELECT version,level FROM stuck_alerts WHERE order_id=?',o.id).first();if(seen?.version===o.version&&(seen.level??2)>=level)continue;
  const groups=['WEIGHING','ASSEMBLING'].includes(o.status)&&o.confirmed?(await q(db,"SELECT g.vendor_id,v.names FROM order_groups g JOIN vendors v ON v.id=g.vendor_id WHERE g.order_id=? AND g.status!='READY' ORDER BY v.id",o.id).all()).results:[];
  out.push({o,minutes,level,nudged:seen?.version===o.version,wait:o.status==='READY'&&o.fulfillment==='delivery'&&!o.driver_id?'nobody':waitFor[o.status],vendors:groups.map(r=>parse(r.names,{})),vendorIds:groups.map(r=>r.vendor_id)})}
 return out}
export function stuckText(x,lang){const w=stuckWords[lang]||stuckWords.ru;return w.head.replace('{id}',x.o.id.slice(-6)).replace('{m}',x.minutes).replace('{time}',hhmm(x.o.minute))+'\n'+w[x.wait].replace('{v}',x.vendors.map(n=>n[lang]||n.ru).join(', ')||'—')}
// Who has to press now: the suppliers still weighing, the courier group when nobody took it, the assigned courier.
async function holders(db,x){const o=x.o,links=[];const all=sql=>db.prepare(sql);
 if(x.vendorIds.length)for(const v of x.vendorIds)for(const l of(await q(db,"SELECT * FROM tg_links WHERE kind='SUPPLIER' AND ref_id=? AND active=1",v).all()).results)links.push([l,'nudgeSupplier']);
 if(x.wait==='nobody')for(const l of(await q(db,"SELECT * FROM tg_links WHERE kind='DRIVER' AND city_id=? AND active=1",o.city_id).all()).results)links.push([l,'nudgeGroup']);
 else if(o.driver_id&&o.fulfillment==='delivery'&&['READY','PICKED_UP','OUT_FOR_DELIVERY'].includes(o.status))for(const l of(await q(db,"SELECT * FROM tg_links WHERE kind='PERSONAL' AND ref_id=? AND active=1",o.driver_id).all()).results)links.push([l,'nudgeCourier']);
 return links}
export async function stuckTick(db,env,call,at=new Date(),addButton=null){const list=await stuckOrders(db,at);if(!list.length)return 0;const owners=(await db.prepare("SELECT * FROM tg_links WHERE kind='OWNER' AND active=1").all()).results;
 for(const x of list){
  if(!x.nudged)for(const [l,k]of await holders(db,x)){const w=ctlWords[l.lang]||ctlWords.ru,step={READY:w.stepPickup,PICKED_UP:w.stepDepart,OUT_FOR_DELIVERY:w.stepDeliver}[x.o.status]||'';await call(env,'sendMessage',{chat_id:l.chat_id,text:w[k].replace('{id}',x.o.id.slice(-6)).replace('{m}',x.minutes).replace('{step}',step)}).catch(()=>{})}
  if(x.level===2)for(const l of owners){const rows=addButton?await ownerRows(db,l,x.o,addButton):[];await call(env,'sendMessage',{chat_id:l.chat_id,text:stuckText(x,l.lang),...(rows.length?{reply_markup:{inline_keyboard:rows}}:{})}).catch(()=>{})}
  await q(db,'INSERT INTO stuck_alerts(order_id,version,at,level) VALUES(?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET version=excluded.version,at=excluded.at,level=excluded.level',x.o.id,x.o.version,at.toISOString(),x.level).run()}
 return list.length}
