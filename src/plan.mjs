// План доставок на период: что и сколько загрузить в каждый день. Только чтение: ничего не резервирует и не создаёт заказов.
import {q,parse} from './commerce.mjs';
import {isDay,addDays} from './subscriptions.mjs';
import {fail} from './security.mjs';

export const MAX_PLAN_SPAN=120;
const ACTIVE_STATUSES=['PLANNED','ORDERED','WAITING_FUNDS','WAITING_APPROVAL','WAITING_STOCK','WAITING_SLOT','WAITING_CHANGE'];

// Возвращает по дням: сколько доставок, по каким программам, и суммарный список товаров (граммы и штуки).
export async function deliveryPlan(db,{from,to,today}){
  if(!isDay(from)||!isDay(to)||to<from)fail('INVALID_DATE',409);
  if(to>addDays(from,MAX_PLAN_SPAN))fail('INVALID_DATE',409);
  const rows=(await db.prepare(`SELECT d.day,d.minute,d.status,p.id AS program_id,p.items
      FROM subscription_deliveries d JOIN subscription_programs p ON p.id=d.program_id
      WHERE p.status='ACTIVE' AND d.day BETWEEN ? AND ? AND d.status IN (${ACTIVE_STATUSES.map(s=>`'${s}'`).join(',')})
      ORDER BY d.day,d.minute`).bind(from,to).all()).results;
  const ids=[...new Set(rows.flatMap(r=>parse(r.items,[]).map(i=>i.product_id)))];
  const names=ids.length?Object.fromEntries((await db.prepare(`SELECT id,names FROM products WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all()).results.map(r=>[r.id,parse(r.names,{}).ru||r.id])):{};
  const days=new Map();
  for(const r of rows){
    if(!days.has(r.day))days.set(r.day,{day:r.day,is_today:r.day===today,deliveries:0,programs:new Set(),statuses:{},products:new Map()});
    const d=days.get(r.day);
    d.deliveries++;d.programs.add(r.program_id);d.statuses[r.status]=(d.statuses[r.status]||0)+1;
    for(const item of parse(r.items,[])){
      const p=d.products.get(item.product_id)||{product_id:item.product_id,name:names[item.product_id]||item.product_id,grams:0,count:0,deliveries:0};
      p.grams+=Number.isInteger(item.selection?.grams)?item.selection.grams:0;
      p.count+=Number.isInteger(item.selection?.count)?item.selection.count:0;
      p.deliveries++;
      d.products.set(item.product_id,p);
    }
  }
  return {from,to,days:[...days.values()].map(d=>({day:d.day,is_today:d.is_today,deliveries:d.deliveries,programs:d.programs.size,statuses:d.statuses,products:[...d.products.values()].sort((a,b)=>a.name.localeCompare(b.name))}))};
}
