// Owner 07.11: «сайт работает с 9 до 18» — orders are accepted only inside the city's order hours (Ахалкалаки time).
// Stored in app_config as 'from-to' minutes; no row = no limit. Tests run with BAZAR_IGNORE_ORDER_HOURS=1.
const q=(db,sql,...p)=>db.prepare(sql).bind(...p);
export const ORDER_HOURS_KEY='order_hours';
export const orderHoursValue='540-1080';   // 09:00 – 18:00
export async function orderHours(db){try{const v=(await q(db,'SELECT value FROM app_config WHERE key=?',ORDER_HOURS_KEY).first())?.value;const m=/^(\d+)-(\d+)$/.exec(v||'');return m?{from:+m[1],to:+m[2]}:null}catch{return null}}
export const hoursOpen=(h,minute)=>!h||globalThis.process?.env?.BAZAR_IGNORE_ORDER_HOURS==='1'||(minute>=h.from&&minute<h.to);
export const orderHoursSql=()=>[`INSERT INTO app_config(key,value) VALUES('${ORDER_HOURS_KEY}','${orderHoursValue}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;`];
// Owner 11.11: ready food (pizza, khachapuri, lamajo — categories rf_*) is ordered until 19:30, after the rest of the site closes
// at 18:00; a basket with anything else still follows the 9–18 hours. Its delivery may go up to the supplier's closing time.
export const readyFoodTo=1170;   // 19:30
// Owner 11.11 (later): cakes from the same bakery are ordered in the evening too.
export const isReadyCat=c=>String(c||'').startsWith('rf_')||c==='cakes';
export const readyOpen=(h,minute)=>!h||globalThis.process?.env?.BAZAR_IGNORE_ORDER_HOURS==='1'||(minute>=h.from&&minute<Math.max(h.to,readyFoodTo));
