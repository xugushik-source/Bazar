// Owner 30.10: a stuck order must not go unnoticed. When an order has not moved for 5 minutes and its delivery is less than two hours
// away (or already late), the owner's bot says who is holding it and what has to be pressed; once per stop, again if it stalls later.
import {q,parse}from './commerce.mjs';
export const STUCK_MINUTES=5,AHEAD_MINUTES=120;
export const stuckWords={
 ru:{head:'⏰ Заказ {id} стоит {m} мин · доставка {time}',confirm:'Ждём: подтвердить заказ',supplier:'Ждём поставщика: {v} — взвесить и нажать «Готово»',approve:'Ждём: одобрить изменение (вес или замена)',check:'Ждём: проверить сборку',buyer:'Ждём покупателя: подтвердить сумму, или позвоните ему',courier:'Ждём курьера: забрать и доставить',nobody:'Курьер не назначен: никто не нажал «Беру»'},
 hy:{head:'⏰ Պատվեր {id}-ը կանգնած է {m} րոպե · առաքում {time}',confirm:'Սպասում ենք՝ հաստատել պատվերը',supplier:'Սպասում ենք մատակարարին՝ {v} — կշռել և սեղմել «Պատրաստ է»',approve:'Սպասում ենք՝ հաստատել փոփոխությունը (քաշ կամ փոխարինում)',check:'Սպասում ենք՝ ստուգել հավաքածուն',buyer:'Սպասում ենք գնորդին՝ հաստատել գումարը, կամ զանգահարեք նրան',courier:'Սպասում ենք առաքիչին՝ վերցնել և առաքել',nobody:'Առաքիչ նշանակված չէ՝ ոչ ոք չի սեղմել «Վերցնում եմ»'},
 ka:{head:'⏰ შეკვეთა {id} დგას {m} წთ · მიწოდება {time}',confirm:'ველოდებით: შეკვეთის დადასტურებას',supplier:'ველოდებით მომწოდებელს: {v} — აწონოს და დააჭიროს „მზადაა“',approve:'ველოდებით: ცვლილების დადასტურებას (წონა ან შეცვლა)',check:'ველოდებით: აწყობის შემოწმებას',buyer:'ველოდებით მყიდველს: თანხის დადასტურებას, ან დაურეკეთ მას',courier:'ველოდებით კურიერს: აიღოს და მიიტანოს',nobody:'კურიერი არ არის დანიშნული: არავინ დააჭირა „ვიღებ“'}};
const waitFor={NEW:'confirm',CLAIMED:'confirm',WEIGHING:'supplier',ASSEMBLING:'supplier',AWAITING_APPROVAL:'approve',CHECKING:'check',CUSTOMER_REVIEW:'buyer',READY:'courier',PICKED_UP:'courier',OUT_FOR_DELIVERY:'courier'};
const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
// Tbilisi has no daylight saving: a slot is day + minute at +04:00.
const slotAt=o=>Date.parse(o.day+'T'+hhmm(o.minute)+':00+04:00');
export async function stuckOrders(db,at=new Date()){const since=new Date(at.getTime()-STUCK_MINUTES*60000).toISOString(),out=[];
 for(const o of(await q(db,"SELECT * FROM orders WHERE status NOT IN('COMPLETED','CANCELLED') AND updated_at<=?",since).all()).results){
  if(!waitFor[o.status]||slotAt(o)-at.getTime()>AHEAD_MINUTES*60000)continue;
  const seen=await q(db,'SELECT version FROM stuck_alerts WHERE order_id=?',o.id).first();if(seen?.version===o.version)continue;
  const vendors=['WEIGHING','ASSEMBLING'].includes(o.status)?(await q(db,"SELECT v.names FROM order_groups g JOIN vendors v ON v.id=g.vendor_id WHERE g.order_id=? AND g.status!='READY' ORDER BY v.id",o.id).all()).results.map(r=>parse(r.names,{})):[];
  out.push({o,minutes:Math.floor((at.getTime()-Date.parse(o.updated_at))/60000),wait:o.status==='READY'&&o.fulfillment==='delivery'&&!o.driver_id?'nobody':waitFor[o.status],vendors})}
 return out}
export function stuckText(x,lang){const w=stuckWords[lang]||stuckWords.ru;return w.head.replace('{id}',x.o.id.slice(-6)).replace('{m}',x.minutes).replace('{time}',hhmm(x.o.minute))+'\n'+w[x.wait].replace('{v}',x.vendors.map(n=>n[lang]||n.ru).join(', ')||'—')}
export async function stuckTick(db,env,call,at=new Date()){const list=await stuckOrders(db,at);if(!list.length)return 0;const owners=(await db.prepare("SELECT * FROM tg_links WHERE kind='OWNER' AND active=1").all()).results;
 for(const x of list){for(const l of owners)await call(env,'sendMessage',{chat_id:l.chat_id,text:stuckText(x,l.lang)}).catch(()=>{});
  await q(db,'INSERT INTO stuck_alerts(order_id,version,at) VALUES(?,?,?) ON CONFLICT(order_id) DO UPDATE SET version=excluded.version,at=excluded.at',x.o.id,x.o.version,at.toISOString()).run()}
 return list.length}
