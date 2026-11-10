// Owner 10.11: «полный контроль». The owner names the courier (or changes him), presses any stuck step for whoever forgot
// («Готово» for a supplier — the ordered weight stands for the weighed one; «Забрал / Выехал / Доставил» for the courier),
// and a stuck order first reminds the one who has to press (3 min), then the owner (6 min) with the buttons to do it himself.
import {q,parse,action,clock}from './commerce.mjs';import {botWords}from './bot-words.mjs';import {lineCost}from './vendor-ledger.mjs';
export const ctlWords={
 ru:{assign:'🚚 Назначить курьера',reassign:'🔁 Сменить курьера',pick:'Кого назначить на заказ {id}?',onShift:'на смене',none:'В этом городе нет курьеров',assigned:'Заказ {id} назначен: {name}',forReady:'✋ Готово за: {v}',forPickup:'✋ За курьера: забрал',forDepart:'✋ За курьера: выехал',forDeliver:'✋ За курьера: доставил',nudgeSupplier:'⏰ Заказ {id} ждёт вас {m} мин. Взвесьте и нажмите «Готово» (или «Нет»).',nudgeGroup:'⏰ Заказ {id} готов уже {m} мин, а курьера нет. Нажмите «Беру».',nudgeCourier:'⏰ Заказ {id} ждёт вас {m} мин: {step}.',stepPickup:'заберите и нажмите «Забрал»',stepDepart:'нажмите «Выехал»',stepDeliver:'передайте покупателю и нажмите «Передал»'},
 hy:{assign:'🚚 Նշանակել առաքիչ',reassign:'🔁 Փոխել առաքիչին',pick:'Ո՞ւմ նշանակել {id} պատվերին',onShift:'հերթափոխում',none:'Այս քաղաքում առաքիչներ չկան',assigned:'{id} պատվերը նշանակված է՝ {name}',forReady:'✋ Պատրաստ է՝ {v}-ի փոխարեն',forPickup:'✋ Առաքիչի փոխարեն՝ վերցրեց',forDepart:'✋ Առաքիչի փոխարեն՝ ճանապարհ ընկավ',forDeliver:'✋ Առաքիչի փոխարեն՝ առաքեց',nudgeSupplier:'⏰ {id} պատվերը ձեզ է սպասում {m} րոպե։ Կշռեք և սեղմեք «Պատրաստ է» (կամ «Չկա»)։',nudgeGroup:'⏰ {id} պատվերը պատրաստ է արդեն {m} րոպե, իսկ առաքիչ չկա։ Սեղմեք «Վերցնում եմ»։',nudgeCourier:'⏰ {id} պատվերը ձեզ է սպասում {m} րոպե՝ {step}։',stepPickup:'վերցրեք և սեղմեք «Վերցրի»',stepDepart:'սեղմեք «Ճանապարհ ընկա»',stepDeliver:'հանձնեք գնորդին և սեղմեք «Հանձնեցի»'},
 ka:{assign:'🚚 კურიერის დანიშვნა',reassign:'🔁 კურიერის შეცვლა',pick:'ვინ დავნიშნოთ შეკვეთაზე {id}?',onShift:'ცვლაზე',none:'ამ ქალაქში კურიერები არ არიან',assigned:'შეკვეთა {id} დაენიშნა: {name}',forReady:'✋ მზადაა — {v}-ის ნაცვლად',forPickup:'✋ კურიერის ნაცვლად: აიღო',forDepart:'✋ კურიერის ნაცვლად: გავიდა',forDeliver:'✋ კურიერის ნაცვლად: მიიტანა',nudgeSupplier:'⏰ შეკვეთა {id} გელოდებათ {m} წთ. აწონეთ და დააჭირეთ „მზადაა“ (ან „არ არის“).',nudgeGroup:'⏰ შეკვეთა {id} უკვე {m} წთ მზადაა, კურიერი კი არ არის. დააჭირეთ „ვიღებ“.',nudgeCourier:'⏰ შეკვეთა {id} გელოდებათ {m} წთ: {step}.',stepPickup:'აიღეთ და დააჭირეთ „ავიღე“',stepDepart:'დააჭირეთ „გავედი“',stepDeliver:'გადაეცით მყიდველს და დააჭირეთ „გადავეცი“'}};
