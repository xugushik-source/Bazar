// Owner 29.10: «в экселе тоже меняются закуп и продажа». The owner's Google Sheet pulls the live catalogue with
// =IMPORTDATA(<this link>) — a tab-separated list with costs, so the link carries a secret key the owner gets (and can change)
// in the cabinet. Decimal commas match the sheet's Russian locale. Nothing is pushed to Google; no Google credentials needed.
import {q,parse,clock}from './commerce.mjs';import {fail,token,constant,now}from './security.mjs';import {closedToday}from './supplier-day.mjs';
const KEY='sheet-key',num=n=>n==null?'':(n/100).toFixed(2).replace('.',','),cell=v=>String(v??'').replace(/[\t\r\n]+/g,' ');
export async function sheetKey(db,rotate=false){if(rotate)await q(db,'DELETE FROM app_config WHERE key=?',KEY).run();await q(db,'INSERT INTO app_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING',KEY,token()).run();return (await q(db,'SELECT value FROM app_config WHERE key=?',KEY).first()).value}
export async function priceSheet(db,key){const stored=(await q(db,'SELECT value FROM app_config WHERE key=?',KEY).first())?.value;if(!stored||!key||!constant(String(key),stored))fail('FORBIDDEN',403);
 const rows=(await db.prepare('SELECT p.*,v.names AS vendor_names,v.city_id FROM products p JOIN vendors v ON v.id=p.vendor_id ORDER BY v.city_id,p.vendor_id,p.category,p.id').all()).results,closed=await closedToday(db,clock('Asia/Tbilisi').day);
 const out=[['Код','Город','Поставщик','Товар','Ед.','Закуп ₾','Продажа ₾','Наценка %','В продаже','Нет сегодня','Обновлено']];const stamp=now().slice(0,16).replace('T',' ');
 for(const p of rows){const mode=parse(p.profile,{}).mode,unit=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(mode)?'кг':'шт',pct=p.cost>0?((p.price/p.cost-1)*100).toFixed(1).replace('.',','):'';
  out.push([p.id,p.city_id,parse(p.vendor_names,{}).ru||p.vendor_id,parse(p.names,{}).ru||p.id,unit,num(p.cost),num(p.price),pct,p.active?'да':'нет',closed.has(p.id)?'нет сегодня':'',stamp])}
 return out.map(r=>r.map(cell).join('\t')).join('\n')+'\n'}
