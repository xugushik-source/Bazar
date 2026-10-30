// Delivery zones (owner 30.10): only Akhalkalaki; «Городок» next to the town has a bad road, so delivery there is 8 GEL,
// without the free-delivery threshold and without the free first order. Ninotsminda and Akhaltsikhe are announced as «скоро».
export const zones={akhalkalaki:[{id:'gorodok',fee:800,names:{ru:'Городок',hy:'Գորոդոկ',ka:'გოროდოკი'}}]};
export const zoneOf=(c,id)=>(zones[c?.id]||[]).find(z=>z.id===id)||null;
