// Owner 24.10: Karo produce by variety. Red apples «Стар» and «Демерчян», yellow «Голден» (cost 4 ₾); light and dark tomatoes
// (cost 4 ₾), the dearer tomatoes are Azerbaijani (cost 6 ₾, unchanged); grapes «Ред Глоуб» and pink kishmish (cost 5 ₾). The
// demo-supplier grapes, melon and watermelon are gone. Prices follow the Karo tiers; weighed produce from 500 g in 100 g steps.
import {karoVendor,karoTiers,tierRetail}from './karo.mjs';import {produceMinimum}from './produce.mjs';
// [key, ru, hy, ka, category, art, tier, cost]
export const karoVarieties=[
 ['apple_demirchyan_loose','Яблоки красные «Демерчян»','Կարմիր խնձոր «Դեմերճյան»','წითელი ვაშლი „დემერჩიანი“','fruit','apple-demirchyan','staple',400],
 ['tomato_light_loose','Помидоры светлые','Բաց լոլիկ','ღია პომიდორი','vegetables','tomato-light','staple',400],
 ['tomato_dark_loose','Помидоры тёмные','Մուգ լոլիկ','მუქი პომიდორი','vegetables','tomato-dark','staple',400],
 ['grapes_red_globe_loose','Виноград «Ред Глоуб»','Խաղող «Ռեդ Գլոուբ»','ყურძენი „რედ გლოუბი“','fruit','grapes-red-globe','produce',500],
 ['grapes_kishmish_pink_loose','Виноград кишмиш розовый','Խաղող քիշմիշ վարդագույն','ყურძენი ქიშმიში ვარდისფერი','fruit','grapes-kishmish-pink','produce',500]
];
// Existing products renamed by variety, with the owner's photo: [key, ru, hy, ka, art]
export const karoVarietyRenames=[
 ['apple_loose','Яблоки красные «Стар»','Կարմիր խնձոր «Սթար»','წითელი ვაშლი „სტარი“','apple-star'],
 ['apple_yellow_loose','Яблоки жёлтые «Голден»','Դեղին խնձոր «Գոլդեն»','ყვითელი ვაშლი „გოლდენი“','apple-golden'],
 ['tomato_loose','Помидоры азербайджанские','Ադրբեջանական լոլիկ','აზერბაიჯანული პომიდორი','tomato-azerbaijan']
];
export const karoVarietiesRetired=['grapes_loose','melon_whole_kg','watermelon_whole_kg'];
export const karoVarietyProfiles=Object.fromEntries(karoVarieties.map(r=>[r[0],'loose']));
export const karoVarietyArts=[...karoVarieties,...karoVarietyRenames].map(r=>r.at(r.length===5?4:5));
export const karoVarietyPrice=r=>tierRetail(r[7],karoTiers[r[6]]);
export function karoVarietySql(profileFor){const v=karoVendor,s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),id=k=>s(v.city_id+'--'+k);
 return [...karoVarietiesRetired.map(k=>`UPDATE products SET active=0,version=version+1 WHERE id=${id(k)} AND active=1;`),
  ...karoVarietyRenames.map(([k,ru,hy,ka,art])=>`UPDATE products SET names=${j({ru,hy,ka})},art=${s(art)},version=version+1 WHERE id=${id(k)} AND vendor_id=${s(v.id)} AND (names<>${j({ru,hy,ka})} OR art<>${s(art)});`),
  ...karoVarieties.map(r=>{const [k,ru,hy,ka,category,art,,cost]=r;return `INSERT INTO products(id,vendor_id,names,category,art,profile,price,cost,stock) SELECT ${id(k)},${s(v.id)},${j({ru,hy,ka})},${s(category)},${s(art)},${j({...profileFor(k),...produceMinimum})},${karoVarietyPrice(r)},${cost},100000 WHERE EXISTS(SELECT 1 FROM vendors WHERE id=${s(v.id)}) AND EXISTS(SELECT 1 FROM categories WHERE id=${s(category)}) ON CONFLICT(id) DO NOTHING;`})]}
// Owner 24.10, later: «Помидоры, второй сорт» is no longer sold — tomatoes are light, dark and Azerbaijani.
export const karoVarietiesRetired2=['tomato_second_loose'];
export function karoRetire2Sql(){const id=k=>`'${karoVendor.city_id}--${k}'`;return karoVarietiesRetired2.map(k=>`UPDATE products SET active=0,version=version+1 WHERE id=${id(k)} AND active=1;`)}
