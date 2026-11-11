// Owner 11.11: «на 3 дня закрой все продукты поставщика МАДО» — every MADO product is closed for Wed 11.11, Thu 12.11 and
// Fri 13.11 (day_closures: hidden from the catalog, orders for those days refused); Saturday 14.11 opens by itself.
export const madoClosedDays1111 = ['2026-11-11', '2026-11-12', '2026-11-13'];
export function madoCloseSql1111(){return madoClosedDays1111.map(d=>`INSERT INTO day_closures(product_id,day,vendor_id,closed_by,at) SELECT id,'${d}',vendor_id,'owner','2026-11-11T04:00:00.000Z' FROM products WHERE vendor_id='akhalkalaki-mado' ON CONFLICT(product_id,day) DO NOTHING;`)}
