import test from 'node:test';import assert from 'node:assert/strict';
import {LocalD1} from '../tools/sqlite.mjs';import {migrate} from '../tools/migrate.mjs';import {seed,createUser} from '../tools/seed.mjs';import {handle} from '../src/worker.mjs';import {orderView,q,clock} from '../src/commerce.mjs';import {sha,token} from '../src/security.mjs';
import {renderMessage,addButton} from '../src/telegram.mjs';import {ownerCallback} from '../src/owner-control.mjs';import {stuckTick} from '../src/stuck-orders.mjs';
// Owner 10.11 «полный контроль»: the owner assigns the courier, presses a stuck step for whoever forgot, and reminders go
// first to the one who has to press, then to the owner with the buttons.
const env=async()=>{const DB=new LocalD1();migrate(DB);await seed(DB,{karo:false});DB.exec('UPDATE cities SET first_order_free=0');DB.exec('DELETE FROM day_hours');const owner={id:await createUser(DB,{email:'owner@test.invalid',name:'Владелец',password:'test-password-123456',owner:true}),owner:true,memberships:[]};return{DB,owner}};
async function call(e,path,b,user=null){const headers=b?{'Content-Type':'application/json','X-Bazar-CSRF':'1'}:{};if(user){const session=token();await q(e.DB,'INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)',await sha(session),user.id,Date.now()+100000).run();headers.cookie='bazar_session='+session}const r=await handle(new Request('https://bazar.test/api/'+path,{method:b?'POST':'GET',headers,...(b?{body:JSON.stringify(b)}:{})}),e);return{...await r.json(),http:r.status}}
const cid='akhalkalaki',pid=k=>cid+'--'+k,vendor=cid+'-garden';
async function order(e){const base={city_id:cid,items:[{product_id:pid('apple_loose'),selection:{grams:1000}},{product_id:pid('pear_loose'),selection:{grams:1000}}],fulfillment:'delivery'},quote=await call(e,'quote',base);const b={...base,idem:crypto.randomUUID(),day:new Date(Date.now()+86400000).toISOString().slice(0,10),minute:600,method:'cash',customer:{name:'Покупатель',phone:'+995555000000',address:'Тестовый адрес'},expected_total:quote.total,maximum_total:quote.maximum_total,accepted_weight_rules:true,privacy_consent:true};const o=await call(e,'orders',b);assert.equal(o.http,201,JSON.stringify(o));return o}
const view=(e,o,user=e.owner)=>orderView(e.DB,o.id,user);
async function act(e,o,action,extra={},user=e.owner,status=200){const v=await view(e,o);const r=await call(e,'manage/action',{id:o.id,version:v.version,command:crypto.randomUUID(),action,...extra},user);assert.equal(r.http,status,JSON.stringify({action,r}));return r}
async function member(e,role,suffix='one',v=vendor){const id=await createUser(e.DB,{email:role+suffix+'@test.invalid',name:role+' '+suffix,password:'test-password-123456',vendor_id:v,role});return{id,owner:false,memberships:[{vendor_id:v,role}]}}

