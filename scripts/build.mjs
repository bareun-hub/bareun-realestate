// Dependency-free static build. Preserve cascade and classic script order.
import { readFile, writeFile, mkdir, readdir, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw Error('Invalid build output path');
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
const read = (file) => readFile(path.join(root, file), 'utf8');
const hash = (data) => createHash('sha256').update(data).digest('hex').slice(0, 12);
const assets = new Map();

// All files under dist/assets are content-addressed and safe to cache forever.
for (const entry of await readdir(path.join(root, 'assets'), { withFileTypes: true })) {
  if (!entry.isFile()) throw Error(`Unexpected asset directory: ${entry.name}`);
  const data = await readFile(path.join(root, 'assets', entry.name));
  const extension = path.extname(entry.name);
  const name = `assets/${path.basename(entry.name, extension)}.${hash(data)}${extension}`;
  await writeFile(path.join(output, name), data);
  assets.set(`assets/${entry.name}`, name);
}

let html = await read('index.html');
const cssParts = [];
const stylePattern = /<link\b[^>]*rel="stylesheet"[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/g;
let cssPlaceholder = false;
for (const match of [...html.matchAll(stylePattern)]) {
  const tag = match[0];
  let css;
  if (tag.startsWith('<style')) css = tag.replace(/^<style[^>]*>|<\/style>$/g, '');
  else {
    const href = tag.match(/href="([^"]+)"/)?.[1];
    if (!href || /^(https?:)?\/\//.test(href)) continue;
    css = await read(href.split('?')[0]);
  }
  const media = tag.match(/media="([^"]+)"/)?.[1];
  cssParts.push(media ? `@media ${media} {\n${css}\n}` : css);
  html = html.replace(tag, cssPlaceholder ? '' : '<!-- SITE_CSS -->');
  cssPlaceholder = true;
}
const css = cssParts.join('\n');
if (/@import\s/i.test(css)) throw Error('Move CSS imports to explicit head links before bundling');
// Existing local CSS only references remote/data URLs. Catch future local
// references rather than silently breaking them when relocating the bundle.
for (const match of css.matchAll(/url\(\s*['"]?([^\s'"\)]+)/g)) {
  if (!/^(https?:|data:|\/\/|#)/.test(match[1])) throw Error(`Resolve relative CSS URL before bundling: ${match[1]}`);
}
const cssName = `assets/site.${hash(css)}.css`;
await writeFile(path.join(output, cssName), css);
html = html.replace('<!-- SITE_CSS -->', `<link rel="stylesheet" href="${cssName}" />`);

const jsParts = [];
let jsPlaceholder = false;
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"?]+)(?:\?[^"]*)?"[^>]*><\/script>/g)]) {
  if (/^(https?:)?\/\//.test(match[1])) continue;
  jsParts.push((await read(match[1])).replace(/^\uFEFF/, ''));
  html = html.replace(match[0], jsPlaceholder ? '' : '<!-- SITE_JS -->');
  jsPlaceholder = true;
}
const js = jsParts.join('\n;\n');
const jsName = `assets/site.${hash(js)}.js`;
await writeFile(path.join(output, jsName), js);
html = html.replace('<!-- SITE_JS -->', `<script defer src="${jsName}"></script>`);

function rewriteAssets(document) {
  for (const [source, destination] of assets) {
    document = document.replaceAll(new RegExp(`${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?[^"'\\s<>]*)?`, 'g'), destination);
  }
  return document;
}
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const configuredUrl = process.env.SITE_URL || (productionHost ? `https://${productionHost}/` : '');
let card = rewriteAssets(await read('card.html'));
if (configuredUrl) {
  const site = new URL(configuredUrl);
  if (!['http:', 'https:'].includes(site.protocol)) throw Error('SITE_URL must use HTTP(S)');
  if (!site.pathname.endsWith('/')) site.pathname += '/';
  // Update existing social/canonical metadata only; business copy stays intact.
  card = card.replaceAll('https://bareun-hub.github.io/bareun-realestate/', site.href);
}
// Card assets are split only in production output. Root card.html stays portable.
// Preserve CSS cascade and script order; do not run unsafe regex minification.
const cardStyles = [...card.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
const cardCss = cardStyles.map(match => match[1]).join('\n');
if (cardStyles.length) {
  const cardCssName = 'assets/card.' + hash(cardCss) + '.css';
  await writeFile(path.join(output, cardCssName), cardCss);
  cardStyles.forEach((match, i) => { card = card.replace(match[0], i ? '' : '<link rel="stylesheet" href="' + cardCssName + '">'); });
}
const cardScripts = [...card.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
if (cardScripts.length) {
  const cardJs = cardScripts.map(match => match[1]).join('\n;\n');
  const cardJsName = 'assets/card.' + hash(cardJs) + '.js';
  await writeFile(path.join(output, cardJsName), cardJs);
  cardScripts.forEach((match, i) => { card = card.replace(match[0], i ? '' : '<script defer src="' + cardJsName + '"></script>'); });
}
// Reserve logo geometry before decoding to avoid layout shift.
const logo = await readFile(path.join(root, 'assets/business-card-logo.png'));
card = card.replace('<img class="logo"', '<img width="' + logo.readUInt32BE(16) + '" height="' + logo.readUInt32BE(20) + '" decoding="async" class="logo"');

await writeFile(path.join(output, 'index.html'), rewriteAssets(html));
await writeFile(path.join(output, 'card.html'), card);
for (const file of ['og-card-20261028.png', 'og-image.png']) await copyFile(path.join(root, file), path.join(output, file));
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built dist/: 1 local CSS bundle (${Buffer.byteLength(css)} bytes), 1 JS bundle (${Buffer.byteLength(js)} bytes).`);