const W=l=>ctlWords[l]||ctlWords.ru;
export const ownerActions=['ctl_pick','ctl_assign','force_ready','own_pickup','own_depart','own_deliver'];
const courierStep={READY:'pickup',PICKED_UP:'depart',OUT_FOR_DELIVERY:'deliver'};
export async function driversFor(db,city){const c=clock('Asia/Tbilisi'),list=(await q(db,"SELECT DISTINCT u.id,u.name FROM users u JOIN memberships m ON m.user_id=u.id AND m.role='DRIVER' JOIN vendors v ON v.id=m.vendor_id WHERE u.active=1 AND v.city_id=? ORDER BY u.name",city).all()).results;
 for(const d of list){const s=await q(db,'SELECT * FROM courier_shifts WHERE user_id=? AND city_id=? AND day=?',d.id,city,c.day).first().catch(()=>null);d.on=!!s&&!s.left_at&&(s.mode==='DAY'||s.mode==='HOURS'&&c.minute>=s.start_minute&&c.minute<s.end_minute)}
 return list.sort((a,b)=>b.on-a.on)}
// The owner's control buttons for one order (his order card and the 6-minute reminder). `o` is the order row or its view.
export async function ownerRows(db,l,o,addButton){const w=W(l.lang),rows=[],btn=async(a,label,x={})=>rows.push([await addButton(db,l,o,a,label,x)]);if(['COMPLETED','CANCELLED'].includes(o.status))return rows;
 if(o.fulfillment==='delivery'&&!['PICKED_UP','OUT_FOR_DELIVERY'].includes(o.status))await btn('ctl_pick',o.driver_id?w.reassign:w.assign);
 if(o.confirmed&&['WEIGHING','ASSEMBLING'].includes(o.status))for(const g of(await q(db,"SELECT g.vendor_id,v.names FROM order_groups g JOIN vendors v ON v.id=g.vendor_id WHERE g.order_id=? AND g.status NOT IN('READY','MISSING') ORDER BY v.id",o.id).all()).results){const n=parse(g.names,{});await btn('force_ready',w.forReady.replace('{v}',n[l.lang]||n.ru||g.vendor_id),{vendor_id:g.vendor_id})}
 const step=o.fulfillment==='delivery'&&o.driver_id&&courierStep[o.status];if(step)await btn('own_'+step,w[{pickup:'forPickup',depart:'forDepart',deliver:'forDeliver'}[step]]);
 return rows}
// A courier named by the owner: a dispatcher (taxi firm) is asked in his own chat for the courier's name and the car, as after «Беру».
async function afterAssign(db,env,call,o,driverId){const u=await q(db,'SELECT dispatcher FROM users WHERE id=?',driverId).first();if(!u?.dispatcher)return;const l=await q(db,"SELECT * FROM tg_links WHERE kind='PERSONAL' AND ref_id=? AND active=1",driverId).first();if(!l)return;
 await q(db,'INSERT INTO tg_dialogs(telegram_user,link_id,order_id,version,action,expires,state) VALUES(?,?,?,?,?,?,?) ON CONFLICT(telegram_user) DO UPDATE SET link_id=excluded.link_id,order_id=excluded.order_id,version=excluded.version,action=excluded.action,expires=excluded.expires,state=excluded.state',String(l.chat_id),l.id,o.id,0,'disp_name',Date.now()+3600000,'{}').run();
 await call(env,'sendMessage',{chat_id:l.chat_id,text:(botWords[l.lang]||botWords.ru).dispName.replace('{id}',o.id.slice(-6)),reply_markup:{force_reply:true,selective:true}}).catch(()=>{})}
