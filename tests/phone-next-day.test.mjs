import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed,createUser} from '../tools/seed.mjs';
import {phoneAPI} from '../src/phone-operator.mjs';
import {createOrder,priceBasket,deliveryFee,clock,q,action,releaseScheduledOrders} from '../src/commerce.mjs';

// Owner 18.11: a phone order for a later day. Hours are checked against the real clock, so each test sets the window itself:
// '0-0' is always closed, '0-1440' is always open. npm test sets BAZAR_IGNORE_ORDER_HOURS=1, which would switch the check off.
const TZ='Asia/Tbilisi',CITY='akhalkalaki';
async function fixture(){const db=new LocalD1();migrate(db);await seed(db,{karo:false});db.exec("DELETE FROM day_hours; UPDATE cities SET first_order_free=0; UPDATE vendors SET open_minute=NULL,close_minute=NULL WHERE id='akhalkalaki-karo';");const user={id:await createUser(db,{email:'operator@test.invalid',name:'Test operator',password:'test-password-123456',owner:true}),owner:true};return {db,user}}
async function hours(db,value){await q(db,"INSERT INTO app_config(key,value) VALUES('order_hours',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",value).run()}
async function withRealHours(fn){const saved=process.env.BAZAR_IGNORE_ORDER_HOURS;delete process.env.BAZAR_IGNORE_ORDER_HOURS;try{return await fn()}finally{if(saved!==undefined)process.env.BAZAR_IGNORE_ORDER_HOURS=saved}}
const dayAt=days=>clock(TZ,new Date(Date.now()+days*86400000)).day;
const at=(day,hhmm)=>new Date(Date.parse(`${day}T${hhmm}:00+04:00`));
async function payload(db,day,minute=720){const b={city_id:CITY,items:[{product_id:CITY+'--apple_loose',selection:{grams:1000}},{product_id:CITY+'--pear_loose',selection:{grams:1000}}],fulfillment:'delivery',day,minute,method:'cash',customer:{name:'TEST ONLY',phone:'+995555000000',address:'DO NOT DELIVER'},accepted_weight_rules:true,privacy_consent:true,idem:crypto.randomUUID()};const p=await priceBasket(db,b),fee=deliveryFee(p.city,b.fulfillment,p.estimate_minor);return {...b,expected_total:p.estimate_minor+fee,maximum_total:p.maximum_minor+fee}}

test('a later day is bookable outside working hours (operator and website, owner 25.11); same-day orders keep the closing rule',()=>withRealHours(async()=>{const {db,user}=await fixture();try{
 await hours(db,'0-0');const day=dayAt(1);
 await assert.doesNotReject(createOrder(db,await payload(db,day)),'website: a later day is open at any hour (owner 25.11)');
 const phone=await phoneAPI(db,'create',await payload(db,day),user);
 assert.equal(phone.day,day);assert.equal(phone.status,'NEW');assert.equal(phone.confirmed,false);assert.equal(phone.payment,'UNPAID');
 await assert.rejects(phoneAPI(db,'create',await payload(db,dayAt(0)),user),/ORDERS_CLOSED/,'a same-day order still follows the hours');
}finally{db.close()}}));

test('a later-day call is recorded with its author but does not start processing; it is released once, on the day from 09:00',()=>withRealHours(async()=>{const {db,user}=await fixture();try{
 await hours(db,'0-0');const day=dayAt(1);
 const o=await phoneAPI(db,'create',await payload(db,day),user);
 const cmd=crypto.randomUUID(),reason='Покупатель подтвердил по телефону';
 const r=await action(db,{id:o.id,version:o.version,command:cmd,action:'confirm',reason},user);
 assert.equal(r.scheduled_for,day);
 let row=await q(db,'SELECT status,confirmed,version FROM orders WHERE id=?',o.id).first();
 assert.equal(row.status,'NEW');assert.equal(row.confirmed,0,'not confirmed for processing yet');
 const calls=(await q(db,"SELECT actor,data FROM events WHERE order_id=? AND event='PHONE_CONFIRM_SCHEDULED'",o.id).all()).results;
 assert.equal(calls.length,1);assert.equal(calls[0].actor,user.id,'the operator is recorded as the author');assert.match(calls[0].data,/Покупатель подтвердил/);
 // a replay with the same command, or a second press with a new one, records nothing again
 assert.deepEqual(await action(db,{id:o.id,version:o.version,command:cmd,action:'confirm',reason},user),r);
 const again=await action(db,{id:o.id,version:row.version,command:crypto.randomUUID(),action:'confirm',reason:'повтор'},user);
 assert.equal(again.scheduled_for,day);
 assert.equal((await q(db,"SELECT COUNT(*) n FROM events WHERE order_id=? AND event='PHONE_CONFIRM_SCHEDULED'",o.id).first()).n,1);
 assert.equal((await phoneAPI(db,'recent',{city_id:CITY},user)).orders[0].scheduled_for,day,'after a reload the screen still shows the waiting state');
 // a courier cannot take it before its day
 await assert.rejects(action(db,{id:o.id,version:row.version,command:crypto.randomUUID(),action:'claim'},user),/NOT_AVAILABLE/);
 // before 09:00 on the day nothing moves; from 09:00 it enters processing exactly like the confirm button
 assert.equal((await releaseScheduledOrders(db,at(day,'08:59'))).released,0);
 assert.equal((await releaseScheduledOrders(db,at(day,'09:00'))).released,1);
 row=await q(db,'SELECT status,confirmed FROM orders WHERE id=?',o.id).first();
 assert.equal(row.status,'WEIGHING');assert.equal(row.confirmed,1);
 const sys=await q(db,"SELECT actor,data FROM events WHERE order_id=? AND event='CONFIRM'",o.id).first();assert.equal(sys.actor,'SYSTEM');assert.match(sys.data,/scheduled_release/);
 assert.equal((await releaseScheduledOrders(db,at(day,'10:00'))).released,0,'released only once');
 assert.equal((await phoneAPI(db,'recent',{city_id:CITY},user)).orders[0].scheduled_for,null,'once processing started the waiting state is gone');
}finally{db.close()}}));

test('an unconfirmed later-day phone order is never released; a website order keeps the immediate confirm',()=>withRealHours(async()=>{const {db,user}=await fixture();try{
 await hours(db,'0-0');const day=dayAt(1);
 const phone=await phoneAPI(db,'create',await payload(db,day),user);
 assert.equal((await releaseScheduledOrders(db,at(day,'12:00'))).released,0,'no call recorded, nothing to release');
 assert.equal((await q(db,'SELECT status FROM orders WHERE id=?',phone.id).first()).status,'NEW');
 await hours(db,'0-1440');
 const web=await createOrder(db,await payload(db,day));
 await action(db,{id:web.id,version:web.version,command:crypto.randomUUID(),action:'confirm'},user);
 const w=await q(db,'SELECT status,confirmed FROM orders WHERE id=?',web.id).first();
 assert.equal(w.status,'WEIGHING');assert.equal(w.confirmed,1);
}finally{db.close()}}));
