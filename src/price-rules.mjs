// Owner 29.10: a supplier sends a new cost in the bot, the owner approves, and the retail price follows the same rule the
// catalogue was priced with: Karo by its product group (15 / 20 / 30 %, the owner's 30 % keepers stay at 30 %), brandy +20 %
// (+10 % from 200 ₾ cost), every other product keeps its present markup. Always rounded up to 10 tetri.
import {karoVendor,karoPrice,tierRetail,karoTiers}from './karo.mjs';import {karoVarieties}from './karo-varieties.mjs';import {cognacs,cognacPct}from './cognac.mjs';
export function retailFor(p,cost){const key=p.id.split('--')[1]||'',variety=karoVarieties.find(r=>r[0]===key);
 if(p.vendor_id===karoVendor.id)return variety?{price:tierRetail(cost,karoTiers[variety[6]]),rule:karoTiers[variety[6]]+'%'}:{price:karoPrice(key,cost),rule:'karo'};
 if(cognacs.some(r=>r[0]===key))return {price:tierRetail(cost,cognacPct(cost)),rule:cognacPct(cost)+'%'};
 if(p.cost>0&&p.price>0){const pct=Math.round((p.price/p.cost-1)*100);return {price:tierRetail(cost,pct),rule:pct+'%'}}
 return {price:null,rule:'manual'}}
// Owner 06.11: a new cost. Up — retail by the product's group (Karo 15/20/30 %, others their own markup), never below today's
// price. Down — today's price stays while it is at most 30 % above the new cost; above that it comes down to the group's markup.
export function retailOnCost(p,cost){const r=retailFor(p,cost);if(r.price==null||!p.cost||!p.price)return r;
 if(cost>=p.cost)return {...r,price:Math.max(p.price,r.price)};return {...r,price:p.price*100<=cost*130?p.price:r.price}}
