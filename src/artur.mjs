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
 ['roshcha','Конфеты «Ореховая роща»','Կոնֆետ «Ընկուզենու պուրակ»','კანფეტი „თხილის კორომი“',3500,false],
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
 ['ogni','Конфеты «Огни Москвы»','Կոնֆետ «Մոսկվայի լույսեր»','კანფეტი „მოსკოვის შუქები“',3500,false],
 ['vals','Конфеты «Осенний вальс»','Կոնֆետ «Աշնանային վալս»','კანფეტი „შემოდგომის ვალსი“',3500,true],
 ['pm_cappuccino','«Птичье молоко» вкус капучино','«Թռչնի կաթ» կապուչինոյի համով','„ჩიტის რძე“ კაპუჩინოს გემოთი',3500,true],
 ['pm_choc','«Птичье молоко» вкус шоколада','«Թռչնի կաթ» շոկոլադի համով','„ჩიტის რძე“ შოკოლადის გემოთი',3500,true],
 ['pm_vanilla','«Птичье молоко» сливочно-ванильное','«Թռչնի կաթ» սերուցքա-վանիլային','„ჩიტის რძე“ ნაღების და ვანილის',3500,true],
 ['halva_minn','Халва МИНН','Հալվա ՄԻՆՆ','ჰალვა „მინ“',3500,false],
 ['cherry_liqueur','Конфеты «Вишня в ликёре»','Կոնֆետ «Բալ լիկյորում»','კანფეტი „ალუბალი ლიქიორში“',3500,false],
 ['zabegai','Конфеты «Забегай на чай»','Կոնֆետ «Մտիր թեյի»','კანფეტი „შემოიარე ჩაიზე“',3500,false],
 ['halva','Халва','Հալվա','ჰალვა',3500,true],
 ['soreni','Конфеты Soreni','Կոնֆետ Soreni','კანფეტი Soreni',3500,false],
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
