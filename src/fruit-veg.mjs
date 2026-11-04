// Owner 04.11: fruit and vegetables in Akhalkalaki — selling price +25% (rounded up to 10 tetri; costs untouched, the owner
// checks them the next day) and weighed ones sold from 1 kg in 200 g steps. The price before the rise is noted once per product
// (inventory note, delta = old price) and only that price is raised, so re-running any migration or the seed gives +25% exactly once,
// and a price the owner sets later by hand is never touched.
export const fruitVegMark='CATALOG: owner 04.11 fruit/veg +25%';
const scope="id LIKE 'akhalkalaki--%' AND category IN ('fruit','vegetables')";
export const up25=p=>Math.ceil(p*125/1000)*10;
export function fruitVegSql(){return [
 `INSERT INTO inventory(id,product_id,at,actor,delta,reason) SELECT 'fv25-'||id,id,'2026-11-04T00:00:00.000Z','owner',price,'${fruitVegMark}' FROM products WHERE ${scope} ON CONFLICT(id) DO NOTHING;`,
 `UPDATE products SET price=((price*125+999)/1000)*10 WHERE ${scope} AND price=(SELECT delta FROM inventory WHERE id='fv25-'||products.id);`,
 `UPDATE products SET profile=json_set(profile,'$.minimum_g',1000,'$.order_step_g',200) WHERE ${scope} AND json_extract(profile,'$.mode')='WEIGHED' AND json_extract(profile,'$.minimum_g')=500 AND json_extract(profile,'$.order_step_g')=100;`]}
