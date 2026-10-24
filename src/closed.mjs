// Products the owner closes for now (hidden from the storefront, kept with price, cost and photo). The owner can reopen any of
// them in the cabinet: product card → «в продаже». Owner 24.10: whole pumpkin closed (pumpkin seeds stay).
export const closedProducts=[['akhalkalaki','pumpkin_whole_kg']];
export function closedSql(){return closedProducts.map(([city,key])=>`UPDATE products SET active=0,version=version+1 WHERE id='${city}--${key}' AND active=1;`)}
