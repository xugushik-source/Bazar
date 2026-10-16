// Pure server-side decision module. No charging, persistence or browser-trusted inputs.
const modes = new Set(['WEIGHED','WHOLE_BY_WEIGHT','EACH','BUNCH','FIXED_PACK','PREWEIGHED']);
const int = (v,min=0,max=100_000_000) => {if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('INVALID_NUMBER');return v;};
const copy = v => JSON.parse(JSON.stringify(v));
export function weightPrice(pricePerKgMinor, grams) {
  int(pricePerKgMinor);int(grams);
  return Number((BigInt(pricePerKgMinor)*BigInt(grams)+500n)/1000n);
}
function freeze(v){Object.values(v).forEach(x=>{if(x&&typeof x==='object')freeze(x)});return Object.freeze(v)}
export function quote(product, selection, lineId) {
  if(!product?.id||!modes.has(product.mode)||!product.policy_version||!lineId)throw Error('UNCONFIGURED_PRODUCT');
  if(!['GEL','AMD','RUB'].includes(product.currency))throw Error('INVALID_CURRENCY');
  const p=copy(product),s=copy(selection),mode=p.mode;
  const q={line_id:lineId,product_id:p.id,variant_id:p.variant_id||p.id,currency:p.currency,mode,policy_version:p.policy_version,product:p,selection:s};
  if(mode==='WEIGHED') {
    const target=int(s.grams,1),step=int(p.order_step_g,1),min=int(p.minimum_g,1);
    if(target<min||target%step)throw Error('INVALID_ORDER_STEP');
    const bps=int(p.tolerance_bps,0,1000),cap=int(p.tolerance_cap_g,0);
    const tolerance=Math.min(Math.floor(target*bps/10000),cap);
    q.target_g=target;q.min_g=Math.max(1,target-tolerance);q.max_g=target+tolerance;
    q.estimate_minor=weightPrice(p.price_per_kg_minor,target);
    q.maximum_minor=weightPrice(p.price_per_kg_minor,q.max_g);
  } else if(mode==='WHOLE_BY_WEIGHT') {
    q.count=int(s.count,1,20);
    const range=p.ranges?.find(r=>r.id===s.range_id);
    if(!range)throw Error('INVALID_SIZE_RANGE');
    q.each_min_g=int(range.min_g,1);q.each_max_g=int(range.max_g,q.each_min_g);
    q.each_estimate_g=int(range.estimate_g,q.each_min_g,q.each_max_g);
    q.target_g=q.each_estimate_g*q.count;q.min_g=q.each_min_g*q.count;q.max_g=q.each_max_g*q.count;
    q.estimate_minor=weightPrice(p.price_per_kg_minor,q.target_g);
    q.maximum_minor=weightPrice(p.price_per_kg_minor,q.max_g);
  } else if(mode==='PREWEIGHED') {
    q.count=int(s.count,1,1);q.target_g=int(p.exact_net_g,1);q.min_g=q.target_g;q.max_g=q.target_g;
    q.estimate_minor=weightPrice(p.price_per_kg_minor,q.target_g);q.maximum_minor=q.estimate_minor;
  } else {
    q.count=int(s.count,1,100);q.estimate_minor=int(p.price_per_unit_minor)*q.count;q.maximum_minor=q.estimate_minor;
    if(mode==='FIXED_PACK')q.declared_net_g=int(p.declared_net_g,1)*q.count;
  }
  int(q.maximum_minor);return freeze(q);
}
export function assess(q, actual) {
  if(actual.product_id!==q.product_id||actual.variant_id!==(q.variant_id))return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'REPLACEMENT',actual_minor:null};
  const priceKey=['WEIGHED','WHOLE_BY_WEIGHT','PREWEIGHED'].includes(q.mode)?'price_per_kg_minor':'price_per_unit_minor';
  if(actual[priceKey]!==undefined&&actual[priceKey]!==q.product[priceKey])return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'PRICE_CHANGE',actual_minor:null};
  let grams,amount;
  if(q.mode==='WHOLE_BY_WEIGHT') {
    if(!Array.isArray(actual.each_net_g)||actual.each_net_g.length!==q.count)return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'COUNT_CHANGE',actual_minor:null};
    const weights=actual.each_net_g.map(x=>int(x,1));
    grams=weights.reduce((a,g)=>a+g,0);int(grams);
    amount=weightPrice(q.product.price_per_kg_minor,grams);
    if(weights.some(g=>g<q.each_min_g||g>q.each_max_g))return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'OUTSIDE_SIZE_RANGE',actual_minor:amount};
  } else if(q.mode==='WEIGHED'||q.mode==='PREWEIGHED') {
    grams=int(actual.net_g);
    amount=weightPrice(q.product.price_per_kg_minor,grams);
    if(grams<q.min_g||grams>q.max_g)return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'OUTSIDE_WEIGHT_RANGE',actual_minor:amount};
    if(q.mode==='PREWEIGHED'&&actual.count!==1)return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'COUNT_CHANGE',actual_minor:null};
  } else {
    const count=int(actual.count);
    if(count!==q.count)return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'COUNT_CHANGE',actual_minor:null};
    if(q.mode==='FIXED_PACK'&&actual.each_net_g!==undefined){if(!Array.isArray(actual.each_net_g)||actual.each_net_g.length!==q.count)throw Error('INVALID_PACK_WEIGHTS');if(actual.each_net_g.some(g=>int(g)<q.product.declared_net_g))return {decision:'QUALITY_REVIEW_REQUIRED',reason:'PACK_UNDERWEIGHT',actual_minor:null};}
    if(q.mode==='FIXED_PACK'&&actual.net_g!==undefined&&int(actual.net_g)<q.declared_net_g)return {decision:'QUALITY_REVIEW_REQUIRED',reason:'PACK_UNDERWEIGHT',actual_minor:null};
    amount=q.estimate_minor;
  }
  if(amount>q.maximum_minor)return {decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'PRICE_CEILING',actual_minor:amount};
  return {decision:'WITHIN_PREAGREED_RANGE',reason:'SAME_PRODUCT_FIXED_RATE',actual_minor:amount,...(grams===undefined?{}:{net_g:grams}),maximum_minor:q.maximum_minor};
}
export function assessBasket(serverQuotes,actuals) {
  if(new Set(serverQuotes.map(q=>q.line_id)).size!==serverQuotes.length||new Set(actuals.map(a=>a.line_id)).size!==actuals.length)throw Error('DUPLICATE_LINE');
  if(actuals.some(a=>!serverQuotes.some(q=>q.line_id===a.line_id)))throw Error('UNKNOWN_LINE');
  const currencies=new Set(serverQuotes.map(q=>q.currency));if(currencies.size>1)throw Error('CURRENCY_MISMATCH');
  const rows=serverQuotes.map(q=>{const a=actuals.find(a=>a.line_id===q.line_id);return {line_id:q.line_id,...(a?assess(q,a):{decision:'CUSTOMER_APPROVAL_REQUIRED',reason:'MISSING_ITEM',actual_minor:null})}});
  const ready=rows.every(r=>r.decision==='WITHIN_PREAGREED_RANGE');
  return {ready,lines:rows,actual_total_minor:ready?rows.reduce((s,r)=>s+r.actual_minor,0):null};
}
export const notices={
 ru:{weighed:'При подборе вес может отличаться до ±10%, но не более указанного для товара допуска в граммах. Оплата — за фактический вес по цене за килограмм, зафиксированной при заказе. В этих пределах дополнительное согласование не требуется.',whole:'Целый плод подбирается в выбранном диапазоне веса. Итог рассчитывается по фактическому весу. Диапазон и максимальная сумма показаны до оформления; дополнительного допуска сверх диапазона нет.',fixed:'Цена за штуку, пучок или упаковку фиксирована. Допуск весового подбора к количеству и заявленной фасовке не применяется.'},
 hy:{weighed:'Ընտրելիս քաշը կարող է տարբերվել մինչև ±10%, բայց ոչ ավելի, քան ապրանքի համար նշված գրամային սահմանը։ Վճարումը՝ փաստացի քաշով և պատվերի պահին ամրագրված կիլոգրամի գնով։ Այս սահմաններում լրացուցիչ համաձայնեցում չի պահանջվում։',whole:'Ամբողջական պտուղն ընտրվում է քաշի ընտրված միջակայքում։ Վերջնական գումարը հաշվարկվում է փաստացի քաշով։ Միջակայքն ու առավելագույն գումարը ցուցադրվում են պատվերից առաջ։ Միջակայքից դուրս լրացուցիչ թույլատրելի շեղում չկա։',fixed:'Հատով, կապով կամ փաթեթով վաճառվող ապրանքի գինը հաստատուն է։ Քաշի ընտրության թույլատրելի շեղումը չի կիրառվում քանակի կամ հայտարարված փաթեթավորման քաշի նկատմամբ։'},
 ka:{weighed:'შერჩევისას წონა შეიძლება განსხვავდებოდეს ±10%-მდე, მაგრამ არაუმეტეს პროდუქტისთვის მითითებული გრამობრივი ზღვრისა. გადახდა ხდება ფაქტობრივი წონით, შეკვეთისას დაფიქსირებული კილოგრამის ფასით. ამ ფარგლებში დამატებითი შეთანხმება საჭირო არ არის.',whole:'მთლიანი ნაყოფი შეირჩევა წონის არჩეულ დიაპაზონში. საბოლოო თანხა ითვლება ფაქტობრივი წონით. დიაპაზონი და მაქსიმალური თანხა ჩანს შეკვეთამდე. დიაპაზონის მიღმა დამატებითი დაშვება არ მოქმედებს.',fixed:'ცალობით, კონით ან შეფუთვით გაყიდული პროდუქტის ფასი ფიქსირებულია. წონის შერჩევის დაშვება რაოდენობასა და შეფუთვაზე მითითებულ წონაზე არ ვრცელდება.'}
};
