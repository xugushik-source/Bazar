// Owner 06.11: «чтобы потом не было: я по столько давал — нет, не по столько». Every day, once the supplier's morning
// window has closed, each product's cost, price and availability is written with how it was confirmed (pressed «Всё есть»,
// marked «нет сегодня», or no answer = all available at these prices). Price changes are written when they happen.
// Rows are only added. The owner's Google Sheet reads them with =IMPORTDATA(<link>) like the live price list.
import {q,parse,clock}from './commerce.mjs';import {fail,uuid,now,constant}from './security.mjs';
const TZ='Asia/Tbilisi',hm=iso=>{if(!iso)return '';const m=clock(TZ,new Date(iso)).minute;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const name=async(db,id)=>id?(await q(db,'SELECT name FROM users WHERE id=?',id).first())?.name||'':'';
export async function journalTick(db,at=new Date()){const c=clock(TZ,at);
 for(const {vendor_id}of(await db.prepare('SELECT DISTINCT vendor_id FROM products WHERE active=1').all()).results){let open=540;try{open=(await q(db,'SELECT open_minute FROM vendors WHERE id=?',vendor_id).first())?.open_minute??540}catch{}
  if(c.minute<open+180||await q(db,"SELECT 1 FROM price_journal WHERE kind='DAY' AND day=? AND vendor_id=? LIMIT 1",c.day,vendor_id).first())continue;
  const link=await q(db,"SELECT id FROM tg_links WHERE kind='SUPPLIER' AND active=1 AND ref_id=?",vendor_id).first(),check=link?await q(db,'SELECT * FROM supplier_checks WHERE link_id=? AND day=?',link.id,c.day).first():null,
   closed=new Map((await q(db,'SELECT * FROM day_closures WHERE vendor_id=? AND day=?',vendor_id,c.day).all()).results.map(r=>[r.product_id,r])),who=await name(db,check?.answered_by),st=[];
  for(const p of(await q(db,'SELECT * FROM products WHERE vendor_id=? AND active=1',vendor_id).all()).results){const off=closed.get(p.id);
   const how=off?'❌ нет сегодня — отметил '+(await name(db,off.closed_by))+' '+hm(off.at):check?.answered_by?'✅ подтвердил «Всё есть» — '+who+(check.answered_at?' '+hm(check.answered_at):''):link?'не ответил — по умолчанию всё есть, цены те же':'нет группы поставщика';
   st.push(q(db,"INSERT INTO price_journal(id,day,kind,vendor_id,product_id,cost,price,available,how,at) VALUES(?,?,'DAY',?,?,?,?,?,?,?) ON CONFLICT DO NOTHING",uuid(),c.day,vendor_id,p.id,p.cost,p.price,off?0:1,how,now()))}
  for(let i=0;i<st.length;i+=80)await db.batch(st.slice(i,i+80))}}
export async function journalPrice(db,r,price,who){const p=await q(db,'SELECT vendor_id FROM products WHERE id=?',r.product_id).first();const m=x=>x==null?'—':(x/100).toFixed(2).replace('.',',');
 await q(db,"INSERT INTO price_journal(id,day,kind,vendor_id,product_id,cost,price,available,how,at) VALUES(?,?,'PRICE',?,?,?,?,1,?,?)",uuid(),clock(TZ).day,p?.vendor_id||r.vendor_id,r.product_id,r.new_cost,price,'💲 цена изменена: закуп '+m(r.old_cost)+' → '+m(r.new_cost)+', продажа '+m(r.old_price)+' → '+m(price)+' — '+who,now()).run()}
const KEY='sheet-key',num=n=>n==null?'':(n/100).toFixed(2).replace('.',','),cell=v=>String(v??'').replace(/[\t\r\n]+/g,' ');
export async function historySheet(db,key,days=31){const stored=(await q(db,'SELECT value FROM app_config WHERE key=?',KEY).first())?.value;if(!stored||!key||!constant(String(key),stored))fail('FORBIDDEN',403);
 const n=Math.min(366,Math.max(1,Number(days)||31)),from=new Date(Date.now()-n*86400000).toISOString().slice(0,10);
 const rows=(await q(db,'SELECT j.*,p.names,v.names AS vendor_names FROM price_journal j JOIN products p ON p.id=j.product_id JOIN vendors v ON v.id=j.vendor_id WHERE j.day>=? ORDER BY j.day DESC,v.id,j.kind,p.id,j.at',from).all()).results;
 const out=[['Дата','Поставщик','Товар','Закуп','Продажа','Наличие','Как подтверждено','Записано (UTC)']];
 for(const r of rows)out.push([r.day,parse(r.vendor_names,{}).ru||r.vendor_id,parse(r.names,{}).ru||r.product_id,num(r.cost),num(r.price),r.available?'есть':'нет',r.how,r.at.slice(0,16).replace('T',' ')]);
 return out.map(r=>r.map(cell).join('\t')).join('\n')+'\n'}
