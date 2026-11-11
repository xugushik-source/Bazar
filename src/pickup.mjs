// Owner 11.11: couriers do not know the suppliers by address, so every courier message says where to pick the goods up.
export const pickups={
 'akhalkalaki-karo':{ru:'Джавахетская улица, Каро — «Фруктовый сад»',hy:'Ջավախքի փողոց, Կարո՝ «Պտղատու այգի»',ka:'ჯავახეთის ქუჩა, კარო — „ხილის ბაღი“'},
 'akhalkalaki-garden':{ru:'Джавахетская улица, Каро — «Фруктовый сад»',hy:'Ջավախքի փողոց, Կարո՝ «Պտղատու այգի»',ka:'ჯავახეთის ქუჩა, კარო — „ხილის ბაღი“'},
 'akhalkalaki-amo':{ru:'Вход на базар, справа — Мясной пассаж',hy:'Շուկայի մուտքի աջ կողմում՝ Մսի անցուղի',ka:'ბაზრის შესასვლელთან, მარჯვნივ — ხორცის გადასასვლელი'},
 'akhalkalaki-vypechka':{ru:'Мясникяна, 16, рядом с Вови',hy:'Մյասնիկյան 16, Վովիի մոտ',ka:'მიასნიკიანის 16, ვოვისთან'},
 'akhalkalaki-artur':{ru:'У Пло, чуть ниже по улице Свободы от рынка — магазин Партез',hy:'Պլոյի մոտ, Ազատության փողոցով շուկայից մի փոքր ներքև՝ «Պարտեզ» խանութ',ka:'პლოსთან, თავისუფლების ქუჩაზე ბაზრიდან ოდნავ დაბლა — მაღაზია „პარტეზი“'},
 'akhalkalaki-mtsco':{ru:'Угол рынка снаружи, у обменника',hy:'Շուկայի անկյունում դրսից՝ փոխանակման կետի մոտ',ka:'ბაზრის კუთხეში, გარედან, გადამცვლელთან'}};
export const pickupColumnSql='ALTER TABLE vendors ADD COLUMN pickup TEXT;';
export function pickupSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'";return Object.entries(pickups).map(([id,o])=>`UPDATE vendors SET pickup=${s(JSON.stringify(o))} WHERE id=${s(id)} AND (pickup IS NULL OR pickup<>${s(JSON.stringify(o))});`)}
