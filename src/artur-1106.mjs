// Owner 06.11: Artur's new goods (owner's shelf photos with costs). Retail: alcohol — cost below 100 ₾ +20 %, 100–300 ₾ +15 %,
// from 300 ₾ +10 %; food and soft drinks +20 %; up to 10 tetri. Artur's earlier goods keep their prices. Tsitsak and jonjoli move
// from Anto to Artur. Photos: brand bottle shots from shops (docs/PHOTO_SOURCES.json); goods without one show the section picture.
import {arturVendor}from './artur.mjs';import {tierRetail}from './karo.mjs';
export const arturAlcoholPct=cost=>cost>=30000?10:cost>=10000?15:20;
export const arturRetail1106=(cost,category)=>tierRetail(cost,category==='alcohol'?arturAlcoholPct(cost):20);
const L=(ru,hy,ka)=>[ru,hy,ka];
const v=(x,u)=>x+' '+u;const n3=(a,b,c,vol)=>vol?[a+' '+vol+' л',b+' '+vol+' լ',c+' '+vol+' ლ']:[a,b,c];
// [key, [ru,hy,ka], category, art|null, cost (tetri), profile?]
const W={mode:'WEIGHED',policy_version:1,minimum_g:300,order_step_g:100,tolerance_bps:1000,tolerance_cap_g:50};
const A=(key,ru,hy,ka,vol,art,cost)=>[key,n3(ru,hy,ka,vol),'alcohol',art,cost];
export const arturProducts1106=[
 A('baileys_1l','Ликёр Baileys Original','Լիկյոր Baileys Original','ლიქიორი Baileys Original','1','artur-baileys',6000),
 A('amarula_coffee_1l','Ликёр Amarula Ethiopian Coffee','Լիկյոր Amarula Ethiopian Coffee','ლიქიორი Amarula Ethiopian Coffee','1','artur-amarula-coffee',10000),
 A('amarula_07','Ликёр Amarula Cream','Լիկյոր Amarula Cream','ლიქიორი Amarula Cream','0,7','artur-amarula',9000),
 A('meukow_vs_07','Коньяк Meukow VS','Կոնյակ Meukow VS','კონიაკი Meukow VS','0,7','artur-meukow-vs',13000),
 A('frangelico_1l','Ликёр Frangelico ореховый','Լիկյոր Frangelico ընկույզի','ლიქიორი Frangelico თხილის','1','artur-frangelico',8000),
 A('macallan_night','Виски The Macallan A Night on Earth — The First Light','Վիսկի The Macallan A Night on Earth — The First Light','ვისკი The Macallan A Night on Earth — The First Light','0,7','artur-macallan-night',55000),
 A('macallan_12','Виски The Macallan 12 Sherry Oak','Վիսկի The Macallan 12 Sherry Oak','ვისკი The Macallan 12 Sherry Oak','0,7','artur-macallan-12',35000),
 A('macallan_15','Виски The Macallan 15 Double Cask','Վիսկի The Macallan 15 Double Cask','ვისკი The Macallan 15 Double Cask','0,7','artur-macallan-15',65000),
 A('macallan_18','Виски The Macallan 18 Double Cask','Վիսկի The Macallan 18 Double Cask','ვისკი The Macallan 18 Double Cask','0,7','artur-macallan-18',125000),
 A('beluga_1l','Водка Beluga Noble','Օղի Beluga Noble','არაყი Beluga Noble','1','artur-beluga',13000),
 A('beluga_07','Водка Beluga Noble','Օղի Beluga Noble','არაყი Beluga Noble','0,7','artur-beluga',11000),
 A('beluga_05','Водка Beluga Noble','Օղի Beluga Noble','არაყი Beluga Noble','0,5','artur-beluga',9500),
 A('beluga_celebration_1l','Водка Beluga Celebration','Օղի Beluga Celebration','არაყი Beluga Celebration','1','artur-beluga-celebration',14000),
 A('beluga_transatlantic_1l','Водка Beluga Transatlantic Racing','Օղի Beluga Transatlantic Racing','არაყი Beluga Transatlantic Racing','1','artur-beluga-transatlantic',14000),
 A('chistye_rosy_07','Водка «Чистые росы» органик','Օղի «Чистые росы» օրգանիկ','არაყი „Чистые росы“ ორგანული','0,7','artur-chistye-rosy-07',7000),
 A('chistye_rosy_05','Водка «Чистые росы» органик','Օղի «Чистые росы» օրգանիկ','არაყი „Чистые росы“ ორგანული','0,5','artur-chistye-rosy-05',5700),
 A('crown_1l','Водка Gold Russian Crown','Օղի Gold Russian Crown','არაყი Gold Russian Crown','1',null,5300),
 A('crown_07','Водка Gold Russian Crown','Օղի Gold Russian Crown','არაყი Gold Russian Crown','0,7',null,3800),
 A('crown_05','Водка Gold Russian Crown','Օղի Gold Russian Crown','არაყი Gold Russian Crown','0,5',null,3100),
 A('onegin_1l','Водка Onégin','Օղի Onégin','არაყი Onégin','1','artur-onegin',18000),
 A('onegin_07','Водка Onégin','Օղի Onégin','არაყი Onégin','0,7','artur-onegin',12500),
 A('greygoose_1l','Водка Grey Goose','Օղի Grey Goose','არაყი Grey Goose','1','artur-greygoose',12000),
 A('greygoose_05','Водка Grey Goose','Օղի Grey Goose','არაყი Grey Goose','0,5','artur-greygoose',8500),
 A('absolut_1l','Водка Absolut','Օղի Absolut','არაყი Absolut','1','artur-absolut',4200),
 A('mamont_1l','Водка Mamont','Օղի Mamont','არაყი Mamont','1','artur-mamont',9500),
 A('mamont_075','Водка Mamont Original','Օղի Mamont Original','არაყი Mamont Original','0,75','artur-mamont',7000),
 A('mamont_05','Водка Mamont','Օղի Mamont','არაყი Mamont','0,5','artur-mamont',5400),
 A('mamont_northman_07','Водка Mamont Northman','Օղի Mamont Northman','არაყი Mamont Northman','0,7','artur-mamont-northman-07',7300),
 A('partner_1l','Водка Partner Premium Export','Օղի Partner Premium Export','არაყი Partner Premium Export','1',null,6500),
 A('partner_07','Водка Partner Premium Export','Օղի Partner Premium Export','არაყი Partner Premium Export','0,7',null,5000),
 A('partner_05','Водка Partner Premium Export','Օղի Partner Premium Export','არაყი Partner Premium Export','0,5',null,4000),
 A('dargett_weizen_05','Пиво Dargett Weizen','Գարեջուր Dargett Weizen','ლუდი Dargett Weizen','0,5','artur-dargett-weizen-05',400),
 A('dargett_weizen_033','Пиво Dargett Weizen','Գարեջուր Dargett Weizen','ლუდი Dargett Weizen','0,33','artur-dargett-weizen-033',350),
 A('zhigulevskoe_05','Пиво «Жыгулёўскае Хмельнае» (Лида)','Գարեջուր «Жыгулёўскае Хмельнае» (Լիդա)','ლუდი „Жыгулёўскае Хмельнае“ (ლიდა)','0,5',null,400),
 A('heineken_05','Пиво Heineken','Գարեջուր Heineken','ლუდი Heineken','0,5','artur-heineken-05',500),
 A('heineken_033','Пиво Heineken','Գարեջուր Heineken','ლუდი Heineken','0,33','artur-heineken-033',400),
 A('baltika_0','Пиво «Балтика 0» безалкогольное','Գարեջուր «Балтика 0» ոչ ալկոհոլային','ლუდი „Балтика 0“ უალკოჰოლო','0,5','artur-baltika-0',350),
 A('baltika_3','Пиво «Балтика 3» классическое','Գարեջուր «Балтика 3» դասական','ლუდი „Балтика 3“ კლასიკური','0,5','artur-baltika-3',280),
 A('baltika_6','Пиво «Балтика 6» портер','Գարեջուր «Балтика 6» պորտեր','ლუდი „Балтика 6“ პორტერი','0,5',null,280),
 A('baltika_7','Пиво «Балтика 7» экспортное','Գարեջուր «Балтика 7» էքսպորտային','ლუდი „Балтика 7“ საექსპორტო','0,5','artur-baltika-7',320),
 A('baltika_8','Пиво «Балтика 8» пшеничное','Գարեջուր «Балтика 8» ցորենի','ლუდი „Балтика 8“ ხორბლის','0,5',null,280),
 ['avocado_oil_oliricco',L('Масло авокадо Oliricco 1 л','Ավոկադոյի յուղ Oliricco 1 լ','ავოკადოს ზეთი Oliricco 1 ლ'),'pantry',null,2000],
 ['avocado_oil_cratos',L('Масло авокадо Cratos 1 л','Ավոկադոյի յուղ Cratos 1 լ','ავოკადოს ზეთი Cratos 1 ლ'),'pantry','artur-avocado-oil-cratos',2000],
 ['olives_coopoliva_pitted_850',L('Маслины Coopoliva без косточки 850 г','Ձիթապտուղ սև Coopoliva առանց կորիզի 850 գ','შავი ზეთისხილი Coopoliva უკურკო 850 გ'),'preserves','artur-olives-coopoliva-pitted-850',1100],
 ['olives_coopoliva_plain_850',L('Маслины Coopoliva с косточкой 850 г','Ձիթապտուղ սև Coopoliva կորիզով 850 գ','შავი ზეთისხილი Coopoliva კურკით 850 გ'),'preserves','artur-olives-coopoliva-plain-850',1100],
 ['olives_coopoliva_pitted_425',L('Маслины Coopoliva без косточки 425 г','Ձիթապտուղ սև Coopoliva առանց կորիզի 425 գ','შავი ზეთისხილი Coopoliva უკურკო 425 გ'),'preserves','artur-olives-coopoliva-pitted-425',500],
 ['olives_coopoliva_plain_425',L('Маслины Coopoliva с косточкой 425 г','Ձիթապտուղ սև Coopoliva կորիզով 425 գ','შავი ზეთისხილი Coopoliva კურკით 425 გ'),'preserves','artur-olives-coopoliva-plain-425',500],
 ['olives_markesa_green',L('Оливки Markesa de Oliva без косточки 420 г','Ձիթապտուղ կանաչ Markesa de Oliva առանց կորիզի 420 գ','მწვანე ზეთისხილი Markesa de Oliva უკურკო 420 გ'),'preserves',null,550],
 ['olives_markesa_black',L('Маслины Markesa de Oliva без косточки 420 г','Ձիթապտուղ սև Markesa de Oliva առանց կորիզի 420 գ','შავი ზეთისხილი Markesa de Oliva უკურკო 420 გ'),'preserves',null,550],
 ['stew_pork_525',L('Свинина тушёная «Белорусские консервы» 525 г','Խոզի միս շոգեխաշած «Белорусские консервы» 525 գ','ღორის ჩაშუშული „Белорусские консервы“ 525 გ'),'belarus',null,1750],
 ['stew_beef_500',L('Говядина тушёная «Белорусские консервы», стекло 500 г','Տավարի միս շոգեխաշած «Белорусские консервы», ապակի 500 գ','საქონლის ჩაშუშული „Белорусские консервы“, მინა 500 გ'),'belarus',null,1750],
 ['stew_pork_338',L('Свинина тушёная «Белорусские консервы» 338 г','Խոզի միս շոգեխաշած «Белорусские консервы» 338 գ','ღორის ჩაშუშული „Белорусские консервы“ 338 გ'),'belarus',null,1100],
 ['condensed_alekseevskoe',L('Сгущённое молоко «Алексеевское» 8,5% 380 г','Խտացրած կաթ «Алексеевское» 8,5% 380 գ','შესქელებული რძე „Алексеевское“ 8,5% 380 გ'),'pantry','artur-condensed-alekseevskoe',500],
 ['condensed_rogachev',L('Сгущённое молоко «Рогачёвъ» 8,5% 380 г','Խտացրած կաթ «Рогачёвъ» 8,5% 380 գ','შესქელებული რძე „Рогачёвъ“ 8,5% 380 გ'),'belarus','artur-condensed-rogachev',500],
 ['borjomi_05',L('Минеральная вода Borjomi, стекло 0,5 л','Հանքային ջուր Borjomi, ապակի 0,5 լ','მინერალური წყალი ბორჯომი, მინა 0,5 ლ'),'drinks','artur-borjomi',220],
 ['nabeglavi_05',L('Минеральная вода Nabeglavi, стекло 0,5 л','Հանքային ջուր Nabeglavi, ապակի 0,5 լ','მინერალური წყალი ნაბეღლავი, მინა 0,5 ლ'),'drinks','kri-nabeglavi-050',220],
 ['natakhtari_tarragon',L('Лимонад «Натахтари» тархун, стекло 0,5 л','Լիմոնադ «Նատախտարի» թարխուն, ապակի 0,5 լ','ლიმონათი „ნატახტარი“ ტარხუნა, მინა 0,5 ლ'),'drinks','artur-natakhtari-tarragon',250],
 ['natakhtari_pear',L('Лимонад «Натахтари» груша, стекло 0,5 л','Լիմոնադ «Նատախտարի» տանձ, ապակի 0,5 լ','ლიმონათი „ნატახტარი“ მსხალი, მინა 0,5 ლ'),'drinks','artur-natakhtari-pear',250],
 ['redbull_025',L('Red Bull 250 мл','Red Bull 250 մլ','Red Bull 250 მლ'),'drinks','kri-redbull-025',400],
 ['redbull_yellow_025',L('Red Bull The Yellow Edition (тропик) 250 мл','Red Bull The Yellow Edition (արևադարձային) 250 մլ','Red Bull The Yellow Edition (ტროპიკული) 250 მლ'),'drinks','artur-redbull-yellow',400],
 ['juice_mango_15',L('Сок манго 1,5 л','Մանգոյի հյութ 1,5 լ','მანგოს წვენი 1,5 ლ'),'drinks',null,1000],
 ['juice_mango_1',L('Сок манго 1 л','Մանգոյի հյութ 1 լ','მანგოს წვენი 1 ლ'),'drinks',null,800],
 ['juice_mango_025',L('Сок манго 250 мл','Մանգոյի հյութ 250 մլ','მანგოს წვენი 250 მლ'),'drinks',null,300],
 ['sauerkraut',L('Капуста квашеная','Թթու կաղամբ','მჟავე კომბოსტო'),'preserves',null,600,W],
 ['garlic_pickled',L('Чеснок маринованный','Սխտոր մարինացված','ნიორი მარინადში'),'preserves',null,1200,W]];
