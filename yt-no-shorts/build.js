// node build.js → dist/: расширение (папка + zip), userscript, букмарклет, фильтры uBO
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const src = p => path.join(__dirname, 'src', p), dist = path.join(__dirname, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'extension'), { recursive: true });
const core = fs.readFileSync(src('core.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(src('manifest.json'), 'utf8'));

fs.writeFileSync(path.join(dist, 'extension', 'content.js'), core);
fs.writeFileSync(path.join(dist, 'extension', 'manifest.json'), JSON.stringify(manifest, null, 2));
execSync('zip -qj ../yt-no-shorts-extension.zip manifest.json content.js', { cwd: path.join(dist, 'extension') });

fs.writeFileSync(path.join(dist, 'yt-no-shorts.user.js'), `// ==UserScript==
// @name         YT No Shorts
// @version      ${manifest.version}
// @description  ${manifest.description}
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
${core}`);

// Букмарклет: убираем комментарии и лишние пробелы
const min = core.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
  .map(l => l.replace(/^\s+/, '')).filter(l => l && !l.startsWith('//'))
  .map(l => l.replace(/\s+\/\/ .*$/, '')).join('\n');
fs.writeFileSync(path.join(dist, 'bookmarklet.txt'), 'javascript:' + encodeURIComponent(min));
fs.copyFileSync(src('ublock-filters.txt'), path.join(dist, 'ublock-filters.txt'));
console.log('ok:', fs.readdirSync(dist).join(', '));
