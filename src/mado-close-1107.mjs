// Owner 07.11: «товары МАДО закрой на ближайшие выходные и даже в понедельник» — every MADO product is closed for
// Sat 07.11, Sun 08.11 and Mon 09.11 (day_closures: hidden from the catalog, orders for those days refused); Tuesday opens by itself.
export const madoClosedDays = ['2026-11-07', '2026-11-08', '2026-11-09'];
export function madoCloseSql(){return madoClosedDays.map(d=>`INSERT INTO day_closures(product_id,day,vendor_id,closed_by,at) SELECT id,'${d}',vendor_id,'owner','2026-11-07T15:30:00.000Z' FROM products WHERE vendor_id='akhalkalaki-mado' ON CONFLICT(product_id,day) DO NOTHING;`)}