test('owner 10.11: the owner names and changes the courier, presses «Готово» for a supplier and every courier step; the history says for whom',async()=>{const e=await env();try{
 const o=await order(e),d=await member(e,'DRIVER'),d2=await member(e,'DRIVER','two');await act(e,o,'confirm');
 await act(e,o,'assign',{driver_id:d.id},d2,403);await act(e,o,'assign',{driver_id:'nobody'},e.owner,404);
 await act(e,o,'assign',{driver_id:d.id});let row=await q(e.DB,'SELECT driver_id,courier_name FROM orders WHERE id=?',o.id).first();assert.equal(row.driver_id,d.id);assert.equal(row.courier_name,'DRIVER one');
 await act(e,o,'assign',{driver_id:d2.id});row=await q(e.DB,'SELECT driver_id,courier_name FROM orders WHERE id=?',o.id).first();assert.equal(row.driver_id,d2.id,'the owner changes the courier');assert.equal(row.courier_name,'DRIVER two');
 await act(e,o,'force_ready',{vendor_id:vendor},d2,403);
 await act(e,o,'force_ready',{vendor_id:vendor});assert.equal((await view(e,o)).status,'WEIGHING','the second supplier still weighs');await act(e,o,'force_ready',{vendor_id:cid+'-farm'});let v=await view(e,o);assert.equal(v.status,'READY','weighed goods: the ordered weight stands for the supplier');assert.deepEqual(v.actuals.map(a=>a.net_g),[1000,1000]);
 await act(e,o,'pickup',{},d,403);
 for(const [a,s]of[['pickup','PICKED_UP'],['depart','OUT_FOR_DELIVERY'],['deliver','COMPLETED']]){await act(e,o,a);assert.equal((await view(e,o)).status,s)}
 const ev=(await q(e.DB,'SELECT event,data FROM events WHERE order_id=? ORDER BY at',o.id).all()).results.map(r=>[r.event,JSON.parse(r.data||'{}')]);
 assert.equal(ev.find(([n])=>n==='READY')[1].instead_of,'SUPPLIER');assert.equal(ev.find(([n])=>n==='DELIVER')[1].instead_of,'COURIER');assert.equal(ev.filter(([n])=>n==='ASSIGN').length,2)}finally{e.DB.close()}});

test('owner 10.11: the owner card has «Назначить курьера» and «Готово за …»; picking a courier from the list assigns him',async()=>{const e=await env();try{
 const o=await order(e),d=await member(e,'DRIVER');await act(e,o,'confirm');e.DB.exec(`INSERT INTO tg_links(id,kind,ref_id,chat_id,title,created_at) VALUES('own','OWNER','${e.owner.id}','100','Owner','x')`);const l=await q(e.DB,"SELECT * FROM tg_links WHERE id='own'").first();
 const card=await renderMessage(e.DB,l,o.id,'https://bazar.test'),labels=card.reply_markup.inline_keyboard.flat().map(b=>b.text);assert.ok(labels.includes('🚚 Назначить курьера'),labels.join('|'));assert.ok(labels.some(t=>t.startsWith('✋ Готово за:')));
 const sent=[],tg=async(env,m,b)=>{sent.push(b);return {ok:true}},row=await q(e.DB,'SELECT * FROM orders WHERE id=?',o.id).first(),base={id:o.id,version:row.version,command:'telegram-test-'+crypto.randomUUID().slice(0,8)};
 await ownerCallback(e.DB,{},tg,addButton,{},l,{action:'ctl_pick'},row,e.owner,{...base,action:'ctl_pick'});const list=sent[0].reply_markup.inline_keyboard.flat();assert.match(list[0].text,/DRIVER one/);
 const pick=JSON.parse((await q(e.DB,'SELECT payload FROM tg_buttons WHERE id=?',list[0].callback_data.slice(3)).first()).payload);
 await ownerCallback(e.DB,{},tg,addButton,{},l,pick,row,e.owner,{...base,...pick});assert.equal((await q(e.DB,'SELECT driver_id FROM orders WHERE id=?',o.id).first()).driver_id,d.id);assert.match(sent.at(-1).text,/назначен/);
 await assert.rejects(ownerCallback(e.DB,{},tg,addButton,{},l,{action:'ctl_pick'},row,{id:d.id,owner:false},base))}finally{e.DB.close()}});

