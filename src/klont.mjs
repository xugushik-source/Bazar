// «Клонт», Ахалкалаки: мёд (owner 22.10). Sold in 1 kg jars, bought at 25 ₾ and sold at 32 ₾ a jar; replaces the demo 500 g jar.
export const klontVendor={id:'akhalkalaki-klont',city_id:'akhalkalaki',names:{ru:'Клонт',hy:'Կլոնտ',ka:'კლონტი'}};
// [key, ru, hy, ka, category, art, profile, sale price, cost] — tetri per jar
export const klontProducts=[
 ['honey_chestnut_jar_1kg','Мёд каштановый · банка 1 кг','Շագանակի մեղր · 1 կգ տարա','წაბლის თაფლი · ქილა 1 კგ','market','honey','pack',3200,2500],
 ['honey_linden_jar_1kg','Мёд липовый · банка 1 кг','Լորենու մեղր · 1 կգ տարա','ცაცხვის თაფლი · ქილა 1 კგ','market','honey-linden','pack',3200,2500]
];
export const klontPacks=Object.fromEntries(klontProducts.map(r=>[r[0],1000]));
export const klontRetired=['honey_jar_500g'];
export const klontProfiles=Object.fromEntries(klontProducts.map(r=>[r[0],r[6]]));
export const klontArts=klontProducts.map(r=>r[5]);
export const klontArtsWithoutPhoto=[];
export function klontSql(profileFor){const v=klontVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...klontRetired.map(key=>`UPDATE products SET active=0,version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND active=1;`),
  ...klontProducts.map(([key,ru,hy,ka,category,art,,price,cost])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profileFor(key))},${price},${cost},50 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 22.10, later: chestnut honey sells at 35 ₾ (cost unchanged).
export const klontPrices={honey_chestnut_jar_1kg:3500};
export function klontPriceSql(){const v=klontVendor,cost=Object.fromEntries(klontProducts.map(r=>[r[0],r[8]]));return Object.entries(klontPrices).map(([key,price])=>`UPDATE products SET price=${price},version=version+1 WHERE id='${v.city_id}--${key}' AND vendor_id='${v.id}' AND cost=${cost[key]} AND price<>${price};`)}
