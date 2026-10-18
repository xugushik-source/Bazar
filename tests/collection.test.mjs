import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {LocalD1}from '../tools/sqlite.mjs';import {migrate}from '../tools/migrate.mjs';import {seed,createUser}from '../tools/seed.mjs';
import {handle}from '../src/worker.mjs';import {q,orderView,createOrder,priceBasket,clock}from '../src/commerce.mjs';import {sha,token}from '../src/security.mjs';
import {botInvite,telegramWebhook,drainTelegram}from '../src/telegram.mjs';import {weightPrice}from '../src/weight-policy.mjs';import {botWords}from '../src/bot-words.mjs';
const cid='akhalkalaki',pid=k=>cid+'--'+k;
async function env(){const DB=new LocalD1();migrate(DB);await seed(DB);const sent=[];let message=500;const e={DB,sent,update:0,TELEGRAM_BOT_TOKEN:'fake-test-token',TELEGRAM_WEBHOOK_SECRET:token(),TELEGRAM_FETCH:async(url,init)=>{const method=url.split('/').pop(),body=JSON.parse(init.body);sent.push({method,...body});return Response.json({ok:true,result:method==='getMe'?{id:99,username:'bazar_test_bot'}:method==='getChatMember'?{status:'administrator'}:method==='sendMessage'?{message_id:++message}:true})}};e.owner={id:await createUser(DB,{email:'owner@test.invalid',name:'Владелец',password:'test-password-123456',owner:true})};return e}
async function call(e,path,b,user=null){const headers=b?{'Content-Type':'application/json','X-Bazar-CSRF':'1'}:{};if(user){const s=token();await q(e.DB,'INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)',await sha(s),user.id,Date.now()+100000).run();headers.cookie='bazar_session='+s}const r=await handle(new Request('https://bazar.test/api/'+path,{method:b?'POST':'GET',headers,...(b?{body:JSON.stringify(b)}:{})}),e);return {http:r.status,...await r.json()}}
// The owner creates the account and sets the password; the employee only logs in with it.
async function hire(e,role,name,city=cid){const login=role.toLowerCase()+'-'+(++e.update),r=await call(e,'manage/team/create',{role,city_id:city,name,login,password:'123456'},e.owner);assert.equal(r.http,200,JSON.stringify(r));assert.equal((await call(e,'manage/team/create',{role,city_id:city,name,login,password:'123456'},e.owner)).error,'LOGIN_TAKEN');return {id:r.id,name,login}}
async function order(e,fulfillment='pickup'){const b={city_id:cid,items:[{product_id:pid('apple_loose'),selection:{grams:1000}},{product_id:pid('pear_loose'),selection:{grams:1000}}],fulfillment},p=await priceBasket(e.DB,b),fee=fulfillment==='delivery'?500:0;return createOrder(e.DB,{...b,idem:crypto.randomUUID(),day:clock('Asia/Tbilisi',new Date(Date.now()+86400000)).day,minute:600,method:'cash',customer:{name:'ТЕСТ сборки',phone:'+995555000777',address:'ТЕСТ — не доставлять',note:'Яблоки покрупнее'},expected_total:p.estimate_minor+fee,maximum_total:p.maximum_minor+fee,accepted_weight_rules:true})}
const version=async(e,o)=>(await q(e.DB,'SELECT version FROM orders WHERE id=?',o.id).first()).version;
async function act(e,o,user,action,extra={},expect=200){const b={id:o.id,version:await version(e,o),command:crypto.randomUUID(),action,...extra},r=await call(e,'manage/action',b,user);assert.equal(r.http,expect,JSON.stringify({action,r}));return {b,r}}
const view=(e,o,user)=>call(e,'order/view',{id:o.id},user),customer=(e,o)=>call(e,'order/view',{id:o.id,key:o.key});

