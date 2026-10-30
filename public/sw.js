// БАЗАР as an installable app (owner 29.10). Pages always come from the network, so prices and stock are never stale;
// only when the network is gone does the buyer get a short notice instead of the browser's error page.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.mode!=='navigate')return;e.respondWith(fetch(e.request).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:18px sans-serif;padding:24px;background:#f7f3ea;color:#254637"><h1>БАЗАР</h1><p>Нет интернета. Проверьте связь и обновите страницу.</p><p>Ինտերնետ չկա։ Ստուգեք կապը։</p><p>ინტერნეტი არ არის. შეამოწმეთ კავშირი.</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}})))});
