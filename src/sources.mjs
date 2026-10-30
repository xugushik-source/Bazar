// Where orders come from (owner 28.10: «система привлечения новых»). A link like …/?src=instagram is remembered by the buyer's
// browser for 30 days and sent with the order; ?ref= friend links count as «friend». Only a short code is stored, nothing personal.
export const sourceCode=v=>typeof v==='string'&&/^[a-z0-9_-]{2,32}$/.test(v)?v:null;
// Databases before migration 0052 have no orders.source; orders there are simply unmarked.
const known=new WeakSet();
export async function hasSourceColumn(db){if(known.has(db))return true;try{await db.prepare('SELECT source FROM orders LIMIT 0').all();known.add(db);return true}catch{return false}}
const digits=p=>String(p||'').replace(/[^0-9]/g,'');
// Per source for the last `days` days: orders (not cancelled), completed, revenue of completed, and new buyers — orders that are
// the first ever for that phone number. Orders without a mark are «direct».
export async function sourceReport(db,city,days=30,at=Date.now()){
 const rows=(await db.prepare(`SELECT id,created_at,status,total,${await hasSourceColumn(db)?'source':'NULL AS source'},json_extract(customer,'$.phone') AS phone FROM orders WHERE city_id=? ORDER BY created_at,id`).bind(city).all()).results;
 const since=new Date(at-days*86400000).toISOString(),seen=new Set(),by=new Map();
 for(const o of rows){const key=digits(o.phone),first=!!key&&!seen.has(key);if(key)seen.add(key);if(o.created_at<since||o.status==='CANCELLED')continue;
  const s=o.source||'direct',r=by.get(s)||{source:s,orders:0,completed:0,revenue:0,new_customers:0};r.orders++;if(first)r.new_customers++;if(o.status==='COMPLETED'){r.completed++;r.revenue+=o.total}by.set(s,r)}
 return {days,sources:[...by.values()].sort((a,b)=>b.new_customers-a.new_customers||b.orders-a.orders||a.source.localeCompare(b.source))}}