test('collector and controller: separate accounts, missing item agreed by buyer, measured weights, return with reason, check, buyer confirmation; payment stays separate',async()=>{const e=await env();try{
 const collector=await hire(e,'COLLECTOR','Арам'),controller=await hire(e,'CONTROLLER','Нино'),o=await order(e);
 // the collector cannot start before the call is confirmed, and cannot confirm the call itself
 await act(e,o,collector,'line_found',{line_id:pid('apple_loose')},403);await act(e,o,collector,'confirm',{},403);
 await act(e,o,controller,'confirm');let v=await view(e,o,collector);assert.equal(v.status,'WEIGHING');assert.equal(v.role,'COLLECTOR');
 // what the collector sees: lines and the buyer's note, no money, no contacts
 assert.equal(v.total,null);assert.equal(v.paid,null);assert.equal(v.payment,null);assert.deepEqual(v.customer,{note:'Яблоки покрупнее'});assert.equal(v.quotes.length,2);
 const cv=await view(e,o,controller);assert.equal(cv.customer.phone,'+995555000777');assert.equal(cv.paid,null);assert.ok(cv.total>0);
 // a measured weight is never zero; a missing item is marked explicitly and blocks submission until the buyer agrees
 await act(e,o,collector,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:0}]},400);
 await act(e,o,collector,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:1040}]});await act(e,o,collector,'line_missing',{line_id:pid('pear_loose')});
 v=await view(e,o,collector);assert.equal(v.availability[pid('apple_loose')],'FOUND');assert.equal(v.availability[pid('pear_loose')],'MISSING');assert.equal(v.actuals,null,'one line weighed is not a measured order');
 await act(e,o,collector,'submit_collection',{},409);
 await act(e,o,collector,'replace',{items:[{product_id:pid('apple_loose'),selection:{grams:1000}}]});
 let c=await customer(e,o);assert.equal(c.status,'AWAITING_APPROVAL');assert.equal(c.proposal.type,'REPLACEMENT');
 assert.equal((await call(e,'order/approve',{id:o.id,key:o.key,version:c.version,proposal_id:c.proposal.id,approved:true})).http,200);
 v=await view(e,o,collector);assert.equal(v.quotes.length,1);assert.equal(v.availability[pid('apple_loose')],'PENDING','new composition starts unmarked');
 await act(e,o,collector,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:1040}]});v=await view(e,o,collector);assert.equal(v.status,'ASSEMBLING');assert.equal(v.actuals[0].net_g,1040);
 // collector submits; collector can neither check nor take payment
 await act(e,o,collector,'submit_collection');await act(e,o,collector,'check_collection',{},403);await act(e,o,collector,'payment',{amount:100,reason:'нет'},403);
 // controller returns with a reason; collector re-weighs and resubmits
 await act(e,o,controller,'return_collection',{},400);await act(e,o,controller,'return_collection',{reason:'Перевесить яблоки, весы не обнулены'});
 v=await view(e,o,collector);assert.equal(v.status,'ASSEMBLING');assert.equal(v.collection.return_reason,'Перевесить яблоки, весы не обнулены');assert.equal(v.collection.round,1);
 await act(e,o,collector,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:1010}]});await act(e,o,collector,'submit_collection');
 // the check: replaying the same command is harmless; a second different press on an old version is refused
 const {b:check,r:first}=await act(e,o,controller,'check_collection');const replay=await call(e,'manage/action',check,controller);assert.deepEqual({...replay,http:200},first);
 await act(e,o,controller,'check_collection',{},409);
 c=await customer(e,o);assert.equal(c.status,'CUSTOMER_REVIEW');assert.equal(c.actuals[0].net_g,1010);assert.ok(c.collection.checked_at);assert.equal(c.collection.checked_by,undefined,'staff names are not shown to the buyer');
 assert.equal(c.total,weightPrice(c.quotes[0].product.price_per_kg_minor,1010),'pickup total is the measured weight, no delivery fee');
 const ok=await call(e,'order/confirm',{id:o.id,key:o.key,version:c.version,accepted:true});assert.equal(ok.status,'READY');
 assert.equal((await call(e,'order/confirm',{id:o.id,key:o.key,version:c.version,accepted:true})).status,'READY','repeated tap returns the same state');
 assert.equal((await call(e,'order/confirm',{id:o.id,key:'0'.repeat(64),version:ok.version,accepted:true})).http,404);
 // owner sees who did what; payment is still unpaid until the owner confirms money
 const ow=await view(e,o,e.owner);assert.equal(ow.collection.collected_by,'Арам');assert.equal(ow.collection.checked_by,'Нино');assert.equal(ow.collection.self_checked,false);assert.equal(ow.payment,'UNPAID');
 const names=ow.events.map(x=>x.event+':'+x.actor);for(const x of['CONFIRM:Нино','LINE_MISSING:Арам','SUBMIT_COLLECTION:Арам','RETURN_COLLECTION:Нино','CHECK_COLLECTION:Нино','CUSTOMER_CONFIRMED:CUSTOMER'])assert.ok(names.includes(x),x+' in '+names);
 assert.equal(ow.routing.active_links,0);assert.deepEqual(ow.routing.chats,[]);
 // pickup handover by the controller completes the order; money remains a separate owner action
 await act(e,o,controller,'payment',{amount:100,reason:'нет'},403);await act(e,o,controller,'handover');assert.equal((await view(e,o,e.owner)).payment,'UNPAID');
 await act(e,o,e.owner,'payment',{amount:(await view(e,o,e.owner)).total,reason:'ТЕСТ: наличные получены владельцем'});assert.equal((await view(e,o,e.owner)).payment,'PAID');
}finally{e.DB.close()}});

