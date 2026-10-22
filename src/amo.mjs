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
// No suitable free photo yet (owner may send his own); the shop shows «Фото временно недоступно» for these.
export const amoArtsWithoutPhoto=['pork-offal','kholodets-set','beef-spleen','pork-spleen'];
export function amoSql(profileFor){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),out=[];
 out.push(`INSERT INTO vendors(id,city_id,names) SELECT ${s(v.id)},${s(v.city_id)},${j(v.names)} WHERE EXISTS(SELECT 1 FROM cities WHERE id=${s(v.city_id)}) ON CONFLICT(id) DO NOTHING;`);
 for(const [key,ru,hy,ka,category,art,,list]of amoProducts){const profile=profileFor(key),weighted=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(profile.mode);
  out.push(`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profile)},${amoPrice(list)},${amoCost(list)},${weighted?100000:50} WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)}
 return out}
// Owner 22.10, later: clearer names; offal sold separately (beef 10 ₾/kg, pork 7 ₾/kg) instead of one «Субпродукты свиные».
export const amoRenames={
 pork_bone_in:{ru:'Свинина мякоть с костью',hy:'Խոզի փափուկ միս՝ ոսկորով',ka:'ღორის რბილი ხორცი ძვლით'},
 tongue_each:{ru:'Язык говяжий · штука',hy:'Տավարի լեզու · հատ',ka:'საქონლის ენა · ცალი'},
 kholodets_set:{ru:'Набор для холодца, полуфабрикат: свиная голова и 4 ножки',hy:'Խոլոդեցի հավաքածու, կիսաֆաբրիկատ՝ խոզի գլուխ և 4 ոտք',ka:'ხოლოდეცის ნაკრები, ნახევარფაბრიკატი: ღორის თავი და 4 ფეხი'}
};
export const amoOffal=[
 ['beef_heart','Сердце говяжье','Տավարի սիրտ','საქონლის გული','meat','beef-heart','loose',1000],
 ['beef_kidneys','Почки говяжьи','Տավարի երիկամներ','საქონლის თირკმელები','meat','beef-kidneys','loose',1000],
 ['beef_liver','Печень говяжья','Տավարի լյարդ','საქონლის ღვიძლი','meat','beef-liver','loose',1000],
 ['beef_spleen','Селезёнка говяжья','Տավարի փայծաղ','საქონლის ელენთა','meat','beef-spleen','loose',1000],
 ['pork_heart','Сердце свиное','Խոզի սիրտ','ღორის გული','meat','pork-heart','loose',700],
 ['pork_kidneys','Почки свиные','Խոզի երիկամներ','ღორის თირკმელები','meat','pork-kidneys','loose',700],
 ['pork_liver','Печень свиная','Խոզի լյարդ','ღორის ღვიძლი','meat','pork-liver','loose',700],
 ['pork_spleen','Селезёнка свиная','Խոզի փայծաղ','ღორის ელენთა','meat','pork-spleen','loose',700]
];
export const amoRetired=['pork_offal'];
export const amoOffalArts=amoOffal.map(r=>r[5]);
export function amoUpdateSql(profileFor){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),out=[];
 for(const [key,names]of Object.entries(amoRenames))out.push(`UPDATE products SET names=${j(names)},version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND names<>${j(names)};`);
 for(const [key,ru,hy,ka,category,art,,list]of amoOffal){const profile=profileFor(key);out.push(`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profile)},${amoPrice(list)},${amoCost(list)},100000 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)}
 for(const key of amoRetired)out.push(`UPDATE products SET active=0,version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND active=1;`);
 return out}
