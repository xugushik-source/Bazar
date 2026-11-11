// Owner 11.11: «Доставка готовой еды» — separate from cakes. Empty subsections (shown in the «скоро» line) until the owner sends the menu.
export const readyFoodCategories=[
 ['rf_pizza',{ru:'Готовая еда: пицца',hy:'Պատրաստի սնունդ՝ պիցցա',ka:'მზა საჭმელი: პიცა'},80],
 ['rf_first',{ru:'Готовая еда: первые блюда',hy:'Պատրաստի սնունդ՝ առաջին ճաշատեսակներ',ka:'მზა საჭმელი: პირველი კერძები'},81],
 ['rf_second',{ru:'Готовая еда: вторые блюда',hy:'Պատրաստի սնունդ՝ երկրորդ ճաշատեսակներ',ka:'მზა საჭმელი: მეორე კერძები'},82],
 ['rf_salads',{ru:'Готовая еда: салаты и закуски',hy:'Պատրաստի սնունդ՝ աղցաններ և նախուտեստներ',ka:'მზა საჭმელი: სალათები და საუზმეულები'},83],
 ['rf_sides',{ru:'Готовая еда: гарниры',hy:'Պատրաստի սնունդ՝ կողքի ուտեստներ',ka:'მზა საჭმელი: გარნირები'},84]];
export function readyFoodSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'";
 return readyFoodCategories.map(([id,names,sort])=>`INSERT INTO categories(id,names,sort) VALUES(${s(id)},${s(JSON.stringify(names))},${sort}) ON CONFLICT(id) DO NOTHING;`)}
