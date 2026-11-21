import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {LocalD1} from '../tools/sqlite.mjs';
import {migrate} from '../tools/migrate.mjs';
import {seed} from '../tools/seed.mjs';
import {clock} from '../src/commerce.mjs';
import {uuid,now} from '../src/security.mjs';
import {addDays,createProgram,runSubscriptionPlanner} from '../src/subscriptions.mjs';
import {syncOrders,SheetsClient,runSheetSync,syncStatus,SHEET_COLUMNS} from '../src/sheets-sync.mjs';

const TBS='Asia/Tbilisi', cid='akhalkalaki';
const day=n=>addDays(clock(TBS).day,n);
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const pem=privateKey.export({type:'pkcs8',format:'pem'});
const SA={client_email:'bazar@test-project.iam.gserviceaccount.com',private_key:pem};

async function env(){
  const DB=new LocalD1();
  migrate(DB);
  await seed(DB,{karo:false});
  DB.exec('UPDATE cities SET first_order_free=0');
  DB.exec('DELETE FROM day_hours');
  DB.exec("UPDATE cities SET delivery_fee=500,free_delivery_from=10000 WHERE id='akhalkalaki'");
  DB.exec("UPDATE products SET stock=1000000,price=3000 WHERE id='akhalkalaki--apple_loose'");
  const r=await createProgram(DB,{city_id:cid,payer:{name:'Карен',phone:'+995555111222'},recipient:{name:'Мама Анна',phone:'+995555333444'},address:'Ахалкалаки, ул. Ленина 1',minute:600,
    schedule:{type:'dates',dates:[day(1)]},items:[{product_id:'akhalkalaki--apple_loose',selection:{grams:1000}}],max_delivery_minor:10000,privacy_consent:true,accepted_weight_rules:true});
  DB.prepare("INSERT INTO subscription_funds(id,program_id,kind,amount_minor,status,reference,requested_at,confirmed_at) VALUES(?,?,'PAYMENT',7000,'CONFIRMED','тест',?,?)").bind(uuid(),r.program.id,now(),now()).run();
  await runSubscriptionPlanner(DB);
  return {DB};
}

// Фейковый Google: записывает все запросы, отвечает как настоящий API.
function fakeGoogle({failAppend=null,failUpdate=null}={}){
  const calls=[];let nextRow=2;
  const fetchImpl=async(url,opts={})=>{
    const isJson=typeof opts.body==='string';
    calls.push({url,method:opts.method||'GET',body:isJson?JSON.parse(opts.body):null,headers:opts.headers||{},form:opts.body instanceof URLSearchParams?Object.fromEntries(opts.body):null});
    if(url.startsWith('https://oauth2.googleapis.com/token'))return {ok:true,status:200,json:async()=>({access_token:'tok'})};
    if(url.includes(':append')){
      const failed=failAppend&&failAppend();
      if(failed)return failed;
      const row=nextRow++;
      return {ok:true,status:200,json:async()=>({updates:{updatedRange:`Заказы!A${row}:R${row}`}})};
    }
    if(url.includes('/values/')&&opts.method==='PUT'){
      const failed=failUpdate&&failUpdate();
      if(failed)return failed;
      return {ok:true,status:200,json:async()=>({})};
    }
    throw new Error('unexpected '+url);
  };
  return {calls,fetchImpl};
}
const client=(fetchImpl)=>new SheetsClient({spreadsheetId:'sheet-1',serviceAccount:SA,fetchImpl,at:()=>new Date()});
const writes=calls=>calls.filter(c=>c.method!=='GET'&&!c.url.startsWith('https://oauth2'));

test('without Google settings nothing is sent and nothing is marked as copied', async()=>{
  const e=await env();
  try{
    const r=await runSheetSync({DB:e.DB});
    assert.equal(r.configured,false);
    assert.equal((await e.DB.prepare('SELECT COUNT(*) n FROM sheet_sync').first()).n,0);
    assert.equal((await syncStatus(e.DB,{})).configured,false);
  }finally{e.DB.close()}
});

test('first run writes the header and appends each order once with its full details', async()=>{
  const e=await env();
  try{
    const g=fakeGoogle();
    const r=await syncOrders(e.DB,client(g.fetchImpl));
    assert.equal(r.synced,1);
    const appended=writes(g.calls).find(c=>c.url.includes(':append'));
    const row=appended.body.values[0];
    assert.equal(row.length,SHEET_COLUMNS.length,'row has one value per column');
    assert.ok(row.includes('+995555333444'),'recipient phone is in the sheet');
    assert.ok(row.some(v=>String(v).includes('Ленина 1')),'address is in the sheet');
    assert.ok(writes(g.calls).some(c=>c.method==='PUT'&&c.url.includes('A1')),'header row written first');
    const s=await e.DB.prepare('SELECT status,row_no FROM sheet_sync').first();
    assert.equal(s.status,'SYNCED');
    assert.equal(s.row_no,2);
  }finally{e.DB.close()}
});

