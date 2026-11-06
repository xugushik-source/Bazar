// Owner 06.11: weight tolerance without gram caps — fruit and vegetables ±20 %, every other weighed product ±10 %.
// Inside it the buyer is not asked (the total follows the real weight); outside it the buyer confirms. It is applied when a
// product is read for the catalogue and for a quote, not written into the products: older supplier generators run on every
// request and rewrite their profiles, and two writers would bump the product version back and forth.
// Whole rabbit and piglet: an expected weight ±20 % (rabbit ≈1.5 kg, piglet ≈3 kg); a carcass outside it goes to the buyer.
export const NO_CAP=1000000;
export function ownerProfile(profile,category){if(profile?.mode!=='WEIGHED')return profile;return {...profile,tolerance_bps:['fruit','vegetables'].includes(category)?2000:1000,tolerance_cap_g:NO_CAP}}
export const wholeRanges={'akhalkalaki--artur_rabbit_whole':[1200,1800,1500],'akhalkalaki--artur_piglet_whole':[2400,3600,3000]};
export function toleranceSql(){return Object.entries(wholeRanges).map(([id,[min_g,max_g,estimate_g]])=>{const r=JSON.stringify([{id:'whole',min_g,max_g,estimate_g}]);return `UPDATE products SET profile=json_set(profile,'$.ranges',json('${r}')) WHERE id='${id}' AND json_extract(profile,'$.mode')='WHOLE_BY_WEIGHT' AND json(json_extract(profile,'$.ranges'))<>json('${r}');`})}
