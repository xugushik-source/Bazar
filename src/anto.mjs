// «Анто», Ахалкалаки: бастурма and its house goods (owner 31.10). Prices: cost = Anto's price to us, sale = Anto's own shop
// price + 10% («мы доставляем домой»). Works 09:00–18:00. Basturma and sujuk are weighed, from 500 g; pastila by the kilo;
// tkemali red and yellow, 0,5 l bottles. Tsitsak, jonjoli and the glass of spices wait for their units and prices.
export const antoVendor={id:'akhalkalaki-anto',city_id:'akhalkalaki',names:{ru:'Анто',hy:'Անտո',ka:'ანტო'}};
export const antoHours={open_minute:540,close_minute:1080};
const weighed=min=>({mode:'WEIGHED',policy_version:1,minimum_g:min,order_step_g:100,tolerance_bps:1000,tolerance_cap_g:200});
const each={mode:'EACH',policy_version:1};
// [key, ru, hy, ka, category, art, profile, sale (tetri per kg or per item), cost, has photo]
export const antoProducts=[
 ['anto_basturma','Бастурма','Բաստուրմա','ბასტურმა','deli','anto-basturma',weighed(500),6600,5500,true],
 ['anto_sujuk','Суджук','Սուջուխ','სუჯუხი','deli','anto-sujuk',weighed(500),2750,2000,true],
 ['anto_pastila','Пастила','Պաստեղ','ტყლაპი','market','anto-pastila',weighed(200),1650,1300,false],
 ['anto_tkemali_red','Ткемали красный · 0,5 л','Տկեմալի կարմիր · 0,5 լ','ტყემალი წითელი · 0,5 ლ','preserves','anto-tkemali-red',each,550,400,false],
 ['anto_tkemali_yellow','Ткемали жёлтый · 0,5 л','Տկեմալի դեղին · 0,5 լ','ტყემალი ყვითელი · 0,5 ლ','preserves','anto-tkemali-yellow',each,550,400,false]
];
export const antoArts=antoProducts.map(r=>r[5]);
export const antoArtsWithoutPhoto=antoProducts.filter(r=>!r[9]).map(r=>r[5]);
export function antoSql(){const v=antoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  `UPDATE vendors SET open_minute=${antoHours.open_minute},close_minute=${antoHours.close_minute} WHERE id=${s(v.id)} AND (open_minute IS NOT ${antoHours.open_minute} OR close_minute IS NOT ${antoHours.close_minute});`,
  ...antoProducts.map(([key,ru,hy,ka,category,art,profile,price,cost])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profile)},${price},${cost},${profile.mode==='WEIGHED'?100000:100} WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
