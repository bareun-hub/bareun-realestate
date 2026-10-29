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
