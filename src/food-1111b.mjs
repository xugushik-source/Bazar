// Owner 11.11 (evening): cake names fixed by photo — the photo shown as «Ключик» is «Рыжик», the one shown as «Рыжик» is
// «Президент», «Маренго» is «Виагра». First ready food from «Выпечка с любовью»: three pizzas and khachapuri, all 35 cm,
// закуп 25 ₾ → продажа +20 % = 30 ₾ (owner chose +20 %). Khachapuri sits with the pizza, so the subsection is renamed.
import {cakesId,cakesVendor}from './vypechka.mjs';import {cakeNames}from './cakes-1111.mjs';
export const cakeRenames=[[12,'Рыжик'],[13,'Президент'],[6,'Виагра']];
// Today's names: the seed re-runs 0101 with these, so a reseed does not flip «Виагра» back to «Маренго».
export const cakeNamesNow=()=>cakeNames.map(([n,name])=>[n,cakeRenames.find(r=>r[0]===n)?.[1]??name]);
export const pizzaCategory=['rf_pizza',{ru:'Готовая еда: пицца и хачапури',hy:'Պատրաստի սնունդ՝ պիցցա և խաչապուրի',ka:'მზა საჭმელი: პიცა და ხაჭაპური'}];
// [n, ru, hy, ka]
export const pizzas=[
 [1,'Пицца «Ассорти», 35 см','Պիցցա «Ասորտի», 35 սմ','პიცა „ასორტი“, 35 სმ'],
 [2,'Пицца «Пепперони», 35 см','Պիցցա «Պեպպերոնի», 35 սմ','პიცა „პეპერონი“, 35 სმ'],
 [3,'Пицца с курицей и грибами, 35 см','Պիցցա հավով և սնկով, 35 սմ','პიცა ქათმითა და სოკოთი, 35 სმ'],
 [4,'Хачапури, 35 см','Խաչապուրի, 35 սմ','ხაჭაპური, 35 სმ']];
export const pizzaCost=2500,pizzaPrice=3000;
export const pizzaArt=n=>'rf-pizza-'+String(n).padStart(2,'0');
export const pizzaId=n=>cakesVendor.city_id+'--rf_pizza_'+String(n).padStart(2,'0');
export function food1111bSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),prof=j({mode:'EACH',policy_version:1}),v=s(cakesVendor.id);
 return [...cakeRenames.map(([n,name])=>{const names=j({ru:name,hy:name,ka:name});return `UPDATE products SET names=${names},version=version+1 WHERE id=${s(cakesId(n))} AND vendor_id=${v} AND names<>${names};`}),
  `UPDATE categories SET names=${j(pizzaCategory[1])} WHERE id=${s(pizzaCategory[0])};`,
  ...pizzas.map(([n,ru,hy,ka])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock,active) SELECT ${s(pizzaId(n))},${v},${j({ru,hy,ka})},${s(pizzaCategory[0])},${s(pizzaArt(n))},${prof},${pizzaPrice},${pizzaCost},100,1 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${v}) ON CONFLICT(id) DO NOTHING;`)]}
