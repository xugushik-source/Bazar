// Owner 11.11: the owner writes «Ламаджо» — buyers search for it that way.
import {pizzaId}from './food-1111b.mjs';import {lahmajo}from './food-1111c.mjs';
export const lahmajoNames={ru:'Ламаджо',hy:'Լահմաջո',ka:'ლაჰმაჯო'};
export const pizzaCategory3={ru:'Готовая еда: пицца, хачапури, ламаджо',hy:'Պատրաստի սնունդ՝ պիցցա, խաչապուրի, լահմաջո',ka:'მზა საჭმელი: პიცა, ხაჭაპური, ლაჰმაჯო'};
export function food1111dSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o));
 return [`UPDATE products SET names=${j(lahmajoNames)},version=version+1 WHERE id=${s(pizzaId(lahmajo.n))} AND names<>${j(lahmajoNames)};`,
  `UPDATE categories SET names=${j(pizzaCategory3)} WHERE id='rf_pizza';`]}
