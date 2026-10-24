// «Мадо»: distributor of Atenk meats, Artashat alcohol and more (owner 24.10). Costs and sale prices are the owner's, as in his
// «Пивка для рывка» price sheet; only items marked «есть» with a known cost. Alcohol is its own section, «Алкоголь 18+».
export const madoVendor={id:'akhalkalaki-mado',city_id:'akhalkalaki',names:{ru:'Мадо',hy:'Մադո',ka:'მადო'}};
export const madoAlcohol={id:'alcohol',names:{ru:'Алкоголь 18+',hy:'Ալկոհոլ 18+',ka:'ალკოჰოლი 18+'},sort:90};
const SK={ru:'сырокопчёная',hy:'հում ապխտած',ka:'ნედლად შებოლილი'},PK={ru:'полукопчёная',hy:'կիսաապխտած',ka:'ნახევრად შებოლილი'};
const kolbasa=(ru,hy,ka,t,brand,g)=>[`Колбаса «${ru}» ${t.ru}${brand?` «${brand[0]}»`:''} ${g} г`,`Երշիկ «${hy}», ${t.hy}${brand?` «${brand[1]}»`:''} ${g} գ`,`ძეხვი „${ka}“, ${t.ka}${brand?` „${brand[2]}“`:''} ${g} გ`];
const G=['Гандзасар','Գանձասար','განძასარი'],M=['Муш','Մուշ','მუში'];
// [key, [ru, hy, ka], category, art, cost, price, photo in the owner's Pivka catalogue]
export const madoProducts=[
 ['mado_549',['Палочки куриные копчёные «Атенк» 30 г','Հավի ապխտած փայտիկներ «Ատենք» 30 գ','ქათმის შებოლილი ჩხირები „ატენქი“ 30 გ'],'deli','mado-sticks-chicken',260,400],
 ['mado_722',['Палочки свиные копчёные «Атенк» 30 г','Խոզի ապխտած փայտիկներ «Ատենք» 30 գ','ღორის შებოლილი ჩხირები „ატენქი“ 30 გ'],'deli','mado-sticks-pork',260,400],
 ['mado_3512',['Охотничьи снеки острые «Атенк» 120 г','Որսորդական սնեքներ, կծու, «Ատենք» 120 գ','სამონადირეო სნეკები, ცხარე, „ატენქი“ 120 გ'],'deli','mado-hunter-spicy',590,850],
 ['mado_3513',['Охотничьи снеки с сыром «Атенк» 120 г','Որսորդական սնեքներ պանրով «Ատենք» 120 գ','სამონადირეო სნეკები ყველით „ატენქი“ 120 გ'],'deli','mado-hunter-cheese',590,850],
 ['mado_6611',['Бастурма, нарезка «Атенк» 60 г','Բաստուրմա, կտրատած, «Ատենք» 60 գ','ბასტურმა, დაჭრილი, „ატენქი“ 60 გ'],'deli','mado-basturma-slice-060',640,900],
 ['mado_4112',['Суджух, нарезка «Атенк» 70 г','Սուջուխ, կտրատած, «Ատենք» 70 գ','სუჯუხი, დაჭრილი, „ატენქი“ 70 გ'],'deli','mado-sudzhuk-slice-070',640,900,'atenk-sudzhuk-slice-070.jpg'],
 ['mado_451',kolbasa('Пикантная','Պիկանտ','პიკანტური',SK,null,200),'deli','mado-piquant-200',1220,1600],
 ['mado_453',kolbasa('Ленинакан','Լենինական','ლენინაკანი',SK,null,190),'deli','mado-leninakan-190',1220,1600],
 ['mado_455',kolbasa('Коньячная','Կոնյակային','კონიაკის',SK,null,200),'deli','mado-cognac-200',1220,1600],
 ['mado_4292',kolbasa('Пикант','Պիկանտ','პიკანტი',SK,M,370),'deli','mado-mush-piquant-370',1450,1900],
 ['mado_442',['Пепперони сырокопчёная «Муш» 370 г','Պեպերոնի, հում ապխտած, «Մուշ» 370 գ','პეპერონი, ნედლად შებოლილი, „მუში“ 370 გ'],'deli','mado-mush-pepperoni-370',1450,1900],
 ['mado_406',kolbasa('Пикантная','Պիկանտ','პიკანტური',SK,G,380),'deli','mado-gandzasar-piquant-380',1850,2500],
 ['mado_416',kolbasa('Коньячная','Կոնյակային','კონიაკის',SK,G,380),'deli','mado-gandzasar-cognac-380',1850,2500],
 ['mado_407',kolbasa('Итальянская','Իտալական','იტალიური',SK,G,400),'deli','mado-gandzasar-italian-400',2070,2700],
 ['mado_479',kolbasa('Пикантная','Պիկանտ','პიკანტური',SK,null,400),'deli','mado-piquant-400',2390,3200],
 ['mado_480',kolbasa('Ленинакан','Լենինական','ლენინაკანი',SK,null,380),'deli','mado-leninakan-380',2390,3200],
 ['mado_486',kolbasa('Коньячная','Կոնյակային','კონიაკის',SK,null,400),'deli','mado-cognac-400',2390,3200],
 ['mado_372',kolbasa('Иджеван','Իջևան','იჯევანი',PK,G,500),'deli','mado-gandzasar-ijevan-500',810,1150],
 ['mado_373',kolbasa('Дилижан','Դիլիջան','დილიჯანი',PK,G,450),'deli','mado-gandzasar-dilijan-450',700,1000],
 ['mado_3801',['Сервелат полукопчёный «Муш» 600 г','Սերվելատ, կիսաապխտած, «Մուշ» 600 գ','სერველატი, ნახევრად შებოლილი, „მუში“ 600 გ'],'deli','mado-mush-servelat-600',840,1200],
 ['mado_3791',kolbasa('Гюмри','Գյումրի','გიუმრი',PK,M,800),'deli','mado-mush-gyumri-800',1040,1400],
 ['mado_164',['Сосиски «Хот-дог» «Атенк» 550 г','Նրբերշիկ «Հոթ-դոգ» «Ատենք» 550 գ','სოსისი „ჰოთ-დოგი“ „ატენქი“ 550 გ'],'deli','mado-sausages-hotdog-550',790,1150,'atenk-sausages.jpg'],
 ['mado_158',['Сосиски «Молочные» «Атенк» 500 г','Նրբերշիկ «Կաթնային» «Ատենք» 500 գ','სოსისი „რძიანი“ „ატენქი“ 500 გ'],'deli','mado-sausages-milk-500',1467,1950],
 ['mado_159',['Сосиски «Венские» «Атенк» 500 г','Նրբերշիկ «Վիեննական» «Ատենք» 500 գ','სოსისი „ვენური“ „ატენქი“ 500 გ'],'deli','mado-sausages-vienna-500',1603,2100],
 ['mado_728',['Джерки куриные «Атенк» 30 г','Ջերկի հավի «Ատենք» 30 գ','ჯერკი ქათმის „ატენქი“ 30 გ'],'deli','mado-jerky-chicken-030',220,350,'atenk-jerky-chicken-030.jpg'],
 ['mado_543',['Джерки свиные «Атенк» 30 г','Ջերկի խոզի «Ատենք» 30 գ','ჯერკი ღორის „ატენქი“ 30 გ'],'deli','mado-jerky-pork-030',260,400,'atenk-jerky-pork-030.jpg'],
 ['mado_625',['Джерки говяжьи «Атенк» 30 г','Ջերկի տավարի «Ատենք» 30 գ','ჯერკი საქონლის „ატენქი“ 30 გ'],'deli','mado-jerky-beef-030',560,800],
 ['mado_vana_khash',['Хаш «VANA Food», банка','Խաշ «VANA Food», տարա','ხაში „VANA Food“, ქილა'],'preserves','mado-vana-khash',1600,2100,'vana-khash.jpg'],
 ['mado_adrenaline_025',['Энергетик Adrenaline Rush 0,25 л','Էներգետիկ Adrenaline Rush 0,25 լ','ენერგეტიკი Adrenaline Rush 0,25 ლ'],'drinks','mado-adrenaline-025',270,400,'adrenaline-rush-025.jpg'],
 ['mado_gubernator_050',['Водка «Губернатор» 0,5 л','Օղի «Գուբեռնատոր» 0,5 լ','არაყი „გუბერნატორი“ 0,5 ლ'],'alcohol','mado-gubernator-050',1620,2200,'artashat-gubernator-050.jpg'],
 ['mado_gubernator_exclusive_050',['Водка «Губернатор» Эксклюзив 0,5 л','Օղի «Գուբեռնատոր» Էքսկլյուզիվ 0,5 լ','არაყი „გუბერნატორი“ ექსკლუზივი 0,5 ლ'],'alcohol','mado-gubernator-exclusive-050',1800,2400,'artashat-gubernator-exclusive-050.jpg'],
 ['mado_gubernator_collection_050',['Водка «Губернатор» Коллекционная 0,5 л','Օղի «Գուբեռնատոր» Կոլեկցիոն 0,5 լ','არაყი „გუბერნატორი“ საკოლექციო 0,5 ლ'],'alcohol','mado-gubernator-collection-050',2000,2600,'artashat-gubernator-collection-050.jpg'],
 ['mado_gubernator_070',['Водка «Губернатор» 0,7 л','Օղի «Գուբեռնատոր» 0,7 լ','არაყი „გუბერნატორი“ 0,7 ლ'],'alcohol','mado-gubernator-070',2600,3400],
 ['mado_druzhba_050',['Водка «Дружба» 0,5 л','Օղի «Դրուժբա» 0,5 լ','არაყი „დრუჟბა“ 0,5 ლ'],'alcohol','mado-druzhba-050',1440,1900,'artashat-druzhba-050.jpg'],
 ['mado_druzhba_classic_050',['Водка «Дружба» Классическая 0,5 л','Օղի «Դրուժբա» Դասական 0,5 լ','არაყი „დრუჟბა“ კლასიკური 0,5 ლ'],'alcohol','mado-druzhba-classic-050',1500,1950],
 ['mado_piton_050',['Водка «Питон» 0,5 л, в тубусе','Օղի «Պիտոն» 0,5 լ, տուփով','არაყი „პიტონი“ 0,5 ლ, ტუბუსში'],'alcohol','mado-piton-050',5500,6600,'artashat-piton-050.jpg'],
 ['mado_artashat5_050',['Бренди «Арташат 5» 0,5 л','Բրենդի «Արտաշատ 5» 0,5 լ','ბრენდი „არტაშატი 5“ 0,5 ლ'],'alcohol','mado-artashat5-050',3900,5100],
 ['mado_artashat7_050',['Бренди «Арташат 7» 0,5 л','Բրենդի «Արտաշատ 7» 0,5 լ','ბრენდი „არტაშატი 7“ 0,5 ლ'],'alcohol','mado-artashat7-050',4800,6300],
 ['mado_artashat10_050',['Бренди «Арташат 10» 0,5 л','Բրենդի «Արտաշատ 10» 0,5 լ','ბრენდი „არტაშატი 10“ 0,5 ლ'],'alcohol','mado-artashat10-050',7500,9800],
 ['mado_tsar_khosrov7_050',['Бренди «Царь Хосров 7» 0,5 л','Բրենդի «Խոսրով Արքա 7» 0,5 լ','ბრენდი „მეფე ხოსროვი 7“ 0,5 ლ'],'alcohol','mado-tsar-khosrov7-050',4500,5900]
];
export const madoProfiles=Object.fromEntries(madoProducts.map(r=>[r[0],'each']));
export const madoArts=madoProducts.map(r=>r[3]);
// Photos still to come from the owner; until then the card shows the section's picture.
export const madoArtsWithoutPhoto=madoProducts.filter(r=>!r[6]).map(r=>r[3]);
export function madoSql(profileFor){const v=madoVendor,a=madoAlcohol,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO categories(id,names,sort) VALUES(${s(a.id)},${j(a.names)},${a.sort}) ON CONFLICT(id) DO NOTHING;`,
  `INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...madoProducts.map(([key,[ru,hy,ka],category,art,cost,price])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profileFor(key))},${price},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