test('owner 10.11: a stuck order reminds the supplier after 3 minutes, the owner after 6 with buttons, once per stop; outside order hours nobody',async()=>{const e=await env();try{
 const o=await order(e);await act(e,o,'confirm');const day=(await q(e.DB,'SELECT day FROM orders WHERE id=?',o.id).first()).day,now=new Date(day+'T06:00:00+04:00');// 4 h before the 10:00 slot
 e.DB.exec("INSERT INTO app_config(key,value) VALUES('order_hours','0-1440') ON CONFLICT(key) DO UPDATE SET value=excluded.value");
 e.DB.exec(`INSERT INTO tg_links(id,kind,ref_id,chat_id,title,created_at) VALUES('own','OWNER','${e.owner.id}','100','Owner','x')`);e.DB.exec(`INSERT INTO tg_links(id,kind,ref_id,chat_id,title,created_at) VALUES('sup','SUPPLIER','${vendor}','200','Garden','x')`);
 const ago=m=>e.DB.exec(`UPDATE orders SET updated_at='${new Date(now.getTime()-m*60000).toISOString()}'`),sent=[],tg=async(env,m,b)=>{sent.push(b);return {ok:true}};
 ago(1);assert.equal(await stuckTick(e.DB,{},tg,now,addButton),0,'one minute: nothing yet');
 ago(4);assert.equal(await stuckTick(e.DB,{},tg,now,addButton),1,'today, inside order hours, though the slot is 4 h away');assert.deepEqual(sent.map(s=>s.chat_id),['200'],'3 min: the supplier only');assert.match(sent[0].text,/Готово/);
 assert.equal(await stuckTick(e.DB,{},tg,now,addButton),0,'not twice');
 ago(7);assert.equal(await stuckTick(e.DB,{},tg,now,addButton),1);assert.deepEqual(sent.map(s=>s.chat_id),['200','100'],'6 min: the owner, the supplier is not nagged again');
 assert.ok(sent[1].reply_markup.inline_keyboard.flat().some(b=>b.text.startsWith('✋ Готово за:')));assert.equal(await stuckTick(e.DB,{},tg,now,addButton),0);
 e.DB.exec("UPDATE app_config SET value='480-1080' WHERE key='order_hours'");e.DB.exec('DELETE FROM stuck_alerts');
 assert.equal(await stuckTick(e.DB,{},tg,now,addButton),0,'06:00, outside order hours and far from the slot: quiet');
 e.DB.exec('DELETE FROM stuck_alerts');const later=new Date(now.getTime()+2*86400000);e.DB.exec(`UPDATE orders SET updated_at='${new Date(later.getTime()-60*60000).toISOString()}'`);e.DB.exec("UPDATE app_config SET value='0-1440' WHERE key='order_hours'");
 assert.equal(await stuckTick(e.DB,{},tg,later,addButton),0,'an order of an earlier day (a forgotten test order) never reminds')}finally{e.DB.close()}});

test('owner 10.11: after the owner confirms, the supplier sees the receipt sum at our purchase price, approximate then exact; never the address',async()=>{const e=await env();try{
 e.DB.exec(`UPDATE products SET cost=400 WHERE id='${pid('apple_loose')}'`);e.DB.exec(`UPDATE order_lines SET cost=400 WHERE product_id='${pid('apple_loose')}'`);
 const o=await order(e);e.DB.exec(`UPDATE order_lines SET cost=400 WHERE product_id='${pid('apple_loose')}'`);e.DB.exec(`INSERT INTO tg_links(id,kind,ref_id,chat_id,title,created_at) VALUES('sup','SUPPLIER','${vendor}','200','Garden','x')`);
 const l=await q(e.DB,"SELECT * FROM tg_links WHERE id='sup'").first(),text=async()=>(await renderMessage(e.DB,l,o.id,'https://bazar.test')).text;
 let t=await text();assert.ok(!t.includes('🧾'),'before the owner\'s call: no sum');assert.match(t,/пока БАЗАР не подтвердит/);
 await act(e,o,'confirm');t=await text();assert.match(t,/🧾 Чек для БАЗАРА: ≈4\.00 GEL/);assert.ok(!t.includes('Тестовый адрес')&&!t.includes('+995555000000'));
 const apple=(await view(e,o)).quotes.find(x=>x.product_id===pid('apple_loose'));await act(e,o,'weigh',{actuals:[{line_id:apple.line_id,net_g:1100}]});
 t=await text();assert.match(t,/🧾 Чек для БАЗАРА: 4\.40 GEL/)}finally{e.DB.close()}});

