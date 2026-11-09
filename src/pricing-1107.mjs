// Owner 07.11: new money rules.
// • Markups on cost: meat of Amo and Artur +20 %; sweets, dairy and Belarusian goods +20 %; alcohol +15 %; Karo fruit and
//   vegetables stay +25 %; everything else keeps its markup. Rounded up to 10 tetri (tierRetail). The same groups price a
//   new cost from the supplier bot (src/price-rules.mjs). A markup only lifts a price to the group's level — prices already
//   above it (Artur's rabbit, MADO alcohol, cheap brandy) are not lowered.
// • Delivery: town 5 ₾, free from 100 ₾; «1 Городок» 7 ₾, free from 150 ₾ (src/zones.mjs). The free first delivery is over
//   (the offer ended on 05.11). Couriers: 5 ₾ + 2 ₾ for each further shop.
// • Karo: pink kishmish goes, grapes «Дамский пальчик» come in at 5 ₾/kg cost (+25 % → 6.30 ₾).
const MEAT_VENDORS=['akhalkalaki-amo','akhalkalaki-artur'];
export function groupPct(p){if(p.vendor_id==='akhalkalaki-karo')return null;
 if(p.category==='meat'&&MEAT_VENDORS.includes(p.vendor_id))return 20;
 if(['sweets','dairy','belarus'].includes(p.category))return 20;
 if(p.category==='alcohol')return 15;return null}
const retailExpr=pct=>`((CAST(ROUND(cost*${100+pct}/100.0) AS INTEGER)+9)/10)*10`;
export function markupSql(){const g=[["category='meat' AND vendor_id IN ('akhalkalaki-amo','akhalkalaki-artur')",20],["category IN ('sweets','dairy','belarus') AND vendor_id<>'akhalkalaki-karo'",20],["category='alcohol' AND vendor_id<>'akhalkalaki-karo'",15]];
 return g.map(([w,pct])=>`UPDATE products SET price=${retailExpr(pct)},version=version+1 WHERE ${w} AND cost>0 AND price<${retailExpr(pct)};`)}
const s=x=>"'"+String(x).replaceAll("'","''")+"'";
export const ladyfinger={id:'akhalkalaki--grapes_ladyfinger_loose',names:{ru:'Виноград «Дамский пальчик»',hy:'Խաղող «Կանանց մատիկ»',ka:'ყურძენი „ქალის თითი“'},art:'grapes-ladyfinger',cost:500,price:630};
export function grapesSql(){const k='akhalkalaki--grapes_kishmish_pink_loose',l=ladyfinger;
 return [`INSERT INTO products(id,vendor_id,names,category,art,profile,price,stock,cost) SELECT ${s(l.id)},vendor_id,${s(JSON.stringify(l.names))},category,${s(l.art)},profile,${l.price},stock,${l.cost} FROM products WHERE id=${s(k)} ON CONFLICT(id) DO NOTHING;`,
  `UPDATE products SET active=0,version=version+1 WHERE id=${s(k)} AND active=1;`]}
export const deliverySql=()=>["UPDATE cities SET delivery_fee=500,free_delivery_from=10000,first_order_free=0 WHERE id='akhalkalaki';"];
export const pricingSql=()=>[...grapesSql(),...markupSql(),...deliverySql()];
