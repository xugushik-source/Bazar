// Owner 10.11: Амо's whole fresh (not frozen) piglet and lamb, slaughtered and cleaned — a pre-order. No price or weight on
// the site («цена уточняется по сезону и по весу»): profile mode REQUEST, price 0, no cost; the buyer writes or calls.
import {amoVendor}from './amo.mjs';
export const amoWhole=[
 ['piglet_fresh_whole','Поросёнок целый, свежий (не замороженный)','Խոճկոր ամբողջական, թարմ (չսառեցված)','გოჭი მთლიანი, ახალი (გაუყინავი)','meat','amo-piglet-fresh'],
 ['lamb_fresh_whole','Ягнёнок целый, свежий','Գառ ամբողջական, թարմ','ბატკანი მთლიანი, ახალი','meat','amo-lamb-whole']];
export const amoWholeArts=amoWhole.map(r=>r[5]);
// Piglet photo from the owner (10.11); the lamb is Wikimedia Commons, Furkan Akkurt, CC BY-SA 4.0.
export const amoWholeArtsWithoutPhoto=[];
export function amoWholeSql(){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return amoWhole.map(([key,ru,hy,ka,category,art])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--amo_'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j({mode:'REQUEST',policy_version:1})},0,NULL,100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)}
