// Owner 06.11: weight tolerance without gram caps — fruit and vegetables ±20 %, every other weighed product ±10 %.
// Inside it the buyer is not asked (the total follows the real weight); outside it the buyer confirms. Whole rabbit and
// piglet: an expected weight ±20 % (rabbit ≈1.5 kg, piglet ≈3 kg); a carcass outside it goes to the buyer too.
export const NO_CAP=1000000;
export const wholeRanges={'akhalkalaki--artur_rabbit_whole':[1200,1800,1500],'akhalkalaki--artur_piglet_whole':[2400,3600,3000]};
export function toleranceSql(){const fv="category IN ('fruit','vegetables')";return [
 `UPDATE products SET profile=json_set(profile,'$.tolerance_bps',2000,'$.tolerance_cap_g',${NO_CAP}) WHERE json_extract(profile,'$.mode')='WEIGHED' AND ${fv} AND (json_extract(profile,'$.tolerance_bps')<>2000 OR json_extract(profile,'$.tolerance_cap_g')<>${NO_CAP});`,
 `UPDATE products SET profile=json_set(profile,'$.tolerance_bps',1000,'$.tolerance_cap_g',${NO_CAP}) WHERE json_extract(profile,'$.mode')='WEIGHED' AND NOT ${fv} AND (json_extract(profile,'$.tolerance_bps')<>1000 OR json_extract(profile,'$.tolerance_cap_g')<>${NO_CAP});`,
 ...Object.entries(wholeRanges).map(([id,[min_g,max_g,estimate_g]])=>`UPDATE products SET profile=json_set(profile,'$.ranges',json('${JSON.stringify([{id:'whole',min_g,max_g,estimate_g}])}')) WHERE id='${id}' AND json_extract(profile,'$.mode')='WHOLE_BY_WEIGHT';`)]}
