// One entry lives outside #app. Re-rendering the shop can never create another.
export function initEntry({root,image,button,reduced=false,now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout}){
 if(!root)return {ready(){},dismiss(){}};
 let contentReady=false,imageReady=!image,closing=false,removed=false;
 const started=now(),timers=new Set();
 const later=(fn,ms)=>{const id=schedule(()=>{timers.delete(id);fn()},ms);timers.add(id);return id};
 const remove=()=>{if(removed)return;removed=true;for(const id of timers)cancel(id);timers.clear();button?.removeEventListener('click',dismiss);root.remove()};
 function dismiss(){if(closing)return;closing=true;if(reduced){remove();return}root.classList.add('is-opening');later(remove,750)}
 function check(){if(contentReady&&imageReady&&!closing)later(dismiss,Math.max(0,1100-(now()-started)))}
 button?.addEventListener('click',dismiss);
 if(reduced){remove();return {ready(){},dismiss}}
 // Bounded exit also works when the image, API, or animation event never completes.
 later(dismiss,3000);
 if(image){const ready=()=>{imageReady=true;check()};if(typeof image.decode==='function')image.decode().then(ready,ready);else if(image.complete)ready();else{image.addEventListener('load',ready,{once:true});image.addEventListener('error',ready,{once:true})}}
 return {ready(){contentReady=true;check()},dismiss};
}
let entry;
export function entryReady(){entry?.ready()}
if(typeof document!=='undefined')entry=initEntry({root:document.querySelector('#market-entry'),image:document.querySelector('#market-entry img'),button:document.querySelector('#entry-skip'),reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false});
