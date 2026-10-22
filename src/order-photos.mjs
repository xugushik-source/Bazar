import {q,access}from './commerce.mjs';
import {fail,uuid,now,text}from './security.mjs';
import {configured,addButton}from './telegram.mjs';
import {botWords}from './bot-words.mjs';
// Photos uploaded on the site (owner 22.10): the collector's photo of the packed order and the buyer's transfer screenshot.
// The image (a compressed JPEG made on the phone) is kept with the order and also sent to the owner's Telegram chats.
const words=l=>botWords[l]||botWords.ru;
async function sendPhoto(env,chat_id,bytes,mime,caption,reply_markup){const form=new FormData();form.append('chat_id',String(chat_id));form.append('caption',caption);if(reply_markup)form.append('reply_markup',JSON.stringify(reply_markup));form.append('photo',new Blob([bytes],{type:mime}),'photo.'+mime.split('/')[1]);const r=await (env.TELEGRAM_FETCH||fetch)('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendPhoto',{method:'POST',body:form,signal:AbortSignal.timeout(15000)});return r.json()}
export async function savePhoto(db,env,b,user,key){const kind=b.kind,{o,role}=await access(db,b.id,user,key);
 if(kind==='COLLECTED'){if(!['OWNER','COLLECTOR','CONTROLLER'].includes(role)||!['WEIGHING','ASSEMBLING','CHECKING'].includes(o.status))fail('FORBIDDEN',403)}
 else if(kind==='RECEIPT'){if(role!=='CUSTOMER'&&role!=='OWNER'||o.status==='CANCELLED'||o.payment==='PAID')fail('INVALID_TRANSITION',409)}else fail('INVALID_INPUT');
 const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image||''));if(!m||m[2].length>1500000)fail('INVALID_INPUT');
 const command=text(b.command,80,true),old=await q(db,'SELECT id,order_id FROM order_photos WHERE command=?',command).first();if(old){if(old.order_id!==o.id)fail('IDEMPOTENCY_CONFLICT',409);return {ok:true,id:old.id}}
 const id=uuid();await db.batch([q(db,'INSERT INTO order_photos(id,order_id,kind,data,mime,by_user,at,command) VALUES(?,?,?,?,?,?,?,?)',id,o.id,kind,m[2],m[1],user?.id||'CUSTOMER',now(),command),q(db,"INSERT INTO events(id,order_id,at,actor,event,data) VALUES(?,?,?,?,?,?)",uuid(),o.id,now(),user?.id||'CUSTOMER',kind==='RECEIPT'?'RECEIPT_ADDED':'COLLECTED_PHOTO',JSON.stringify({photo_id:id}))]);
 if(configured(env)){const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0)),money=n=>(n/100).toFixed(2)+' '+o.currency;
  for(const l of(await db.prepare("SELECT * FROM tg_links WHERE kind='OWNER' AND active=1").all()).results){const w=words(l.lang);try{if(kind==='RECEIPT'){const kb=[[await addButton(db,l,o,'receipt_ok',w.receiptOk,{photo_id:id}),await addButton(db,l,o,'receipt_bad',w.receiptBad,{photo_id:id})]];await sendPhoto(env,l.chat_id,bytes,m[1],'🧾 '+o.id.slice(-6)+' · '+w.receipt+' · '+money(o.total-o.paid),{inline_keyboard:kb})}else await sendPhoto(env,l.chat_id,bytes,m[1],'📷 '+o.id.slice(-6)+' · '+w.collectedPhoto+(user?.name?' · '+user.name:''))}catch{}}}
 return {ok:true,id}}
export async function listPhotos(db,id,user){const {role}=await access(db,id,user);if(!['OWNER','COLLECTOR','CONTROLLER','DRIVER'].includes(role))fail('FORBIDDEN',403);return {photos:(await q(db,'SELECT id,kind,at,by_user FROM order_photos WHERE order_id=? ORDER BY at',id).all()).results}}
// The image itself, for staff: kept data, or the Telegram file for photos sent in the bot.
export async function photoFile(db,env,photoId,user){const p=await q(db,'SELECT * FROM order_photos WHERE id=?',text(photoId,80,true)).first();if(!p)fail('NOT_FOUND',404);const {role}=await access(db,p.order_id,user);if(!['OWNER','COLLECTOR','CONTROLLER','DRIVER'].includes(role))fail('FORBIDDEN',403);
 if(p.data)return new Response(Uint8Array.from(atob(p.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':p.mime,'Cache-Control':'private, max-age=3600'}});
 if(!configured(env))fail('NOT_FOUND',404);const f=await (env.TELEGRAM_FETCH||fetch)('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/getFile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_id:p.file_id})}).then(r=>r.json());if(!f.ok)fail('NOT_FOUND',404);
 const r=await fetch('https://api.telegram.org/file/bot'+env.TELEGRAM_BOT_TOKEN+'/'+f.result.file_path);return new Response(r.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=3600'}})}
