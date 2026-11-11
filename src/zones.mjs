// Delivery zones (owner 30.10): only Akhalkalaki; «1 Городок» next to the town has a bad road, so delivery there costs extra,
// without the free-delivery threshold and without the free first order. Ninotsminda and Akhaltsikhe are announced as «скоро».
// Owner 31.10: «1 городок — 6 лари» (taxi Maxim from the centre: 6,7 ₾); the 14th and 15th gorodoks count as the town.
// Owner 07.11: nearby villages, free from 160 ₾ of goods.
const village=(id,fee,ru,hy,ka,aliases)=>({id,fee,free_from:16000,names:{ru,hy,ka},aliases}),far=(id,fee,ru,hy,ka,aliases)=>({id,fee,free_from:null,names:{ru,hy,ka},aliases});
export const zones={akhalkalaki:[{id:'gorodok',fee:700,free_from:15000,names:{ru:'1 Городок',hy:'1 Գորոդոկ',ka:'1 გოროდოკი'},aliases:['1 городок','1-й городок','1й городок','1-ый городок','первый городок','1 gorodok','1 գորոդոկ','1 გოროდოკი']},
 village('bavra',550,'Бавра','Բավրա','ბავრა',['бавр','bavra','բավրա','ბავრა']),village('khulgumo',600,'Хулгумо','Խուլգումո','ხულგუმო',['хулгум','хульгум','khulgumo','xulgumo','խուլգումո','ხულგუმო']),
 village('dilisqa',800,'Дилиска','Դիլիսկա','დილისქა',['дилиск','делиск','dilisqa','dilisca','diliska','դիլիսկա','დილისქა']),village('kartikam',800,'Картикам','Քարթիկամ','ქარტიკამი',['картикам','kartikam','kartikami','քարթիկամ','քարտիկամ','կարտիկամ','ქარტიკამი']),
 village('kulikam',800,'Куликам','Կուլիկամ','კულიკამი',['куликам','kulikam','kulikami','կուլիկամ','კულიკამი']),
 // Owner 11.11: farther villages — Маджадия 10 ₾, Орджа 13 ₾, Хандо 18 ₾, Аластан 22 ₾. No free-delivery threshold was given,
 // so these pay the fee on any order until the owner names one.
 far('majadia',1000,'Маджадия','Մաջադիա','მაჯადია',['маджади','majadia','majadiya','մաջադիա','მაჯადია']),far('orja',1300,'Орджа','Օրջա','ორჯა',['орджа','ордже','орджу','orja','ordja','օրջա','ორჯა']),
 far('khando',1800,'Хандо','Խանդո','ხანდო',['хандо','khando','xando','խանդո','ხანდო']),far('alastani',2200,'Аластан','Ալաստան','ალასტანი',['аластан','alastan','alastani','ալաստան','ალასტანი'])]};
// Owner 31.10: free in «1 Городок» from 80 ₾ of goods (the town: from 50 ₾); the free first order stays a town offer.
// Owner 07.11: delivery 5 ₾ below 100 ₾ in the town, «1 Городок» 7 ₾, free from 100 ₾ in the town and from 150 ₾ in «1 Городок» (src/pricing-1107.mjs).
export const zoneFee=(z,items)=>z.free_from!=null&&items>=z.free_from?0:z.fee;
export const zoneOf=(c,id)=>(zones[c?.id]||[]).find(z=>z.id===id)||null;
// Owner 09.11: the village written in the address picks its delivery price by itself (site and server use the same rule).
export function detectZone(list,text){const t=' '+String(text||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ')+' ';
 for(const z of list||[])for(const a of z.aliases||[]){let i=t.indexOf(a);while(i>=0){if(!/[\p{L}\p{N}]/u.test(t[i-1]||' ')&&!/[\p{L}\p{N}]/u.test(t[i+a.length]||' ')||!/[\p{L}\p{N}]/u.test(t[i-1]||' ')&&/[\p{L}]/u.test(t[i+a.length]||' ')&&!/\d/.test(a[0]))return z.id;i=t.indexOf(a,i+1)}}return ''}