// Owner 22.10, later: lyulya and cutlets sold by the piece, 250 g each — beef and pork 50/50 at Amo 6 ₾ a piece; chicken lyulya
// at 20 ₾/kg ÷ 4 = 5 ₾ a piece, replacing the per-kg chicken lyulya.
export const amoPieces=[
 ['lyulya_beef_pork_each','Люля-кебаб говядина и свинина 50/50, полуфабрикат · штука 250 г','Լյուլյա-քաբաբ տավար և խոզ 50/50, կիսաֆաբրիկատ · հատ 250 գ','ლულა-ქაბაბი საქონელი და ღორი 50/50, ნახევარფაბრიკატი · ცალი 250 გ','meat','lyulya-beef-pork','each',600],
 ['cutlet_beef_pork_each','Котлета говядина и свинина 50/50, полуфабрикат · штука 250 г','Կոտլետ տավար և խոզ 50/50, կիսաֆաբրիկատ · հատ 250 գ','კოტლეტი საქონელი და ღორი 50/50, ნახევარფაბრიკატი · ცალი 250 გ','meat','cutlet-beef-pork','each',600],
 ['lyulya_chicken_each','Люля-кебаб куриный, полуфабрикат · штука 250 г','Հավի լյուլյա-քաբաբ, կիսաֆաբրիկատ · հատ 250 գ','ქათმის ლულა-ქაბაბი, ნახევარფაბრიკატი · ცალი 250 გ','meat','lyulya-chicken','each',500]
];
export const amoPiecesRetired=['lyulya_chicken'];
export function amoPiecesSql(profileFor){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));return [...amoPiecesRetired.map(key=>`UPDATE products SET active=0,version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND active=1;`),...amoPieces.map(([key,ru,hy,ka,category,art,,list])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profileFor(key))},${amoPrice(list)},${amoCost(list)},50 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 22.10, later: the kholodets set is retired — buyers pick the parts themselves: pork trotters stay by weight (10 ₾/kg),
// the pork head is sold whole at Amo 10 ₾ a piece.
export const amoSplit=[
 ['pork_head','Голова свиная · штука','Խոզի գլուխ · հատ','ღორის თავი · ცალი','meat','pork-head','each',1000]
];
export const amoSplitRetired=['kholodets_set'];
export function amoSplitSql(profileFor){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));return [...amoSplitRetired.map(key=>`UPDATE products SET active=0,version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND active=1;`),...amoSplit.map(([key,ru,hy,ka,category,art,,list])=>`INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${s(v.city_id+'--'+key)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j(profileFor(key))},${amoPrice50(list)},${amoCost(list)},50 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`)]}
// Owner 22.10, later: pork spleen is no longer sold.
export const amoRemoved=['pork_spleen'];
export function amoRemovedSql(){const v=amoVendor;return amoRemoved.map(key=>`UPDATE products SET active=0,version=version+1 WHERE id='${v.city_id}--${key}' AND active=1;`)}
// Owner 22.10, later: sale prices the owner sets by hand instead of listed + 5% (dog bones 3 ₾/kg; cost stays listed − 10%).
export const amoPriceOverrides={dog_bones:300};
export function amoOverrideSql(){const v=amoVendor,rows=Object.fromEntries([...amoProducts,...amoOffal,...amoPieces,...amoSplit].map(r=>[r[0],r[7]]));return Object.entries(amoPriceOverrides).map(([key,price])=>`UPDATE products SET price=${price},version=version+1 WHERE id='${v.city_id}--${key}' AND vendor_id='${v.id}' AND cost=${amoCost(rows[key])} AND price<>${price};`)}
export const amoProfiles=Object.fromEntries([...amoProducts,...amoOffal,...amoPieces,...amoSplit].map(r=>[r[0],r[6]]));
export const amoArts=[...amoProducts,...amoOffal,...amoPieces,...amoSplit].map(r=>r[5]);
// Owner 22.10, later: the lyulya is 80% beef and 20% lard (not beef and pork 50/50); price unchanged.
export const amoLyulyaNames={lyulya_beef_pork_each:{ru:'Люля-кебаб: 80% говядины, 20% сала, полуфабрикат · штука 250 г',hy:'Լյուլյա-քաբաբ՝ 80% տավար, 20% ճարպ, կիսաֆաբրիկատ · հատ 250 գ',ka:'ლულა-ქაბაბი: 80% საქონელი, 20% ქონი, ნახევარფაბრიკატი · ცალი 250 გ'}};
export function amoLyulyaSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'";return Object.entries(amoLyulyaNames).map(([key,names])=>`UPDATE products SET names=${s(JSON.stringify(names))},version=version+1 WHERE id=${s(amoVendor.city_id+'--'+key)} AND names<>${s(JSON.stringify(names))};`)}
// Owner 22.10, later: meat prices round up to 50 tetri (6.10 → 6.50) and meat sold by weight starts at 1 kg (then 100 g steps).
// Charcoal rounds the same way. Rows keep their recorded cost; only those still at it are repriced.
export const amoPrice50=list=>Math.ceil(list*105/5000)*50;
export function amoMeatSql(profiles,overrides={}){const v=amoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),gone=[...amoRetired,...amoPiecesRetired];
 return [...amoProducts,...amoOffal,...amoPieces].filter(r=>(r[4]==='meat'||r[0]==='charcoal_4kg')&&!gone.includes(r[0])).map(([key,,,,,,profile,list])=>[key,profile,list,overrides[key]??amoPrice50(list)]).map(([key,profile,list,price])=>`UPDATE products SET price=${price},${profile==='loose'?`profile=${j(profiles.meat)},`:''}version=version+1 WHERE id=${s(v.city_id+'--'+key)} AND vendor_id=${s(v.id)} AND cost=${amoCost(list)} AND (price<>${price}${profile==='loose'?` OR profile<>${j(profiles.meat)}`:''});`)}
// Owner 22.10, later: Amo works 09:00–18:00. Orders with Amo goods are delivered from an hour after opening; the last slot is 17:40.
export const amoHours={open_minute:540,close_minute:1080};
export function amoHoursSql(){return [`UPDATE vendors SET open_minute=${amoHours.open_minute},close_minute=${amoHours.close_minute} WHERE id='${amoVendor.id}' AND (open_minute IS NOT ${amoHours.open_minute} OR close_minute IS NOT ${amoHours.close_minute});`]}
