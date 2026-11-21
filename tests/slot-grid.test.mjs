import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed} from '../tools/seed.mjs';
import {addDays,createProgram} from '../src/subscriptions.mjs';
import {clock} from '../src/commerce.mjs';

const TBS='Asia/Tbilisi';
const day=n=>addDays(clock(TBS).day,n);

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec("UPDATE products SET stock=1000000,price=3000 WHERE id='akhalkalaki--apple_loose'");
  return {DB};
}
const base=(minute)=>({city_id:'akhalkalaki',payer:{name:'Карен',phone:'+995555111222'},recipient:{name:'Мама',phone:'+995555333444'},address:'Ахалкалаки, ул. Ленина 1',minute,
  schedule:{type:'dates',dates:[day(1)]},items:[{product_id:'akhalkalaki--apple_loose',selection:{grams:1000}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});

test('programme times must be on the catalogue slot grid (every 30 minutes from 09:00)', async()=>{
  const e=await env();
  try{
    await createProgram(e.DB,base(630));          // 10:30 — на сетке
    await assert.rejects(createProgram(e.DB,base(700)),{code:'INVALID_SLOT'});   // 11:40 — не на сетке
    await assert.rejects(createProgram(e.DB,base(610)),{code:'INVALID_SLOT'});
  }finally{e.DB.close()}
});
