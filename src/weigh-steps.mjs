// Owner 06.11: the supplier weighs each weighed line in turn in the bot instead of typing «1=950, 2=1800». Each answer is
// checked against the line's disclosed bounds (the quote's min/max, per carcass for whole goods) and shown at once; the
// summary is written as one ordinary «weigh» action, so totals, tolerance and the buyer's approval follow the same rules.
import {q,parse,action,orderView}from './commerce.mjs';import {fail,token,sha}from './security.mjs';import {botWords}from './bot-words.mjs';
const W=l=>botWords[l]||botWords.ru,WEIGHT=['WEIGHED','WHOLE_BY_WEIGHT'];
const kg=(g,l)=>(g/1000).toFixed(3).replace(/\.?0+$/,'').replace('.',',')+' '+W(l).kg;
export function grams(text){const s=String(text||'').trim().replace(/\s+/g,'').replace(',','.');if(!/^\d+(\.\d+)?$/.test(s))return null;const n=Number(s);if(!(n>0))return null;return Math.round(n<=50?n*1000:n)}
const nameOf=(x,l)=>x.names?.[l]||x.names?.ru||x.product_id;
export function stepsFor(o,vendor){const out=[];for(const x of o.quotes||[]){if(vendor&&x.vendor_id!==vendor||!WEIGHT.includes(x.mode)||o.availability?.[x.line_id]==='MISSING')continue;
 if(x.mode==='WHOLE_BY_WEIGHT')for(let k=1;k<=x.count;k++)out.push({line_id:x.line_id,k,c:x.count});else out.push({line_id:x.line_id})}return out}
async function save(db,from,l,o,version,state){await q(db,"INSERT INTO tg_dialogs(telegram_user,link_id,order_id,version,action,expires,state) VALUES(?,?,?,?,'weigh_step',?,?) ON CONFLICT(telegram_user) DO UPDATE SET link_id=excluded.link_id,order_id=excluded.order_id,version=excluded.version,action=excluded.action,expires=excluded.expires,state=excluded.state",String(from),l.id,o.id,version,Date.now()+3600000,JSON.stringify(state)).run()}
function prompt(o,l,state){const w=W(l.lang),s=state.steps[state.answers.length],x=o.quotes.find(x=>x.line_id===s.line_id),want=x.mode==='WHOLE_BY_WEIGHT'?'≈'+kg(x.each_estimate_g,l.lang)+(s.c>1?' · '+w.wsPiece.replace('{k}',s.k).replace('{c}',s.c):''):kg(x.target_g,l.lang);
 return w.wsAsk.replace('{i}',state.answers.length+1).replace('{n}',state.steps.length).replace('{name}',nameOf(x,l.lang)).replace('{want}',want)}
export async function startSteps(db,env,call,l,o,from){const steps=stepsFor(o,l.kind==='SUPPLIER'?l.ref_id:null);if(!steps.length)fail('NOTHING_TO_WEIGH',409);const state={steps,answers:[]};await save(db,from,l,o,o.version,state);
 await call(env,'sendMessage',{chat_id:l.chat_id,text:prompt(o,l,state),reply_markup:{force_reply:true,selective:true}});return {ok:true}}
async function button(db,l,o,version,caption,payload){const id=token().slice(0,32);await q(db,'INSERT INTO tg_buttons(id,link_id,order_id,version,payload,expires) VALUES(?,?,?,?,?,?)',id,l.id,o.id,version,JSON.stringify(payload),Date.now()+3600000).run();return {text:caption,callback_data:'bz:'+id}}
function check(x,g){const [min,max]=x.mode==='WHOLE_BY_WEIGHT'?[x.each_min_g,x.each_max_g]:[x.min_g,x.max_g];return {ok:g>=min&&g<=max,min,max}}
export async function stepAnswer(db,env,call,m,l,d,o){const w=W(l.lang),state=parse(d.state,{steps:[],answers:[]}),g=grams(m.text);
 if(!g){await call(env,'sendMessage',{chat_id:l.chat_id,text:w.wsBad,reply_markup:{force_reply:true,selective:true}});return true}
 const s=state.steps[state.answers.length];if(!s)return true;const x=o.quotes.find(x=>x.line_id===s.line_id);if(!x)fail('STALE_VERSION',409);state.answers.push(g);const r=check(x,g);
 const note=(r.ok?w.wsOk:w.wsOut).replace('{name}',nameOf(x,l.lang)).replace('{got}',kg(g,l.lang)).replace('{min}',kg(r.min,l.lang)).replace('{max}',kg(r.max,l.lang));await save(db,m.from.id,l,o,d.version,state);
 if(state.answers.length<state.steps.length){await call(env,'sendMessage',{chat_id:l.chat_id,text:note+'\n\n'+prompt(o,l,state),reply_markup:{force_reply:true,selective:true}});return true}
 const lines=state.steps.map((s,i)=>{const x=o.quotes.find(x=>x.line_id===s.line_id),r=check(x,state.answers[i]);return (r.ok?'✅ ':'⚠️ ')+nameOf(x,l.lang)+(s.c>1?' ('+s.k+'/'+s.c+')':'')+' — '+kg(state.answers[i],l.lang)});
 await call(env,'sendMessage',{chat_id:l.chat_id,text:note+'\n\n'+w.wsSummary.replace('{id}',o.id.slice(-6))+'\n'+lines.join('\n'),reply_markup:{inline_keyboard:[[await button(db,l,o,d.version,w.wsAllRight,{action:'weigh_ok'})],[await button(db,l,o,d.version,w.wsRedo,{action:'weigh_redo'})]]}});return true}
export function actualsFrom(o,state){const by={};state.steps.forEach((s,i)=>{(by[s.line_id]??=[]).push(state.answers[i])});
 return Object.entries(by).map(([line_id,v])=>{const x=o.quotes.find(x=>x.line_id===line_id);return x.mode==='WHOLE_BY_WEIGHT'?{line_id,each_net_g:v}:{line_id,net_g:v[0]}})}
export async function stepFinish(db,env,call,c,l,row,user,redo){const o=await orderView(db,row.id,user),d=await q(db,"SELECT * FROM tg_dialogs WHERE telegram_user=? AND link_id=? AND order_id=? AND action='weigh_step'",String(c.from.id),l.id,o.id).first();
 if(redo)return startSteps(db,env,call,l,o,c.from.id);if(!d)fail('STALE_VERSION',409);const state=parse(d.state,{steps:[],answers:[]});if(state.answers.length!==state.steps.length||state.steps.some(s=>!o.quotes.some(x=>x.line_id===s.line_id&&WEIGHT.includes(x.mode))))fail('STALE_VERSION',409);
 // the answers are tied to lines, not to the order's version: another supplier may have pressed «Готово» meanwhile
 await action(db,{id:o.id,version:o.version,command:'tgsteps-'+(await sha(String(c.from.id)+':'+o.id+':'+d.version)).slice(0,40),action:'weigh',actuals:actualsFrom(o,state)},user);
 await q(db,'DELETE FROM tg_dialogs WHERE telegram_user=?',String(c.from.id)).run();await call(env,'sendMessage',{chat_id:l.chat_id,text:W(l.lang).wsSaved});
 // the order card comes again below the conversation, now with «Готово»
 await q(db,'UPDATE tg_jobs SET message_id=NULL,revision=revision+1,next_at=0 WHERE link_id=? AND order_id=?',l.id,o.id).run();return {ok:true}}
