import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed} from '../tools/seed.mjs';
import {handle} from '../src/worker.mjs';
import {clock} from '../src/commerce.mjs';
import {addDays,createProgram,quoteFor} from '../src/subscriptions.mjs';

// Порог владельца: 25 ₾ товаров для всех заказов и программ. Тестовый набор его отключает, здесь включаем явно.
const TBS='Asia/Tbilisi', cid='akhalkalaki', PRODUCT='akhalkalaki--apple_loose';
const day=n=>addDays(clock(TBS).day,n);

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec("UPDATE app_config SET value='2500' WHERE key='min-order-minor'");
  DB.exec("UPDATE cities SET first_order_free=0 WHERE id='akhalkalaki'");
  DB.exec('DELETE FROM day_hours');
  DB.exec(`UPDATE products SET stock=1000000,price=5000 WHERE id='${PRODUCT}'`);
  return {DB};
}
const quoteCall=async(e,grams)=>{const r=await handle(new Request('https://bazar.test/api/quote',{method:'POST',headers:{'Content-Type':'application/json','X-Bazar-CSRF':'1'},body:JSON.stringify({city_id:cid,fulfillment:'pickup',items:[{product_id:PRODUCT,selection:{grams}}]})}),e);return {http:r.status,...await r.json()}};

test('the minimum is 25 GEL of goods: 24.90 is refused, 25.00 is accepted (quote and checkout use the same rule)', async()=>{
  const e=await env();
  try{
    // 5000 тетри за кг: 500 г = 2500 тетри (25 ₾), 400 г = 2000 тетри (20 ₾).
    assert.equal((await quoteCall(e,400)).error,'MIN_ORDER');
    assert.equal((await quoteCall(e,500)).http,200);
  }finally{e.DB.close()}
});

test('the minimum applies to village orders and to programmes, not only the town', async()=>{
  const e=await env();
  try{
    await assert.rejects(quoteFor(e.DB,{city_id:cid,zone:'bavra',items:[{product_id:PRODUCT,selection:{grams:400}}]}),{code:'MIN_ORDER'});
    const ok=await quoteFor(e.DB,{city_id:cid,zone:'bavra',items:[{product_id:PRODUCT,selection:{grams:500}}]});
    assert.equal(ok.estimate,2500);
    await assert.rejects(createProgram(e.DB,{city_id:cid,payer:{name:'Карен',phone:'+995555111222'},recipient:{name:'Мама',phone:'+995555333444'},address:'Бавра, дом 7',minute:600,
      schedule:{type:'dates',dates:[day(1)]},items:[{product_id:PRODUCT,selection:{grams:400}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true}),{code:'MIN_ORDER'});
  }finally{e.DB.close()}
});

test('the minimum is a setting: owner can change it without a code release', async()=>{
  const e=await env();
  try{
    e.DB.exec("UPDATE app_config SET value='3000' WHERE key='min-order-minor'");
    assert.equal((await quoteCall(e,500)).error,'MIN_ORDER');
    e.DB.exec("UPDATE app_config SET value='2500' WHERE key='min-order-minor'");
    assert.equal((await quoteCall(e,500)).http,200);
  }finally{e.DB.close()}
});
