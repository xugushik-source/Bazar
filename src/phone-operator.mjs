import {q,parse,createOrder,orderView} from './commerce.mjs';
import {fail,text,uuid,now,integer} from './security.mjs';
const audit=(db,user,event,data)=>q(db,'INSERT INTO operations_audit(id,at,actor,event,data) VALUES(?,?,?,?,?)',uuid(),now(),user.id,event,JSON.stringify(data));
// Only the owner until a dedicated operator permission is introduced. Vendor staff
// must never gain access to the entire customer base through this endpoint.
export async function phoneAPI(db,op,b,user){
 if(!user?.owner)fail('FORBIDDEN',403);
 if(op==='create')return createOrder(db,b,user);
 if(op==='customers'){
  const phone=text(b.phone,40,true).replace(/\D/g,'');if(phone.length<5)fail('INVALID_PHONE');
  const rows=(await q(db,"SELECT id,customer FROM orders WHERE city_id=? ORDER BY created_at DESC LIMIT 1000",text(b.city_id,80,true)).all()).results;
  const ids=rows.filter(o=>parse(o.customer).phone.replace(/\D/g,'')===phone).slice(0,20);
  await audit(db,user,'PHONE_CUSTOMER_LOOKUP',{city_id:b.city_id}).run();
  return {orders:await Promise.all(ids.map(o=>orderView(db,o.id,user)))};
 }
 if(op==='drafts')return {drafts:(await q(db,'SELECT id,payload,version,updated_at FROM phone_drafts WHERE actor=? AND city_id=? ORDER BY updated_at DESC LIMIT 30',user.id,text(b.city_id,80,true)).all()).results.map(r=>({...r,payload:parse(r.payload)}))};
 if(op==='draft'){
  const id=b.id?text(b.id,80,true):uuid(),city=text(b.city_id,80,true),payload=JSON.stringify(b.payload||{});
  const old=await q(db,'SELECT * FROM phone_drafts WHERE id=?',id).first();
  if(old&&(old.actor!==user.id||old.city_id!==city))fail('FORBIDDEN',403);
  if(old&&old.version!==integer(b.version,1))fail('STALE_VERSION',409);
  await db.batch([old?q(db,'UPDATE phone_drafts SET payload=?,version=version+1,updated_at=? WHERE id=? AND version=?',payload,now(),id,old.version):q(db,'INSERT INTO phone_drafts(id,actor,city_id,payload,updated_at) VALUES(?,?,?,?,?)',id,user.id,city,payload,now()),...(old?[db.prepare('INSERT INTO guards(value) VALUES(changes())')]:[]),audit(db,user,'PHONE_DRAFT_SAVED',{id}),db.prepare('DELETE FROM guards')]);
  return {id,version:(old?.version||0)+1};
 }
 fail('NOT_FOUND',404);
}
