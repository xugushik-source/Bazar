// Delivery zones (owner 30.10): only Akhalkalaki; «1 Городок» next to the town has a bad road, so delivery there costs extra,
// without the free-delivery threshold and without the free first order. Ninotsminda and Akhaltsikhe are announced as «скоро».
// Owner 31.10: «1 городок — 6 лари» (taxi Maxim from the centre: 6,7 ₾); the 14th and 15th gorodoks count as the town.
export const zones={akhalkalaki:[{id:'gorodok',fee:600,names:{ru:'1 Городок',hy:'1 Գորոդոկ',ka:'1 გოროდოკი'}}]};
export const zoneOf=(c,id)=>(zones[c?.id]||[]).find(z=>z.id===id)||null;
