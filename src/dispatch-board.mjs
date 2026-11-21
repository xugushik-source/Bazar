// Доска заказов дня и назначение одного курьера на несколько заказов (владелец).
// Назначение идёт через существующую action('assign'): те же проверки курьера, города и доставки, тот же журнал событий.
// (src/dispatch.mjs — отдельная логика диспетчера в Telegram; здесь её не меняем.)
import {q,action,parse} from './commerce.mjs';
import {fail,uuid,text} from './security.mjs';

export const MAX_ASSIGN=100;
const DEFAULT_AREA='Ахалкалаки';
const areaOf=address=>{const a=String(address||'');const i=a.indexOf(':');return i>0?a.slice(0,i):DEFAULT_AREA};
const hhmm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

// Доставки дня с фильтрами: населённый пункт и интервал времени (в минутах от полуночи).
export async function dispatchBoard(db,{day,area='',from=null,to=null}={}){
  const d=text(day,10,true);
  const rows=(await db.prepare(`SELECT o.id,o.minute,o.status,o.customer,o.driver_id,o.courier_name,o.version,u.name AS driver_name
    FROM orders o LEFT JOIN users u ON u.id=o.driver_id
    WHERE o.day=? AND o.fulfillment='delivery' AND o.status NOT IN ('CANCELLED','COMPLETED') ORDER BY o.minute`).bind(d).all()).results;
  const list=rows.map(o=>{const c=parse(o.customer,{});return {order_id:o.id,time:hhmm(o.minute),minute:o.minute,area:areaOf(c.address),
    address:String(c.address||'').replace(/^[^:]*:\s*/,''),status:o.status,version:o.version,driver_id:o.driver_id||null,driver_name:o.driver_name||o.courier_name||null}});
  const orders=list.filter(o=>(!area||o.area===area)&&(from===null||o.minute>=from)&&(to===null||o.minute<=to));
  const byArea={};
  for(const o of orders)byArea[o.area]=(byArea[o.area]||0)+1;
  return {day:d,count:orders.length,by_area:byArea,orders};
}

// Один курьер на список заказов. Каждый заказ — отдельно: сбой одного не отменяет остальные, результат по каждому.
export async function assignMany(db,{order_ids,driver_id},owner){
  if(!Array.isArray(order_ids)||!order_ids.length||order_ids.length>MAX_ASSIGN)fail('INVALID_INPUT',409);
  const driver=text(driver_id,80,true);
  const results=[];
  for(const raw of [...new Set(order_ids)]){
    const id=text(raw,80,true);
    const o=await q(db,'SELECT id,version FROM orders WHERE id=?',id).first();
    if(!o){results.push({order_id:id,ok:false,error:'NOT_FOUND'});continue}
    try{
      await action(db,{id,version:o.version,command:uuid(),action:'assign',driver_id:driver},owner);
      results.push({order_id:id,ok:true});
    }catch(e){
      results.push({order_id:id,ok:false,error:e.code||'ERROR'});
    }
  }
  return {driver_id:driver,assigned:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,results};
}
