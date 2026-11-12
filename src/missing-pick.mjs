// Owner 12.11: a supplier pressing «Есть отсутствующие позиции» picks WHICH item is missing, and that item is closed on the site
// for the rest of the day (the next day it is back by itself — day_closures for today only). «Нет ничего» closes all of this
// supplier's items in the order and marks his part missing, as the old button did.
import {q,parse,action,clock}from './commerce.mjs';import {fail,now,token}from './security.mjs';import {botWords}from './bot-words.mjs';
const W=l=>botWords[l]||botWords.ru;
export const missActions=['miss_line','miss_all'];
async function button(db,l,o,payload){const id=token().slice(0,32);await q(db,'INSERT INTO tg_buttons(id,link_id,order_id,version,payload,expires) VALUES(?,?,?,NULL,?,?)',id,l.id,o.id,JSON.stringify(payload),Date.now()+86400000).run();return 'bz:'+id}
const linesOf=async(db,o,vendor)=>(await q(db,'SELECT line_id,product_id,quote,availability FROM order_lines WHERE order_id=? AND vendor_id=? ORDER BY rowid',o.id,vendor).all()).results;
const nameOf=(row,lang)=>{const x=parse(row.quote,{});return x.names?.[lang]||x.names?.ru||row.product_id};
export async function closeForToday(db,productId,vendor,tz='Asia/Tbilisi'){await q(db,'INSERT INTO day_closures(product_id,day,vendor_id,closed_by,at) VALUES(?,?,?,?,?) ON CONFLICT(product_id,day) DO NOTHING',productId,clock(tz).day,vendor,'supplier-order',now()).run()}
export async function missingPicker(db,env,call,l,o,version){if(version!==o.version)fail('STALE_VERSION',409);const w=W(l.lang),rows=(await linesOf(db,o,l.ref_id)).filter(r=>r.availability!=='MISSING'),kb=[];
 for(const r of rows)kb.push([{text:'❌ '+nameOf(r,l.lang),callback_data:await button(db,l,o,{action:'miss_line',line_id:r.line_id})}]);
 kb.push([{text:w.missAll,callback_data:await button(db,l,o,{action:'miss_all'})}]);
 await call(env,'sendMessage',{chat_id:l.chat_id,text:w.missPickAsk.replace('{id}',o.id.slice(-6)),reply_markup:{inline_keyboard:kb}});return {ok:true}}
export async function missCallback(db,env,call,c,l,p,o,user,buttonId){if(l.kind!=='SUPPLIER')fail('FORBIDDEN',403);const w=W(l.lang),tz=(await q(db,'SELECT timezone FROM cities WHERE id=?',o.city_id).first())?.timezone||'Asia/Tbilisi',rows=await linesOf(db,o,l.ref_id);
 const groupMissing=async reason=>{const g=await q(db,'SELECT status FROM order_groups WHERE order_id=? AND vendor_id=?',o.id,l.ref_id).first(),cur=await q(db,'SELECT version FROM orders WHERE id=?',o.id).first();if(g&&['WAITING','AVAILABLE','PREPARING'].includes(g.status))try{await action(db,{id:o.id,version:cur.version,command:'telegram-miss-all-'+buttonId,action:'missing',vendor_id:l.ref_id,reason},user)}catch{}};
 if(p.action==='miss_all'){for(const r of rows)await closeForToday(db,r.product_id,l.ref_id,tz);await groupMissing(w.missAll);await call(env,'sendMessage',{chat_id:l.chat_id,text:w.missClosed.replace('{name}',rows.map(r=>nameOf(r,l.lang)).join(', '))});return {ok:true}}
 const row=rows.find(r=>r.line_id===p.line_id);if(!row)fail('NOT_FOUND',404);await closeForToday(db,row.product_id,l.ref_id,tz);
 if(row.availability!=='MISSING'){const cur=await q(db,'SELECT version FROM orders WHERE id=?',o.id).first();let marked=false;try{await action(db,{id:o.id,version:cur.version,command:'telegram-miss-'+buttonId,action:'line_missing',line_id:row.line_id},user);marked=true}catch{}
  // Before weighing (or in the step-by-step flow) a single line cannot be marked: the supplier's part is marked missing, as before.
  if(!marked)await groupMissing(w.missWhat.replace('{name}',nameOf(row,l.lang)))}
 const left=(await linesOf(db,o,l.ref_id)).filter(r=>r.availability!=='MISSING');if(!left.length)await groupMissing(w.missAll);
 await call(env,'sendMessage',{chat_id:l.chat_id,text:w.missClosed.replace('{name}',nameOf(row,l.lang))});return {ok:true}}
