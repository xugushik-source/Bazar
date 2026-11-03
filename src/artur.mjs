// «Артур Фарманян», Ахалкалаки: loose chocolates by the kilo (owner 02.11). Cost = Artur's price to us (35 ₾/kg for the factory
// sweets, 33 ₾/kg for Snickers, Bounty, Twix, Milky Way); sale = cost + 15%, rounded up to 50 tetri. From 100 g in steps of 50 g.
// Works 09:00–18:00. A new section «Конфеты». Photos: the makers' own sites (uniconf.ru for the Moscow factories, Mars brand
// sites for the bars); the ones the makers do not show get a plain name card.
export const arturVendor={id:'akhalkalaki-artur',city_id:'akhalkalaki',names:{ru:'Артур Фарманян',hy:'Արթուր Ֆարմանյան',ka:'არტურ ფარმანიანი'}};
export const arturHours={open_minute:540,close_minute:1080};
export const sweets={id:'sweets',names:{ru:'Конфеты',hy:'Կոնֆետներ',ka:'კანფეტები'},sort:75};
export const arturProfile={mode:'WEIGHED',policy_version:1,minimum_g:100,order_step_g:50,tolerance_bps:1000,tolerance_cap_g:50};
export const saleOf=cost=>Math.ceil(cost*115/100/50)*50;
// [key, ru, hy, ka, cost per kg (tetri), has the maker's photo]
export const arturProducts=[
 ['alenka','Конфеты «Алёнка»','Կոնֆետ «Ալյոնկա»','კანფეტი „ალიონკა“',3500,true],
 ['sufle','Конфеты «Золотое суфле» черносмородиновое','Կոնֆետ «Ոսկե սուֆլե» սև հաղարջով','კანფეტი „ოქროს სუფლე“ შავი მოცხარით',3500,true],
 ['karakum','Конфеты «Кара-Кум»','Կոնֆետ «Կարա-Կում»','კანფეტი „ყარა-ყუმი“',3500,true],
 ['shapochka','Конфеты «Красная шапочка»','Կոնֆետ «Կարմիր գլխարկ»','კანფეტი „წითელქუდა“',3500,true],
 ['mishka_nut','Конфеты «Мишка косолапый» с ореховой начинкой','Կոնֆետ «Միշկա կոսոլապի» ընկույզի միջուկով','კანფეტი „მიშკა კოსოლაპი“ თხილის შიგთავსით',3500,true],
 ['mishka','Конфеты «Мишка косолапый»','Կոնֆետ «Միշկա կոսոլապի»','კანფეტი „მიშკა კოსოლაპი“',3500,true],
 ['roshcha','Конфеты «Ореховая роща»','Կոնֆետ «Ընկուզենու պուրակ»','კანფეტი „თხილის კორომი“',3500,true],
 ['petushok','Конфеты «Петушок — золотой гребешок»','Կոնֆետ «Աքլորիկ — ոսկե կատար»','კანფეტი „მამალი — ოქროს სავარცხელა“',3500,true],
 ['stolichnye','Конфеты «Столичные»','Կոնֆետ «Ստոլիչնիե»','კანფეტი „სტოლიჩნიე“',3500,true],
 ['stratosfera','Конфеты «Стратосфера»','Կոնֆետ «Ստրատոսֆերա»','კანფეტი „სტრატოსფერო“',3500,true],
 ['choc_cream','Конфеты «Шоколадный крем»','Կոնֆետ «Շոկոլադե կրեմ»','კანფეტი „შოკოლადის კრემი“',3500,true],
 ['babaevskie','Конфеты «Бабаевские»','Կոնֆետ «Բաբաևսկիե»','კანფეტი „ბაბაევსკიე“',3500,true],
 ['babaevskie_hazel','Конфеты «Бабаевские» оригинальные с фундуком и какао','Կոնֆետ «Բաբաևսկիե» պնդուկով և կակաոյով','კანფეტი „ბაბაევსკიე“ თხილითა და კაკაოთი',3500,true],
 ['babaevskie_pist','Конфеты «Бабаевские» с фисташкой','Կոնֆետ «Բաբաևսկիե» պիստակով','კანფეტი „ბაბაევსკიე“ ფსტით',3500,true],
 ['babaevskie_truffle','Конфеты «Бабаевские» трюфельный крем','Կոնֆետ «Բաբաևսկիե» տրյուֆելային կրեմ','კანფეტი „ბაბაევსკიე“ ტრიუფელის კრემი',3500,true],
 ['belochka','Конфеты «Белочка»','Կոնֆետ «Սկյուռիկ»','კანფეტი „ციყვი“',3500,true],
 ['vdokhnovenie','Конфеты «Вдохновение»','Կոնֆետ «Վդոխնովենիե»','კანფეტი „ვდოხნოვენიე“',3500,true],
 ['vizit','Конфеты «Визит»','Կոնֆետ «Վիզիտ»','კანფეტი „ვიზიტი“',3500,true],
 ['odisseya','Конфеты «Космическая одиссея»','Կոնֆետ «Տիեզերական ոդիսական»','კანფეტი „კოსმოსური ოდისეა“',3500,true],
 ['truffle_dark','Трюфель «Бабаевский» горький','Տրյուֆել «Բաբաևսկի» դառը','ტრიუფელი „ბაბაევსკი“ მწარე',3500,true],
 ['truffle_classic','Трюфель «Бабаевский» классический','Տրյուֆել «Բաբաևսկի» դասական','ტრიუფელი „ბაბაევსკი“ კლასიკური',3500,true],
 ['vecherniy','Конфеты «Вечерний звон»','Կոնֆետ «Երեկոյան զանգ»','კანფეტი „საღამოს რეკვა“',3500,true],
 ['truffle_glaze','Трюфель в шоколадной глазури','Տրյուֆել շոկոլադե ջնարակով','ტრიუფელი შოკოლადის მინანქარში',3500,true],
 ['ogni','Конфеты «Огни Москвы»','Կոնֆետ «Մոսկվայի լույսեր»','კანფეტი „მოსკოვის შუქები“',3500,true],
 ['vals','Конфеты «Осенний вальс»','Կոնֆետ «Աշնանային վալս»','კანფეტი „შემოდგომის ვალსი“',3500,true],
 ['pm_cappuccino','«Птичье молоко» вкус капучино','«Թռչնի կաթ» կապուչինոյի համով','„ჩიტის რძე“ კაპუჩინოს გემოთი',3500,true],
 ['pm_choc','«Птичье молоко» вкус шоколада','«Թռչնի կաթ» շոկոլադի համով','„ჩიტის რძე“ შოკოლადის გემოთი',3500,true],
 ['pm_vanilla','«Птичье молоко» сливочно-ванильное','«Թռչնի կաթ» սերուցքա-վանիլային','„ჩიტის რძე“ ნაღების და ვანილის',3500,true],
 ['halva_minn','Халва МИНН','Հալվա ՄԻՆՆ','ჰალვა „მინ“',3500,true],
 ['cherry_liqueur','Конфеты «Вишня в ликёре»','Կոնֆետ «Բալ լիկյորում»','კანფეტი „ალუბალი ლიქიორში“',3500,true],
 ['zabegai','Конфеты «Забегай на чай»','Կոնֆետ «Մտիր թեյի»','კანფეტი „შემოიარე ჩაიზე“',3500,true],
 ['halva','Халва','Հալվա','ჰალვა',3500,true],
 ['soreni','Конфеты Soreni','Կոնֆետ Soreni','კანფეტი Soreni',3500,true],
 ['snickers','Сникерс','Սնիքերս','სნიკერსი',3300,true],
 ['bounty','Баунти','Բաունթի','ბაუნტი',3300,true],
 ['twix','Твикс','Թվիքս','ტვიქსი',3300,true],
 ['milkyway','Милки Вэй','Միլքի Վեյ','მილქი ვეი',3300,true]
];
export const arturArts=arturProducts.map(r=>'artur-'+r[0].replaceAll('_','-'));
export function arturSql(){const v=arturVendor,c=sweets,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO categories(id,names,sort) VALUES(${s(c.id)},${j(c.names)},${c.sort}) ON CONFLICT(id) DO NOTHING;`,
  `INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  `UPDATE vendors SET open_minute=${arturHours.open_minute},close_minute=${arturHours.close_minute} WHERE id=${s(v.id)} AND (open_minute IS NOT ${arturHours.open_minute} OR close_minute IS NOT ${arturHours.close_minute});`,
  ...arturProducts.map(([key,ru,hy,ka,cost])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--artur_'+key)},${s(v.id)},${j({ru,hy,ka})},${s(c.id)},${s('artur-'+key.replaceAll('_','-'))},${j(arturProfile)},${saleOf(cost)},${cost},100000 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(c.id)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 02.11, later: the wrapper says «Sorini». Migration 0068 is applied, so the name is changed by an update of its own.
export const sorini={ru:'Конфеты Sorini',hy:'Կոնֆետ Sorini',ka:'კანფეტი Sorini'};
export function arturSoriniSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'";
 return [`UPDATE products SET names=${s(JSON.stringify(sorini))} WHERE id='akhalkalaki--artur_soreni' AND names IS NOT ${s(JSON.stringify(sorini))};`]}
// Owner 02.11, later: two new sections — «Белорусские продукты» (dairy) and «Заморозка» (shrimp, octopus) — and beer in the
// alcohol section. Dairy and beer: cost + 15% rounded up to 50 tetri (as the sweets); shrimp and octopus at the owner's own prices.
// Sold by the piece. Photos: beer from the brewers' sites, the rest cut from the owner's shelf photos (no price tags visible).
export const belarus={id:'belarus',names:{ru:'Белорусские продукты',hy:'Բելառուսական ապրանքներ',ka:'ბელარუსული პროდუქტები'},sort:76};
export const frozen={id:'frozen',names:{ru:'Заморозка',hy:'Սառեցված ապրանքներ',ka:'გაყინული პროდუქცია'},sort:77};
// [key, ru, hy, ka, category, art, cost (tetri), sale (tetri) or null = cost + 15%]
export const arturProducts3=[
 ['greco','Йогурт греческий GRECO 2%, 310 г','Հունական յոգուրտ GRECO 2%, 310 գ','ბერძნული იოგურტი GRECO 2%, 310 გ','belarus','artur-greco',400,null],
 ['tvorog_svezhie','Творог «Деревенский» «Свежие новости» 7%, 350 г','Կաթնաշոռ «Դերևենսկի» «Свежие новости» 7%, 350 գ','ხაჭო „დერევენსკი“ „Свежие новости“ 7%, 350 გ','belarus','artur-tvorog-svezhie',850,null],
 ['tvorog_babushkina','Творог «Деревенский» «Бабушкина крынка» 5%','Կաթնաշոռ «Դերևենսկի» «Бабушкина крынка» 5%','ხაჭო „დერევენსკი“ „Бабушкина крынка“ 5%','belarus','artur-tvorog-babushkina',850,null],
 ['smetana_danke15','Сметана Danke 15%','Թթվասեր Danke 15%','არაჟანი Danke 15%','belarus','artur-smetana-danke15',600,null],
 ['smetana_svezhie20','Сметана «Свежие новости» 20%','Թթվասեր «Свежие новости» 20%','არაჟანი „Свежие новости“ 20%','belarus','artur-smetana-svezhie20',600,null],
 ['smetana_danke_lf20','Сметана Danke безлактозная 20%','Թթվասեր Danke առանց լակտոզի 20%','არაჟანი Danke ულაქტოზო 20%','belarus','artur-smetana-danke-lf20',600,null],
 ['smetana_gorki26','Сметана «Молочные горки» 26%, 380 г','Թթվասեր «Молочные горки» 26%, 380 գ','არაჟანი „Молочные горки“ 26%, 380 გ','belarus','artur-smetana-gorki26',650,null],
 ['smetana_svezhie23','Сметана «Свежие новости» 23%, 380 г','Թթվասեր «Свежие новости» 23%, 380 գ','არაჟანი „Свежие новости“ 23%, 380 გ','belarus','artur-smetana-svezhie23',650,null],
 ['smetana_babushkina25','Сметана «Бабушкина крынка» 25%, 380 г','Թթվասեր «Бабушкина крынка» 25%, 380 գ','არაჟანი „Бабушкина крынка“ 25%, 380 გ','belarus','artur-smetana-babushkina25',650,null],
 ['beer_corona','Пиво Corona Extra 0,355 л','Գարեջուր Corona Extra 0,355 լ','ლუდი Corona Extra 0,355 ლ','alcohol','artur-beer-corona',500,null],
 ['beer_paulaner_weiss','Пиво Paulaner Weissbier 0,5 л','Գարեջուր Paulaner Weissbier 0,5 լ','ლუდი Paulaner Weissbier 0,5 ლ','alcohol','artur-beer-paulaner-weiss',700,null],
 ['beer_paulaner_hell','Пиво Paulaner Münchner Hell 0,5 л','Գարեջուր Paulaner Münchner Hell 0,5 լ','ლუდი Paulaner Münchner Hell 0,5 ლ','alcohol','artur-beer-paulaner-hell',700,null],
 ['shrimp_vanoni','Креветки Vanoni’s 16/20, 1 кг','Ծովախեցգետին Vanoni’s 16/20, 1 կգ','კრევეტი Vanoni’s 16/20, 1 კგ','frozen','artur-shrimp-vanoni',3500,4300],
 ['shrimp_king','Креветки в панировке King Torpedo 26/30, 1 кг','Ծովախեցգետին պանիրովկայով King Torpedo 26/30, 1 կգ','პანირებული კრევეტი King Torpedo 26/30, 1 კგ','frozen','artur-shrimp-king',4500,5300],
 ['octopus','Осьминог замороженный, лоток 5,45 кг','Ութոտնուկ սառեցված, սկուտեղ 5,45 կգ','რვაფეხა გაყინული, ლანგარი 5,45 კგ','frozen','artur-octopus',10000,12000]
];
export const arturArts3=arturProducts3.map(r=>r[5]);
export function arturSql3(){const v=arturVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [...[belarus,frozen].map(c=>`INSERT INTO categories(id,names,sort) VALUES(${s(c.id)},${j(c.names)},${c.sort}) ON CONFLICT(id) DO NOTHING;`),
  ...arturProducts3.map(([key,ru,hy,ka,category,art,cost,sale])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--artur_'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j({mode:'EACH',policy_version:1})},${sale??saleOf(cost)},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 02.11, later: kvass «Хатні» dark 1.4 l (Belarus), cost 5.50 → 6.50 (cost + 15% up to 50 tetri). Photo from an online shop.
export const kvas=['kvas_hatni','Квас «Хатні» тёмный, 1,4 л','Կվաս «Хатні» մուգ, 1,4 լ','კვასი „Хатні“ მუქი, 1,4 ლ','belarus','artur-kvas-hatni',550,null];
export function arturKvasSql(){const v=arturVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));const [key,ru,hy,ka,category,art,cost]=kvas;
 return [`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--artur_'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j({mode:'EACH',policy_version:1})},${saleOf(cost)},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`]}
// Owner 03.11: Kristall closes for now (vendor switched off, nothing deleted — switch back on to return its goods); all
// drinks and alcohol come from Artur instead. Artur's «Новые фото 1» folder: prices from the owner's sheet are the cost,
// sale = cost + 15% rounded up to 50 tetri. Volumes and weights the owner has not given yet stay out of the names.
// Photos: makers' sites (Mikoyan, CAMPA, Bellini, Rémy Martin, Bahçivan), large wine shops, Belarusian online shops;
// six items without a found photo show their section's picture until one is found.
export const kristallOffSql=()=>[`UPDATE vendors SET active=0 WHERE id='akhalkalaki-kristall' AND active=1;`];
// [key, ru, hy, ka, category, art (null = section picture), cost (tetri)]
export const arturProducts4=[
 ['hennessy_vsop_priv','Коньяк Hennessy V.S.O.P Privilège 0,5 л','Կոնյակ Hennessy V.S.O.P Privilège 0,5 լ','კონიაკი Hennessy V.S.O.P Privilège 0,5 ლ','alcohol','artur-hennessy-vsop-priv',19000],
 ['hennessy_vs','Коньяк Hennessy Very Special 1 л','Կոնյակ Hennessy Very Special 1 լ','კონიაკი Hennessy Very Special 1 ლ','alcohol','artur-hennessy-vs',20000],
 ['hennessy_vsop','Коньяк Hennessy V.S.O.P','Կոնյակ Hennessy V.S.O.P','კონიაკი Hennessy V.S.O.P','alcohol','artur-hennessy-vsop',35000],
 ['remy_vsop','Коньяк Rémy Martin V.S.O.P','Կոնյակ Rémy Martin V.S.O.P','კონიაკი Rémy Martin V.S.O.P','alcohol','artur-remy-vsop',20500],
 ['hennessy_xo','Коньяк Hennessy X.O 0,7 л','Կոնյակ Hennessy X.O 0,7 լ','კონიაკი Hennessy X.O 0,7 ლ','alcohol','artur-hennessy-xo',85000],
 ['bottega_latte','Ликёр Bottega Latte Macchiato 0,5 л','Լիկյոր Bottega Latte Macchiato 0,5 լ','ლიქიორი Bottega Latte Macchiato 0,5 ლ','alcohol','artur-bottega-latte',5000],
 ['bottega_nero','Ликёр Bottega Nero шоколадный 0,5 л','Լիկյոր Bottega Nero շոկոլադե 0,5 լ','ლიქიორი Bottega Nero შოკოლადის 0,5 ლ','alcohol','artur-bottega-nero',5000],
 ['bottega_espresso','Ликёр Bottega Espresso 0,5 л','Լիկյոր Bottega Espresso 0,5 լ','ლიქიორი Bottega Espresso 0,5 ლ','alcohol','artur-bottega-espresso',5000],
 ['bottega_limoncino','Ликёр Bottega Limoncino 0,5 л','Լիկյոր Bottega Limoncino 0,5 լ','ლიქიორი Bottega Limoncino 0,5 ლ','alcohol','artur-bottega-limoncino',5000],
 ['bottega_meloncino','Ликёр Bottega Meloncino дынный 0,5 л','Լիկյոր Bottega Meloncino սեխի 0,5 լ','ლიქიორი Bottega Meloncino ნესვის 0,5 ლ','alcohol','artur-bottega-meloncino',5000],
 ['moet_imperial','Шампанское Moët & Chandon Impérial Brut 0,75 л','Շամպայն Moët & Chandon Impérial Brut 0,75 լ','შამპანური Moët & Chandon Impérial Brut 0,75 ლ','alcohol','artur-moet-imperial',18000],
 ['moet_red','Шампанское Moët & Chandon Impérial, красная бутылка в коробке 0,75 л','Շամպայն Moët & Chandon Impérial, կարմիր շիշ տուփով 0,75 լ','შამპანური Moët & Chandon Impérial, წითელი ბოთლი ყუთში 0,75 ლ','alcohol','artur-moet-red',18000],
 ['jager_1l','Ликёр Jägermeister 1 л','Լիկյոր Jägermeister 1 լ','ლიქიორი Jägermeister 1 ლ','alcohol','artur-jager-1l',6500],
 ['jager_07','Ликёр Jägermeister 0,7 л','Լիկյոր Jägermeister 0,7 լ','ლიქიორი Jägermeister 0,7 ლ','alcohol','artur-jager-07',6000],
 ['bellini_fragola','Ликёр-крем Bellini Fragola клубничный 0,5 л','Լիկյոր-կրեմ Bellini Fragola ելակի 0,5 լ','ლიქიორ-კრემი Bellini Fragola მარწყვის 0,5 ლ','alcohol','artur-bellini-fragola',3300],
 ['bellini_limone','Ликёр-крем Bellini Limone лимонный 0,5 л','Լիկյոր-կրեմ Bellini Limone կիտրոնի 0,5 լ','ლიქიორ-კრემი Bellini Limone ლიმონის 0,5 ლ','alcohol','artur-bellini-limone',3300],
 ['bellini_cioccolato','Ликёр-крем Bellini Cioccolato шоколадный 0,5 л','Լիկյոր-կրեմ Bellini Cioccolato շոկոլադե 0,5 լ','ლიქიორ-კრემი Bellini Cioccolato შოკოლადის 0,5 ლ','alcohol','artur-bellini-cioccolato',3300],
 ['martini_asti','Игристое Martini Asti 0,75 л','Փրփրուն գինի Martini Asti 0,75 լ','ცქრიალა Martini Asti 0,75 ლ','alcohol','artur-martini-asti',4000],
 ['martini_prosecco','Игристое Martini Prosecco 0,75 л','Փրփրուն գինի Martini Prosecco 0,75 լ','ცქრიალა Martini Prosecco 0,75 ლ','alcohol','artur-martini-prosecco',4000],
 ['martini_rose','Игристое Martini Rosé 0,75 л','Փրփրուն գինի Martini Rosé 0,75 լ','ცქრიალა Martini Rosé 0,75 ლ','alcohol','artur-martini-rose',5000],
 ['fanta_glass','Fanta, стекло 0,33 л','Fanta, ապակե շիշ 0,33 լ','Fanta, მინის ბოთლი 0,33 ლ','drinks','artur-fanta-glass',170],
 ['coke_glass','Coca-Cola Classic, стекло 0,33 л','Coca-Cola Classic, ապակե շիշ 0,33 լ','Coca-Cola Classic, მინის ბოთლი 0,33 ლ','drinks','artur-coke-glass',170],
 ['coke_zero_glass','Coca-Cola Zero, стекло 0,33 л','Coca-Cola Zero, ապակե շիշ 0,33 լ','Coca-Cola Zero, მინის ბოთლი 0,33 ლ','drinks','artur-coke-zero-glass',170],
 ['campa_apple','Сок CAMPA яблочный 100% 0,75 л','Հյութ CAMPA խնձորի 100% 0,75 լ','წვენი CAMPA ვაშლის 100% 0,75 ლ','drinks','artur-campa-apple',750],
 ['campa_cherry','Нектар CAMPA вишнёвый 0,75 л','Նեկտար CAMPA բալի 0,75 լ','ნექტარი CAMPA ალუბლის 0,75 ლ','drinks','artur-campa-cherry',750],
 ['campa_orange','Сок CAMPA апельсиновый 0,75 л','Հյութ CAMPA նարնջի 0,75 լ','წვენი CAMPA ფორთოხლის 0,75 ლ','drinks','artur-campa-orange',750],
 ['mikoyan_moskovskiy','Сервелат «Московский» Микоян','Սերվելատ «Մոսկովսկի» Միկոյան','სერველატი „მოსკოვსკი“ მიქოიანი','deli','artur-mikoyan-moskovskiy',2000],
 ['mikoyan_rublenaya','Колбаса варёно-копчёная «Рубленая» Микоян','Երշիկ եփած-ապխտած «Ռուբլենայա» Միկոյան','ძეხვი მოხარშულ-შებოლილი „რუბლენაია“ მიქოიანი','deli','artur-mikoyan-rublenaya',2500],
 ['brest_kremlevskaya','Колбаса «Кремлёвская» Брестский мясокомбинат','Երշիկ «Կրեմլյովսկայա» Բրեստի մսկոմբինատ','ძეხვი „კრემლიოვსკაია“ ბრესტის ხორცკომბინატი','belarus','artur-brest-kremlevskaya',1700],
 ['mikoyan_belorusskaya','Колбаса сырокопчёная «Белорусская» Микоян','Երշիկ հում ապխտած «Բելոռուսսկայա» Միկոյան','ნედლად შებოლილი ძეხვი „ბელორუსკაია“ მიქოიანი','deli','artur-mikoyan-belorusskaya',2000],
 ['alan_ukrainska','Колбаса сырокопчёная «Українська» АЛАН','Երշիկ հում ապխտած «Ուկրաինսկա» ԱԼԱՆ','ნედლად შებოლილი ძეხვი „უკრაინსკა“ ალანი','deli',null,2200],
 ['mikoyan_shpikachki','Шпикачки «Мясные» Микоян','Շպիկաչկի «Միասնիե» Միկոյան','შპიკაჩკები „მიასნიე“ მიქოიანი','deli','artur-mikoyan-shpikachki',2200],
 ['mikoyan_sosiski','Сосиски «Кремлёвские» Микоян','Նրբերշիկ «Կրեմլյովսկիե» Միկոյան','სოსისი „კრემლიოვსკიე“ მიქოიანი','deli','artur-mikoyan-sosiski-kremlevskie',2200],
 ['grodno_minskaya','Колбаса сырокопчёная «Минская» Гродненский мясокомбинат','Երշիկ հում ապխտած «Մինսկայա» Գրոդնոյի մսկոմբինատ','ნედლად შებოლილი ძეხვი „მინსკაია“ გროდნოს ხორცკომბინატი','belarus','artur-grodno-minskaya',3000],
 ['brest_nikolskie','Сосиски «Никольские» Брестский мясокомбинат','Նրբերշիկ «Նիկոլսկիե» Բրեստի մսկոմբինատ','სოსისი „ნიკოლსკიე“ ბრესტის ხორცკომბინატი','belarus','artur-brest-nikolskie',2600],
 ['brest_sardelki','Сардельки «С телятиной» Брестский мясокомбинат','Սարդելկա «Հորթի մսով» Բրեստի մսկոմբինատ','სარდელი „ხბოს ხორცით“ ბრესტის ხორცკომბინატი','belarus',null,2600],
 ['sb_seledochka','Селёдочка «А-ля лосось» Санта Бремор','Ծովատառեխ «Ա-լյա սաղմոն» Սանտա Բրեմոր','ქაშაყი „ა-ლია ორაგული“ სანტა ბრემორი','belarus','artur-sb-seledochka',600],
 ['sb_krevetki','Королевские креветки в заливке Санта Бремор','Արքայական ծովախեցգետին լցոնով Սանտա Բրեմոր','სამეფო კრევეტი ჩასხმაში სანტა ბრემორი','belarus','artur-sb-krevetki',1200],
 ['sb_osminogi','Осьминоги в заливке Санта Бремор','Ութոտնուկներ լցոնով Սանտա Բրեմոր','რვაფეხები ჩასხმაში სანტა ბრემორი','belarus','artur-sb-osminogi',1200],
 ['sb_mix','Морской микс в масле Санта Բремор'.replace('Բ','Б'),'Ծովային միքս ձեթով Սանտա Բրեմոր','ზღვის მიქსი ზეთში სანტა ბრემორი','belarus','artur-sb-mix-oil',1000],
 ['gouda_mlekpol','Сыр Gouda в нарезке Mlekpol 1 кг','Պանիր Gouda կտրատած Mlekpol 1 կգ','ყველი Gouda დაჭრილი Mlekpol 1 კგ','dairy',null,3300],
 ['bonfesto_slivochny','Крем-сыр Bonfesto сливочный','Կրեմ-պանիր Bonfesto սերուցքային','კრემ-ყველი Bonfesto ნაღების','belarus','artur-bonfesto-slivochny',700],
 ['bonfesto_truffle','Крем-сыр Bonfesto с трюфелем','Կրեմ-պանիր Bonfesto տրյուֆելով','კრემ-ყველი Bonfesto ტრიუფელით','belarus','artur-bonfesto-truffle',700],
 ['kefir_35','Кефир «Бабушкина крынка» 3,5%','Կեֆիր «Բաբուշկինա կրինկա» 3,5%','კეფირი „ბაბუშკინა კრინკა“ 3,5%','belarus','artur-kefir-35',500],
 ['kefir_1','Кефир «Бабушкина крынка» 1%','Կեֆիր «Բաբուշկինա կրինկա» 1%','კეფირი „ბაბუშკინა კრინკა“ 1%','belarus','artur-kefir-1',500],
 ['bonfesto_mascarpone','Маскарпоне Bonfesto Cooking','Մասկարպոնե Bonfesto Cooking','მასკარპონე Bonfesto Cooking','belarus',null,1600],
 ['bahcivan_toplar','Сырные шарики Bahçivan 200 г','Պանրի գնդիկներ Bahçivan 200 գ','ყველის ბურთულები Bahçivan 200 გ','dairy','artur-bahcivan-toplar',1000]
];
export const arturArts4=[...new Set(arturProducts4.map(r=>r[5]).filter(Boolean))];
export function arturSql4(){const v=arturVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [...kristallOffSql(),...arturProducts4.map(([key,ru,hy,ka,category,art,cost])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--artur_'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art||'artur-'+key.replaceAll('_','-'))},${j({mode:'EACH',policy_version:1})},${saleOf(cost)},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
export const arturArtsWithoutPhoto4=arturProducts4.filter(r=>!r[5]).map(r=>'artur-'+r[0].replaceAll('_','-'));
