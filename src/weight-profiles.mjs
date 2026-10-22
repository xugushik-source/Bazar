import {marketProfiles,declaredPacks} from './market-catalog.mjs';import {karoProfiles} from './karo.mjs';import {amoProfiles} from './amo.mjs';import {klontProfiles,klontPacks} from './klont.mjs';
// Proposed launch profiles, not measurements, stock, prices or a legal standard.
export const profiles={
 dry:{mode:'WEIGHED',policy_version:1,minimum_g:100,order_step_g:50,tolerance_bps:1000,tolerance_cap_g:20},
 nuts:{mode:'WEIGHED',policy_version:1,minimum_g:100,order_step_g:50,tolerance_bps:1000,tolerance_cap_g:20},
 grains:{mode:'WEIGHED',policy_version:1,minimum_g:100,order_step_g:100,tolerance_bps:1000,tolerance_cap_g:100},
 loose:{mode:'WEIGHED',policy_version:1,minimum_g:100,order_step_g:100,tolerance_bps:1000,tolerance_cap_g:200},meat:{mode:'WEIGHED',policy_version:1,minimum_g:1000,order_step_g:500,tolerance_bps:1000,tolerance_cap_g:200},
 delicate:{mode:'WEIGHED',policy_version:1,minimum_g:100,order_step_g:50,tolerance_bps:1000,tolerance_cap_g:50},
 herbs_by_weight:{mode:'WEIGHED',policy_version:1,minimum_g:50,order_step_g:50,tolerance_bps:1000,tolerance_cap_g:20},
 whole:{mode:'WHOLE_BY_WEIGHT',policy_version:1},
 each:{mode:'EACH',policy_version:1},bunch:{mode:'BUNCH',policy_version:1},pack:{mode:'FIXED_PACK',policy_version:1},preweighed:{mode:'PREWEIGHED',policy_version:1}
};
export const productProfiles={
 ...marketProfiles,...karoProfiles,...amoProfiles,...klontProfiles,apple_loose:'loose',pear_loose:'loose',tomato_loose:'loose',cucumber_loose:'loose',potato_loose:'loose',carrot_loose:'loose',onion_loose:'loose',beetroot_loose:'loose',orange_loose:'loose',mandarin_loose:'loose',lemon_loose:'loose',banana_loose:'loose',grapes_loose:'loose',plum_loose:'loose',peach_loose:'loose',apricot_loose:'loose',aubergine_loose:'loose',pepper_loose:'loose',courgette_loose:'loose',
 strawberry_loose:'delicate',cherry_loose:'delicate',raspberry_loose:'delicate',ginger_loose:'herbs_by_weight',garlic_loose:'herbs_by_weight',
 watermelon_whole_kg:'whole',melon_whole_kg:'whole',pumpkin_whole_kg:'whole',cabbage_whole_kg:'whole',cauliflower_whole_kg:'whole',
 avocado_each:'each',mango_each:'each',pineapple_each:'each',watermelon_fixed_each:'each',lettuce_each:'each',
 parsley_bunch:'bunch',dill_bunch:'bunch',coriander_bunch:'bunch',spring_onion_bunch:'bunch',
 strawberry_pack_250g:'pack',blueberry_pack_125g:'pack',potato_pack_2kg:'pack',salad_pack_150g:'pack',
 pumpkin_preweighed:'preweighed',watermelon_cut_preweighed:'preweighed',watermelon_cut_to_order:'loose'
};
export const exampleWholeRanges={
 watermelon_whole_kg:[{id:'small',min_g:2000,max_g:4000,estimate_g:3000},{id:'medium',min_g:4000,max_g:6000,estimate_g:5000},{id:'large',min_g:6000,max_g:8000,estimate_g:7000}],
 melon_whole_kg:[{id:'standard',min_g:1500,max_g:2500,estimate_g:2000}],
 pumpkin_whole_kg:[{id:'standard',min_g:2000,max_g:4000,estimate_g:3000}],
 cabbage_whole_kg:[{id:'standard',min_g:1000,max_g:2000,estimate_g:1500}],
 cauliflower_whole_kg:[{id:'standard',min_g:700,max_g:1200,estimate_g:950}]
};
export function profileFor(id){const key=productProfiles[id];if(!key)throw Error('UNCONFIGURED_PRODUCT');return {...profiles[key],...((declaredPacks[id]||klontPacks[id])?{declared_net_g:declaredPacks[id]||klontPacks[id]}:{}),...(exampleWholeRanges[id]?{ranges:structuredClone(exampleWholeRanges[id])}:{})};}
