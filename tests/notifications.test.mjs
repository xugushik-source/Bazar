import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed,createUser} from '../tools/seed.mjs';
import {clock} from '../src/commerce.mjs';
import {uuid,now} from '../src/security.mjs';
import {addDays,createProgram,runSubscriptionPlanner} from '../src/subscriptions.mjs';
import {buildNotifications,sendNotifications,operatorTasks} from '../src/notifications.mjs';

const TBS='Asia/Tbilisi', cid='akhalkalaki';
const today=()=>clock(TBS).day;
const day=n=>addDays(today(),n);
// Время в Тбилиси: 09:00 = 05:00Z, 19:00 = 15:00Z того же дня.
const at=(d,hourTbs)=>new Date(`${d}T${String(hourTbs-4).padStart(2,'0')}:00:00Z`);
const PAYER={name:'Карен',phone:'+995555111222'};
const RECIPIENT={name:'Мама Анна',phone:'+995555333444'};
const ADDRESS='Ахалкалаки, ул. Ленина 1';

async function env({funds=true}={}){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec("UPDATE cities SET delivery_fee=500,free_delivery_from=10000 WHERE id='akhalkalaki'");
  DB.exec("UPDATE products SET stock=1000000,price=3000 WHERE id='akhalkalaki--apple_loose'");
  const driver=await createUser(DB,{email:'driver@test.invalid',name:'Вахтанг',password:'test-password-123456'});
  const r=await createProgram(DB,{city_id:cid,payer:PAYER,recipient:RECIPIENT,address:ADDRESS,minute:600,
    schedule:{type:'dates',dates:[day(1)]},items:[{product_id:'akhalkalaki--apple_loose',selection:{grams:1000}}],
    max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});
  if(funds)DB.prepare("INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at,confirmed_at) VALUES(?,?,'PAYMENT',7000,'CONFIRMED','тест',?,?)").bind(uuid(),r.program.id,now(),now()).run();
  await runSubscriptionPlanner(DB);
  return {DB,program:r.program,driver};
}
const tasksText=async DB=>(await operatorTasks(DB)).map(t=>t.text);
const channel=(DB,programId,chat='777')=>DB.prepare("INSERT INTO subscription_channels(program_id,kind,chat_id,lang,linked_at,active) VALUES(?,'TELEGRAM',?,'ru',?,1)").bind(programId,chat,now()).run();
const link=(DB,kind,refId,chat,lang='ru')=>DB.prepare("INSERT INTO tg_links(id,kind,ref_id,city_id,chat_id,title,lang,active,created_at) VALUES(?,?,?,?,?,?,?,1,?)").bind(uuid(),kind,refId,cid,chat,kind+' '+chat,lang,now()).run();

test('evening reminder about tomorrow appears at 19:00, not before; morning reminder for today at 09:00', async()=>{
  const e=await env();
  try{
    await buildNotifications(e.DB,at(day(0),18),{telegramOn:false});
    assert.equal((await tasksText(e.DB)).some(t=>t.startsWith('Завтра')),false,'no reminder at 18:00');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    assert.ok((await tasksText(e.DB)).some(t=>t.startsWith('Завтра, '+day(1))),'reminder at 19:00');
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    assert.ok((await tasksText(e.DB)).some(t=>t.startsWith('Сегодня доставка')),'morning reminder on delivery day');
  }finally{e.DB.close()}
});

test('each reminder is created once: repeated cron runs add no duplicates', async()=>{
  const e=await env();
  try{
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    const first=(await e.DB.prepare('SELECT COUNT(*) n FROM subscription_notifications').first()).n;
    const again=await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    assert.equal((await e.DB.prepare('SELECT COUNT(*) n FROM subscription_notifications').first()).n,first);
    assert.equal(again.payer,0);
  }finally{e.DB.close()}
});

test('no channel or Telegram off: the message becomes an operator task, never a fake send', async()=>{
  const e=await env();
  try{
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:true});   // Telegram включён, но у плательщика нет чата
    const rows=(await e.DB.prepare("SELECT status,reason FROM subscription_notifications WHERE audience='PAYER'").all()).results;
    assert.ok(rows.length>0);
    assert.ok(rows.every(r=>r.status==='OPERATOR_TASK'&&r.reason==='NO_CHANNEL'));
    let calls=0;
    await sendNotifications(e.DB,{},{sender:async()=>{calls++},at:at(day(0),19)});
    assert.equal(calls,0,'nothing is sent to a missing channel');
  }finally{e.DB.close()}
});

