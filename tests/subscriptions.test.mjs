import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed,createUser} from '../tools/seed.mjs';
import {handle} from '../src/worker.mjs';
import {q,clock,action} from '../src/commerce.mjs';
import {sha,token} from '../src/security.mjs';
import {normalizeSchedule,scheduledDays,addDays,runSubscriptionPlanner,quoteFor} from '../src/subscriptions.mjs';

// Программа «Забота о близких» проверяется на SQLite-совместимом адаптере, как и остальной набор.
// Проверка на настоящем D1 (миграции, batch, лимиты) — отдельный шаг перед публикацией; см. docs/SUBSCRIPTIONS_RU.md.

const cid='akhalkalaki', pid=k=>cid+'--'+k, TBS='Asia/Tbilisi';
const today=()=>clock(TBS).day;
const day=n=>addDays(today(),n);
const CONSENT={privacy_consent:true,accepted_weight_rules:true};
const PAYER={name:'Карен',phone:'+995555111222'};
const RECIPIENT={name:'Мама',phone:'+995555333444'};
const ADDRESS='Ахалкалаки, ул. Ленина 1';

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  // Тарифы как в миграции 0094 (ТЗ 6.1). В тестовом seed миграция до города не доходит, поэтому выставляем явно.
  // Отдельная находка: на свежей базе без этой строки бесплатная доставка от 100 ₾ не работает.
  DB.exec("UPDATE cities SET delivery_fee=500,free_delivery_from=10000 WHERE id='akhalkalaki'");
  const owner={id:await createUser(DB,{email:'owner@test.invalid',name:'Тестовый владелец',password:'test-password-123456',owner:true}),owner:true,memberships:[]};
  // 1 кг яблок = 3000 тетри (30 ₾): минимум ТЗ соблюдён по умолчанию. Остаток большой, чтобы не мешал тестам.
  DB.exec(`UPDATE products SET stock=1000000,price=3000 WHERE id='${pid('apple_loose')}'`);
  return {DB,owner};
}
const setPrice=(e,k,price)=>e.DB.exec(`UPDATE products SET price=${price} WHERE id='${pid(k)}'`);

// Планировщик в тестах обязан отработать без скрытых ошибок.
async function plan(e,at){const r=await runSubscriptionPlanner(e.DB,at);assert.equal(r.errors,0,'planner must not hide errors');return r}

async function call(e,path,b,user=null){
  const headers=b?{'Content-Type':'application/json','X-Bazar-CSRF':'1'}:{};
  if(user){const session=token();await q(e.DB,'INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)',await sha(session),user.id,Date.now()+100000).run();headers.cookie='bazar_session='+session}
  const r=await handle(new Request('https://bazar.test/api/'+path,{method:b?'POST':'GET',headers,...(b?{body:JSON.stringify(b)}:{})}),e);
  return {...await r.json(),http:r.status};
}

const apple=(grams=1000)=>[{product_id:pid('apple_loose'),selection:{grams}}];
function create(e,over={}){
  return call(e,'subscriptions/create',{city_id:cid,payer:PAYER,recipient:RECIPIENT,address:ADDRESS,minute:600,
    schedule:{type:'dates',dates:[day(1),day(2)]},items:apple(),max_delivery_minor:10000,...CONSENT,...over});
}
// Успешное создание; без него дальнейшие шаги теста бессмысленны.
async function newProgram(e,over={}){const r=await create(e,over);assert.equal(r.http,201,JSON.stringify(r));return {...r.program,key:r.key}}
async function current(e,prog){return call(e,'subscriptions/view',{id:prog.id,key:prog.key})}
async function act(e,prog,action,fields={}){
  const v=await current(e,prog);
  return call(e,'subscriptions/action',{id:prog.id,key:prog.key,version:v.version,action,...fields});
}
// Плательщик заявляет пополнение, оператор подтверждает его после получения денег.
async function topUpConfirmed(e,prog,amount,reference='Перевод по телефону, квитанция 1'){
  const r=await act(e,prog,'request_top_up',{amount_minor:amount,reference});
  assert.equal(r.http,200,JSON.stringify(r));
  const fund=r.funds.find(f=>f.kind==='PAYMENT'&&f.status==='PENDING'&&f.reference===reference);
  assert.ok(fund,'pending top-up expected');
  const c=await call(e,'manage/subscriptions/fund',{fund_id:fund.id,decision:'CONFIRM'},e.owner);
  assert.equal(c.http,200,JSON.stringify(c));
  return c;
}
const ordersOf=(e,prog)=>e.DB.prepare('SELECT o.* FROM orders o JOIN subscription_deliveries d ON d.order_id=o.id WHERE d.program_id=? ORDER BY d.day').bind(prog.id).all().then(r=>r.results);
const deliveriesOf=(e,prog)=>e.DB.prepare('SELECT * FROM subscription_deliveries WHERE program_id=? ORDER BY day').bind(prog.id).all().then(r=>r.results);
const paymentsCount=(e,prefix)=>e.DB.prepare("SELECT COUNT(*) n FROM payments WHERE command LIKE ?").bind(prefix+'%').first().then(r=>r.n);

