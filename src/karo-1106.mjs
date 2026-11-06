// Owner 06.11: Karo's costs from the shelf price cards (video 05.11). Retail follows the product's Karo group (15/20/30 %,
// up to 10 tetri) from the new cost, but never below today's price (the owner's 04.11 +25 % stays where it is higher).
// Applied once: only while the cost is still the old one, so a later cost from the supplier bot is kept.
import {karoVendor}from './karo.mjs';import {retailFor}from './price-rules.mjs';
export const karoCosts1106=[['tomato_loose',600,700],['tomato_light_loose',400,500],['tomato_dark_loose',400,500],['aubergine_loose',300,400],['cucumber_loose',400,500],['chili_green_loose',500,800],['apple_loose',400,500],['grapefruit_loose',600,400]];
export function karoCost1106Sql(){return karoCosts1106.map(([key,old,cost])=>`UPDATE products SET cost=${cost},price=MAX(price,${retailFor({id:karoVendor.city_id+'--'+key,vendor_id:karoVendor.id},cost).price}),version=version+1 WHERE id='${karoVendor.city_id}--${key}' AND vendor_id='${karoVendor.id}' AND cost=${old};`)}