test('owner 10.11: whole fresh piglet and lamb (Амо) are a pre-order — in the catalog without a price, never in a quote or an order',async()=>{const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{
 const c=await call(e,'catalog?city='+cid);for(const k of ['amo_piglet_fresh_whole','amo_lamb_fresh_whole']){const p=c.products.find(p=>p.id===pid(k));assert.ok(p,k);assert.equal(p.profile.mode,'REQUEST');assert.equal(p.vendor_id,cid+'-amo')}
 const r=await call(e,'quote',{city_id:cid,items:[{product_id:pid('amo_lamb_fresh_whole'),selection:{count:1}}],fulfillment:'delivery'});assert.equal(r.http,409);assert.match(JSON.stringify(r),/PRODUCT_UNAVAILABLE/);
 const fs=await import('node:fs'),{amoWholeSql}=await import('../src/amo-whole.mjs');assert.ok(fs.readFileSync(new URL('../migrations/0096_amo_whole_preorder.sql',import.meta.url),'utf8').endsWith(amoWholeSql().join('\n')+'\n'),'migration equals the generator')}finally{e.DB.close()}});

test('owner 10.11: Artur household goods show «Ожидается» with no price and cannot be ordered; migration equals the generator',async()=>{const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{
 const {arturHousehold,arturHouseholdSql,householdId}=await import('../src/artur-household.mjs');assert.equal(arturHousehold.length,349);
 const rows=(await q(DB,"SELECT * FROM products WHERE id LIKE 'akhalkalaki--artur_hh_%'").all()).results;assert.equal(rows.length,349);assert.ok(rows.every(r=>r.active===1&&r.price===0&&r.cost===null&&r.vendor_id==='akhalkalaki-artur'&&r.category==='household'&&JSON.parse(r.profile).mode==='SOON'));
 const c=await call(e,'catalog?city='+cid);assert.equal(c.products.filter(p=>p.id.includes('artur_hh_')).length,349);assert.ok(c.products.filter(p=>p.id.includes('artur_hh_')).every(p=>p.profile.mode==='SOON'&&!('cost'in p)));
 const r=await call(e,'quote',{city_id:cid,items:[{product_id:householdId(1),selection:{count:1}}],fulfillment:'delivery'});assert.equal(r.http,409);assert.match(JSON.stringify(r),/PRODUCT_UNAVAILABLE/);
 const fs=await import('node:fs');assert.ok(fs.readFileSync(new URL('../migrations/0097_artur_household.sql',import.meta.url),'utf8').endsWith(arturHouseholdSql().join('\n')+'\n'));
 const p=JSON.parse((await q(DB,'SELECT names FROM products WHERE id=?',householdId(2)).first()).names);assert.match(p.ru,/Hobby/);assert.match(p.hy,/Hobby/);assert.match(p.ka,/Hobby/);
 for(const r of arturHousehold.filter(r=>r[2]))assert.ok(fs.existsSync(new URL('../public/media/artur-hh-'+String(r[0]).padStart(3,'0')+'.jpg',import.meta.url)),r[0])}finally{DB.close()}});

test('owner 10.11: household price list — cost +20 % rounded up to 10 tetri (or the owner\'s own sale price) and the product appears on the site',async()=>{const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{
 const {arturHouseholdPriceSql,householdId,householdRetail}=await import('../src/artur-household.mjs');assert.equal(householdRetail(1000),1200);assert.equal(householdRetail(1234),1490,'1234 × 1,2 = 1480,8, up to 10 tetri');
 for(const sql of arturHouseholdPriceSql([[1,2500,null],[2,1000,1500],[3,0,null],[999,500,null]]))DB.exec(sql);
 const c=await call(e,'catalog?city='+cid),by=id=>c.products.find(p=>p.id===householdId(id));
 assert.equal(by(1).price,3000);assert.equal(by(2).price,1500);assert.ok(by(3));assert.equal(c.products.filter(p=>p.id.includes('artur_hh_')&&p.profile.mode==='EACH').length,2,'priced items become ordinary');assert.equal(by(3).profile.mode,'SOON','no cost — still «Ожидается»');
 assert.equal((await q(DB,'SELECT cost FROM products WHERE id=?',householdId(1)).first()).cost,2500);assert.ok(!('cost'in by(1)),'cost is private')}finally{DB.close()}});