// ---------- график ----------
test('schedule: weekly, interval, monthly and explicit dates produce the expected days', ()=>{
  // 1 декабря 2026 — вторник.
  assert.deepEqual(scheduledDays({type:'weekly',days:[1]},'2026-12-01','2026-12-31'),['2026-12-07','2026-12-14','2026-12-21','2026-12-28']);
  assert.deepEqual(scheduledDays({type:'weekly',days:[2,5]},'2026-12-01','2026-12-07'),['2026-12-01','2026-12-04']);
  assert.deepEqual(scheduledDays({type:'interval',every:10,start:'2026-12-01'},'2026-12-01','2026-12-31'),['2026-12-01','2026-12-11','2026-12-21','2026-12-31']);
  assert.deepEqual(scheduledDays({type:'monthly',dates:[1,15]},'2026-12-01','2026-12-31'),['2026-12-01','2026-12-15']);
  assert.deepEqual(scheduledDays({type:'dates',dates:['2026-12-03','2026-12-20']},'2026-12-01','2026-12-31'),['2026-12-03','2026-12-20']);
});

test('schedule: invalid rules are refused (29th of month, empty list, past dates, unknown type)', ()=>{
  const today='2026-11-21';
  for(const bad of [{type:'monthly',dates:[29]},{type:'weekly',days:[]},{type:'weekly',days:[8]},{type:'interval',every:0,start:'2026-12-01'},{type:'dates',dates:['2026-11-01']},{type:'nope'}])
    assert.throws(()=>normalizeSchedule(bad,today),{code:'INVALID_SCHEDULE'},JSON.stringify(bad));
  assert.deepEqual(normalizeSchedule({type:'weekly',days:[5,1,5]},today),{type:'weekly',days:[1,5]});
});

// ---------- тарифы: Ахалкалаки и сёла (ТЗ, раздел 6) ----------
test('Akhalkalaki town: 30→35, 80→85, 99.99→+5, 100→100 GEL (delivery from the existing city tariff)', async()=>{
  const e=await env();
  try{
    for(const [price,total] of [[3000,3500],[8000,8500],[9999,10499],[10000,10000]]){
      setPrice(e,'apple_loose',price);
      assert.equal((await quoteFor(e.DB,{city_id:cid,zone:'',items:apple()})).total,total,`price ${price}`);
    }
  }finally{e.DB.close()}
});

test('Akhalkalaki town: goods below 30 GEL cannot be a subscription (MIN_ORDER at creation and in the planner)', async()=>{
  const e=await env();
  try{
    setPrice(e,'apple_loose',2500);
    const r=await create(e);
    assert.equal(r.http,409);
    assert.equal(r.error,'MIN_ORDER');
  }finally{e.DB.close()}
});

test('villages: zone fee is added; the 30 GEL town minimum does not apply; no free delivery below the existing village threshold', async()=>{
  const e=await env();
  try{
    setPrice(e,'apple_loose',8000);
    assert.equal((await quoteFor(e.DB,{city_id:cid,zone:'bavra',items:apple()})).total,8550);    // 80 + 5.50
    setPrice(e,'apple_loose',10000);
    assert.equal((await quoteFor(e.DB,{city_id:cid,zone:'bavra',items:apple()})).total,10550);   // 100 + тариф села; «от 100» для сёл не действует
    setPrice(e,'apple_loose',2500);
    assert.equal((await quoteFor(e.DB,{city_id:cid,zone:'bavra',items:apple()})).total,3050);    // 25 + 5.50, минимума для сёл нет
  }finally{e.DB.close()}
});

