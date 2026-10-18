import {marketProducts}from '../src/market-catalog.mjs';import {karoSql}from '../src/karo.mjs';import {categories}from '../src/categories.mjs';
import config from '../src/config.mjs';
import {profileFor,profiles,exampleWholeRanges} from '../src/weight-profiles.mjs';
import {uuid,token,passwordHash} from '../src/security.mjs';
export async function createUser(db,{email,name,password,owner=false,vendor_id,role='ADMIN'}) {
 if(password.length<12)throw Error('PASSWORD_TOO_SHORT');const id=uuid(),salt=token(),hash=await passwordHash(password,salt);
 await db.prepare('INSERT INTO users(id,email,name,hash,salt,owner) VALUES(?,?,?,?,?,?)').bind(id,email.toLowerCase(),name,hash,salt,owner?1:0).run();
 if(vendor_id)await db.prepare('INSERT INTO memberships(user_id,vendor_id,role) VALUES(?,?,?)').bind(id,vendor_id,role).run();return id;
}
const products=[
 ['apple_loose','Яблоки','Խնձոր','ვაშლი','fruit','apple',450],['pear_loose','Груши','Տանձ','მსხალი','fruit','pear',650],['grapes_loose','Виноград','Խաղող','ყურძენი','fruit','grapes',800],['mandarin_loose','Мандарины','Մանդարին','მანდარინი','fruit','tangerine',550],['lemon_loose','Лимоны','Կիտրոն','ლიმონი','fruit','lemon',700],['banana_loose','Бананы','Բանան','ბანანი','fruit','banana',650],
 ['tomato_loose','Помидоры','Լոլիկ','პომიდორი','vegetables','tomato',600],['cucumber_loose','Огурцы','Վարունգ','კიტრი','vegetables','cucumber',450],['potato_loose','Картофель','Կարտոֆիլ','კარტოფილი','vegetables','potato',250],['carrot_loose','Морковь','Գազար','სტაფილო','vegetables','carrot',300],['onion_loose','Лук','Սոխ','ხახვი','vegetables','onion',250],['pepper_loose','Сладкий перец','Քաղցր պղպեղ','ტკბილი წიწაკა','vegetables','pepper',700],
 ['watermelon_whole_kg','Арбуз целиком','Ամբողջական ձմերուկ','მთლიანი საზამთრო','fruit','watermelon',300],['melon_whole_kg','Дыня целиком','Ամբողջական սեխ','მთლიანი ნესვი','fruit','melon',450],['pumpkin_whole_kg','Тыква целиком','Ամբողջական դդում','მთლიანი გოგრა','vegetables','pumpkin',350],['cabbage_whole_kg','Капуста кочаном','Ամբողջական կաղամբ','კომბოსტო','vegetables','cabbage',250],
 ['avocado_each','Авокадо','Ավոկադո','ავოკადო','fruit','avocado',500],['mango_each','Манго','Մանգո','მანგო','fruit','mango',800],['dill_bunch','Укроп пучком','Սամիթ՝ կապով','კამა, კონა','herbs','herbs',150],['parsley_bunch','Петрушка пучком','Մաղադանոս՝ կապով','ოხრახუში, კონა','herbs','herbs',150],
 ['strawberry_pack_250g','Клубника · 250 г','Ելակ · 250 գ','მარწყვი · 250 გ','berries','strawberry',700],['blueberry_pack_125g','Голубика · 125 г','Հապալաս · 125 գ','მოცვი · 125 გ','berries','blueberry',800],['ginger_loose','Имбирь','Կոճապղպեղ','ჯანჯაფილი','vegetables','ginger',1500],['garlic_loose','Чеснок','Սխտոր','ნიორი','vegetables','garlic',1200],['orange_loose','Апельсины','Նարինջ','ფორთოხალი','fruit','orange',650]
];
export async function seed(db,{karo=true}={}) {
 if(await db.prepare("SELECT value FROM app_config WHERE key='catalog-expanded-v1'").first())return karo?applyKaro(db):undefined;
 const st=[];for(const c of config.cities){st.push(db.prepare('INSERT INTO cities(id,names) VALUES(?,?) ON CONFLICT DO NOTHING').bind(c.id,JSON.stringify(c.names)));
 const vendors=[{id:c.id+'-garden',names:{ru:'Сад Базара',hy:'Բազարի այգի',ka:'ბაზრის ბაღი'}},{id:c.id+'-farm',names:{ru:'Ферма Базара',hy:'Բազարի ֆերմա',ka:'ბაზრის ფერმა'}}];
 for(const v of vendors)st.push(db.prepare('INSERT INTO vendors(id,city_id,names) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(v.id,c.id,JSON.stringify(v.names)));
 for(const [i,row]of [...products,...marketProducts].entries()){
 const [key,ru,hy,ka,category,art,price]=row,vendor=vendors[i%2].id,profile={...profileFor(key)},weighted=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(profile.mode);
 if(key==='strawberry_pack_250g')profile.declared_net_g=250;if(key==='blueberry_pack_125g')profile.declared_net_g=125;
 st.push(db.prepare('INSERT INTO products(id,vendor_id,names,category,art,profile,price,stock) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(c.id+'--'+key,vendor,JSON.stringify({ru,hy,ka}),category,art,JSON.stringify(profile),price,weighted?100000:50));
 }}
 for(const c of config.cities)st.push(db.prepare("UPDATE products SET art='tangerine',version=version+1 WHERE id=? AND art='orange'").bind(c.id+'--mandarin_loose'));
 for(const [i,c]of categories.entries())st.push(db.prepare('INSERT INTO categories(id,names,sort) VALUES(?,?,?) ON CONFLICT DO NOTHING').bind(c.id,JSON.stringify(c.names),i));
 st.push(db.prepare('INSERT INTO app_config(key,value) VALUES(?,?) ON CONFLICT DO NOTHING').bind('recovery',token()),db.prepare("INSERT INTO app_config(key,value) VALUES('catalog-expanded-v1','1') ON CONFLICT DO NOTHING"));
 for(let i=0;i<st.length;i+=80)await db.batch(st.slice(i,i+80));
 if(karo)await applyKaro(db);
}
// Same statements as migrations/0008_karo_supplier.sql, so fresh local/test databases match production.
async function applyKaro(db){const st=karoSql(profileFor).map(sql=>db.prepare(sql));for(let i=0;i<st.length;i+=80)await db.batch(st.slice(i,i+80))}