test('payer with a linked chat: message is queued, sent once, and marked SENT', async()=>{
  const e=await env();
  try{
    await channel(e.DB,e.program.id,'777');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:true});
    const sent=[];
    const r=await sendNotifications(e.DB,{},{sender:async(env,m,b)=>{sent.push([m,b.chat_id,b.text])},at:at(day(0),19)});
    assert.equal(r.sent,sent.length);
    assert.ok(sent.every(([m,chat])=>m==='sendMessage'&&chat==='777'));
    assert.ok(sent.some(([,,t])=>t.startsWith('Завтра')));
    const again=await sendNotifications(e.DB,{},{sender:async()=>{throw new Error('must not resend')},at:at(day(0),19)});
    assert.equal(again.sent,0);
  }finally{e.DB.close()}
});

test('send errors: a refused request is retried later; an unknown outcome is never resent automatically', async()=>{
  const e=await env();
  try{
    await channel(e.DB,e.program.id,'777');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:true});
    const refused=async()=>{const err=new Error('TELEGRAM_429');err.retryAfter=60;throw err};
    const r1=await sendNotifications(e.DB,{},{sender:refused,at:at(day(0),19)});
    assert.ok(r1.retry>0);
    const row=await e.DB.prepare("SELECT status,attempts,next_at FROM subscription_notifications WHERE status='PENDING' AND attempts=1 LIMIT 1").first();
    assert.ok(row,'retry scheduled');
    assert.ok(row.next_at>at(day(0),19).getTime(),'pause before retry');

    const unknown=async()=>{const err=new Error('TELEGRAM_TRANSPORT');err.ambiguous=true;throw err};
    const r2=await sendNotifications(e.DB,{},{sender:unknown,at:new Date(at(day(0),19).getTime()+3600e3*24)});
    assert.ok(r2.ambiguous>0);
    assert.ok((await e.DB.prepare("SELECT COUNT(*) n FROM subscription_notifications WHERE status='AMBIGUOUS'").first()).n>0);
  }finally{e.DB.close()}
});

test('payer gets an action message when a delivery is stuck (no funds), with the reason in the chosen language', async()=>{
  const e=await env({funds:false});
  try{
    await buildNotifications(e.DB,at(day(0),10),{telegramOn:false});
    assert.ok((await tasksText(e.DB)).some(t=>t.includes('закончились средства программы')));
  }finally{e.DB.close()}
});

test('courier group summary: counts by area in the morning and tomorrow in the evening, no names, phones or addresses', async()=>{
  const e=await env();
  try{
    await link(e.DB,'DRIVER','group-1','-1001');
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    const tasks=(await operatorTasks(e.DB)).filter(t=>t.audience==='DRIVER_GROUP');
    const morning=tasks.find(t=>t.dedup_key.startsWith('DISPATCH:AM:'+day(1)));
    const evening=tasks.find(t=>t.dedup_key.startsWith('DISPATCH:PM:'+day(1)));
    assert.ok(morning&&evening,'both digests exist');
    assert.match(evening.text,/Заказы на завтра: всего заказов 1/);
    assert.match(evening.text,/Ахалкалаки — 1/);
    for(const t of tasks){
      assert.equal(t.text.includes(RECIPIENT.phone),false);
      assert.equal(t.text.includes('Ленина'),false);
      assert.equal(t.text.includes('Мама'),false);
    }
  }finally{e.DB.close()}
});

test('courier personal route: only orders assigned to that courier, with address and phone for them', async()=>{
  const e=await env();
  try{
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});          // на доставку-день, но заказ ещё не назначен
    assert.equal((await operatorTasks(e.DB)).filter(t=>t.audience==='DRIVER_PERSONAL').length,0);
    await e.DB.prepare("UPDATE orders SET driver_id=? WHERE day=?").bind(e.driver,day(1)).run();
    await link(e.DB,'PERSONAL',e.driver,'555');
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    const route=(await operatorTasks(e.DB)).find(t=>t.audience==='DRIVER_PERSONAL');
    assert.ok(route,'route created for the assigned courier');
    assert.ok(route.text.includes(RECIPIENT.phone));
    assert.ok(route.text.includes('Ленина 1'));
    assert.equal(route.text.includes(PAYER.phone),false,'payer phone is not shown to the courier');
  }finally{e.DB.close()}
});