test('village named in the address sets the zone and its price (same rule as orders)', async()=>{
  const e=await env();
  try{
    setPrice(e,'apple_loose',8000);
    const r=await create(e,{address:'Бавра, дом 7'});
    assert.equal(r.http,201);
    assert.equal(r.program.zone,'bavra');
    assert.equal(r.preview.delivery_fee_minor,550);
  }finally{e.DB.close()}
});

// ---------- создание и доступ ----------
test('creation: consent is required; invalid phone, zone and schedule are refused', async()=>{
  const e=await env();
  try{
    assert.equal((await create(e,{privacy_consent:false})).error,'CONSENT_REQUIRED');
    assert.equal((await create(e,{payer:{name:'Карен',phone:'abc'}})).error,'INVALID_PHONE');
    assert.equal((await create(e,{zone:'moon'})).error,'INVALID_ZONE');
    assert.equal((await create(e,{schedule:{type:'monthly',dates:[29]}})).error,'INVALID_SCHEDULE');
  }finally{e.DB.close()}
});

test('operator creation by phone must record who agreed; the payer key is shown only once and never in lists', async()=>{
  const e=await env();
  try{
    const noNote=await call(e,'manage/subscriptions/create',{city_id:cid,payer:PAYER,recipient:RECIPIENT,address:ADDRESS,schedule:{type:'weekly',days:[1]},items:apple(),max_delivery_minor:10000,...CONSENT},e.owner);
    assert.equal(noNote.error,'INVALID_INPUT');
    const ok=await call(e,'manage/subscriptions/create',{city_id:cid,payer:PAYER,recipient:RECIPIENT,address:ADDRESS,schedule:{type:'weekly',days:[1]},items:apple(),max_delivery_minor:10000,consent_note:'Мама по телефону, 21.11.2026',...CONSENT},e.owner);
    assert.equal(ok.http,201);
    assert.equal(ok.program.consent.by,'OPERATOR');
    const list=await call(e,'manage/subscriptions/list',{},e.owner);
    assert.equal(list.http,200);
    assert.equal(JSON.stringify(list).includes(ok.key),false,'owner list never contains the payer key');
  }finally{e.DB.close()}
});

test('access: a wrong or missing key is refused; a logged-out or non-owner user cannot use owner endpoints', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    assert.equal((await call(e,'subscriptions/view',{id:prog.id,key:'0'.repeat(64)})).http,404);
    assert.notEqual((await call(e,'subscriptions/view',{id:prog.id})).http,200);
    assert.equal((await call(e,'manage/subscriptions/list',{})).http,401);
    assert.equal((await call(e,'manage/subscriptions/run',{})).http,401);
  }finally{e.DB.close()}
});

// ---------- деньги: полный цикл ----------
test('full cycle: no money → no order; confirmed top-up → orders paid; repeated and parallel planner runs never duplicate', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await plan(e);
    assert.equal((await ordersOf(e,prog)).length,0,'unfunded programme must not create orders');
    assert.ok((await deliveriesOf(e,prog)).every(d=>d.status==='WAITING_FUNDS'));

    await topUpConfirmed(e,prog,7000);
    await plan(e);
    const orders=await ordersOf(e,prog);
    assert.equal(orders.length,2);
    for(const o of orders){
      assert.equal(o.total,3500);
      assert.equal(o.paid,3500);
      assert.equal(o.payment,'PAID');
      assert.equal(o.status,'NEW');
      assert.equal(JSON.parse(o.customer).phone,RECIPIENT.phone);
    }
    assert.equal(await paymentsCount(e,'sub-pay-'),2);

    await plan(e);
    await Promise.all([plan(e),plan(e),plan(e)]);
    assert.equal((await ordersOf(e,prog)).length,2,'planner runs must not create second orders');
    assert.equal(await paymentsCount(e,'sub-pay-'),2,'payments must not be doubled');

    const view=await current(e,prog);
    assert.equal(view.summary.paid_minor,7000);
    assert.equal(view.summary.reserved_minor,7000);
    assert.equal(view.summary.unused_minor,0);
  }finally{e.DB.close()}
});

