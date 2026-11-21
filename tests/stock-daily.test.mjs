import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed} from '../tools/seed.mjs';
import {clock,priceBasket} from '../src/commerce.mjs';
import {addDays,createProgram,runSubscriptionPlanner} from '../src/subscriptions.mjs';

const TBS='Asia/Tbilisi', cid='akhalkalaki', PRODUCT='akhalkalaki--apple_loose';
const day=n=>addDays(clock(TBS).day,n);

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec(`UPDATE products SET stock=0,reserved=0,price=3000 WHERE id='${PRODUCT}'`);
  return {DB};
}
const basket=(DB,grams)=>priceBasket(DB,{city_id:cid,items:[{product_id:PRODUCT,selection:{grams}}]});

test('daily mode: no stock figure limits the order (the supplier decides each morning)', async()=>{
  const e=await env();
  try{
    assert.equal((await e.DB.prepare("SELECT value FROM app_config WHERE key='stock-mode'").first()).value,'DAILY');
    const b=await basket(e.DB,5000);
    assert.equal(b.lines.length,1,'5 kg sells with zero stock recorded');
  }finally{e.DB.close()}
});

test('limited mode (kept for the old behaviour): stock figure still refuses an order that exceeds it', async()=>{
  const e=await env();
  try{
    e.DB.exec("UPDATE app_config SET value='LIMITED' WHERE key='stock-mode'");
    await assert.rejects(basket(e.DB,5000),{code:'OUT_OF_STOCK'});
  }finally{e.DB.close()}
});

test('supplier «нет сегодня» still stops that day\'s delivery, and it comes back by itself the next morning', async()=>{
  const e=await env();
  try{
    const r=await createProgram(e.DB,{city_id:cid,payer:{name:'Карен',phone:'+995555111222'},recipient:{name:'Мама',phone:'+995555333444'},address:'Ахалкалаки, ул. Ленина 1',minute:600,
      schedule:{type:'dates',dates:[day(1)]},items:[{product_id:PRODUCT,selection:{grams:1000}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});
    e.DB.prepare("INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at,confirmed_at) VALUES(?,?,'PAYMENT',7000,'CONFIRMED','t',?,?)").bind('f1',r.program.id,new Date().toISOString(),new Date().toISOString()).run();
    e.DB.exec(`INSERT INTO day_closures(product_id,day,vendor_id,closed_by,at) VALUES('${PRODUCT}','${day(1)}','akhalkalaki-garden','supplier','${new Date().toISOString()}')`);
    await runSubscriptionPlanner(e.DB);
    assert.equal((await e.DB.prepare('SELECT status FROM subscription_deliveries').first()).status,'WAITING_STOCK');
    e.DB.exec(`DELETE FROM day_closures WHERE product_id='${PRODUCT}' AND day='${day(1)}'`);
    await runSubscriptionPlanner(e.DB);
    assert.equal((await e.DB.prepare('SELECT status FROM subscription_deliveries').first()).status,'ORDERED');
  }finally{e.DB.close()}
});
