// Delivery zones (owner 30.10): only Akhalkalaki; «1 Городок» next to the town has a bad road, so delivery there costs extra,
// without the free-delivery threshold and without the free first order. Ninotsminda and Akhaltsikhe are announced as «скоро».
// Owner 31.10: «1 городок — 6 лари» (taxi Maxim from the centre: 6,7 ₾); the 14th and 15th gorodoks count as the town.
export const zones={akhalkalaki:[{id:'gorodok',fee:600,free_from:8000,names:{ru:'1 Городок',hy:'1 Գորոդոկ',ka:'1 გოროდოკი'}}]};
// Owner 31.10: free in «1 Городок» from 80 ₾ of goods (the town: from 50 ₾); the free first order stays a town offer.
export const zoneFee=(z,items)=>z.free_from!=null&&items>=z.free_from?0:z.fee;
export const zoneOf=(c,id)=>(zones[c?.id]||[]).find(z=>z.id===id)||null;
