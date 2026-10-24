// Short sounds so people hear what just happened (same approach as the Pivka store): synthesised with Web Audio, no files,
// quiet, only after a tap; «🔊/🔇» in the header turns them off for good. Each sound has a visible side too (a toast,
// a badge, the cart counter), so a phone on silent misses nothing; phones also get a short vibration.
let ctx=null;
const KEY='bazar.sound';
export const soundOn=()=>{try{return localStorage.getItem(KEY)!=='off'}catch{return true}};
function tone(freq,start,dur,type='sine',vol=.06,to=null){const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+start;o.type=type;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+dur+.02)}
const buzz=p=>{try{navigator.vibrate?.(p)}catch{}};
// add — soft rising «bloop»; remove — the same falling; order — two glasses clinking; done — short confirming tick;
// update — a gentle double note (an order changed); new — an attention chime for staff (new order); error — low double knock.
export function sound(kind){if(!soundOn())return;try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();
 if(kind==='add')tone(520,0,.13,'sine',.07,880);
 else if(kind==='remove')tone(700,0,.12,'sine',.05,380);
 else if(kind==='order'){tone(2093,0,.5,'sine',.04);tone(2637,.07,.55,'sine',.035);tone(3136,.14,.45,'sine',.02);buzz([30,40,60])}
 else if(kind==='done')tone(660,0,.09,'triangle',.06,990);
 else if(kind==='update'){tone(784,0,.16,'sine',.05);tone(988,.14,.2,'sine',.045)}
 else if(kind==='new'){[0,.55].forEach(d=>{tone(880,d,.18,'triangle',.08);tone(1175,d+.16,.18,'triangle',.08);tone(1568,d+.32,.28,'triangle',.07)});buzz([120,80,120,80,200])}
 else if(kind==='error'){tone(220,0,.12,'square',.035);tone(196,.15,.16,'square',.035);buzz(80)}
}catch{}}
export function soundButton(label){return `<button type="button" class="sound-toggle" data-sound-toggle aria-label="${label}" title="${label}">${soundOn()?'🔊':'🔇'}</button>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sound-toggle]');if(!b)return;try{localStorage.setItem(KEY,soundOn()?'off':'on')}catch{}b.textContent=soundOn()?'🔊':'🔇';sound('done')});
// Staff screens refresh on their own; remember what was there so a new order (or a changed one) is heard, not only seen.
let seen=null;
export function watchOrders(list){const now=new Map(list.map(o=>[o.id,o.status]));if(seen){const fresh=[...now.keys()].some(id=>!seen.has(id)),changed=[...now].some(([id,s])=>seen.has(id)&&seen.get(id)!==s);if(fresh){sound('new');flashTitle()}else if(changed)sound('update')}seen=now}
let flashing=null;
function flashTitle(){if(flashing||!document.hidden)return;const base=document.title;let on=false;flashing=setInterval(()=>{document.title=(on=!on)?'🔔 '+base:base},900);const stop=()=>{clearInterval(flashing);flashing=null;document.title=base;document.removeEventListener('visibilitychange',stop)};document.addEventListener('visibilitychange',stop)}
