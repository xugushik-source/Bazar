// Owner 28.10: delivery is free on a buyer's first order — the reason to try БАЗАР. «First» means no earlier order from the same
// number that was not cancelled; numbers are compared by their last 9 digits (+995 555 12 34 56 and 555123456 match). The
// storefront quote never takes a phone, so nobody can probe which numbers are customers: the buyer agrees to the price with
// delivery and the server leaves the delivery out when the order is placed — the buyer can only pay less.
import {fail,uuid,now,text}from './security.mjs';
export const phoneTail=p=>String(p||'').replace(/[^0-9]/g,'').slice(-9);
const tailSql="substr(replace(replace(replace(replace(replace(replace(json_extract(customer,'$.phone'),'+',''),' ',''),'(',''),')',''),'-',''),'.',''),-9)";
export async function firstOrder(db,city,phone){if(city?.first_order_free!==1)return false;const tail=phoneTail(phone);return tail.length===9&&!await db.prepare(`SELECT 1 FROM orders WHERE status<>'CANCELLED' AND ${tailSql}=? LIMIT 1`).bind(tail).first()}
export async function setFirstOrderFree(db,user,b){if(!user?.owner)fail('FORBIDDEN',403);const city=text(b.city_id,60,true);if(typeof b.enabled!=='boolean')fail('INVALID_INPUT');
 const r=await db.prepare('UPDATE cities SET first_order_free=? WHERE id=?').bind(b.enabled?1:0,city).run();if(!r.meta?.changes)fail('NOT_FOUND',404);
 await db.prepare('INSERT INTO operations_audit(id,at,actor,event,data) VALUES(?,?,?,?,?)').bind(uuid(),now(),user.id,'FIRST_ORDER',JSON.stringify({city_id:city,enabled:b.enabled})).run();return {city_id:city,enabled:b.enabled}}
