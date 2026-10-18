// «Каро», Ахалкалаки: закупка с ценников 18.10.2026, продажа = закупка × 1.3 с округлением вверх до 10 тетри (решение владельца).
// Каро пробивает чек по цене Базара; разница — комиссия Базара по договору. Источник: таблица «Базар — цены (закуп / продажа)».
export const karoVendor={id:'akhalkalaki-karo',city_id:'akhalkalaki',names:{ru:'Каро',hy:'Կարո',ka:'კარო'}};
export const retail=cost=>Math.ceil(Math.round(cost*1.3)/10)*10;
// Existing Akhalkalaki products that Karo now supplies: [key, cost in tetri, optional new names].
export const karoMoves=[
 ['apple_loose',400,{ru:'Яблоки красные',hy:'Կարմիր խնձոր',ka:'წითელი ვაშლი'}],['pear_loose',800,{ru:'Груши «Конференс»',hy:'Տանձ «Կոնֆերենս»',ka:'მსხალი „კონფერენსი“'}],
 ['mandarin_loose',400],['lemon_loose',400],['banana_loose',500],['avocado_each',500],['mango_each',500],['blueberry_pack_125g',850],
 ['tomato_loose',600],['cucumber_loose',400],['pepper_loose',300],['potato_loose',100],['carrot_loose',250],['cabbage_whole_kg',150],['onion_loose',200],['garlic_loose',600],
 ['peanut_kernel',1100,{ru:'Арахис очищенный',hy:'Մաքրված արախիս',ka:'გაწმენდილი მიწის თხილი'}],['churchkhela_each',500],
 ['almond_kernel',3500],['pumpkin_seed',1800],['walnut_kernel',2200],['cashew_kernel',4500],['raisins_dried',2000],['hazelnut_kernel',3500]
];
// New Karo products: [key, ru, hy, ka, category, art, profile, cost in tetri, optional owner-set price].
export const karoProducts=[
 ['apple_yellow_loose','Яблоки жёлтые','Դեղին խնձոր','ყვითელი ვაშლი','fruit','apple-yellow','loose',400],
 ['pear_yellow_loose','Груши жёлтые','Դեղին տանձ','ყვითელი მსხალი','fruit','pear','loose',500],
 ['pear_brown_loose','Груши коричневые','Շագանակագույն տանձ','ყავისფერი მსხალი','fruit','pear','loose',600],
 ['grapefruit_loose','Грейпфрут','Գրեյպֆրուտ','გრეიპფრუტი','fruit','grapefruit','loose',600],
 ['persimmon_loose','Хурма','Խուրմա','ხურმა','fruit','persimmon','loose',300],
 ['kiwi_loose','Киви','Կիվի','კივი','fruit','kiwi','loose',500],
 ['nectarine_loose','Нектарины','Նեկտարին','ნექტარინი','fruit','nectarine','loose',400],
 ['plum_loose','Сливы','Սալոր','ქლიავი','fruit','plum','loose',500],
 ['chestnut_loose','Каштаны съедобные','Ուտելի շագանակ','წაბლი','fruit','chestnut','loose',800],
 ['pomegranate_loose','Гранат','Նուռ','ბროწეული','fruit','pomegranate','loose',500],
 ['pineapple_each','Ананас','Արքայախնձոր','ანანასი','fruit','pineapple','each',1300],
 ['tomato_second_loose','Помидоры, второй сорт','Լոլիկ, երկրորդ տեսակ','პომიდორი, მეორე ხარისხი','vegetables','tomato','loose',500],
 ['cucumber_long_loose','Огурцы длинные тёмные','Երկար մուգ վարունգ','გრძელი მუქი კიტრი','vegetables','cucumber','loose',330],
 ['pepper_red_long_loose','Перец красный длинный','Կարմիր երկար պղպեղ','წითელი გრძელი წიწაკა','vegetables','pepper-red-long','loose',300],
 ['chili_green_loose','Перец острый зелёный','Կանաչ կծու պղպեղ','მწვანე ცხარე წიწაკა','vegetables','chili','delicate',500],
 ['aubergine_loose','Баклажаны','Սմբուկ','ბადრიჯანი','vegetables','aubergine','loose',300],
 ['beetroot_loose','Свёкла','Ճակնդեղ','ჭარხალი','vegetables','beetroot','loose',150],
 ['radish_black_loose','Редька чёрная','Սև բողկ','შავი ბოლოკი','vegetables','radish-black','loose',300],
 ['radish_red_loose','Редька красная','Կարմիր բողկ','წითელი ბოლოკი','vegetables','radish-red','loose',300],
 ['champignon_loose','Шампиньоны','Շամպինյոն','შამპინიონი','vegetables','mushrooms','delicate',1100,1500],
 ['radish_green_loose','Редька зелёная','Կանաչ բողկ','მწვანე ბოლოკი','vegetables','radish-green','loose',300],
 ['turnip_loose','Репа','Շաղգամ','თალგამი','vegetables','turnip','loose',200],
 ['cauliflower_whole_kg','Цветная капуста','Ծաղկակաղամբ','ყვავილოვანი კომბოსტო','vegetables','cauliflower','whole',250],
 ['peanut_shell','Арахис в скорлупе','Արախիս՝ կճեպով','მიწის თხილი, ნაჭუჭით','nuts','peanut-shell','nuts',1000],
 ['peanut_blanched','Арахис очищенный белый','Մաքրված սպիտակ արախիս','გაწმენდილი თეთრი მიწის თხილი','nuts','peanut','nuts',1100],
 ['pistachio_shell','Фисташки в скорлупе','Պիստակ՝ կճեպով','ფისტა, ნაჭუჭით','nuts','pistachio','nuts',4800],
 ['beans_speckled_light','Фасоль пёстрая светлая','Բաց խայտաբղետ լոբի','ჭრელი ღია ლობიო','grains','beans-speckled','grains',700],
 ['beans_speckled_dark','Фасоль пёстрая тёмная','Մուգ խայտաբղետ լոբի','ჭრელი მუქი ლობიო','grains','beans-speckled-dark','grains',700],
 ['corn_kernels','Кукуруза зерном','Եգիպտացորենի հատիկ','სიმინდის მარცვალი','grains','corn','grains',500],
 ['churchkhela_color_each','Чурчхела цветная · штука','Գունավոր չուրչխելա · հատ','ფერადი ჩურჩხელა · ცალი','market','churchkhela','each',500],
 ['okra_pickled_jar','Бамия маринованная · банка','Մարինացված բամիա · տարա','მარინადში ბამია · ქილა','preserves','pickles','each',800],
 ['cauliflower_pickled_jar','Цветная капуста маринованная · банка ≈3 л','Մարինացված ծաղկակաղամբ · տարա ≈3 լ','მარინადში ყვავილოვანი კომბოსტო · ქილა ≈3 ლ','preserves','pickles','each',1500],
 ['tomato_pickled_jar','Помидоры маринованные · банка ≈3 л','Մարինացված լոլիկ · տարա ≈3 լ','მარინადში პომიდორი · ქილა ≈3 ლ','preserves','pickles','each',1500],
 ['cucumber_pickled_jar','Огурцы маринованные · банка ≈3 л','Մարինացված վարունգ · տարա ≈3 լ','მარინადში კიტრი · ქილა ≈3 ლ','preserves','pickles','each',1500],
 ['minicorn_nostimo_330g','Кукуруза мини маринованная Nostimo · 330 г','Մինի եգիպտացորեն մարինացված Nostimo · 330 գ','მინი სიმინდი მარინადში Nostimo · 330 გ','preserves','pickles','each',500]
];
export const karoProfiles=Object.fromEntries(karoProducts.map(r=>[r[0],r[6]]));
export const karoArts=[...new Set([...karoProducts.map(r=>r[5]),'apple-red'])];
// Photos still missing (no free licensed photo found); the shop shows «фото временно недоступно».
export const karoArtsWithoutPhoto=['radish-black','radish-red','radish-green'];
// Idempotent statements: create the vendor, move the starter-catalogue products (only while they are still with the initial vendors), add new products.
export function karoSql(profileFor){
 const v=karoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),out=[];
 out.push(`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`);
 for(const [key,cost,names]of karoMoves)out.push(`UPDATE products SET vendor_id=${s(v.id)},price=${retail(cost)},cost=${cost},${names?`names=${j(names)},`:''}version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND vendor_id IN('akhalkalaki-garden','akhalkalaki-farm') AND EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)});`);
 for(const [key,ru,hy,ka,category,art,,cost,price=retail(cost)]of karoProducts){const profile=profileFor(key),weighted=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(profile.mode);
  out.push(`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profile)},${price},${cost},${weighted?100000:50} WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)}
 return out;
}
// Owner 18.10: Karo's dark speckled beans are the site's «Фасоль красная» — move that product to Karo and retire the duplicate.
export const karoFixes=[['red_beans',700]],karoRetired=['beans_speckled_dark'];
export function karoFixSql(){const v=karoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",out=[];
 for(const [key,cost]of karoFixes)out.push(`UPDATE products SET vendor_id=${s(v.id)},price=${retail(cost)},cost=${cost},version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND vendor_id IN('akhalkalaki-garden','akhalkalaki-farm') AND EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)});`);
 for(const key of karoRetired)out.push(`UPDATE products SET active=0,version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND active=1;`);
 return out}
// Owner 18.10: the pickle jars are exactly 3 litres.
export const karoJarNames={
 cauliflower_pickled_jar:{ru:'Цветная капуста маринованная · банка 3 л',hy:'Մարինացված ծաղկակաղամբ · տարա 3 լ',ka:'მარინადში ყვავილოვანი კომბოსტო · ქილა 3 ლ'},
 tomato_pickled_jar:{ru:'Помидоры маринованные · банка 3 л',hy:'Մարինացված լոլիկ · տարա 3 լ',ka:'მარინადში პომიდორი · ქილა 3 ლ'},
 cucumber_pickled_jar:{ru:'Огурцы маринованные · банка 3 л',hy:'Մարինացված վարունգ · տարա 3 լ',ka:'მარინადში კიტრი · ქილა 3 ლ'}
};
export function karoJarSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'";return Object.entries(karoJarNames).map(([key,names])=>`UPDATE products SET names=${s(JSON.stringify(names))},version=version+1 WHERE id=${s(karoVendor.city_id+'--'+key)} AND names<>${s(JSON.stringify(names))};`)}
// Owner 18.10: Karo's red apples are fully dark red (Red Delicious type) — own photo for Akhalkalaki; Tbilisi keeps the general apple photo.
export function karoPhotoSql(){return [`UPDATE products SET art='apple-red',version=version+1 WHERE id='${karoVendor.city_id}--apple_loose' AND art='apple';`]}