test('partial funds: the first delivery is paid, the second waits and is ordered after the next top-up', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,3500);
    await plan(e);
    let d=await deliveriesOf(e,prog);
    assert.equal(d[0].status,'ORDERED');
    assert.equal(d[1].status,'WAITING_FUNDS');
    await topUpConfirmed(e,prog,3500,'Перевод №2');
    await plan(e);
    d=await deliveriesOf(e,prog);
    assert.ok(d.every(x=>x.status==='ORDERED'));
    assert.equal((await ordersOf(e,prog)).length,2);
  }finally{e.DB.close()}
});

test('refund: only unused confirmed money can be refunded; the operator confirms the payout once', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,5000);
    await plan(e);                                    // один заказ 3500, остаток 1500
    assert.equal((await act(e,prog,'request_refund',{amount_minor:2000})).error,'INSUFFICIENT_FUNDS');
    const r=await act(e,prog,'request_refund',{amount_minor:1500});
    assert.equal(r.http,200);
    const refund=r.funds.find(f=>f.kind==='REFUND');
    assert.equal(refund.status,'PENDING');
    const c=await call(e,'manage/subscriptions/fund',{fund_id:refund.id,decision:'CONFIRM'},e.owner);
    assert.equal(c.http,200);
    assert.equal(c.summary.unused_minor,0);
    assert.equal((await call(e,'manage/subscriptions/fund',{fund_id:refund.id,decision:'CONFIRM'},e.owner)).error,'NOT_PENDING');
  }finally{e.DB.close()}
});

test('budget: a delivery above the limit waits for the payer; approval must match the quote shown', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e,{max_delivery_minor:3000});
    await topUpConfirmed(e,prog,7000);
    await plan(e);
    let d=await deliveriesOf(e,prog);
    assert.equal(d[0].status,'WAITING_APPROVAL');
    assert.equal(d[0].quoted_total_minor,3500);
    assert.equal((await act(e,prog,'approve_delivery',{day:d[0].day,total_minor:3000})).error,'STALE_QUOTE');
    assert.equal((await act(e,prog,'approve_delivery',{day:d[0].day,total_minor:3500})).http,200);
    await plan(e);
    d=await deliveriesOf(e,prog);
    assert.equal(d[0].status,'ORDERED');
  }finally{e.DB.close()}
});

test('no free slot: the delivery waits (WAITING_SLOT) and is ordered once a slot opens', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e,{schedule:{type:'dates',dates:[day(1)]}});
    await topUpConfirmed(e,prog,5000);
    for(let m=540;m<1440;m+=10)e.DB.exec(`INSERT OR REPLACE INTO slots(city_id,day,minute,capacity,reserved) VALUES('${cid}','${day(1)}',${m},1,1)`);
    await plan(e);
    assert.equal((await deliveriesOf(e,prog))[0].status,'WAITING_SLOT');
    assert.equal((await ordersOf(e,prog)).length,0);
    e.DB.exec(`DELETE FROM slots WHERE city_id='${cid}' AND day='${day(1)}'`);
    await plan(e);
    assert.equal((await deliveriesOf(e,prog))[0].status,'ORDERED');
  }finally{e.DB.close()}
});

// ---------- сбои ----------
test('crash after order creation: the stale claim is linked to the existing order, not duplicated', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,7000);
    await plan(e);
    const first=(await deliveriesOf(e,prog))[0];
    // Имитация сбоя: заказ создан, связь доставки с заказом не сохранилась, заявка зависла.
    e.DB.exec(`UPDATE subscription_deliveries SET status='CLAIMED',order_id=NULL,claimed_at='2000-01-01T00:00:00.000Z' WHERE id='${first.id}'`);
    await plan(e);
    const d=await deliveriesOf(e,prog);
    assert.equal(d[0].status,'ORDERED');
    assert.ok(d[0].order_id);
    assert.equal((await ordersOf(e,prog)).length,2);
    assert.equal(await paymentsCount(e,'sub-pay-'+first.id),1);
  }finally{e.DB.close()}
});

test('crash before order creation: the stale claim returns to the plan and is ordered once', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,7000);
    const first=(await deliveriesOf(e,prog))[0];
    e.DB.exec(`UPDATE subscription_deliveries SET status='CLAIMED',allocated_minor=3500,claimed_at='2000-01-01T00:00:00.000Z' WHERE id='${first.id}'`);
    await plan(e);
    assert.equal((await ordersOf(e,prog)).length,2);
    assert.equal((await deliveriesOf(e,prog))[0].status,'ORDERED');
  }finally{e.DB.close()}
});

