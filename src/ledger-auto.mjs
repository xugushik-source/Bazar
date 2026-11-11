// Owner 11.11: every morning at 08:30 each supplier's group gets what was sold the day before and the sum, answers «согласен» or
// «есть уточнения»; after the owner pays, the group presses «получил» (or «не получил»). The statement is the same record the owner
// could fix by hand (src/vendor-ledger.mjs); here the system creates it, once per supplier and day.
import {q,parse,clock}from './commerce.mjs';import {uuid,now}from './security.mjs';import {unsettled}from './vendor-ledger.mjs';
const TZ='Asia/Tbilisi';export const LEDGER_FROM=510,LEDGER_UNTIL=720;
export async function systemStatement(db,vendor,day){const lines=(await unsettled(db,vendor)).filter(l=>l.day===day);if(!lines.length||lines.some(l=>l.amount===null))return null;
 const command='auto:'+vendor+':'+day;if(await q(db,'SELECT id FROM vendor_statements WHERE command=?',command).first())return null;const id=uuid(),amount=lines.reduce((s,l)=>s+l.amount,0);
 await db.batch([q(db,'INSERT INTO vendor_statements(id,vendor_id,day,amount,lines,created_by,created_at,command) VALUES(?,?,?,?,?,?,?,?)',id,vendor,day,amount,JSON.stringify(lines.map(({day,...l})=>l)),'system',now(),command),...lines.map(l=>q(db,'INSERT INTO vendor_statement_lines(order_id,line_id,statement_id) VALUES(?,?,?)',l.order_id,l.line_id,id))]);return id}
// Runs from the 2-minute cron; the first run after 08:30 does the day, later runs find it claimed.
export async function ledgerTick(db,env,notify,at=new Date()){const c=clock(TZ,at);if(c.minute<LEDGER_FROM||c.minute>=LEDGER_UNTIL)return {sent:0};
 const claim=await q(db,"INSERT INTO app_config(key,value) VALUES('ledger-auto-day',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE value<>excluded.value",c.day).run();if(!claim.meta.changes)return {sent:0};
 let sent=0;for(const v of(await db.prepare("SELECT DISTINCT ref_id FROM tg_links WHERE kind='SUPPLIER' AND active=1").all()).results){try{
  const from=new Date(Date.parse(c.day+'T00:00:00Z')-2*86400000).toISOString().slice(0,10),// only the last two days: older unsettled days stay for the owner to fix by hand, never mailed out in bulk
   days=[...new Set((await unsettled(db,v.ref_id)).map(l=>l.day))].filter(d=>d<c.day&&d>=from).sort();
  for(const d of days){const id=await systemStatement(db,v.ref_id,d);if(id){await notify(id);sent++}}}catch{}}
 return {sent}}
// What the supplier reads: every sold item with its quantity and amount (weighed goods in kg).
export function itemLines(lines,lang,kg){const money=n=>(n/100).toFixed(2);return lines.map(x=>{const nm=x.names?.[lang]||x.names?.ru||x.product_id||'—',weighed=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(x.mode),qty=weighed?(x.quantity/1000).toFixed(3).replace(/\.?0+$/,'').replace('.',',')+' '+kg:x.quantity+' ×';return `• ${nm} — ${qty} = ${money(x.amount)}`})}
