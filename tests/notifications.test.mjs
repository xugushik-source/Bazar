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
// 09:00 Тбилиси = 05:00Z, 19:00 Тбилиси = 15:00Z того же дня.
const at=(d,hourTbs)=>new Date(`${d}T${String(hourTbs-4).padStart(2,'0')}:00:00Z`);
const PRODUCT='akhalkalaki--apple_loose';
const RECIPIENT={name:'Мама Анна',phone:'+995555333444'};
const ADDRESS='Ахалкалаки, ул. Ленина 1';

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec("UPDATE cities SET delivery_fee=500,free_delivery_from=10000 WHERE id='akhalkalaki'");
  DB.exec(`UPDATE products SET stock=1000000,price=3000 WHERE id='${PRODUCT}'`);
  const vendor=(await DB.prepare('SELECT vendor_id FROM products WHERE id=?').bind(PRODUCT).first()).vendor_id;
  const productName=JSON.parse((await DB.prepare('SELECT names FROM products WHERE id=?').bind(PRODUCT).first()).names).ru;
  const driver=await createUser(DB,{email:'driver@test.invalid',name:'Вахтанг',password:'test-password-123456'});
  const r=await createProgram(DB,{city_id:cid,payer:{name:'Карен',phone:'+995555111222'},recipient:RECIPIENT,address:ADDRESS,minute:600,
    schedule:{type:'dates',dates:[day(1)]},items:[{product_id:PRODUCT,selection:{grams:1000}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});
  DB.prepare("INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at,confirmed_at) VALUES(?,?,'PAYMENT',7000,'CONFIRMED','тест',?,?)").bind(uuid(),r.program.id,now(),now()).run();
  await runSubscriptionPlanner(DB);
  return {DB,vendor,productName,driver};
}
const link=(DB,kind,refId,chat,lang='ru')=>{const id=uuid();DB.prepare("INSERT INTO tg_links(id,kind,ref_id,city_id,chat_id,title,lang,active,created_at) VALUES(?,?,?,?,?,?,?,1,?)").bind(id,kind,refId,cid,chat,kind+' '+chat,lang,now()).run();return id};
const tasks=async DB=>operatorTasks(DB);

test('clients get no messages at all: only suppliers, the courier group and assigned couriers are notified', async()=>{
  const e=await env();
  try{
    link(e.DB,'SUPPLIER',e.vendor,'888');
    link(e.DB,'DRIVER',uuid(),'-1001');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    const audiences=(await e.DB.prepare('SELECT DISTINCT audience FROM subscription_notifications').all()).results.map(r=>r.audience);
    assert.ok(audiences.every(a=>['SUPPLIER','DRIVER_GROUP','DRIVER_PERSONAL'].includes(a)),JSON.stringify(audiences));
  }finally{e.DB.close()}
});

test('supplier evening digest for tomorrow lists his products with quantities, sent at 19:00 only', async()=>{
  const e=await env();
  try{
    const sid=link(e.DB,'SUPPLIER',e.vendor,'888');
    await buildNotifications(e.DB,at(day(0),18),{telegramOn:false});
    assert.equal((await tasks(e.DB)).filter(t=>t.dedup_key.startsWith('SUPPLIER')).length,0,'no digest at 18:00');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    const t=(await tasks(e.DB)).find(x=>x.dedup_key===`SUPPLIER:PM:${day(1)}:${sid}`);
    assert.ok(t,'evening digest for tomorrow');
    assert.ok(t.text.includes('Завтра подготовить'));
    assert.ok(t.text.includes(e.productName),'his product is listed');
    assert.ok(t.text.includes('1 кг'),'quantity is summed from the order');
    assert.ok(t.text.includes('Заказов: 1'));
    assert.equal(t.status,'OPERATOR_TASK');
    assert.equal(t.reason,'TELEGRAM_OFF');
  }finally{e.DB.close()}
});

test('supplier gets only his own products; a supplier with no orders gets no digest', async()=>{
  const e=await env();
  try{
    const other=link(e.DB,'SUPPLIER',uuid(),'999');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    assert.equal((await tasks(e.DB)).filter(t=>t.dedup_key.includes(other)).length,0);
  }finally{e.DB.close()}
});

test('morning digest for today is sent at 09:00 on the delivery day; each digest is created once', async()=>{
  const e=await env();
  try{
    const sid=link(e.DB,'SUPPLIER',e.vendor,'888');
    await buildNotifications(e.DB,at(day(1),8),{telegramOn:false});
    assert.equal((await tasks(e.DB)).filter(t=>t.dedup_key===`SUPPLIER:AM:${day(1)}:${sid}`).length,0);
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    const am=(await tasks(e.DB)).find(t=>t.dedup_key===`SUPPLIER:AM:${day(1)}:${sid}`);
    assert.ok(am&&am.text.includes('Сегодня передать'));
    const again=await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    assert.equal(again.supplier,0);
  }finally{e.DB.close()}
});

test('courier group gets the full list for tomorrow at 19:00, with time, address and phone (couriers only)', async()=>{
  const e=await env();
  try{
    const gid=link(e.DB,'DRIVER',uuid(),'-1001');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:false});
    const t=(await tasks(e.DB)).find(x=>x.dedup_key===`DRIVER_LIST:PM:${day(1)}:${gid}`);
    assert.ok(t,'list created');
    assert.ok(t.text.startsWith('Доставки на завтра'));
    assert.ok(t.text.includes('всего 1'));
    assert.ok(t.text.includes('Ленина 1'),'address for the courier');
    assert.ok(t.text.includes(RECIPIENT.phone),'recipient phone for the courier');
  }finally{e.DB.close()}
});