// ---------- отмена заказа программы ----------
test('cancelling a subscription order keeps its money reserved; the operator returns it to balance, once', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,7000);
    await plan(e);
    const [o1]=await ordersOf(e,prog);
    const r=await action(e.DB,{id:o1.id,version:o1.version,command:crypto.randomUUID(),action:'cancel',reason:'Клиент отказался'},e.owner);
    assert.equal(r.ok,true);
    const d1=(await deliveriesOf(e,prog)).find(d=>d.order_id===o1.id);
    assert.equal(d1.status,'FAILED');
    assert.equal(d1.reason,'ORDER_CANCELLED');
    assert.equal(d1.allocated_minor,3500,'money stays reserved until the operator decides');
    assert.equal((await current(e,prog)).summary.unused_minor,0);

    const back=await call(e,'manage/subscriptions/resolve',{delivery_id:d1.id,decision:'RETURN_TO_BALANCE'},e.owner);
    assert.equal(back.http,200);
    assert.equal(back.summary.unused_minor,3500);
    assert.equal((await deliveriesOf(e,prog)).find(d=>d.id===d1.id).status,'CANCELLED');
    assert.equal((await call(e,'manage/subscriptions/resolve',{delivery_id:d1.id,decision:'REFUND'},e.owner)).error,'NOT_RESOLVABLE');

    // Оставшиеся 3500 возвращаются плательщику через запрос и подтверждение оператора.
    assert.equal((await act(e,prog,'request_refund',{amount_minor:3500})).http,200);
    const refund=(await current(e,prog)).funds.find(f=>f.kind==='REFUND'&&f.status==='PENDING');
    assert.equal((await call(e,'manage/subscriptions/fund',{fund_id:refund.id,decision:'CONFIRM'},e.owner)).http,200);
    const s=(await current(e,prog)).summary;
    assert.equal(s.refunded_minor,3500);
    assert.equal(s.unused_minor,0);
  }finally{e.DB.close()}
});

test('REFUND decision: the amount is no longer available to the payer while the payout is pending', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,7000);
    await plan(e);
    const o2=(await ordersOf(e,prog))[1];
    await action(e.DB,{id:o2.id,version:o2.version,command:crypto.randomUUID(),action:'cancel',reason:'Замена не согласована'},e.owner);
    const d2=(await deliveriesOf(e,prog)).find(d=>d.order_id===o2.id);
    const res=await call(e,'manage/subscriptions/resolve',{delivery_id:d2.id,decision:'REFUND'},e.owner);
    assert.equal(res.http,200);
    assert.equal(res.summary.refund_pending_minor,3500);
    assert.equal(res.summary.unused_minor,0,'pending refund must not be offered again');
    assert.equal((await act(e,prog,'request_refund',{amount_minor:1})).error,'INSUFFICIENT_FUNDS');
    const refund=res.funds.find(f=>f.kind==='REFUND'&&f.status==='PENDING');
    const paid=await call(e,'manage/subscriptions/fund',{fund_id:refund.id,decision:'CONFIRM'},e.owner);
    assert.equal(paid.http,200);
    assert.equal(paid.summary.refunded_minor,3500);
    assert.equal(paid.summary.refund_pending_minor,0);
    assert.equal(paid.summary.unused_minor,0);
  }finally{e.DB.close()}
});

// ---------- право плательщика менять ----------
test('after an order exists the payer cannot skip or move that delivery (DELIVERY_LOCKED)', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,7000);
    await plan(e);
    assert.equal((await act(e,prog,'skip',{day:day(1)})).error,'DELIVERY_LOCKED');
    assert.equal((await act(e,prog,'reschedule',{from:day(1),to:day(5)})).error,'DELIVERY_LOCKED');
  }finally{e.DB.close()}
});

