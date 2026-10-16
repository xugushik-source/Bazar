import fs from 'node:fs';import config from '../src/config.mjs';
fs.copyFileSync(new URL('../src/weight-policy.mjs',import.meta.url),new URL('../public/weight-policy.js',import.meta.url));
const path=new URL('../public/index.html',import.meta.url),title=Object.values(config.brand).join(' · ').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));fs.writeFileSync(path,fs.readFileSync(path,'utf8').replace(/<title>.*?<\/title>/,'<title>'+title+'</title>'));