test('controller cannot check own collection, buyer dispute returns it, phone confirmation is recorded with a note',async()=>{const e=await env();try{
 const controller=await hire(e,'CONTROLLER','Гаянэ'),o=await order(e);await act(e,o,controller,'confirm');
 // a controller is not a collector: cannot weigh or submit
 await act(e,o,controller,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:1000}]},403);
 await act(e,o,e.owner,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:1000},{line_id:pid('pear_loose'),net_g:1000}]});await act(e,o,controller,'submit_collection',{},403);
 await act(e,o,e.owner,'submit_collection');await act(e,o,e.owner,'check_collection');let ow=await view(e,o,e.owner);assert.equal(ow.collection.self_checked,true,'owner self-check is visible, not hidden');
 let c=await customer(e,o);assert.equal((await call(e,'order/confirm',{id:o.id,key:o.key,version:c.version,accepted:false})).http,400,'a dispute needs a reason');
 c=await call(e,'order/confirm',{id:o.id,key:o.key,version:c.version,accepted:false,reason:'Груши мягкие'});assert.equal(c.status,'ASSEMBLING');assert.equal(c.collection.return_reason,'Груши мягкие');
 await act(e,o,e.owner,'submit_collection');await act(e,o,controller,'check_collection');
 await act(e,o,controller,'confirm_phone',{},400);await act(e,o,controller,'confirm_phone',{reason:'Покупатель по телефону согласен с составом и суммой'});
 ow=await view(e,o,e.owner);assert.equal(ow.status,'READY');const ev=ow.events.find(x=>x.event==='CONFIRM_PHONE');assert.equal(ev.data.source,'PHONE');assert.equal(ev.actor,'Гаянэ');
 // a collector may not collect and then check (same person)
 const both=await hire(e,'COLLECTOR','Сурен'),o2=await order(e);await act(e,o2,e.owner,'confirm');await act(e,o2,both,'weigh',{actuals:[{line_id:pid('apple_loose'),net_g:1000},{line_id:pid('pear_loose'),net_g:1000}]});await act(e,o2,both,'submit_collection');
 await q(e.DB,"UPDATE team_roles SET role='CONTROLLER' WHERE user_id=?",both.id).run();await act(e,o2,both,'check_collection',{},403);
}finally{e.DB.close()}});

