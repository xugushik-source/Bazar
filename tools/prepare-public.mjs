import fs from 'node:fs';import {mediaVersionsSource}from './media-versions.mjs';import config from '../src/config.mjs';
fs.copyFileSync(new URL('../src/weight-policy.mjs',import.meta.url),new URL('../public/weight-policy.js',import.meta.url));
// SEO 30.10: the storefront title is the search title («доставка продуктов в Ахалкалаки»), not the bare brand names; the app
// switches it to hy/ka when the buyer picks a language.
const path=new URL('../public/index.html',import.meta.url),title=config.seoTitle.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));fs.writeFileSync(path,fs.readFileSync(path,'utf8').replace(/<title>.*?<\/title>/,'<title>'+title+'</title>'));

fs.copyFileSync(new URL('../src/bot-words.mjs',import.meta.url),new URL('../public/bot-words.js',import.meta.url));
fs.writeFileSync(new URL('../public/media-versions.js',import.meta.url),mediaVersionsSource());
// Personal data documents (owner 30.10, Law of Georgia No. 3144): built from the template in src/legal.mjs, so the owner fills the
// operator's details in one place and both pages, in three languages, follow.
{const {consentPage,privacyPage}=await import('../src/legal.mjs');fs.writeFileSync(new URL('../public/consent.html',import.meta.url),consentPage());fs.writeFileSync(new URL('../public/privacy.html',import.meta.url),privacyPage())}