test('a second run with no change writes nothing; a changed order updates the same row, never appends again', async()=>{
  const e=await env();
  try{
    const g=fakeGoogle();
    await syncOrders(e.DB,client(g.fetchImpl));
    const before=writes(g.calls).length;
    assert.equal((await syncOrders(e.DB,client(g.fetchImpl))).synced,0);
    assert.equal(writes(g.calls).length,before,'no writes when nothing changed');
    await e.DB.prepare("UPDATE orders SET status='ASSEMBLING',version=version+1").run();
    assert.equal((await syncOrders(e.DB,client(g.fetchImpl))).synced,1);
    const after=writes(g.calls).slice(before);
    assert.equal(after.length,1);
    assert.equal(after[0].method,'PUT');
    assert.ok(after[0].url.includes('A2%3AR2')||after[0].url.includes('A2:R2'),'same row updated');
    assert.equal(after[0].body.values[0][4],'ASSEMBLING');
  }finally{e.DB.close()}
});

test('an append whose answer was lost is not retried automatically (it may already be in the sheet)', async()=>{
  const e=await env();
  try{
    let fail=true;
    const g=fakeGoogle({failAppend:()=>{if(fail)throw new TypeError('network');return null}});
    const net=async(url,opts)=>{try{return await g.fetchImpl(url,opts)}catch(err){if(err instanceof TypeError)throw err;throw err}};
    const r1=await syncOrders(e.DB,client(async(url,opts)=>{if(url.includes(':append')&&fail)throw new TypeError('network');return net(url,opts)}));
    assert.equal(r1.unknown,1);
    const s=await e.DB.prepare('SELECT status,last_error FROM sheet_sync').first();
    assert.equal(s.status,'ERROR');
    assert.equal(s.last_error,'APPEND_UNKNOWN');
    fail=false;
    const before=g.calls.filter(c=>c.url.includes(':append')).length;
    await syncOrders(e.DB,client(net));
    assert.equal(g.calls.filter(c=>c.url.includes(':append')).length,before,'no automatic second append');
  }finally{e.DB.close()}
});

test('a refused request (400) is a clean failure and is retried on the next run', async()=>{
  const e=await env();
  try{
    let refuse=true;
    const g=fakeGoogle({failAppend:()=>refuse?{ok:false,status:400,json:async()=>({})}:null});
    const r1=await syncOrders(e.DB,client(g.fetchImpl));
    assert.equal(r1.errors,1);
    assert.equal(r1.unknown,0);
    refuse=false;
    const r2=await syncOrders(e.DB,client(g.fetchImpl));
    assert.equal(r2.synced,1);
    assert.equal((await e.DB.prepare('SELECT status FROM sheet_sync').first()).status,'SYNCED');
  }finally{e.DB.close()}
});

test('the access token is a real RS256 signature made with the service-account key', async()=>{
  const e=await env();
  try{
    const g=fakeGoogle();
    await syncOrders(e.DB,client(g.fetchImpl));
    const tokenCall=g.calls.find(c=>c.url.startsWith('https://oauth2.googleapis.com/token'));
    const jwt=tokenCall.form.assertion;
    const [h,p,s]=jwt.split('.');
    assert.ok(verify('RSA-SHA256',Buffer.from(h+'.'+p),publicKey,Buffer.from(s,'base64url')),'signature verifies');
    assert.equal(JSON.parse(Buffer.from(p,'base64url')).iss,SA.client_email);
  }finally{e.DB.close()}
});

test('the owner status shows how many orders are copied, waiting, or failed', async()=>{
  const e=await env();
  try{
    const st=await syncStatus(e.DB,{GOOGLE_SHEETS_ID:'x',GOOGLE_SERVICE_ACCOUNT_JSON:'{}'});
    assert.equal(st.configured,true);
    assert.equal(st.pending,1);
    await syncOrders(e.DB,client(fakeGoogle().fetchImpl));
    const after=await syncStatus(e.DB,{GOOGLE_SHEETS_ID:'x',GOOGLE_SERVICE_ACCOUNT_JSON:'{}'});
    assert.equal(after.synced,1);
    assert.equal(after.pending,0);
  }finally{e.DB.close()}
});
