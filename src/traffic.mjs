// Visit statistics (owner 30.10: «не вижу статистику — сколько человек, откуда, по какой ссылке»). Anonymous daily counters per
// link mark, event, language and device: no name, phone, IP or visitor id is stored, so no consent banner is needed (policy, «Статистика»).
// The browser says whether this is its first such event today, which gives the number of people besides the number of visits.
import {q,clock}from './commerce.mjs';import {fail}from './security.mjs';import {sourceCode}from './sources.mjs';
export const trafficEvents=['visit','cart','checkout'],trafficLangs=['ru','hy','ka'],trafficDevices=['phone','desktop','app'];
export async function recordHit(db,b){const city=String(b?.city_id||''),event=trafficEvents.includes(b?.event)?b.event:null;if(!event||!/^[a-z0-9-]{2,40}$/.test(city))fail('INVALID_INPUT');
 const c=await q(db,'SELECT id,timezone FROM cities WHERE id=? AND active=1',city).first();if(!c)fail('NOT_FOUND',404);
 const src=sourceCode(b.src)||'direct',lang=trafficLangs.includes(b.lang)?b.lang:'ru',device=trafficDevices.includes(b.device)?b.device:'phone',first=b.first===true?1:0;
 await q(db,'INSERT INTO traffic_daily(day,city_id,src,event,lang,device,hits,uniques) VALUES(?,?,?,?,?,?,1,?) ON CONFLICT(day,city_id,src,event,lang,device) DO UPDATE SET hits=hits+1,uniques=uniques+excluded.uniques',clock(c.timezone).day,c.id,src,event,lang,device,first).run();return {ok:true}}
// Per link mark for the period: people and visits, people who put something in the cart and who opened checkout; by language and device.
export async function trafficReport(db,city,days,at=Date.now()){const since=new Date(at-days*86400000+4*3600000).toISOString().slice(0,10);let rows=[];
 try{rows=(await q(db,'SELECT src,event,lang,device,SUM(hits) AS hits,SUM(uniques) AS uniques FROM traffic_daily WHERE city_id=? AND day>=? GROUP BY src,event,lang,device',city,since).all()).results}catch{return {by:new Map(),langs:{},devices:{}}}
 const by=new Map(),langs={},devices={};for(const r of rows){const s=by.get(r.src)||{visitors:0,visits:0,cart:0,checkout:0};if(r.event==='visit'){s.visitors+=r.uniques;s.visits+=r.hits;langs[r.lang]=(langs[r.lang]||0)+r.uniques;devices[r.device]=(devices[r.device]||0)+r.uniques}else s[r.event]+=r.uniques;by.set(r.src,s)}
 return {by,langs,devices}}
