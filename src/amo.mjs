// «Амо», Ахалкалаки: мясо (owner 22.10). Amo gives Bazar 10% off its listed price — that is the cost; Bazar sells at the listed
// price + 5%, rounded up to 10 tetri. Listed prices are per kg unless the product is sold by the piece.
export const amoVendor={id:'akhalkalaki-amo',city_id:'akhalkalaki',names:{ru:'Амо',hy:'Ամո',ka:'ამო'}};
export const amoCost=list=>Math.round(list*0.9),amoPrice=list=>Math.ceil(Math.round(list*1.05)/10)*10;
// [key, ru, hy, ka, category, art, profile, listed price in tetri]
export const amoProducts=[
 ['beef_bone_in','Говядина на кости','Տավարի միս՝ ոսկորով','საქონლის ხორცი ძვლით','meat','beef-bone-in','loose',2800],
 ['beef_boneless','Говядина мякоть','Տավարի փափուկ միս','საქონლის რბილი ხორცი','meat','beef-boneless','loose',3300],
 ['pork_bone_in','Свинина на кости','Խոզի միս՝ ոսկորով','ღორის ხორცი ძვლით','meat','pork-bone-in','loose',2000],
 ['pork_loin','Свинина корейка','Խոզի կոտլետային մաս (կորեյկա)','ღორის კორეიკა','meat','pork-loin','loose',2200],
 ['pork_boneless','Свинина мякоть','Խոզի փափուկ միս','ღორის რბილი ხორცი','meat','pork-boneless','loose',2400],
 ['pork_mince','Фарш свиной','Խոզի աղացած միս','ღორის ფარში','meat','pork-mince','loose',2400],
 ['beef_mince','Фарш говяжий','Տավարի աղացած միս','საქონლის ფარში','meat','beef-mince','loose',3300],
 ['tongue_each','Язык, полуфабрикат · штука','Լեզու, կիսաֆաբրիկատ · հատ','ენა, ნახევარფაბრიკატი · ცალი','meat','tongue','each',1500],
 ['pork_offal','Субпродукты свиные','Խոզի ենթամթերք','ღორის სუბპროდუქტები','meat','pork-offal','loose',700],
 ['lard_thin','Сало тонкое','Բարակ ճարպ (սալո)','თხელი ქონი','meat','lard-thin','loose',300],
 ['lard_thick','Сало толстое','Հաստ ճարպ (սալո)','სქელი ქონი','meat','lard-thick','loose',400],
 ['lard_smoked','Сало копчёное','Ապխտած ճարպ (սալո)','შებოლილი ქონი','meat','lard-smoked','loose',2000],
 ['kupaty','Купаты (говядина и свинина)','Կուպատի (տավար և խոզ)','კუპატი (საქონელი და ღორი)','meat','kupaty','loose',2200],
 ['kholodets_set','Набор для холодца: голова и 4 ножки','Խոլոդեցի հավաքածու՝ գլուխ և 4 ոտք','ხოლოდეცის ნაკრები: თავი და 4 ფეხი','meat','kholodets-set','each',1500],
 ['beef_head','Голова говяжья · штука','Տավարի գլուխ · հատ','საქონლის თავი · ცალი','meat','beef-head','each',6000],
 ['khash_set','Набор для хаша: 4 ноги и желудок','Խաշի հավաքածու՝ 4 ոտք և ստամոքս','ხაშის ნაკრები: 4 ფეხი და კუჭი','meat','khash-set','loose',1000],
 ['pork_trotters','Свиные ножки','Խոզի ոտքեր','ღორის ფეხები','meat','pork-trotters','loose',1000],
 ['lyulya_chicken','Люля-кебаб куриный, полуфабрикат','Հավի լյուլյա-քաբաբ, կիսաֆաբրիկատ','ქათმის ლულა-ქაბაბი, ნახევარფაბრიკატი','meat','lyulya-chicken','loose',2000],
 ['shashlik_loin','Шашлык из корейки, маринованный','Կորեյկայից խորոված, մարինացված','მწვადი კორეიკისგან, მარინადში','meat','shashlik-loin','loose',2300],
 ['shashlik_pork','Мякоть свинины маринованная','Մարինացված խոզի փափուկ միս','მარინადში ღორის რბილი ხორცი','meat','shashlik-pork','loose',2400],
 ['shashlik_bone','Свинина маринованная с косточкой','Մարինացված խոզի միս՝ ոսկորով','მარინადში ღორის ხორცი ძვლით','meat','shashlik-bone','loose',2200],
 ['dog_bones','Кости для собак','Ոսկորներ շների համար','ძვლები ძაღლებისთვის','meat','dog-bones','loose',200],
 ['oxtail','Хвост говяжий','Տավարի պոչ','საქონლის კუდი','meat','oxtail','loose',2000],
 ['charcoal_4kg','Уголь для мангала · мешок 4 кг','Փայտածուխ մանղալի համար · պարկ 4 կգ','ნახშირი მაყალისთვის · ტომარა 4 კგ','household','charcoal','each',1500]
];
export const amoProfiles=Object.fromEntries(amoProducts.map(r=>[r[0],r[6]]));
export const amoArts=amoProducts.map(r=>r[5]);
// No suitable free photo yet (owner may send his own); the shop shows «Фото временно недоступно» for these.
export const amoArtsWithoutPhoto=['tongue','pork-offal','kholodets-set','beef-head','oxtail','lyulya-chicken'];
export function amoSql(profileFor){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),out=[];
 out.push(`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`);
 for(const [key,ru,hy,ka,category,art,,list]of amoProducts){const profile=profileFor(key),weighted=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(profile.mode);
  out.push(`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profile)},${amoPrice(list)},${amoCost(list)},${weighted?100000:50} WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)}
 return out}
