// Owner 22.10: weighed fruit and vegetables are sold from 500 g in 100 g steps. Garlic, ginger, hot pepper and champignons keep
// their smaller minimum (they are not on the 100 g / 100 g profile), as the owner chose.
export const produceMinimum={minimum_g:500,order_step_g:100};
export function produceSql(){return [`UPDATE products SET profile=json_set(profile,'$.minimum_g',${produceMinimum.minimum_g},'$.order_step_g',${produceMinimum.order_step_g}),version=version+1 WHERE category IN ('fruit','vegetables') AND json_extract(profile,'$.mode')='WEIGHED' AND json_extract(profile,'$.minimum_g')=100 AND json_extract(profile,'$.order_step_g')=100;`]}
