// «Рафо Вови», Ахалкалаки: радужная форель (owner 22.10). Cost 16 ₾/kg, sale 20 ₾/kg; an order of 10 kg or more is priced
// at 18 ₾/kg for its whole weight (the trout profile's bulk rate). Sold by weight from 1 kg in 500 g steps.
export const rafoVendor={id:'akhalkalaki-rafo-vovi',city_id:'akhalkalaki',names:{ru:'Рафо Вови',hy:'Ռաֆո Վովի',ka:'რაფო ვოვი'}};
// [key, ru, hy, ka, category, art, profile, sale price per kg, cost per kg] — tetri
export const rafoProducts=[
 ['trout_rainbow','Форель радужная','Ծիածանափայլ իշխան','ცისარტყელა კალმახი','trout','trout-rainbow','trout',2000,1600]
];
export const rafoProfiles=Object.fromEntries(rafoProducts.map(r=>[r[0],r[6]]));
export const rafoArts=rafoProducts.map(r=>r[5]);
// The trout profile as migration 0034 inserted it; 0035 adds the 2-hour notice and supplier delivery for wholesale.
const rafoProfileV1={mode:'WEIGHED',policy_version:1,minimum_g:1000,order_step_g:500,tolerance_bps:1000,tolerance_cap_g:200,bulk:{from_g:10000,price_per_kg_minor:1800}};
export function rafoSql(){const v=rafoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...rafoProducts.map(([key,ru,hy,ka,category,art,,price,cost])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(rafoProfileV1)},${price},${cost},100000 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 22.10, later: a wholesale order is placed at least 2 hours ahead and the supplier delivers it himself.
export function rafoProfileSql(profileFor){const v=rafoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));return rafoProducts.map(([key])=>`UPDATE products SET profile=${j(profileFor(key))},version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND vendor_id=${s(v.id)} AND profile<>${j(profileFor(key))};`)}
// Owner 06.11: trout caviar from «Рафо Вови», a 100 g jar: cost 18 ₾, sale 23 ₾ (the owner's own price). Photo supplied by the owner.
export const rafoCaviar=['trout_caviar_100','Икра форели красная, 100 г','Իշխանի կարմիր խավիար, 100 գ','კალმახის წითელი ხიზილალა, 100 გ','trout','rafo-trout-caviar',2300,1800];
export function rafoCaviarSql(){const v=rafoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));const [key,ru,hy,ka,category,art,price,cost]=rafoCaviar;
 return [`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--rafo_'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j({mode:'EACH',policy_version:1})},${price},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`]}
