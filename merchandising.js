// Curated shopping ideas, not purchase statistics or medical/recipe claims.
export const occasions=[
 {id:'salad',photo:'tomato',items:[['tomato_loose',400],['cucumber_loose',400],['parsley_bunch',1]],pantry:'salad'},
 {id:'soup',photo:'carrot',items:[['potato_loose',600],['carrot_loose',200],['onion_loose',200],['dill_bunch',1]],pantry:'soup'},
 {id:'fruit',photo:'orange',items:[['apple_loose',400],['pear_loose',400],['orange_loose',400]],pantry:'fruit'},
 {id:'snack',photo:'almond',items:[['almond_kernel',100],['walnut_kernel',100],['apricot_dried',100],['dates_dried',100]],pantry:'snack'},
 {id:'lentil',photo:'lentils',items:[['lentils',200],['carrot_loose',200],['onion_loose',200],['garlic_loose',50]],pantry:'lentil'},
 {id:'tea',photo:'dried-apricot',items:[['apricot_dried',100],['figs_dried',100],['walnut_kernel',100],['honey_jar_500g',1]],pantry:'tea'}
];
export function sku(p){return p.id.split('--').slice(1).join('--')}
export function selectionFor(p,amount){const m=p.profile.mode;if(m==='WEIGHED'){const min=p.profile.minimum_g,step=p.profile.order_step_g;return {grams:min+Math.max(0,Math.ceil((Math.round(amount)-min)/step))*step}}if(['EACH','BUNCH','FIXED_PACK'].includes(m))return {count:Math.max(1,Math.ceil(amount))};throw Error('SELECTION_REQUIRED')}
export function kitLines(products,city,id,people=4){const idea=occasions.find(x=>x.id===id);if(!idea||![2,4,6,8].includes(people))throw Error('INVALID_INPUT');return idea.items.map(([key,amount])=>{const product=products.find(p=>p.id===city+'--'+key);return {key,product,selection:product?selectionFor(product,product.profile.mode==='FIXED_PACK'?amount:amount*people/4):null}})}
export function mergeKit(basket,lines,quote){const next=structuredClone(basket);for(const l of lines){if(!l.product)throw Error('OUT_OF_STOCK');const p=l.product,current=next.find(b=>b.product_id===p.id),selection=structuredClone(l.selection);if(current){if(selection.grams)selection.grams+=current.selection.grams;else selection.count+=current.selection.count}const q=quote(p,selection);if((q.max_g??q.count)>p.available)throw Error('OUT_OF_STOCK');if(current)current.selection=selection;else next.push({product_id:p.id,selection})}return next}
const pairGroups=[
 {reason:'salad',keys:['tomato_loose','cucumber_loose','parsley_bunch'],amount:200},
 {reason:'soup',keys:['potato_loose','carrot_loose','onion_loose','dill_bunch'],amount:200},
 {reason:'snack',keys:['apricot_dried','dates_dried','figs_dried','walnut_kernel','almond_kernel','hazelnut_kernel'],amount:100},
 {reason:'lentil',keys:['lentils','onion_loose','carrot_loose','garlic_loose'],amount:100},
 {reason:'fruit',keys:['apple_loose','pear_loose','orange_loose','grapes_loose'],amount:200},
 {reason:'tea',keys:['honey_jar_500g','lemon_loose','ginger_loose'],amount:100}
];
export function recommend(products,city,basket,{focus,limit=3,quote}={}){const owned=new Set(basket.map(b=>b.product_id)),seeds=new Set(focus?[focus]:basket.map(b=>b.product_id)),result=new Map();for(const group of pairGroups){const matches=group.keys.filter(k=>seeds.has(city+'--'+k));if(!matches.length)continue;for(const key of group.keys){const p=products.find(p=>p.id===city+'--'+key);if(!p||owned.has(p.id)||seeds.has(p.id)||p.price<=0||p.available<=0||p.active===0)continue;const selection=selectionFor(p,p.profile.mode==='WEIGHED'?group.amount:1);if(quote){const q=quote(p,selection);if((q.max_g??q.count)>p.available)continue}const score=matches.length;if(!result.has(p.id)||score>result.get(p.id).score)result.set(p.id,{product:p,selection,reason:group.reason,score})}}return [...result.values()].sort((a,b)=>b.score-a.score||a.product.id.localeCompare(b.product.id)).slice(0,limit)}