export async function ownerCallback(db,env,call,addButton,c,l,p,o,user,base){if(!user?.owner)throw Object.assign(new Error('FORBIDDEN'),{code:'FORBIDDEN',status:403});const w=W(l.lang);
 if(p.action==='ctl_pick'){const list=await driversFor(db,o.city_id),kb=[];for(const d of list)kb.push([await addButton(db,l,o,'ctl_assign',(d.on?'🟢 ':'⚪ ')+d.name+(d.on?' · '+w.onShift:''),{driver_id:d.id})]);
  await call(env,'sendMessage',{chat_id:l.chat_id,text:list.length?w.pick.replace('{id}',o.id.slice(-6)):w.none,...(kb.length?{reply_markup:{inline_keyboard:kb}}:{})});return {ok:true}}
 if(p.action==='ctl_assign'){const r=await action(db,{...base,action:'assign',driver_id:p.driver_id},user),d=await q(db,'SELECT name FROM users WHERE id=?',p.driver_id).first();await afterAssign(db,env,call,o,p.driver_id);
  await call(env,'sendMessage',{chat_id:l.chat_id,text:w.assigned.replace('{id}',o.id.slice(-6)).replace('{name}',d?.name||'')}).catch(()=>{});return r}
 return action(db,{...base,action:p.action==='force_ready'?'force_ready':p.action.slice(4)},user)}
// Owner 10.11: the supplier sees the sum to put on his receipt for BAZAR — at our purchase price (cost), never the buyer's price.
// After the owner's «Подтвердить» it is approximate (ordered quantities), after weighing exact.
export const receiptWords={ru:{exact:'🧾 Чек для БАЗАРА: {sum}',approx:'🧾 Чек для БАЗАРА: ≈{sum} (точная сумма — после взвешивания)',unknown:'🧾 Сумму чека уточните у БАЗАРА'},
 hy:{exact:'🧾 Կտրոն ԲԱԶԱՐ-ի համար՝ {sum}',approx:'🧾 Կտրոն ԲԱԶԱՐ-ի համար՝ ≈{sum} (ճշգրիտ գումարը՝ կշռելուց հետո)',unknown:'🧾 Կտրոնի գումարը ճշտեք ԲԱԶԱՐ-ից'},
 ka:{exact:'🧾 ჩეკი ბაზრისთვის: {sum}',approx:'🧾 ჩეკი ბაზრისთვის: ≈{sum} (ზუსტი თანხა — აწონვის შემდეგ)',unknown:'🧾 ჩეკის თანხა დააზუსტეთ ბაზართან'}};
const WEIGHED_MODES=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'];
export async function supplierReceipt(db,order,vendor,lang){const w=receiptWords[lang]||receiptWords.ru,rows=(await q(db,'SELECT line_id,cost,reserved,quote FROM order_lines WHERE order_id=? AND vendor_id=?',order.id,vendor).all()).results;if(!rows.length)return null;
 const done=[].concat(order.actuals||[],order.weighing||[]);let sum=0,exact=true;
 for(const r of rows){const x=parse(r.quote,{}),a=done.find(a=>a.line_id===r.line_id),weighed=WEIGHED_MODES.includes(x.mode);let qty=weighed?(x.mode==='WHOLE_BY_WEIGHT'?x.each_estimate_g*x.count:x.target_g)??r.reserved:x.count??r.reserved;// approximate = what was ordered
  if(a)qty=weighed?(a.each_net_g?a.each_net_g.reduce((n,v)=>n+v,0):a.net_g??qty):a.count??qty;else exact=false;
  const amount=lineCost(x.mode,r.cost,qty);if(amount===null)return w.unknown;sum+=amount}
 return w[exact?'exact':'approx'].replace('{sum}',(sum/100).toFixed(2)+' '+(order.currency||'GEL'))}
