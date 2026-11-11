// Owner 11.11: «Выпечка с любовью» — a new supplier of cakes, pastry and (later) pizza. The owner sends names, weights and prices later,
// so the first eight items (his photos) show «Ожидается» like the household goods: price 0, cost unknown, profile mode SOON, not orderable.
// Names are descriptive of what the photo shows (temporary) — the owner replaces them with the real names.
export const cakesVendor={id:'akhalkalaki-vypechka',city_id:'akhalkalaki',names:{ru:'Выпечка с любовью',hy:'Թխվածք սիրով',ka:'ნამცხვარი სიყვარულით'}};
export const cakesCategory={id:'cakes',names:{ru:'Торты и выпечка',hy:'Տորթեր և թխվածքներ',ka:'ტორტები და ნამცხვრები'},sort:72};
// [n, ru, hy, ka]
export const cakes=[
 [1,'Торт с черносливом и орехами','Տորթ սալորաչիրով և ընկույզով','ტორტი ქლიავითა და თხილით'],
 [2,'Шоколадный торт с кремом и фиником','Շոկոլադե տորթ կրեմով և խուրմայով','შოკოლადის ტორტი კრემითა და ხურმით'],
 [3,'Ореховый пирог с ягодной начинкой','Ընկուզով կարկանդակ հատապտղային միջուկով','თხილის ღვეზელი კენკრის შიგთავსით'],
 [4,'Медовый торт с шоколадной стружкой','Մեղրով տորթ շոկոլադե թեփուկներով','თაფლის ტორტი შოკოლადის ბურბუშელით'],
 [5,'Корзиночка со сливочным кремом','Զամբյուղիկ սերուցքային կրեմով','კალათა ნაღების კრემით'],
 [6,'Шоколадный торт с безе','Շոկոլադե տորթ բեզեով','შოკოლადის ტორტი ბეზეთი'],
 [7,'Хрустящий десерт с шоколадом','Խրթխրթան դեսերտ շոկոլադով','ხრაშუნა დესერტი შოკოლადით'],
 [8,'Слойка с сахарной пудрой','Շերտավոր խմորեղեն շաքարափոշով','ფენოვანი ცომეული ფხვნილი შაქრით']];
export const cakesArt=n=>'cakes-'+String(n).padStart(2,'0');
export const cakesId=n=>cakesVendor.city_id+'--cakes_'+String(n).padStart(2,'0');
export const cakesArtsWithoutPhoto=[];
export function cakesSql(){const v=cakesVendor,c=cakesCategory,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO categories(id,names,sort) VALUES(${s(c.id)},${j(c.names)},${c.sort}) ON CONFLICT(id) DO NOTHING;`,
  `INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...cakes.map(([n,ru,hy,ka])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock,active) SELECT ${s(cakesId(n))},${s(v.id)},${j({ru,hy,ka})},${s(c.id)},${s(cakesArt(n))},${j({mode:'SOON',policy_version:1})},0,NULL,100,1 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) ON CONFLICT(id) DO NOTHING;`)]}
