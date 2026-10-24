// «Мццо», Ахалкалаки: лаваш (owner 24.10). A pack of 5 is bought at 3.20 ₾ and sold at 4 ₾.
export const mtscoVendor={id:'akhalkalaki-mtsco',city_id:'akhalkalaki',names:{ru:'Мццо',hy:'Մցցո',ka:'მცცო'}};
// [key, ru, hy, ka, category, art, profile, sale price, cost] — tetri per pack
export const mtscoProducts=[
 ['lavash_pack_5','Лаваш · 5 штук','Լավաշ · 5 հատ','ლავაში · 5 ცალი','bread','lavash','each',400,320]
];
export const mtscoProfiles=Object.fromEntries(mtscoProducts.map(r=>[r[0],r[6]]));
export const mtscoArts=mtscoProducts.map(r=>r[5]);
export const mtscoArtsWithoutPhoto=[];
export function mtscoSql(profileFor){const v=mtscoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...mtscoProducts.map(([key,ru,hy,ka,category,art,,price,cost])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profileFor(key))},${price},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 24.10, later: Mtsco works 08:00–18:00 — an order with lavash is delivered 09:00–17:40, as for every supplier.
export const mtscoHours={open_minute:480,close_minute:1080};
export function mtscoHoursSql(){return [`UPDATE vendors SET open_minute=${mtscoHours.open_minute},close_minute=${mtscoHours.close_minute} WHERE id='${mtscoVendor.id}' AND (open_minute IS NOT ${mtscoHours.open_minute} OR close_minute IS NOT ${mtscoHours.close_minute});`]}
