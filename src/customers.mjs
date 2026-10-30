// The customer base (owner 30.10: «личные данные — это база для нас»), built from orders: one row per phone number with the latest
// name and address, where the buyer first came from, orders, completed, revenue, dates, and whether they agreed to offers. Owner only.
// Marketing follows the latest order's separate consent unless the buyer later said «стоп» (opt-out recorded by the owner).
import {q,parse}from './commerce.mjs';import {fail,now}from './security.mjs';import {phoneTail}from './first-order.mjs';
async function cols(db){try{await db.prepare('SELECT source,consent_version,marketing FROM orders LIMIT 0').all();return 'source,consent_version,marketing'}catch{return "NULL AS source,NULL AS consent_version,0 AS marketing"}}
export async function customerBase(db,city){const rows=(await q(db,`SELECT id,created_at,status,total,customer,${await cols(db)} FROM orders WHERE city_id=? ORDER BY created_at,id`,city).all()).results;
 let outs=new Map();try{outs=new Map((await db.prepare('SELECT phone_tail,at FROM marketing_optout').all()).results.map(r=>[r.phone_tail,r.at]))}catch{}
 const by=new Map();for(const o of rows){const c=parse(o.customer,{}),tail=phoneTail(c.phone);if(!tail)continue;const r=by.get(tail)||{phone_tail:tail,phone:c.phone,name:c.name,address:'',source:o.source||'direct',first_at:o.created_at,last_at:o.created_at,orders:0,completed:0,cancelled:0,revenue:0,marketing:false,consent:null};
  r.phone=c.phone;r.name=c.name||r.name;if(c.address)r.address=c.address;r.last_at=o.created_at;if(o.status==='CANCELLED')r.cancelled++;else r.orders++;if(o.status==='COMPLETED'){r.completed++;r.revenue+=o.total}
  if(o.consent_version){r.consent=o.consent_version;r.marketing=o.marketing===1}by.set(tail,r)}
 for(const r of by.values()){const out=outs.get(r.phone_tail);if(out&&out>=r.last_at)r.marketing=false}
 return {customers:[...by.values()].sort((a,b)=>b.last_at.localeCompare(a.last_at))}}
// «СТОП» from a buyer: no offers to this number from now on (until they tick the box on a new order).
export async function marketingOptOut(db,b,user){if(!user?.owner)fail('FORBIDDEN',403);const tail=phoneTail(b?.phone);if(!tail)fail('INVALID_PHONE');
 await q(db,'INSERT INTO marketing_optout(phone_tail,at,actor) VALUES(?,?,?) ON CONFLICT(phone_tail) DO UPDATE SET at=excluded.at,actor=excluded.actor',tail,now(),user.id).run();return {ok:true}}
// CSV for the owner's own spreadsheet; ';' and a BOM so Excel and Google Sheets in Russian locale open it in columns.
export function customersCsv(list){const cell=v=>{const s=String(v??'');return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 return '﻿'+[['Имя','Телефон','Адрес','Откуда','Первый заказ','Последний заказ','Заказов','Выполнено','Отменено','Выручка ₾','Согласие на рекламу'],...list.map(r=>[r.name,r.phone,r.address,r.source,r.first_at.slice(0,10),r.last_at.slice(0,10),r.orders,r.completed,r.cancelled,(r.revenue/100).toFixed(2).replace('.',','),r.marketing?'да':'нет'])].map(r=>r.map(cell).join(';')).join('\n')+'\n'}
