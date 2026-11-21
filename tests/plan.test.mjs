import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed} from '../tools/seed.mjs';
import {clock} from '../src/commerce.mjs';
import {addDays,createProgram} from '../src/subscriptions.mjs';
import {deliveryPlan} from '../src/plan.mjs';

const TBS='Asia/Tbilisi', cid='akhalkalaki';
const today=()=>clock(TBS).day;
const day=n=>addDays(today(),n);
const PAYER={name:'Карен',phone:'+995555111222'};
const RECIPIENT={name:'Мама',phone:'+995555333444'};

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec("UPDATE products SET stock=1000000,price=3000 WHERE id='akhalkalaki--apple_loose'");
  return {DB};
}
const program=(DB,dates,grams)=>createProgram(DB,{city_id:cid,payer:PAYER,recipient:RECIPIENT,address:'Ахалкалаки, ул. Ленина 1',minute:600,
  schedule:{type:'dates',dates},items:[{product_id:'akhalkalaki--apple_loose',selection:{grams}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});

test('plan: deliveries of one day are summed per product; no orders or stock are touched', async()=>{
  const e=await env();
  try{
    const a=await program(e.DB,[day(3)],1000);
    await program(e.DB,[day(3),day(4)],2000);
    const cancelled=await program(e.DB,[day(3)],5000);
    e.DB.exec(`UPDATE subscription_programs SET status='CANCELLED' WHERE id='${cancelled.program.id}'`);
    const plan=await deliveryPlan(e.DB,{from:day(3),to:day(4),today:today()});
    const d3=plan.days.find(d=>d.day===day(3));
    assert.equal(d3.deliveries,2,'cancelled programme is not in the plan');
    assert.equal(d3.programs,2);
    assert.equal(d3.products[0].grams,3000);
    assert.equal(plan.days.find(d=>d.day===day(4)).products[0].grams,2000);
    assert.equal((await e.DB.prepare('SELECT COUNT(*) n FROM orders').first()).n,0,'planning creates no orders');
    assert.equal((await e.DB.prepare("SELECT reserved FROM products WHERE id='akhalkalaki--apple_loose'").first()).reserved,0,'planning reserves nothing');
    assert.ok(a.program.id);
  }finally{e.DB.close()}
});

test('plan: the period is validated (order, format, maximum span)', async()=>{
  const e=await env();
  try{
    await assert.rejects(deliveryPlan(e.DB,{from:day(5),to:day(1),today:today()}),{code:'INVALID_DATE'});
    await assert.rejects(deliveryPlan(e.DB,{from:day(0),to:addDays(day(0),121),today:today()}),{code:'INVALID_DATE'});
    await assert.rejects(deliveryPlan(e.DB,{from:'2026-13-01',to:day(1),today:today()}),{code:'INVALID_DATE'});
  }finally{e.DB.close()}
});
