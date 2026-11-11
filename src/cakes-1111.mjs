// Owner 11.11: real names and prices for «Выпечка с любовью». Закуп 2,50 ₾ → продажа 3,50 ₾ (+1 ₾); Финиковый и Бакинская гата:
// закуп 3 ₾ → продажа 4 ₾. Names are brand names, not translated (owner 10.11), so one name serves all three languages.
// «Шоколадница» is a duplicate of a cake already loaded (owner: «дубли не нужны»); №15 of the owner's list has no name yet.
import {cakesId,cakesArt,cakesVendor,cakesCategory}from './vypechka.mjs';
export const cakeNames=[[1,'Чёрный жемчуг'],[2,'Финиковый'],[3,'Славянка'],[4,'Анжелика'],[5,'Тарталетка'],[6,'Маренго'],[7,'Муравейник'],[8,'Бакинская гата'],
 [9,'Спартак'],[10,'Капучино'],[11,'Птичка'],[12,'Ключик'],[13,'Рыжик']];
export const cakeCost=n=>[2,8].includes(n)?300:250,cakePrice=n=>cakeCost(n)+100;
export function cakes1111Sql(list=cakeNames){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),prof=j({mode:'EACH',policy_version:1});
 return list.map(([n,name])=>{const names=j({ru:name,hy:name,ka:name});
  return n<=8?`UPDATE products SET names=${names},profile=${prof},price=${cakePrice(n)},cost=${cakeCost(n)},active=1,version=version+1 WHERE id=${s(cakesId(n))} AND vendor_id=${s(cakesVendor.id)} AND (names<>${names} OR profile<>${prof} OR price<>${cakePrice(n)} OR cost IS NOT ${cakeCost(n)} OR active<>1);`
   :`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock,active) SELECT ${s(cakesId(n))},${s(cakesVendor.id)},${names},${s(cakesCategory.id)},${s(cakesArt(n))},${prof},${cakePrice(n)},${cakeCost(n)},100,1 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(cakesVendor.id)}) ON CONFLICT(id) DO NOTHING;`})}
