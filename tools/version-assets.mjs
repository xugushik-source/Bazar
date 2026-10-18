import fs from 'node:fs';import crypto from 'node:crypto';
// GitHub Pages lets browsers keep files for 10 minutes. Every release gets its own ?v= on every local script/style import,
// so a phone never mixes a new app.js with an old photos.js (which would break the page) and sees a release at once.
export const versionRefs=(text,v)=>text.replace(/(from\s*|import\s*\(\s*|src=|href=)(["'])(\.\/[\w./-]+\.(?:js|css))(?:\?v=[\w.-]+)?\2/g,(_,p,q,file)=>`${p}${q}${file}?v=${v}${q}`);
export function versionDir(dir){const files=fs.readdirSync(dir).filter(f=>/\.(js|css|html)$/.test(f)).sort(),h=crypto.createHash('sha256');for(const f of files)h.update(f).update(fs.readFileSync(new URL(f,dir)));const v=h.digest('hex').slice(0,10);
 for(const f of files){const path=new URL(f,dir),text=fs.readFileSync(path,'utf8'),next=versionRefs(text,v);if(next!==text)fs.writeFileSync(path,next)}return v}
