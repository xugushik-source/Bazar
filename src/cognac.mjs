// Owner 24.10: Ararat brandy bought from Amo and Noy brandy from Garri Vilikovich (cost as in the owner's Pivka sheet).
// Sale price = cost +20%, +10% on the very dear ones (cost from 200 ₾), rounded up to 10 tetri.
import {tierRetail}from './karo.mjs';import {amoVendor}from './amo.mjs';
export const garriVendor={id:'akhalkalaki-garri',city_id:'akhalkalaki',names:{ru:'Гарри Виликович',hy:'Գարրի Վիլիկովիչ',ka:'გარი ვილიკოვიჩი'}};
export const cognacPct=cost=>cost>=20000?10:20;
const C={ru:'Коньяк',hy:'Կոնյակ',ka:'კონიაკი'},L={ru:'л',hy:'լ',ka:'ლ'};
const vol=v=>v.replace('.',',');
const glasses=n=>({ru:` + ${n} стакана`,hy:` + ${n} բաժակ`,ka:` + ${n} ჭიქა`});
const Q={ru:['«','»'],hy:['«','»'],ka:['„','“']};
const nm=([ru,hy,ka],v,extra={ru:'',hy:'',ka:''})=>Object.fromEntries(['ru','hy','ka'].map((l,i)=>[l,`${C[l]} ${Q[l][0]}${[ru,hy,ka][i]}${Q[l][1]}${v?` ${vol(v)} ${L[l]}`:''}${extra[l]}`]));
const AR=['Арарат','Արարատ','არარატი'],A3=['Арарат 3*','Արարատ 3*','არარატი 3*'],A5=['Арарат 5*','Արարատ 5*','არარატი 5*'],ANI=['Арарат Ани','Արարատ Անի','არარატი ანი'],AKH=['Арарат Ахтамар','Արարատ Ախթամար','არარატი ახთამარი'];
// [key, vendor, names, art, cost in tetri, photo (Pivka catalogue file or another art to reuse)]
export const cognacs=[
 ['ararat3_050','amo',nm(A3,'0.5'),'ararat3-050',3100,'pivka:ararat-3-050.jpg'],
 ['ararat3_070','amo',nm(A3,'0.7'),'ararat3-070',4400,'pivka:ararat-3-050.jpg'],
 ['ararat5_005','amo',nm(A5,'0.05'),'ararat5-005',1000,'pivka:ararat-5-050.jpg'],
 ['ararat5_020','amo',nm(A5,'0.2'),'ararat5-020',2200,'pivka:ararat-5-050.jpg'],
 ['ararat5_050','amo',nm(A5,'0.5'),'ararat5-050',4500,'pivka:ararat-5-050.jpg'],
 ['ararat5_070','amo',nm(A5,'0.7'),'ararat5-070',5700,'pivka:ararat-5-050.jpg'],
 ['ararat5_100','amo',nm(A5,'1'),'ararat5-100',8000,'pivka:ararat-5-050.jpg'],
 ['ararat5_070_gift','amo',nm(A5,'0.7',glasses(3)),'ararat5-070-gift',8500],
 ['ani_005','amo',nm(ANI,'0.05'),'ararat-ani-005',1100],
 ['ani_050','amo',nm(ANI,'0.5'),'ararat-ani-050',6000],
 ['ani_070_gift','amo',nm(ANI,'0.7',glasses(2)),'ararat-ani-070-gift',13000],
 ['akhtamar_005','amo',nm(AKH,'0.05'),'ararat-akhtamar-005',1700,'pivka:ararat-akhtamar-10-050.jpg'],
 ['akhtamar_020','amo',nm(AKH,'0.2'),'ararat-akhtamar-020',3400,'pivka:ararat-akhtamar-10-050.jpg'],
 ['akhtamar_050','amo',nm(AKH,'0.5'),'ararat-akhtamar-050',8800,'pivka:ararat-akhtamar-10-050.jpg'],
 ['akhtamar_070','amo',nm(AKH,'0.7'),'ararat-akhtamar-070',11000,'pivka:ararat-akhtamar-10-050.jpg'],
 ['akhtamar_070_gift','amo',nm(AKH,'0.7',glasses(2)),'ararat-akhtamar-070-gift',15500],
 ['vaspurakan_050','amo',nm(['Арарат Васпуракан','Արարատ Վասպուրական','არარატი ვასპურაკანი'],'0.5'),'ararat-vaspurakan-050',20000],
 ['vaspurakan_070','amo',nm(['Арарат Васпуракан','Արարատ Վասպուրական','არარატი ვასპურაკანი'],'0.7'),'ararat-vaspurakan-070',22000],
 ['nairi_050','amo',nm(['Арарат Наири','Արարատ Նաիրի','არარატი ნაირი'],'0.5'),'ararat-nairi-050',26000],
 ['nairi_070','amo',nm(['Арарат Наири','Արարատ Նաիրի','არარატი ნაირი'],'0.7'),'ararat-nairi-070',31500],
 ['nairi_070_gift','amo',nm(['Арарат Наири','Արարատ Նաիրի','არარატი ნაირი'],'0.7',glasses(2)),'ararat-nairi-070-gift',36000],
 ['dvin_070','amo',nm(['Арарат Двин','Արարատ Դվին','არარატი დვინი'],'0.7'),'ararat-dvin-070',23000],
 ['otborny_070','amo',nm(['Арарат Отборный','Արարատ Ընտրյալ','არარატი რჩეული'],'0.7'),'ararat-otborny-070',14000],
 ['armenia_070','amo',nm(['Арарат Армения','Արարատ Հայաստան','არარატი სომხეთი'],'0.7'),'ararat-armenia-070',15000],
 ['ararat_apricot','amo',nm(['Арарат Абрикос','Արարատ Ծիրան','არარატი გარგარი']),'ararat-apricot',5800],
 ['ararat_coffee','amo',nm(['Арарат Кофе','Արարատ Սուրճ','არარატი ყავა']),'ararat-coffee',5800],
 ['aznavour','amo',nm(['Шарль Азнавур','Շառլ Ազնավուր','შარლ აზნავური']),'ararat-aznavour',63000],
 ['erebuni30','amo',nm(['Арарат Эребуни 30 лет','Արարատ Էրեբունի 30 տարի','არარატი ერებუნი 30 წელი']),'ararat-erebuni-30',200000],
 ['noy3_050','garri',nm(['Ной 3 года','Նոյ 3 տարի','ნოი 3 წელი'],'0.5'),'noy3-050',3000,'pivka:noy-3-050.jpg'],
 ['noy5_050','garri',nm(['Ной 5 лет','Նոյ 5 տարի','ნოი 5 წელი'],'0.5'),'noy5-050',4500,'pivka:noy-5-050.jpg'],
 ['noy10_050','garri',nm(['Ной 10 лет','Նոյ 10 տարի','ნოი 10 წელი'],'0.5'),'noy10-050',9000,'pivka:noy-10-050.jpg']
];
const vendorOf=k=>k==='garri'?garriVendor:amoVendor;
export const cognacPrice=cost=>tierRetail(cost,cognacPct(cost));
// Owner 24.10: for a while the very dear bottles (cost from 200 ₾) were marked as delivered by the supplier (migration 0048);
// later the owner explained Amo only distributes Ararat — the courier collects them like any goods (migration 0049).
export const cognacBySupplier=cost=>cost>=20000;
export const cognacProfiles=Object.fromEntries(cognacs.map(r=>[r[0],'each']));
export const cognacArts=cognacs.map(r=>r[3]);
export const cognacArtsWithoutPhoto=cognacs.filter(r=>!r[5]).map(r=>r[3]);
export function cognacSql(profileFor){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),g=garriVendor;
 return [`INSERT INTO vendors(id,city_id,names) SELECT ${s(g.id)},${s(g.city_id)},${j(g.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(g.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...cognacs.map(([key,vk,names,art,cost])=>{const v=vendorOf(vk);return `INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j(names)},'alcohol',${s(art)},${j({mode:'EACH',policy_version:1})},${cognacPrice(cost)},${cost},50 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id='alcohol') ON CONFLICT(id) DO NOTHING;`})]}
export function cognacSupplierSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));return cognacs.filter(r=>cognacBySupplier(r[4])).map(([key,vk])=>{const v=vendorOf(vk),p={mode:'EACH',policy_version:1,supplier_delivers:true};return `UPDATE products SET profile=${j(p)},version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND vendor_id=${s(v.id)} AND profile<>${j(p)};`})}
export function cognacCourierSql(profileFor){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));return cognacs.filter(r=>cognacBySupplier(r[4])).map(([key,vk])=>{const v=vendorOf(vk),p=profileFor(key);return `UPDATE products SET profile=${j(p)},version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND vendor_id=${s(v.id)} AND profile<>${j(p)};`})}
