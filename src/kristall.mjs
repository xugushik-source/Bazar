// «Кристалл»: drinks distributor of the owner's «Пивка для рывка» (codes KRI-, owner 24.10: «все напитки с такой же логикой»).
// Costs and sale prices are the owner's, as in the Pivka price sheet «Товары»; Ararat and Noy brandies are already sold via Amo
// and Garri Vilikovich, so they are not repeated. Photos are the Pivka catalogue's; the wines have none there yet.
export const kristallVendor={id:'akhalkalaki-kristall',city_id:'akhalkalaki',names:{ru:'Кристалл',hy:'Քրիստալ',ka:'კრისტალი'}};
const asst={ru:', в ассортименте',hy:', տեսականի',ka:', ასორტიმენტი'};
const plain=(brand,v,extra={ru:'',hy:'',ka:''})=>[`${brand}${extra.ru} ${v} л`,`${brand}${extra.hy} ${v} լ`,`${brand}${extra.ka} ${v} ლ`];
const kind=(ru,hy,ka)=>(brand,v,tail={ru:'',hy:'',ka:''})=>[`${ru} ${brand} ${v} л${tail.ru}`,`${hy} ${brand} ${v} լ${tail.hy}`,`${ka} ${brand} ${v} ლ${tail.ka}`];
const energy=kind('Энергетик','Էներգետիկ','ენერგეტიკი'),mineral=kind('Минеральная вода','Հանքային ջուր','მინერალური წყალი'),water=kind('Вода','Ջուր','წყალი');
const juice=kind('Сок','Հյութ','წვენი'),vodka=kind('Водка','Օղի','არაყი');
// [key, [ru, hy, ka], category, art, cost, price, photo in the owner's Pivka catalogue]
export const kristallProducts=[
 ['kri_cola_050',plain('Coca-Cola','0,5'),'drinks','kri-cola-050',170,250,'coca-cola-050.jpg'],
 ['kri_fanta_050',plain('Fanta','0,5'),'drinks','kri-fanta-050',170,250,'fanta-050.jpg'],
 ['kri_sprite_050',plain('Sprite','0,5'),'drinks','kri-sprite-050',170,250,'sprite-050.jpg'],
 ['kri_pepsi_050',plain('Pepsi','0,5'),'drinks','kri-pepsi-050',150,200,'pepsi-050.jpg'],
 ['kri_mirinda_050',plain('Mirinda','0,5',{ru:' Зелёное яблоко',hy:' Կանաչ խնձոր',ka:' მწვანე ვაშლი'}),'drinks','kri-mirinda-050',150,200,'mirinda-green-apple-050.jpg'],
 ['kri_mirinda_orange_050',plain('Mirinda','0,5',{ru:' Апельсин',hy:' Նարինջ',ka:' ფორთოხალი'}),'drinks','kri-mirinda-orange-050',150,200,'mirinda-orange-050.jpg'],
 ['kri_laimon_050',plain('Laimon Fresh','0,5'),'drinks','kri-laimon-050',250,300,'laimon-fresh-050.jpg'],
 ['kri_boom_100',kind('Лимонад','Լիմոնադ','ლიმონათი')('BOOM','1',asst),'drinks','kri-boom-100',120,200,'boom-lemonade-100.jpg'],
 ['kri_ararat_juice_075',juice('Ararat','0,75',{ru:', стекло',hy:', ապակե շիշ',ka:', მინის ბოთლი'}),'drinks','kri-ararat-juice-075',550,800,'ararat-075.jpg'],
 ['kri_ararat_premium_097',juice('Ararat Premium','0,97'),'drinks','kri-ararat-premium-097',500,750,'ararat-premium-097.jpg'],
 ['kri_ararat_compote_100',kind('Компот','Կոմպոտ','კომპოტი')('Ararat','1',asst),'drinks','kri-ararat-compote-100',600,750,'ararat-compote-100.jpg'],
 ['kri_cappy',['Сок Cappy, в ассортименте','Հյութ Cappy, տեսականի','წვენი Cappy, ასორტიმენტი'],'drinks','kri-cappy',250,350,'cappy-050.jpg'],
 ['kri_likani_060',mineral('Likani','0,6'),'drinks','kri-likani-060',130,200,'likani-060.jpg'],
 ['kri_likani_100',mineral('Likani','1'),'drinks','kri-likani-100',180,250,'likani-100.jpg'],
 ['kri_nabeglavi_050',mineral('Nabeglavi','0,5'),'drinks','kri-nabeglavi-050',150,200,'nabeglavi-050.jpg'],
 ['kri_nabeglavi_100',mineral('Nabeglavi','1'),'drinks','kri-nabeglavi-100',200,300,'nabeglavi-100.jpg'],
 ['kri_sno_050',water('Sno','0,5'),'drinks','kri-sno-050',80,150,'sno-050.jpg'],
 ['kri_sno_100',water('Sno','1'),'drinks','kri-sno-100',120,150,'sno-100.jpg'],
 ['kri_redbull_025',energy('Red Bull','0,25'),'drinks','kri-redbull-025',430,550,'red-bull-025.jpg'],
 ['kri_burn_025',energy('Burn','0,25'),'drinks','kri-burn-025',230,350,'burn-025.jpg'],
 ['kri_bum_fire_033',energy('BUM Fire','0,33'),'drinks','kri-bum-fire-033',170,250,'bum-fire-033.jpg'],
 ['kri_moonwalker_024',kind('Холодный кофе','Սառը սուրճ','ცივი ყავა')('Moon Walker','0,24',asst),'drinks','kri-moonwalker-024',350,500,'moon-walker-024.jpg'],
 ['kri_absolut_050',vodka('Absolut','0,5'),'alcohol','kri-absolut-050',2500,3000,'absolut-050.jpg'],
 ['kri_fortuna_gold_050',vodka('Fortuna Gold','0,5'),'alcohol','kri-fortuna-gold-050',1800,2200,'fortuna-gold-050.jpg'],
 ['kri_fortuna_premium_050',vodka('Fortuna Premium','0,5'),'alcohol','kri-fortuna-premium-050',2500,2900,'fortuna-premium-050.jpg'],
 ['kri_tchaikovsky_050',vodka('Tchaikovsky','0,5'),'alcohol','kri-tchaikovsky-050',2500,3000,'tchaikovsky-050.jpg'],
 ['kri_uglevka_050',['Водка «Углёвка» 0,5 л','Օղի «Ուգլյովկա» 0,5 լ','არაყი „უგლიოვკა“ 0,5 ლ'],'alcohol','kri-uglevka-050',1700,2000,'uglevka-050.jpg'],
 ['kri_uglevka_070',['Водка «Углёвка» 0,7 л','Օղի «Ուգլյովկա» 0,7 լ','არაყი „უგლიოვკა“ 0,7 ლ'],'alcohol','kri-uglevka-070',2100,2500,'uglevka-070.jpg'],
 ['kri_tsarskaya_gold_050',['Водка «Царская» Золотая 0,5 л','Օղի «Ցարսկայա» Ոսկե 0,5 լ','არაყი „ცარსკაია“ ოქროს 0,5 ლ'],'alcohol','kri-tsarskaya-gold-050',2500,3000,'tsarskaya-gold-050.jpg'],
 ['kri_tsarskaya_original_050',['Водка «Царская» Оригинальная 0,5 л','Օղի «Ցարսկայա» Օրիգինալ 0,5 լ','არაყი „ცარსკაია“ ორიგინალი 0,5 ლ'],'alcohol','kri-tsarskaya-original-050',1800,2300,'tsarskaya-original-050.jpg'],
 ['kri_chistye_rosy_050',['Водка «Чистые росы» 0,5 л','Օղի «Չիստիե ռոսի» 0,5 լ','არაყი „ჩისტიე როსი“ 0,5 ლ'],'alcohol','kri-chistye-rosy-050',6000,7000,'chistye-rosy-050.jpg'],
 ['kri_jack_daniels_050',kind('Виски','Վիսկի','ვისკი')("Jack Daniel's Old No. 7",'0,5'),'alcohol','kri-jack-daniels-050',6000,7000,'jack-daniels-050.jpg'],
 ['kri_jagermeister_050',kind('Ликёр','Լիկյոր','ლიქიორი')('Jägermeister','0,5'),'alcohol','kri-jagermeister-050',3500,4000,'jagermeister-050.jpg'],
 ['kri_martini_bianco_050',kind('Вермут','Վերմուտ','ვერმუტი')('Martini Bianco','0,5'),'alcohol','kri-martini-bianco-050',2500,2900,'martini-bianco.jpg'],
 ['kri_wine_kisi_075',['Вино Kisi белое 0,75 л','Գինի Kisi սպիտակ 0,75 լ','ღვინო ქისი თეთრი 0,75 ლ'],'alcohol','kri-wine-kisi-075',2000,2500],
 ['kri_wine_sm_saperavi_075',['Вино SM Саперави 0,75 л','Գինի SM Սափերավի 0,75 լ','ღვინო SM საფერავი 0,75 ლ'],'alcohol','kri-wine-sm-saperavi-075',1300,1600],
 ['kri_wine_sm_rkatsiteli_075',['Вино SM Ркацители 0,75 л','Գինի SM Ռքածիթելի 0,75 լ','ღვინო SM რქაწითელი 0,75 ლ'],'alcohol','kri-wine-sm-rkatsiteli-075',1200,1500],
 ['kri_wine_mukuzani_075',['Вино «Мукузани» красное 0,75 л','Գինի «Մուկուզանի» կարմիր 0,75 լ','ღვინო „მუკუზანი“ წითელი 0,75 ლ'],'alcohol','kri-wine-mukuzani-075',2300,2800],
 ['kri_wine_saperavi_rose_075',['Вино Саперави розовое 0,75 л','Գինի Սափերավի վարդագույն 0,75 լ','ღვინო საფერავი ვარდისფერი 0,75 ლ'],'alcohol','kri-wine-saperavi-rose-075',1350,1800],
 ['kri_wine_saperavi_075',['Вино Саперави красное 0,75 л','Գինի Սափերավի կարմիր 0,75 լ','ღვინო საფერავი წითელი 0,75 ლ'],'alcohol','kri-wine-saperavi-075',1500,1900]
];
export const kristallProfiles=Object.fromEntries(kristallProducts.map(r=>[r[0],'each']));
export const kristallArts=kristallProducts.map(r=>r[3]);
// Until the owner sends wine photos the card shows the alcohol section's bottle.
export const kristallArtsWithoutPhoto=kristallProducts.filter(r=>!r[6]).map(r=>r[3]);
export function kristallSql(profileFor){const v=kristallVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`,
  ...kristallProducts.map(([key,[ru,hy,ka],category,art,cost,price])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profileFor(key))},${price},${cost},100 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
