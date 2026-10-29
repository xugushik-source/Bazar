// Products the owner closes for now (hidden from the storefront, kept with price, cost and photo). The owner can reopen any of
// them in the cabinet: product card → «в продаже». Owner 24.10: whole pumpkin closed (pumpkin seeds stay).
export const closedProducts=[['akhalkalaki','pumpkin_whole_kg']];
export function closedSql(){return closedProducts.map(([city,key])=>`UPDATE products SET active=0,version=version+1 WHERE id='${city}--${key}' AND active=1;`)}
// Owner 25.10: jam removed from sale (hidden, kept like the pumpkin, so it can be reopened). Migration 0043 stays as it was.
export const closedProducts2=[['akhalkalaki','jam_jar_300g'],['tbilisi','jam_jar_300g']];
export function closed2Sql(){return closedProducts2.map(([city,key])=>`UPDATE products SET active=0,version=version+1 WHERE id='${city}--${key}' AND active=1;`)}
// Owner 29.10: the «Алкоголь 18+» section and the herbs closed until the owner says to reopen. The products on sale at that moment
// are written to paused_products, so reopening (pauseReopenSql) brings back exactly those and nothing closed for another reason.
// Not part of the local seed: the seed keeps the full catalogue the other tests check; production gets it from migration 0054.
export const pausedCategories=['alcohol','herbs'];
export function pauseSql(at='2026-10-29T00:00:00Z'){const list=pausedCategories.map(c=>`'${c}'`).join(',');return [
 'CREATE TABLE IF NOT EXISTS paused_products(id TEXT PRIMARY KEY,category TEXT NOT NULL,paused_at TEXT NOT NULL);',
 `INSERT INTO paused_products(id,category,paused_at) SELECT id,category,'${at}' FROM products WHERE category IN (${list}) AND active=1 ON CONFLICT(id) DO NOTHING;`,
 `UPDATE products SET active=0,version=version+1 WHERE category IN (${list}) AND active=1;`,
 `UPDATE categories SET active=0 WHERE id IN (${list}) AND active=1 AND EXISTS(SELECT 1 FROM paused_products x WHERE x.category=categories.id);`]}
export function pauseReopenSql(categories=pausedCategories){const list=categories.map(c=>`'${c}'`).join(',');return [
 `UPDATE categories SET active=1 WHERE id IN (${list}) AND active=0;`,
 `UPDATE products SET active=1,version=version+1 WHERE id IN (SELECT id FROM paused_products WHERE category IN (${list})) AND active=0;`,
 `DELETE FROM paused_products WHERE category IN (${list});`]}
// Owner 30.10: «Алкоголь 18+» open again, exactly what was on sale on 29.10; the herbs stay closed. Migration 0054 is unchanged.
export const reopenedCategories=['alcohol'];
export function reopenAlcoholSql(){return pauseReopenSql(reopenedCategories)}
