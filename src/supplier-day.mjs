// Owner 29.10: «нет сегодня» from the supplier hides a product for that day only (the next day it is back by itself), and
// new costs wait for the owner. The tables live in migration 0055; databases before it simply have no closures.
// Owner 11.11: «нет в наличии» from the supplier lasts until the supplier brings the product back (day 9999-12-31).
export const FOREVER='9999-12-31';
export async function closedToday(db,day){try{return new Set((await db.prepare('SELECT product_id FROM day_closures WHERE day IN (?,?)').bind(day,FOREVER).all()).results.map(r=>r.product_id))}catch{return new Set()}}
