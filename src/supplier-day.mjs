// Owner 29.10: «нет сегодня» from the supplier hides a product for that day only (the next day it is back by itself), and
// new costs wait for the owner. The tables live in migration 0055; databases before it simply have no closures.
export async function closedToday(db,day){try{return new Set((await db.prepare('SELECT product_id FROM day_closures WHERE day=?').bind(day).all()).results.map(r=>r.product_id))}catch{return new Set()}}
