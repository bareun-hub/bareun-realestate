import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const index = await readFile(path.join(output, 'index.html'), 'utf8');
assert.equal([...index.matchAll(/<script[^>]+src="assets\//g)].length, 1, 'Expected one local script bundle');
assert.equal([...index.matchAll(/<link[^>]+href="assets\/site\./g)].length, 1, 'Expected one local CSS bundle');
assert(!index.includes('<style>'), 'Inline stylesheet was not bundled');
const assets = await readdir(path.join(output, 'assets'));
assert(assets.every((file) => /\.[a-f0-9]{12}\.[a-z]+$/.test(file)), 'Assets must use content-hashed names');
for (const file of assets.filter((name) => name.endsWith('.js'))) {
  new Script(await readFile(path.join(output, 'assets', file), 'utf8'), { filename: file });
}
for (const file of ['index.html', 'card.html']) {
  const html = await readFile(path.join(output, file), 'utf8');
  for (const match of html.matchAll(/(?:src|srcset|href)="(assets\/[^"?]+)(?:\?[^"]*)?"/g)) {
    const resolved = path.resolve(output, match[1]);
    assert(resolved.startsWith(output + path.sep), 'Asset escaped output directory');
    await access(resolved);
  }
}
const published = await readdir(output);
assert(!published.some((name) => ['.git', '.github', 'scripts', 'package.json', 'DEPLOYMENT.md'].includes(name)), 'Development files leaked into build');
assert.equal(JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8')).outputDirectory, 'dist');
console.log('Build verified: asset references, script syntax, cacheable filenames, and deployment output.');

// Digital card: keep the source's styles/scripts and every functional link intact.
const cardSource = await readFile(path.join(root, 'card.html'), 'utf8');
const cardOutput = await readFile(path.join(output, 'card.html'), 'utf8');
const cardStyles = [...cardSource.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const cardScripts = [...cardSource.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
const cardCssPath = cardOutput.match(/<link rel="stylesheet" href="(assets\/card\.[^"]+)"/)?.[1];
const cardJsPath = cardOutput.match(/<script defer src="(assets\/card\.[^"]+)"><\/script>/)?.[1];
assert(cardCssPath && cardJsPath, 'Card must use cacheable CSS and JS');
assert.equal(await readFile(path.join(output, cardCssPath), 'utf8'), cardStyles, 'Card CSS changed during extraction');
assert.equal(await readFile(path.join(output, cardJsPath), 'utf8'), cardScripts, 'Card JS changed during extraction');
assert(!/<style\b|<script\b(?![^>]*\bsrc=)/.test(cardOutput), 'Unexpected inline card code');
const links = html => [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(links(cardOutput), links(cardSource), 'Business links changed during build');
for (const name of ['og:title', 'og:description', 'og:url', 'og:image']) {
  assert.equal([...cardOutput.matchAll(new RegExp('property="' + name + '"', 'g'))].length, 1, 'Missing/duplicate ' + name);
}
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const configuredUrl = process.env.SITE_URL || (productionHost ? `https://${productionHost}/` : '');
if (configuredUrl) {
  const site = new URL(configuredUrl);
  if (!site.pathname.endsWith('/')) site.pathname += '/';
  assert(cardOutput.includes(`property="og:url" content="${site.href}card.html"`));
  assert(cardOutput.includes(`property="og:image" content="${site.href}og-card-20261028.png"`));
}
console.log(`Card verified: exact CSS/JS preservation, original links, social tags; HTML ${Buffer.byteLength(cardSource)} → ${Buffer.byteLength(cardOutput)} bytes.`);
