// Owner 11.11 (late): whole cake «Пламя», 22 cm — закуп 35 ₾, продажа 45 ₾ (owner's own price). Lahmajo — закуп 4 ₾,
// продажа 5,50 ₾ (owner's own price), with the pizza and khachapuri. Pickup for «Выпечка с любовью» names the shop by Vovi's
// confectionery at the market.
import {cakesId,cakesArt,cakesVendor,cakesCategory}from './vypechka.mjs';import {pickups}from './pickup.mjs';import {pizzaId,pizzaArt}from './food-1111b.mjs';
export const flame={n:14,names:{ru:'Пламя, 22 см',hy:'Пламя, 22 սմ',ka:'Пламя, 22 სმ'},cost:3500,price:4500};
export const lahmajo={n:5,names:{ru:'Лахмаджо',hy:'Լահմաջո',ka:'ლაჰმაჯო'},cost:400,price:550};
export const pizzaCategory2=['rf_pizza',{ru:'Готовая еда: пицца, хачапури, лахмаджо',hy:'Պատրաստի սնունդ՝ պիցցա, խաչապուրի, լահմաջո',ka:'მზა საჭმელი: პიცა, ხაჭაპური, ლაჰმაჯო'}];
export const vypechkaPickup={ru:'Мясникяна, 16 — кондитерская Вови, у рынка',hy:'Մյասնիկյան 16 — Վովիի հրուշակեղենի խանութ, շուկայի մոտ',ka:'მიასნიკიანის 16 — ვოვის საკონდიტრო, ბაზართან'};
// Today's pickups: the seed runs 0102 with these, so a reseed does not flip the address back.
export const pickupsNow=()=>({...pickups,[cakesVendor.id]:vypechkaPickup});
export function food1111cSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),prof=j({mode:'EACH',policy_version:1}),v=s(cakesVendor.id);
 return [`UPDATE vendors SET pickup=${j(vypechkaPickup)} WHERE id=${v} AND (pickup IS NULL OR pickup<>${j(vypechkaPickup)});`,
  `UPDATE categories SET names=${j(pizzaCategory2[1])} WHERE id=${s(pizzaCategory2[0])};`,
  `INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock,active) SELECT ${s(cakesId(flame.n))},${v},${j(flame.names)},${s(cakesCategory.id)},${s(cakesArt(flame.n))},${prof},${flame.price},${flame.cost},100,1 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${v}) ON CONFLICT(id) DO NOTHING;`,
  `INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock,active) SELECT ${s(pizzaId(lahmajo.n))},${v},${j(lahmajo.names)},'rf_pizza',${s(pizzaArt(lahmajo.n))},${prof},${lahmajo.price},${lahmajo.cost},100,1 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${v}) ON CONFLICT(id) DO NOTHING;`]}
