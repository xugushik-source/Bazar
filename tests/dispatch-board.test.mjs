import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed,createUser} from '../tools/seed.mjs';
import {clock} from '../src/commerce.mjs';
import {uuid,now} from '../src/security.mjs';
import {addDays,createProgram,runSubscriptionPlanner} from '../src/subscriptions.mjs';
import {dispatchBoard,assignMany} from '../src/dispatch-board.mjs';

const TBS='Asia/Tbilisi', cid='akhalkalaki', PRODUCT='akhalkalaki--apple_loose';
const day=n=>addDays(clock(TBS).day,n);

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec(`UPDATE products SET stock=1000000,price=3000 WHERE id='${PRODUCT}'`);
  const owner={id:await createUser(DB,{email:'owner@test.invalid',name:'Владелец',password:'test-password-123456',owner:true}),owner:true,memberships:[]};
  const courier=await createUser(DB,{email:'courier@test.invalid',name:'Вахтанг',password:'test-password-123456'});
  DB.prepare("INSERT INTO memberships(user_id,vendor_id,role) VALUES(?,?,'DRIVER')").bind(courier,'akhalkalaki-garden').run();
  const makeOrder=async(minute,n)=>{
    const r=await createProgram(DB,{city_id:cid,payer:{name:'Карен',phone:'+995555111222'},recipient:{name:'Получатель '+n,phone:'+99555500000'+n},address:'Ахалкалаки, ул. Ленина '+n,minute,
      schedule:{type:'dates',dates:[day(1)]},items:[{product_id:PRODUCT,selection:{grams:1000}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});
    DB.prepare("INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at,confirmed_at) VALUES(?,?,'PAYMENT',7000,'CONFIRMED','t',?,?)").bind(uuid(),r.program.id,now(),now()).run();
  };
  await makeOrder(600,1);
  await makeOrder(600,2);
  await makeOrder(630,3);
  await runSubscriptionPlanner(DB);
  const orders=(await DB.prepare('SELECT id FROM orders WHERE day=? ORDER BY minute').bind(day(1)).all()).results.map(r=>r.id);
  return {DB,owner,courier,orders};
}

test('board shows the day\'s delivery orders by time and area, and can filter by time window', async()=>{
  const e=await env();
  try{
    const all=await dispatchBoard(e.DB,{day:day(1)});
    assert.equal(all.count,3);
    assert.deepEqual(all.by_area,{'Ахалкалаки':3});
    assert.equal(all.orders[0].time,'10:00');
    const window=await dispatchBoard(e.DB,{day:day(1),from:600,to:600});
    assert.equal(window.count,2,'only the 10:00 orders');
    assert.equal(window.orders.every(o=>o.minute===600),true);
  }finally{e.DB.close()}
});

test('one courier is assigned to several orders in one action; each order keeps its own result', async()=>{
  const e=await env();
  try{
    const r=await assignMany(e.DB,{order_ids:e.orders.slice(0,2),driver_id:e.courier},e.owner);
    assert.equal(r.assigned,2);
    assert.equal(r.failed,0);
    const board=await dispatchBoard(e.DB,{day:day(1)});
    assert.equal(board.orders.filter(o=>o.driver_id===e.courier).length,2);
    assert.equal(board.orders.find(o=>o.order_id===e.orders[2]).driver_id,null,'third order not touched');
  }finally{e.DB.close()}
});

test('an unknown courier is refused per order, and one bad order does not block the others', async()=>{
  const e=await env();
  try{
    const r=await assignMany(e.DB,{order_ids:[e.orders[0],'NO-SUCH-ORDER',e.orders[1]],driver_id:'not-a-courier'},e.owner);
    assert.equal(r.assigned,0);
    assert.equal(r.failed,3);
    assert.equal(r.results.find(x=>x.order_id==='NO-SUCH-ORDER').error,'NOT_FOUND');
    assert.ok(r.results.filter(x=>x.order_id!=='NO-SUCH-ORDER').every(x=>x.ok===false&&x.error==='NOT_FOUND'));
  }finally{e.DB.close()}
});

test('a real courier can be assigned to orders that arrive in the same window, and the list is capped', async()=>{
  const e=await env();
  try{
    const r=await assignMany(e.DB,{order_ids:[e.orders[0],e.orders[0]],driver_id:e.courier},e.owner);
    assert.equal(r.results.length,1,'duplicates are collapsed');
    await assert.rejects(assignMany(e.DB,{order_ids:[],driver_id:e.courier},e.owner),{code:'INVALID_INPUT'});
    await assert.rejects(assignMany(e.DB,{order_ids:Array.from({length:101},(_,i)=>'x'+i),driver_id:e.courier},e.owner),{code:'INVALID_INPUT'});
  }finally{e.DB.close()}
});