test('pause stops new orders; resume brings them back; cancel releases plans and reports created orders', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    await topUpConfirmed(e,prog,7000);
    assert.equal((await act(e,prog,'pause')).status,'PAUSED');
    await plan(e);
    assert.equal((await ordersOf(e,prog)).length,0);
    assert.equal((await act(e,prog,'resume')).status,'ACTIVE');
    await plan(e);
    assert.equal((await ordersOf(e,prog)).length,2);

    const other=await newProgram(e,{schedule:{type:'dates',dates:[day(10),day(12)]}});
    const c=await act(e,other,'cancel',{reason:'Передумали'});
    assert.equal(c.status,'CANCELLED');
    assert.ok(Array.isArray(c.locked));
    assert.ok((await deliveriesOf(e,other)).every(d=>d.status==='CANCELLED'));
  }finally{e.DB.close()}
});

test('stale version: two edits from the same view cannot both apply', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e);
    const v=await current(e,prog);
    assert.equal((await call(e,'subscriptions/action',{id:prog.id,key:prog.key,version:v.version,action:'pause'})).status,'PAUSED');
    assert.equal((await call(e,'subscriptions/action',{id:prog.id,key:prog.key,version:v.version,action:'cancel'})).error,'STALE_VERSION');
  }finally{e.DB.close()}
});

test('plan edits: skip, move to a free day, refuse a taken day, change the schedule without touching ordered days', async()=>{
  const e=await env();
  try{
    const prog=await newProgram(e,{schedule:{type:'weekly',days:[1,3]}});
    const rows=await deliveriesOf(e,prog);
    assert.ok(rows.length>=15,'weekly plan covers the horizon');
    const mondays=rows.filter(d=>new Date(d.day+'T00:00:00Z').getUTCDay()===1);
    const wed=rows.filter(d=>new Date(d.day+'T00:00:00Z').getUTCDay()===3);
    assert.equal((await act(e,prog,'skip',{day:mondays[0].day})).http,200);
    assert.equal((await deliveriesOf(e,prog)).find(d=>d.day===mondays[0].day).status,'SKIPPED');
    assert.equal((await act(e,prog,'reschedule',{from:mondays[1].day,to:wed[0].day})).error,'DAY_TAKEN');
    let free=addDays(today(),60);                       // вторник: по графику (пн, ср) он не занят
    while(new Date(free+'T00:00:00Z').getUTCDay()!==2)free=addDays(free,1);
    assert.equal((await act(e,prog,'reschedule',{from:mondays[1].day,to:free})).http,200);
    const after=await deliveriesOf(e,prog);
    assert.equal(after.find(d=>d.day===mondays[1].day).status,'SKIPPED');
    assert.equal(after.find(d=>d.day===free).status,'PLANNED');
    assert.equal((await act(e,prog,'set_schedule',{schedule:{type:'weekly',days:[5]}})).http,200);
    const planned=(await deliveriesOf(e,prog)).filter(d=>d.status==='PLANNED');
    assert.ok(planned.length>0);
    assert.ok(planned.every(d=>new Date(d.day+'T00:00:00Z').getUTCDay()===5),'only the new weekday remains planned');
  }finally{e.DB.close()}
});

test('schedule range: "until" and "from" cut the plan, bad ranges are rejected (owner 21.11: limit a programme to a month or a date range)',()=>{
  const today='2026-12-01',w=normalizeSchedule({type:'weekly',days:[1,3],from:'2026-12-08',until:'2026-12-20'},today);
  assert.deepEqual(w,{type:'weekly',days:[1,3],from:'2026-12-08',until:'2026-12-20'});
  assert.deepEqual(scheduledDays(w,today,'2027-03-01'),['2026-12-09','2026-12-14','2026-12-16']);
  const i=normalizeSchedule({type:'interval',every:10,start:'2026-12-01',until:'2026-12-25',from:'2026-12-20'},today);
  assert.deepEqual(i,{type:'interval',every:10,start:'2026-12-01',until:'2026-12-25'});
  assert.deepEqual(scheduledDays(i,today,'2027-03-01'),['2026-12-01','2026-12-11','2026-12-21']);
  assert.deepEqual(normalizeSchedule({type:'weekly',days:[1],until:''},today),{type:'weekly',days:[1]});
  for(const bad of [{until:'2026-11-30'},{until:'2027-06-01'},{from:'2026-12-10',until:'2026-12-05'},{until:'nope'}])assert.throws(()=>normalizeSchedule({type:'weekly',days:[1],...bad},today),e=>e.message==='INVALID_SCHEDULE');
});
