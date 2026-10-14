const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '../src/scada_demo_test.Web');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(razor|cshtml|css|js)$/.test(entry.name)) files.push(file);
  }
}
walk(root);
const mojibake = /(?:â.|ðŸ|Ã.|ï¿½)/;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(text, mojibake, `mojibake in ${path.relative(root, file)}`);
}
const infrastructure = fs.readFileSync(path.join(root, 'Pages/Infrastructure.razor'), 'utf8');
assert.match(infrastructure, /var token = _disposeCts\.Token/);
assert.doesNotMatch(infrastructure, /await RefreshAsync\(_disposeCts\.Token\)/);
assert.match(infrastructure, /DetailHistoryLimit = 50/);
assert.match(infrastructure, /<polyline class="trend-line"/);
const css = fs.readFileSync(path.join(root, 'wwwroot/css/site.css'), 'utf8');
assert.match(css, /option \{ background: var\(--bg-card\); color: var\(--text-main\); \}/);
assert.match(css, /input\[type="checkbox"\][\s\S]*accent-color: var\(--control-accent\)/);
console.log(`UI safety regression: ${files.length} local Web assets are UTF-8 and runtime/theme contracts passed.`);
