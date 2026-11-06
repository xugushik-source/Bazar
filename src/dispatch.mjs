// Owner 06.11: after «Беру» a dispatcher (Арпик, a taxi firm) names the courier and the car number; a self-registered
// courier's own name and car go on the order at once. The supplier and the owner see who takes the bags. «Забрал» needs a
// photo of the bags at the supplier, sent to the owner — as the hand-over photo at the door.
import {q,parse,action}from './commerce.mjs';import {fail,text,uuid,now,sha}from './security.mjs';import {botWords}from './bot-words.mjs';
const W=l=>botWords[l]||botWords.ru;
async function ask(db,from,l,order,version,act,state,ttl=3600000){await q(db,'INSERT INTO tg_dialogs(telegram_user,link_id,order_id,version,action,expires,state) VALUES(?,?,?,?,?,?,?) ON CONFLICT(telegram_user) DO UPDATE SET link_id=excluded.link_id,order_id=excluded.order_id,version=excluded.version,action=excluded.action,expires=excluded.expires,state=excluded.state',String(from),l.id,order,version,act,Date.now()+ttl,JSON.stringify(state||{})).run()}
const touch=(db,id)=>q(db,'UPDATE tg_jobs SET revision=revision+1,next_at=0 WHERE order_id=?',id).run();
export async function afterClaim(db,env,call,l,o,user,from){const u=await q(db,'SELECT name,dispatcher,car FROM users WHERE id=?',user.id).first();
 if(u?.dispatcher){await ask(db,from,l,o.id,0,'disp_name',{});await call(env,'sendMessage',{chat_id:l.chat_id,text:W(l.lang).dispName.replace('{id}',o.id.slice(-6)),reply_markup:{force_reply:true,selective:true}});return}
 await q(db,'UPDATE orders SET courier_name=?,courier_car=? WHERE id=?',u?.name||user.name,u?.car||null,o.id).run();await touch(db,o.id)}
export async function dispAnswer(db,env,call,m,l,d){const w=W(l.lang),input=text(String(m.text||'').trim(),60,true),st=parse(d.state,{});
 if(d.action==='disp_name'){await ask(db,m.from.id,l,d.order_id,0,'disp_car',{name:input});await call(env,'sendMessage',{chat_id:l.chat_id,text:w.dispCar.replace('{name}',input),reply_markup:{force_reply:true,selective:true}});return true}
 await q(db,'UPDATE orders SET courier_name=?,courier_car=? WHERE id=?',st.name,input,d.order_id).run();await q(db,'DELETE FROM tg_dialogs WHERE telegram_user=?',String(m.from.id)).run();await touch(db,d.order_id);
 await call(env,'sendMessage',{chat_id:l.chat_id,text:w.dispSaved.replace('{name}',st.name).replace('{car}',input)});return true}
export async function detailsMissing(db,o){if(!o.driver_id)return false;const u=await q(db,'SELECT dispatcher FROM users WHERE id=?',o.driver_id).first(),r=await q(db,'SELECT courier_name,courier_car FROM orders WHERE id=?',o.id).first();return !!u?.dispatcher&&!(r?.courier_name&&r?.courier_car)}
export async function pickupAsk(db,env,call,c,l,o,user,version){if(o.driver_id!==user.id||o.status!=='READY'||version!==o.version)fail('STALE_VERSION',409);
 if(await detailsMissing(db,o)){await call(env,'sendMessage',{chat_id:l.chat_id,text:W(l.lang).dispNeeded});return {ok:true}}
 await ask(db,c.from.id,l,o.id,o.version,'pickup_photo',{});await call(env,'sendMessage',{chat_id:l.chat_id,text:W(l.lang).pickupPhotoPrompt.replace('{id}',o.id.slice(-6)),reply_markup:{force_reply:true,selective:true}});return {ok:true}}
export async function pickupPhoto(db,env,call,m,l,d,user){const w=W(l.lang),ph=m.photo?.at(-1);if(!ph){await call(env,'sendMessage',{chat_id:l.chat_id,text:w.photoNeeded,reply_markup:{force_reply:true,selective:true}});return true}
 const o=await q(db,'SELECT * FROM orders WHERE id=?',d.order_id).first(),cmd='tgpick-'+(await sha(String(m.chat.id)+':'+m.message_id)).slice(0,40);
 await q(db,"INSERT INTO order_photos(id,order_id,kind,file_id,by_user,at,command) VALUES(?,?,'COLLECTED',?,?,?,?) ON CONFLICT(command) DO NOTHING",uuid(),o.id,ph.file_id,user.id,now(),cmd).run();
 await action(db,{id:o.id,version:o.version,command:cmd,action:'pickup'},user);await q(db,'DELETE FROM tg_dialogs WHERE telegram_user=?',String(m.from.id)).run();
 const who=[o.courier_name||user.name,o.courier_car].filter(Boolean).join(' · ');
 for(const own of(await db.prepare("SELECT * FROM tg_links WHERE kind='OWNER' AND active=1").all()).results)await call(env,'sendPhoto',{chat_id:own.chat_id,photo:ph.file_id,caption:'📦 '+o.id.slice(-6)+' · '+W(own.lang).pickedUp+' · '+who}).catch(()=>{});return true}
// The owner's courier list: who is a dispatcher, which car a courier drives.
export async function carAnswer(db,env,call,m,l,d){const st=parse(d.state,{}),v=String(m.text||'').trim();await q(db,'UPDATE users SET car=? WHERE id=? AND owner=0',v==='-'?null:text(v,30,true),st.user_id).run();await q(db,'DELETE FROM tg_dialogs WHERE telegram_user=?',String(m.from.id)).run();await call(env,'sendMessage',{chat_id:l.chat_id,text:W(l.lang).carSaved});return true}
export async function carAsk(db,env,call,c,l,p){const u=await q(db,'SELECT name FROM users WHERE id=?',p.user_id).first();if(!u)fail('NOT_FOUND',404);await ask(db,c.from.id,l,'-',0,'courier_car',{user_id:p.user_id});await call(env,'sendMessage',{chat_id:l.chat_id,text:W(l.lang).carAsk.replace('{name}',u.name),reply_markup:{force_reply:true,selective:true}});return {ok:true}}