test('outsiders: other city, revoked staff, unauthenticated and non-owner cannot read finance or manage access',async()=>{const e=await env();try{
 const tb=await hire(e,'COLLECTOR','Тбилиси','tbilisi'),ak=await hire(e,'CONTROLLER','Ахалкалаки'),o=await order(e);
 assert.equal((await view(e,o,tb)).http,403);assert.equal((await view(e,o)).http,401);
 for(const path of['manage/summary?city='+cid,'manage/team','manage/operations?city='+cid])for(const u of[tb,ak])assert.equal((await call(e,path,null,u)).http,403,path);
 for(const u of[tb,ak]){const r=await call(e,'manage/telegram/status',null,u);assert.equal(r.http,200,JSON.stringify(r));assert.deepEqual([r.links,r.jobs,r.people],[[],[],[]],'staff only learn whether their own Telegram is linked')}
 assert.equal((await call(e,'manage/team/create',{role:'CONTROLLER',city_id:cid,name:'x',login:'xx',password:'123456'},ak)).http,403);assert.equal((await call(e,'manage/team/create',{role:'OWNER',city_id:cid,name:'x',login:'xx',password:'123456'},e.owner)).http,403);
 assert.equal((await call(e,'manage/action',{id:o.id,version:0,command:crypto.randomUUID(),action:'cancel',reason:'x'},ak)).http,403);
 const orders=(await call(e,'manage/orders?city='+cid,null,ak)).orders;assert.equal(orders.length,1);assert.equal(orders[0].paid,null);
 assert.equal((await call(e,'manage/team/revoke',{user_id:ak.id,city_id:cid},e.owner)).http,200);assert.equal((await view(e,o,ak)).http,401,'revoked account is deactivated');
 const team=(await call(e,'manage/team',null,e.owner)).team;assert.deepEqual(team.map(t=>t.name),['Тбилиси']);
}finally{e.DB.close()}});

