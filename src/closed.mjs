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
// Owner 30.10: «Удали поставщика Ферма Базара». A placeholder vendor from the first demo, not a real supplier; switched off
// with its goods (past orders keep their rows). Seed inserts vendors with DO NOTHING, so it never comes back.
export const removedVendors=['akhalkalaki-farm','tbilisi-farm'];
export function removeFarmSql(){return [`UPDATE vendors SET active=0 WHERE id IN (${removedVendors.map(v=>`'${v}'`).join(',')}) AND active=1;`]}
// Owner 30.10: «не пиши алкоголь, а напиши крепкие напитки» — the section keeps its id, only the shown name changes.
export const strongDrinksNames={ru:'Крепкие напитки',hy:'Թունդ խմիչքներ',ka:'მაგარი სასმელები'};
export function strongDrinksSql(){return [`UPDATE categories SET names='${JSON.stringify(strongDrinksNames)}' WHERE id='alcohol';`]}
// Owner 30.10, later: the section holds wine too, so «Вино и крепкие напитки». Test expenses are wiped with the test orders.
export const wineDrinksNames={ru:'Вино и крепкие напитки',hy:'Գինի և թունդ խմիչքներ',ka:'ღვინო და მაგარი სასმელები'};
export function wineDrinksSql(){return [`UPDATE categories SET names='${JSON.stringify(wineDrinksNames)}' WHERE id='alcohol';`,'DELETE FROM expenses;']}
// Owner 31.10: «Ферма Базара — фейковый поставщик, сними всё; оставляем Каро». Its demo twin «Сад Базара» was still on sale with
// 8 placeholder goods; switched off the same way (past orders keep their rows, seed never re-enables a vendor).
export const removedVendors2=['akhalkalaki-garden','tbilisi-garden'];
export function removeGardenSql(){return [`UPDATE vendors SET active=0 WHERE id IN (${removedVendors2.map(v=>`'${v}'`).join(',')}) AND active=1;`]}
