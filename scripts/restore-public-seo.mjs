#!/usr/bin/env node
// Idempotent SEO overlay on the published gh-pages tree.
// Run from a GitHub Actions checkout of the MAIN branch, passing the gh-pages worktree.
import fs from 'node:fs';
import path from 'node:path';

const published = process.argv[2];
if (!published || !fs.existsSync(path.join(published, 'index.html'))) {
  throw new Error('Expected a checked-out gh-pages directory containing index.html');
}
const root = process.cwd();
const files = [
  'sitemap.xml',
  'hy/index.html',
  'ka/index.html',
  'google205ea606b7e2a9e2.html'
];
for (const relative of files) {
  const source = path.join(root, 'seo-public', relative);
  const target = path.join(published, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  const bytes = fs.readFileSync(source);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) fs.writeFileSync(target, bytes);
}
const homepage = path.join(published, 'index.html');
let html = fs.readFileSync(homepage, 'utf8');
const title = 'Базар — доставка продуктов в Ахалкалаки';
const description = 'Базар — онлайн-рынок с доставкой продуктов в Ахалкалаки. Овощи, фрукты, сыр, хлеб и продукты местных поставщиков. Заказы на русском, армянском и грузинском.';
const tags = [
  ['canonical', '<link rel="canonical" href="https://xugushik-source.github.io/Bazar/">'],
  ['name="robots"', '<meta name="robots" content="index,follow">'],
  ['property="og:title"', '<meta property="og:title" content="Базар — доставка продуктов в Ахалкалаки">'],
  ['property="og:description"', '<meta property="og:description" content="Онлайн-рынок Ахалкалаки: продукты местных поставщиков с доставкой.">'],
  ['property="og:type"', '<meta property="og:type" content="website">'],
  ['property="og:url"', '<meta property="og:url" content="https://xugushik-source.github.io/Bazar/">'],
  ['property="og:image"', '<meta property="og:image" content="https://xugushik-source.github.io/Bazar/media/bazar-opening-market.jpg">'],
  ['"@type":"WebSite"', '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Базар","alternateName":["Բազար","ბაზარი"],"url":"https://xugushik-source.github.io/Bazar/","inLanguage":["ru","hy","ka"]}</script>']
];
if (!html.includes('</head>') || !/<title>[^<]*<\/title>/.test(html)) {
  throw new Error('Unexpected homepage head: refusing to modify storefront');
}
html = html.replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>');
if (/<meta name="description" content="[^"]*">/.test(html)) {
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + description + '">');
} else {
  html = html.replace('</head>', '<meta name="description" content="' + description + '"></head>');
}
for (const [marker, tag] of tags) {
  if (!html.includes(marker)) html = html.replace('</head>', tag + '</head>');
}
const languages = '<nav aria-label="Информация на других языках" style="padding:18px 16px;text-align:center;background:#254637;color:#fff;font:15px system-ui,sans-serif"><a href="./hy/" lang="hy" style="color:#fff;text-decoration:underline;margin-right:18px">Հայերեն</a><a href="./ka/" lang="ka" style="color:#fff;text-decoration:underline">ქართული</a></nav>';
if (!html.includes('aria-label="Информация на других языках"')) {
  if (!html.includes('<dialog id="modal"')) throw new Error('Missing insertion point for language links');
  html = html.replace('<dialog id="modal"', languages + '<dialog id="modal"');
}
fs.writeFileSync(homepage, html);
const appFile = path.join(published, 'app.js');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  const oldTitle = "document.title=t('brand')+' · '+t('heroEyebrow');";
  const newTitle = "document.title=lang==='hy'?'Բազար — մթերքների առաքում Ախալքալաքում':lang==='ka'?'ბაზარი — პროდუქტების მიტანა ახალქალაქში':'Базар — доставка продуктов в Ахалкалаки';";
  if (app.includes(oldTitle)) {
    app = app.replace(oldTitle, newTitle);
    fs.writeFileSync(appFile, app);
  } else if (!app.includes(newTitle)) {
    console.warn('App title assignment changed; left app.js untouched for safety.');
  }
}
console.log('Bazar SEO public overlay checked: ' + files.join(', '));