test('Telegram mock: personal cards for collector and controller, buttons by role, outsider refused, buyer confirms, owner sees routing; expired and misplaced links explained',async()=>{const e=await env();try{
 const send=async data=>{const r=await telegramWebhook(new Request('https://bazar.test/api/telegram/webhook',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':e.TELEGRAM_WEBHOOK_SECRET},body:JSON.stringify({update_id:++e.update,...data})}),e);assert.equal(r.status,200);return r};
 const link=async(user,tg,kind='IDENTITY')=>{const inv=await botInvite(e.DB,{kind,lang:'ru'},user,e);assert.ok(inv.url.startsWith('https://t.me/bazar_test_bot?start='));assert.ok(inv.expires_at);await send({message:{message_id:e.update,text:'/start '+inv.command.split(' ')[1],chat:{id:tg,type:'private'},from:{id:tg,first_name:'T'}}});return q(e.DB,'SELECT * FROM tg_links WHERE chat_id=?',String(tg)).first()};
 const collector=await hire(e,'COLLECTOR','Арам'),controller=await hire(e,'CONTROLLER','Нино');
 const ol=await link({id:e.owner.id,owner:true,memberships:[]},1,'OWNER'),cl=await link({...collector,owner:false,memberships:[]},21),kl=await link({...controller,owner:false,memberships:[]},22);
 assert.equal(cl.kind,'PERSONAL');assert.equal(kl.kind,'PERSONAL');
 const o=await order(e),drain=()=>drainTelegram(e,'https://bazar.test',50);await drain();
 const cards=chat=>e.sent.filter(m=>['sendMessage','editMessageText'].includes(m.method)&&String(m.chat_id)===String(chat)&&String(m.text||'').startsWith(o.id));
 assert.ok(cards(21).length&&cards(22).length&&cards(1).length,'owner, collector and controller are notified');
 assert.ok(!cards(21).at(-1).text.includes('+995555000777'),'collector card has no phone');assert.ok(cards(22).at(-1).text.includes('+995555000777'),'controller sees the phone to call');
 assert.ok(cards(21).at(-1).text.includes(botWords.ru.expected),'expected weight is labelled as expected, not measured');
 const press=async(l,action,tg)=>{const b=(await q(e.DB,'SELECT * FROM tg_buttons WHERE link_id=? AND order_id=? ORDER BY rowid DESC',l.id,o.id).all()).results.find(b=>JSON.parse(b.payload).action===action);assert.ok(b,'missing button '+action);await send({callback_query:{id:'cb'+e.update,data:'bz:'+b.id,from:{id:tg},message:{message_id:1,chat:{id:Number(l.chat_id)}}}});await drain()};
 const answers=()=>e.sent.filter(m=>m.method==='answerCallbackQuery');
 // outsider pressing in someone else's chat is refused; the controller confirms the call from Telegram
 const b=(await q(e.DB,'SELECT * FROM tg_buttons WHERE link_id=? ORDER BY rowid DESC',kl.id).all()).results.find(b=>JSON.parse(b.payload).action==='confirm');await send({callback_query:{id:'x',data:'bz:'+b.id,from:{id:999},message:{message_id:1,chat:{id:22}}}});assert.equal(answers().at(-1).text,botWords.ru.denied);
 await press(kl,'confirm',22);assert.equal((await orderView(e.DB,o.id,{id:e.owner.id,owner:true,memberships:[]})).status,'WEIGHING');
 // collector: weight via reply, submit via button
 await press(cl,'weigh',21);await send({message:{message_id:700,text:'1=1000, 2=990',chat:{id:21,type:'private'},from:{id:21}}});await drain();
 assert.ok(cards(21).at(-1).text.includes(botWords.ru.measured+' 1000'));await press(cl,'submit_collection',21);
 // the controller's card now offers the check; the collector has no check button
 assert.ok(!(await q(e.DB,'SELECT payload FROM tg_buttons WHERE link_id=? AND order_id=?',cl.id,o.id).all()).results.some(x=>JSON.parse(x.payload).action==='check_collection'));
 await press(kl,'check_collection',22);
 // the buyer links Telegram from the order card and confirms the checked collection there
 const ci=await botInvite(e.DB,{id:o.id,key:o.key,lang:'ru'},null,e,true);await send({message:{message_id:800,text:'/start '+ci.command.split(' ')[1],chat:{id:31,type:'private'},from:{id:31}}});await drain();
 const bl=await q(e.DB,'SELECT * FROM tg_links WHERE chat_id=?','31').first();assert.ok(cards(31).at(-1).text.includes(botWords.ru.customerReview));await press(bl,'confirmCollection',31);
 const ow=await orderView(e.DB,o.id,{id:e.owner.id,owner:true,memberships:[]});assert.equal(ow.status,'READY');assert.equal(ow.payment,'UNPAID');
 assert.equal(ow.routing.active_links,4);assert.deepEqual(ow.routing.chats.map(c=>c.state),['CUSTOMER','OWNER','PERSONAL','PERSONAL'].map(()=> 'DELIVERED'));
 assert.ok(cards(1).at(-1).text.includes(botWords.ru.collectedBy+': Арам')&&cards(1).at(-1).text.includes(botWords.ru.checkedBy+': Нино'));
 // links: expired code, group link opened in private, personal link used in a group
 const old=await botInvite(e.DB,{kind:'IDENTITY',lang:'ru'},{...collector,owner:false,memberships:[]},e);await q(e.DB,'UPDATE tg_invites SET expires=0').run();await send({message:{message_id:900,text:old.command,chat:{id:41,type:'private'},from:{id:41}}});assert.equal(e.sent.at(-1).text,botWords.ru.inviteExpired);
 const g=await botInvite(e.DB,{kind:'SUPPLIER',ref_id:'akhalkalaki-garden',lang:'ru'},{id:e.owner.id,owner:true,memberships:[]},e);assert.ok(g.url.includes('?startgroup='));await send({message:{message_id:901,text:g.command,chat:{id:42,type:'private'},from:{id:42}}});assert.equal(e.sent.at(-1).text,botWords.ru.groupOnly);
 const p=await botInvite(e.DB,{kind:'IDENTITY',lang:'ru'},{...controller,owner:false,memberships:[]},e);await send({message:{message_id:902,text:p.command,chat:{id:-43,type:'supergroup',title:'G'},from:{id:43}}});assert.equal(e.sent.at(-1).text,botWords.ru.privateOnly);
}finally{e.DB.close()}});

test('migration 0006 keeps existing orders unchanged and the server works on a database without it',async()=>{const DB=new LocalD1(),dir=new URL('../migrations/',import.meta.url);try{
 DB.exec('CREATE TABLE IF NOT EXISTS _local_migrations(name TEXT PRIMARY KEY,applied_at TEXT NOT NULL)');for(const f of fs.readdirSync(dir).filter(f=>/^000[1-5]_/.test(f)).sort()){DB.exec(fs.readFileSync(new URL(f,dir),'utf8'));DB.sqlite.prepare('INSERT INTO _local_migrations VALUES(?,?)').run(f,'x')}
 await seed(DB);const e={DB,sent:[]};e.owner={id:await createUser(DB,{email:'owner@test.invalid',name:'Владелец',password:'test-password-123456',owner:true})};
 const health=await call(e,'health');assert.equal(health.collection,false,'health reports the missing schema honestly');
 const o=await order(e);assert.equal((await customer(e,o)).status,'NEW');assert.equal((await view(e,o,e.owner)).status,'NEW');
 const before=await q(DB,'SELECT * FROM orders WHERE id=?',o.id).first();migrate(DB);const after=await q(DB,'SELECT * FROM orders WHERE id=?',o.id).first();
 for(const k of Object.keys(before))assert.deepEqual(after[k],before[k],k);assert.equal(after.collection_round,0);assert.equal((await q(DB,'SELECT availability FROM order_lines WHERE order_id=?',o.id).first()).availability,'PENDING');
 assert.equal((await call(e,'health')).collection,true);
}finally{DB.close()}});

test('owner-managed staff passwords: short login, six characters, only the owner changes them, old sessions closed, per-account attempt limit',async()=>{const e=await env();try{
 const login=async(name,password,ip='1.1.1.1')=>{const r=await handle(new Request('https://bazar.test/api/login',{method:'POST',headers:{'Content-Type':'application/json','X-Bazar-CSRF':'1','CF-Connecting-IP':ip},body:JSON.stringify({email:name,password})}),e);return {http:r.status,cookie:r.headers.get('Set-Cookie')?.split(';')[0]}};
 assert.equal((await call(e,'manage/team/create',{role:'COLLECTOR',city_id:cid,name:'Арам',login:'aram',password:'12345'},e.owner)).error,'PASSWORD_TOO_SHORT');
 assert.equal((await call(e,'manage/team/create',{role:'COLLECTOR',city_id:cid,name:'Арам',login:'арам',password:'123456'},e.owner)).error,'INVALID_LOGIN_NAME');
 const a=await call(e,'manage/team/create',{role:'COLLECTOR',city_id:cid,name:'Арам',login:'Aram',password:'482913'},e.owner);assert.equal(a.login,'aram');
 const first=await login('aram','482913');assert.equal(first.http,200);
 const me=await handle(new Request('https://bazar.test/api/bootstrap',{headers:{cookie:first.cookie}}),e).then(r=>r.json());assert.equal(me.user.team[0].role,'COLLECTOR');
 // staff cannot change any password, including their own
 const staff=await handle(new Request('https://bazar.test/api/manage/team/password',{method:'POST',headers:{'Content-Type':'application/json','X-Bazar-CSRF':'1',cookie:first.cookie},body:JSON.stringify({user_id:a.id,password:'000000'})}),e);assert.equal(staff.status,403);
 assert.equal((await call(e,'manage/team/password',{user_id:e.owner.id,password:'000000'},e.owner)).http,404,'the owner password is not changed here');
 assert.equal((await call(e,'manage/team/password',{user_id:a.id,password:'771204'},e.owner)).http,200);
 assert.equal((await handle(new Request('https://bazar.test/api/manage/orders?city='+cid,{headers:{cookie:first.cookie}}),e)).status,401,'old session closed');
 assert.equal((await login('aram','482913')).http,401);assert.equal((await login('aram','771204')).http,200);
 // guessing from many addresses still hits the per-account limit
 for(let i=0;i<30;i++)await login('aram','000'+String(i).padStart(3,'0'),'10.0.0.'+i);assert.equal((await login('aram','771204','10.9.9.9')).http,429);
 // revoked staff cannot log in; the same login can be created again with a new password
 await q(e.DB,'DELETE FROM auth_limits').run();assert.equal((await call(e,'manage/team/revoke',{user_id:a.id,city_id:cid},e.owner)).http,200);assert.equal((await login('aram','771204')).http,401);
 const again=await call(e,'manage/team/create',{role:'CONTROLLER',city_id:cid,name:'Арам',login:'aram',password:'550011'},e.owner);assert.equal(again.id,a.id);assert.equal((await login('aram','550011')).http,200);
 assert.equal((await call(e,'manage/team',null,e.owner)).team[0].login,'aram');
 // the owner still logs in with the full address
 assert.equal((await login('owner@test.invalid','test-password-123456')).http,200);
}finally{e.DB.close()}});