test('assigned courier gets his own route in the morning, with the payer phone left out', async()=>{
  const e=await env();
  try{
    link(e.DB,'PERSONAL',e.driver,'555');
    await e.DB.prepare('UPDATE orders SET driver_id=? WHERE day=?').bind(e.driver,day(1)).run();
    await buildNotifications(e.DB,at(day(1),9),{telegramOn:false});
    const route=(await tasks(e.DB)).find(t=>t.audience==='DRIVER_PERSONAL');
    assert.ok(route);
    assert.ok(route.text.includes(RECIPIENT.phone));
    assert.equal(route.text.includes('+995555111222'),false,'payer phone is not in the route');
  }finally{e.DB.close()}
});

test('with Telegram on, a digest is queued and sent once; a refused request is retried, an unknown outcome is not', async()=>{
  const e=await env();
  try{
    link(e.DB,'SUPPLIER',e.vendor,'888');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:true});
    const sent=[];
    const ok=await sendNotifications(e.DB,{},{sender:async(_,m,b)=>{sent.push(b)},at:at(day(0),19)});
    assert.equal(ok.sent,1);
    assert.equal(sent[0].chat_id,'888');
    assert.ok(sent[0].text.includes(e.productName));
    assert.equal((await sendNotifications(e.DB,{},{sender:async()=>{throw new Error('again')},at:at(day(0),19)})).sent,0);

    link(e.DB,'DRIVER',uuid(),'-1001');
    await buildNotifications(e.DB,at(day(0),19),{telegramOn:true});
    const refused=async()=>{const err=new Error('TELEGRAM_429');err.retryAfter=60;throw err};
    const r1=await sendNotifications(e.DB,{},{sender:refused,at:at(day(0),19)});
    assert.equal(r1.retry,1);
    const unknown=async()=>{const err=new Error('TELEGRAM_TRANSPORT');err.ambiguous=true;throw err};
    const r2=await sendNotifications(e.DB,{},{sender:unknown,at:new Date(at(day(0),19).getTime()+86400e3)});
    assert.equal(r2.ambiguous,1);
    assert.equal((await e.DB.prepare("SELECT COUNT(*) n FROM subscription_notifications WHERE status='AMBIGUOUS'").first()).n,1);
  }finally{e.DB.close()}
});
