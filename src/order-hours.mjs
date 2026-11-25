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
// Owner 25.11: suppliers with their own hours (Каро 09–20, Выпечка 09–20, Рафо/Форель 11–23) take today's orders by those hours.
// A basket counts only when EVERY supplier in it has its own hours; any market goods keep 09:00–18:00. The last order is 20 minutes
// before the supplier closes. A later day is always open (see commerce.mjs), so this window only matters for today.
export const ownOrderGap=20;
export const isOwnHours=v=>!!v&&v.open_minute!=null&&v.close_minute!=null&&!(v.open_minute===540&&v.close_minute===1080);
export const ownOrderWindow=(vendors,gap=ownOrderGap)=>{if(!vendors.length||!vendors.every(isOwnHours))return null;return {from:Math.max(...vendors.map(v=>v.open_minute)),to:Math.min(...vendors.map(v=>v.close_minute-gap))}};
export async function ownWindowFor(db,lines){const ids=[...new Set((lines||[]).map(l=>l.vendor_id).filter(Boolean))];if(!ids.length)return null;const rows=(await db.prepare(`SELECT id,open_minute,close_minute FROM vendors WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all()).results;if(rows.length!==ids.length)return null;return ownOrderWindow(rows)}
export const readyOpen=(h,minute)=>!h||globalThis.process?.env?.BAZAR_IGNORE_ORDER_HOURS==='1'||(minute>=h.from&&minute<Math.max(h.to,readyFoodTo));
