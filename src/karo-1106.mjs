// Owner 06.11. Karo is the only fruit supplier: the demo suppliers («Сад Базара», «Ферма Базара») are hidden; their oranges
// and strawberries move to Karo. Costs from the shelf price cards (video 05.11). Karo retail: fruit, vegetables and berries
// +25 % on the cost, everything else Karo sells +20 % (up to 10 tetri); today's price stays only while it is between that and
// 30 % above the cost. Cherry tomatoes added; dark tomatoes hidden; pitahaya and strawberries hidden until the owner's price.
// Applied once per product: the marker keeps the price the older rules leave, so a later owner or supplier price is kept.
import {karoVendor}from './karo.mjs';
const C=karoVendor.city_id,V=karoVendor.id,id=k=>`'${C}--${k}'`,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
export const karoCosts1106=[['tomato_loose',600,700],['tomato_light_loose',400,500],['tomato_dark_loose',400,500],['aubergine_loose',300,400],['cucumber_loose',400,500],['chili_green_loose',500,800],['apple_loose',400,500],['grapefruit_loose',600,400]];
export const karoMark1106='CATALOG: owner 06.11 Karo markup';
const pct="CASE WHEN category IN ('fruit','vegetables','berries') THEN 125 ELSE 120 END",retail=`((((cost*${pct}+50)/100)+9)/10)*10`;
const weighed={mode:'WEIGHED',policy_version:1,minimum_g:1000,order_step_g:200,tolerance_bps:1000,tolerance_cap_g:200};
export const karoNew1106=[['tomato_cherry_loose','Помидоры черри','Չերի լոլիկ','ჩერი პომიდორი','vegetables','tomato-cherry',weighed,1000,1],
 ['pitahaya_each','Питахайя (драконий фрукт)','Պիտահայա (վիշապի միրգ)','პიტაია (დრაკონის ხილი)','fruit','pitahaya',{mode:'EACH',policy_version:1},null,0]];
export function karoCost1106Sql(){return [
 // the demo suppliers' oranges and strawberries are Karo's; the rest of the demo goes away
 `UPDATE products SET vendor_id='${V}',cost=600,price=750,version=version+1 WHERE id=${id('orange_loose')} AND vendor_id='${C}-garden';`,
 `UPDATE products SET vendor_id='${V}',art='strawberry-fresh',active=0,version=version+1 WHERE id=${id('strawberry_pack_250g')} AND vendor_id='${C}-garden';`,
 `UPDATE products SET active=0,version=version+1 WHERE vendor_id IN ('${C}-garden','${C}-farm') AND active=1;`,
 `UPDATE products SET active=0,version=version+1 WHERE id=${id('tomato_dark_loose')} AND active=1;`,
 ...karoNew1106.map(([key,ru,hy,ka,category,art,profile,cost,active])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock,active) SELECT ${id(key)},'${V}',${j({ru,hy,ka})},'${category}','${art}',${j(profile)},${cost?Math.ceil(Math.round(cost*125/100)/10)*10:0},${cost??'NULL'},100000,${active} WHERE EXISTS(SELECT 1 FROM vendors WHERE id='${V}') ON CONFLICT(id) DO NOTHING;`),
 ...karoCosts1106.map(([key,old,cost])=>`UPDATE products SET cost=${cost},version=version+1 WHERE id=${id(key)} AND vendor_id='${V}' AND cost=${old};`),
 `INSERT INTO inventory(id,product_id,at,actor,delta,reason) SELECT 'k1106-'||id,id,'2026-11-06T00:00:00.000Z','owner',price,'${karoMark1106}' FROM products WHERE vendor_id='${V}' AND cost>0 ON CONFLICT(id) DO NOTHING;`,
 `UPDATE products SET price=${retail},version=version+1 WHERE vendor_id='${V}' AND cost>0 AND price=(SELECT delta FROM inventory WHERE id='k1106-'||products.id) AND (price*100>cost*130 OR price<${retail});`]}
// The 04.11 +25 % rule marked the cherry tomatoes too (they arrived after it) and raised 12.50 to 15.70 on the live site.
// Its marker for them is made unusable and the price goes back to +25 % on the cost.
export function karoCherryFixSql(){const c=id('tomato_cherry_loose');return [
 `INSERT INTO inventory(id,product_id,at,actor,delta,reason) SELECT 'fv25-'||id,id,'2026-11-06T00:00:00.000Z','owner',-1,'CATALOG: owner 04.11 fruit/veg +25%' FROM products WHERE id=${c} ON CONFLICT(id) DO UPDATE SET delta=-1;`,
 `UPDATE products SET price=1250,version=version+1 WHERE id=${c} AND cost=1000 AND price=1570;`]}
