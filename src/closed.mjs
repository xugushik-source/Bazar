// Products the owner closes for now (hidden from the storefront, kept with price, cost and photo). The owner can reopen any of
// them in the cabinet: product card → «в продаже». Owner 24.10: whole pumpkin closed (pumpkin seeds stay).
export const closedProducts=[['akhalkalaki','pumpkin_whole_kg']];
export function closedSql(){return closedProducts.map(([city,key])=>`UPDATE products SET active=0,version=version+1 WHERE id='${city}--${key}' AND active=1;`)}
// Owner 25.10: jam removed from sale (hidden, kept like the pumpkin, so it can be reopened). Migration 0043 stays as it was.
export const closedProducts2=[['akhalkalaki','jam_jar_300g'],['tbilisi','jam_jar_300g']];
export function closed2Sql(){return closedProducts2.map(([city,key])=>`UPDATE products SET active=0,version=version+1 WHERE id='${city}--${key}' AND active=1;`)}