test('owner 11.11: «Торты и выпечка» — new section, supplier and eight cakes with photos show «Ожидается», not orderable; migration equals the generator',async()=>{const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{
 const {cakesSql,cakes,cakesId,cakesArt}=await import('../src/vypechka.mjs'),fs=await import('node:fs');
 const c=await call(e,'catalog?city='+cid);assert.ok(c.categories.find(x=>x.id==='cakes'&&x.names.hy&&x.names.ka),'category in three languages');assert.ok(c.vendors.find(v=>v.id==='akhalkalaki-vypechka'&&v.names.hy&&v.names.ka));
 const mine=c.products.filter(p=>p.category==='cakes');assert.equal(mine.length,14);assert.ok(mine.every(p=>p.profile.mode==='EACH'&&p.price>0&&!('cost'in p)&&p.names.ru&&p.names.hy&&p.names.ka),'owner 11.11: thirteen priced cakes');
 const {cakePrice,cakeCost}=await import('../src/cakes-1111.mjs');assert.deepEqual([1,2,8,9].map(cakePrice),[350,400,400,350]);assert.deepEqual([1,2,8,9].map(cakeCost),[250,300,300,250]);const price=n=>mine.find(p=>p.id===cakesId(n)).price;assert.equal(price(1),350);assert.equal(price(2),400);assert.equal(price(8),400);assert.equal(price(13),350);
 assert.ok(fs.readFileSync(new URL('../migrations/0099_vypechka_cakes.sql',import.meta.url),'utf8').endsWith(cakesSql().join('\n')+'\n'));
 for(const n of [...cakes.map(c=>c[0]),9,10,11,12,13])assert.ok(fs.existsSync(new URL('../public/media/'+cakesArt(n)+'.jpg',import.meta.url)),String(n));
 const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');assert.ok(app.includes("['cakes',['cakes']]")&&app.includes("['household',['household']]"),'home tiles for both sections');
 const i18n=fs.readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');assert.equal((i18n.match(/group_cakes:/g)||[]).length,3);assert.equal((i18n.match(/group_household:/g)||[]).length,3)}finally{DB.close()}});

test('owner 11.11: «Доставка готовой еды» — five empty subsections in three languages, separate from cakes; migration equals the generator',async()=>{const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{
 const {readyFoodSql,readyFoodCategories}=await import('../src/ready-food.mjs'),fs=await import('node:fs');
 const c=await call(e,'catalog?city='+cid);
 for(const [id] of readyFoodCategories){const x=c.categories.find(k=>k.id===id);assert.ok(x&&x.names.ru&&x.names.hy&&x.names.ka,id);assert.equal(c.products.filter(p=>p.category===id).length,id==='rf_pizza'?5:0,'no invented dishes: only the owner\'s four (11.11)')}
 assert.ok(c.categories.find(k=>k.id==='cakes'),'cakes stay separate');const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),i18n=fs.readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');assert.ok(app.includes('ready-soon'));assert.equal((i18n.match(/readyFood:/g)||[]).length,3);
 assert.ok(fs.readFileSync(new URL('../migrations/0100_ready_food.sql',import.meta.url),'utf8').endsWith(readyFoodSql().join('\n')+'\n'))}finally{DB.close()}});

test('owner 11.11: home tiles use light thumbnails that exist for every tile photo',async()=>{const fs=await import('node:fs'),app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const arts=[...app.match(/const chipArt=\{([^}]*)\}/)[1].matchAll(/:'([^']+)'/g)].map(m=>m[1]);assert.ok(arts.length>=15);
 for(const a of arts){const f=new URL('../public/media-tiles/'+a+'.jpg',import.meta.url);assert.ok(fs.existsSync(f),a);assert.ok(fs.statSync(f).size<60000,a+' is light')}
 assert.ok(app.includes('media-tiles'))});

test('owner 11.11: cake migration 0101 equals the generator and names the cakes from the owner list',async()=>{const fs=await import('node:fs'),{cakes1111Sql,cakeNames}=await import('../src/cakes-1111.mjs');
 assert.ok(fs.readFileSync(new URL('../migrations/0101_cakes_names_prices.sql',import.meta.url),'utf8').endsWith(cakes1111Sql().join('\n')+'\n'));
 assert.equal(cakeNames.length,13);assert.ok(!cakeNames.some(([,n])=>/дубль|Шоколадница/.test(n)),'the duplicate is skipped');assert.ok(cakeNames.some(([,n])=>n==='Финиковый')&&cakeNames.some(([,n])=>n==='Бакинская гата'))});

test('owner 11.11: pickup addresses reach vendors; migration 0102 equals the generator',async()=>{const fs=await import('node:fs'),{pickups,pickupSql}=await import('../src/pickup.mjs');
 assert.ok(fs.readFileSync(new URL('../migrations/0102_vendor_pickup.sql',import.meta.url),'utf8').endsWith(pickupSql().join('\n')+'\n'));
 for(const [id,o] of Object.entries(pickups))assert.ok(o.ru&&o.hy&&o.ka,id);
 const DB=new LocalD1();migrate(DB);await seed(DB);try{const row=await DB.prepare('SELECT pickup FROM vendors WHERE id=?').bind('akhalkalaki-vypechka').first();assert.match(JSON.parse(row.pickup).ru,/Мясникяна, 16/)}finally{DB.close()}});

test('owner 11.11: cakes renamed by photo, four 35 cm pizzas/khachapuri at 25 ₾ +20 % = 30 ₾; migration 0104 equals the generator',async()=>{const fs=await import('node:fs'),{food1111bSql,pizzas,pizzaArt,pizzaId}=await import('../src/food-1111b.mjs'),{cakesId}=await import('../src/vypechka.mjs');
 assert.ok(fs.readFileSync(new URL('../migrations/0104_pizza_cake_names.sql',import.meta.url),'utf8').endsWith(food1111bSql().join('\n')+'\n'));
 const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{const c=await call(e,'catalog?city='+cid),nm=n=>c.products.find(p=>p.id===cakesId(n)).names.ru;
  assert.deepEqual([nm(12),nm(13),nm(6)],['Рыжик','Президент','Виагра']);
  const pz=c.products.filter(p=>p.category==='rf_pizza'&&p.price===3000);assert.equal(pz.length,4);assert.ok(pz.every(p=>p.price===3000&&p.profile.mode==='EACH'&&!('cost'in p)&&/35/.test(p.names.ru)&&p.names.hy&&p.names.ka&&p.vendor_id==='akhalkalaki-vypechka'));
  const row=await DB.prepare('SELECT cost FROM products WHERE id=?').bind(pizzaId(1)).first();assert.equal(row.cost,2500);
  for(const [n] of pizzas)assert.ok(fs.existsSync(new URL('../public/media/'+pizzaArt(n)+'.jpg',import.meta.url)),String(n));
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),i18n=fs.readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');assert.ok(app.includes("['readyfood',['rf_pizza'"));assert.equal((i18n.match(/group_readyfood:/g)||[]).length,3)}finally{DB.close()}});

test('owner 11.11: whole cake «Пламя» 22 cm 35 → 45 ₾, lahmajo 4 → 5,50 ₾, pickup names Vovi\'s confectionery; migration 0105 equals the generator',async()=>{const fs=await import('node:fs'),{food1111cSql,flame,lahmajo}=await import('../src/food-1111c.mjs'),{cakesId,cakesArt}=await import('../src/vypechka.mjs'),{pizzaId,pizzaArt}=await import('../src/food-1111b.mjs');
 assert.ok(fs.readFileSync(new URL('../migrations/0105_flame_lahmajo_pickup.sql',import.meta.url),'utf8').endsWith(food1111cSql().join('\n')+'\n'));
 const DB=new LocalD1();migrate(DB);await seed(DB);const e={DB};try{const c=await call(e,'catalog?city='+cid),f=c.products.find(p=>p.id===cakesId(flame.n)),l=c.products.find(p=>p.id===pizzaId(lahmajo.n));
  assert.deepEqual([f.price,f.category,f.names.ru],[4500,'cakes','Пламя, 22 см']);assert.deepEqual([l.price,l.category],[550,'rf_pizza']);assert.ok(l.names.hy&&l.names.ka);
  const r=await DB.prepare('SELECT cost FROM products WHERE id IN (?,?) ORDER BY id').bind(cakesId(flame.n),pizzaId(lahmajo.n)).all();assert.deepEqual(r.results.map(x=>x.cost),[3500,400]);
  const v=await DB.prepare('SELECT pickup FROM vendors WHERE id=?').bind('akhalkalaki-vypechka').first();assert.match(JSON.parse(v.pickup).ru,/кондитерская Вови, у рынка/);
  for(const a of [cakesArt(flame.n),pizzaArt(lahmajo.n)])assert.ok(fs.existsSync(new URL('../public/media/'+a+'.jpg',import.meta.url)),a)}finally{DB.close()}});

test('owner 11.11: «Ламаджо» as the owner writes it; migration 0106 equals the generator',async()=>{const fs=await import('node:fs'),{food1111dSql}=await import('../src/food-1111d.mjs');
 assert.ok(fs.readFileSync(new URL('../migrations/0106_lamajo_name.sql',import.meta.url),'utf8').endsWith(food1111dSql().join('\n')+'\n'));
 const DB=new LocalD1();migrate(DB);await seed(DB);try{const c=await call({DB},'catalog?city='+cid);assert.equal(c.products.find(p=>p.id==='akhalkalaki--rf_pizza_05').names.ru,'Ламаджо');assert.match(c.categories.find(k=>k.id==='rf_pizza').names.ru,/ламаджо/)}finally{DB.close()}});

test('owner 11.11: village delivery prices sit behind one «Стоимость доставки» button, in three languages',async()=>{const fs=await import('node:fs'),app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),i18n=fs.readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');
 assert.ok(app.includes('<details class="terms-line area-line"><summary>'));for(const k of ['deliveryPrices','areaIntro'])assert.equal((i18n.match(new RegExp(k+':','g'))||[]).length,3,k)});

test('owner 11.11: «Выпечка с любовью» 9:00–20:00, pizza 25 min and lamajo 20 min on the card, still priced and orderable; migration 0107 equals the generator',async()=>{const fs=await import('node:fs'),{food1111eSql}=await import('../src/food-1111e.mjs'),{priceBasket,vendorWindow}=await import('../src/commerce.mjs');
 assert.ok(fs.readFileSync(new URL('../migrations/0107_vypechka_hours_prep.sql',import.meta.url),'utf8').endsWith(food1111eSql().join('\n')+'\n'));{const {food1111fSql}=await import('../src/food-1111e.mjs');assert.ok(fs.readFileSync(new URL('../migrations/0108_khachapuri_prep.sql',import.meta.url),'utf8').endsWith(food1111fSql().join('\n')+'\n'))}
 const DB=new LocalD1();migrate(DB);await seed(DB);try{const v=await DB.prepare('SELECT open_minute,close_minute FROM vendors WHERE id=?').bind('akhalkalaki-vypechka').first();assert.deepEqual([v.open_minute,v.close_minute],[540,1200]);
  assert.deepEqual(await vendorWindow(DB,['akhalkalaki-vypechka']),{from:600,to:1180});
  const c=await call({DB},'catalog?city='+cid),pm=id=>c.products.find(p=>p.id===id).profile.prep_minutes;assert.deepEqual(['01','02','03','04','05'].map(n=>pm('akhalkalaki--rf_pizza_'+n)),[25,25,25,25,20]);
  const b=await priceBasket(DB,{city_id:cid,items:[{product_id:'akhalkalaki--rf_pizza_02',selection:{count:2}},{product_id:'akhalkalaki--rf_pizza_05',selection:{count:1}}]});assert.equal(b.estimate_minor,2*3000+550);
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),i18n=fs.readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');assert.ok(app.includes("t('prepTime')"));assert.equal((i18n.match(/prepTime:/g)||[]).length,3)}finally{DB.close()}});

test('owner 11.11: ready food is ordered until 19:30 and delivered up to the supplier closing (20:00); other goods keep 9–18',async()=>{const {readyOpen,hoursOpen,readyFoodTo,isReadyCat}=await import('../src/order-hours.mjs'),{slots}=await import('../src/commerce.mjs'),fs=await import('node:fs');
 const was=process.env.BAZAR_IGNORE_ORDER_HOURS;delete process.env.BAZAR_IGNORE_ORDER_HOURS;try{const h={from:540,to:1080};assert.equal(readyFoodTo,1170);
  assert.deepEqual([1079,1080,1150,1169,1170].map(m=>hoursOpen(h,m)),[true,false,false,false,false]);assert.deepEqual([539,1079,1080,1169,1170].map(m=>readyOpen(h,m)),[false,true,true,true,false])}finally{if(was!==undefined)process.env.BAZAR_IGNORE_ORDER_HOURS=was}
 assert.ok(isReadyCat('rf_pizza')&&isReadyCat('cakes')&&!isReadyCat('household'));
 const DB=new LocalD1();migrate(DB);await seed(DB);try{const day=new Date(Date.now()+86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Tbilisi'}),last=a=>Math.max(...a.slots.map(s=>s.minute));
  assert.equal(last(await slots(DB,cid,day,'akhalkalaki--rf_pizza_02,akhalkalaki--rf_pizza_05')),1200,'pizza alone: 20:00');
  assert.equal(last(await slots(DB,cid,day,'akhalkalaki--rf_pizza_02,akhalkalaki--cakes_01')),1200,'owner 11.11: cakes count as evening food');assert.ok(last(await slots(DB,cid,day,'akhalkalaki--rf_pizza_02,akhalkalaki--artur_hh_160'))<=1180,'with other goods: the usual gap before closing');
  const c=await call({DB},'catalog?city='+cid);assert.equal(c.city.ready_to,1170);
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),i18n=fs.readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');assert.ok(app.includes('ordersOpen(basketReady())'));for(const k of ['readyEvening','readyOnlyNow'])assert.equal((i18n.match(new RegExp(k+':','g'))||[]).length,3,k)}finally{DB.close()}});

test('owner 12.11: a copy served by a Cloudflare Worker (bazar.xugushik.workers.dev) uses its own API; only the GitHub copy follows deployment.json',async()=>{const fs=await import('node:fs'),app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.ok(app.includes("if(u.origin!==location.origin&&!location.hostname.endsWith('.workers.dev'))apiBase=u.origin"))});

test('owner 13.11: migration 0110 leaves «Выпечка с любовью» on sale except Тарталетка, Капучино and «Пламя»',async()=>{const fs=await import('node:fs'),DB=new LocalD1();migrate(DB);await seed(DB);try{
 const ids=(await DB.prepare("SELECT id FROM products WHERE vendor_id='akhalkalaki-vypechka'").all()).results.map(r=>r.id),three=['akhalkalaki--cakes_05','akhalkalaki--cakes_10','akhalkalaki--cakes_14'];
 for(const id of ids.filter(i=>!three.includes(i)))DB.exec(`INSERT INTO day_closures(product_id,day,vendor_id,closed_by,at) VALUES('${id}','9999-12-31','akhalkalaki-vypechka','x','t')`);   // the state found on 13.11
 DB.exec(fs.readFileSync(new URL('../migrations/0110_vypechka_fix_closures.sql',import.meta.url),'utf8'));
 const c=await call({DB},'catalog?city='+cid),on=c.products.filter(p=>p.vendor_id==='akhalkalaki-vypechka').map(p=>p.id);
 assert.equal(on.length,ids.length-3);assert.ok(three.every(id=>!on.includes(id)));assert.ok(on.includes('akhalkalaki--rf_pizza_02')&&on.includes('akhalkalaki--rf_pizza_05'))}finally{DB.close()}});
