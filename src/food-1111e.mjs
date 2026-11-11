// Owner 11.11: «Выпечка с любовью» works 9:00–20:00 (delivery slots follow: from 10:00, last at 19:40). Pizza is baked in
// 25 minutes, lamajo in 20 — shown to the buyer on the card (profile.prep_minutes). Khachapuri: no time given, none shown.
import {cakesVendor}from './vypechka.mjs';import {pizzaId}from './food-1111b.mjs';
export const vypechkaHours={open_minute:540,close_minute:1200};
export const prepMinutes=[[1,25],[2,25],[3,25],[5,20]];
export const prepProfile=m=>({mode:'EACH',policy_version:1,prep_minutes:m});
export function food1111eSql(){const s=x=>"'"+String(x).replaceAll("'","''")+"'",j=o=>s(JSON.stringify(o)),v=s(cakesVendor.id),h=vypechkaHours;
 return [`UPDATE vendors SET open_minute=${h.open_minute},close_minute=${h.close_minute} WHERE id=${v} AND (open_minute IS NOT ${h.open_minute} OR close_minute IS NOT ${h.close_minute});`,
  ...prepMinutes.map(([n,m])=>`UPDATE products SET profile=${j(prepProfile(m))},version=version+1 WHERE id=${s(pizzaId(n))} AND profile<>${j(prepProfile(m))};`)]}