// every product has its own picture file (artur-<key>.jpg), a copy of the brand photo for each size
const artOf=key=>'artur-'+key.replaceAll('_','-');
export const arturArts1106=arturProducts1106.map(r=>artOf(r[0]));
export const arturArtsWithoutPhoto1106=arturProducts1106.filter(r=>!r[3]).map(r=>artOf(r[0]));
export const arturPhotoFrom1106=Object.fromEntries(arturProducts1106.filter(r=>r[3]).map(r=>[artOf(r[0]),r[3]]));
export const antoToArtur=[['anto_tsitsak',1000],['anto_jonjoli',2000]];
export function arturSql1106(){const V=arturVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [...arturProducts1106.map(([key,[ru,hy,ka],category,art,cost,profile])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(V.city_id+'--artur_'+key)},${s(V.id)},${j({ru,hy,ka})},${s(category)},${s(artOf(key))},${j(profile||{mode:'EACH',policy_version:1})},${arturRetail1106(cost,category)},${cost},${profile?100000:100} WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(V.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`),
  ...antoToArtur.map(([key,cost])=>`UPDATE products SET vendor_id=${s(V.id)},cost=${cost},price=${tierRetail(cost,20)},version=version+1 WHERE id=${s(V.city_id+'--'+key)} AND vendor_id='akhalkalaki-anto';`)]}
