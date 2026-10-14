const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.join(__dirname, '../src/scada_demo_test.Web');
const program = fs.readFileSync(path.join(root, 'Program.cs'), 'utf8');
const host = fs.readFileSync(path.join(root, 'Pages/_Host.cshtml'), 'utf8');
const staticAssetFiles = [
  'Pages/_Host.cshtml',
  'Shared/MainLayout.razor',
  'wwwroot/css/site.css',
  'wwwroot/js/charts.js',
  'wwwroot/js/sidebar.js',
  'wwwroot/js/theme.js',
];

assert.match(program, /builder\.WebHost\.UseStaticWebAssets\(\)/,
  'direct executable launches must retain the runtime manifest loader');
assert.match(program, /app\.MapStaticAssets\(\)/,
  'Web must register generated static-asset endpoints');
assert.doesNotMatch(program, /app\.UseStaticFiles\(\)/,
  'legacy static-file middleware must not short-circuit compressed endpoints');

assert.doesNotMatch(host, /<link\s+rel="preload"[^>]+css\/site\.css/,
  'site CSS must not have a mismatched duplicate preload');
assert.match(host, /<link rel="stylesheet" href="css\/site\.css" asp-append-version="true"/,
  'site CSS must retain cache-busting versioning');
assert.match(host, /<script src="js\/charts\.js" asp-append-version="true"><\/script>/,
  'charts.js must use local versioned delivery');
assert.ok(host.indexOf('js/charts.js') < host.indexOf('_framework/blazor.server.js'),
  'charts.js must load before the Blazor runtime');
assert.ok(host.indexOf('_framework/blazor.server.js') < host.indexOf('Blazor.start('),
  'Blazor must start only after its runtime script is loaded');
assert.doesNotMatch(host, /charts\.js"[^>]*\bdefer\b/,
  'charts.js must be ready before the inline Blazor start call');
assert.ok(program.indexOf('app.MapStaticAssets()') < program.indexOf('app.MapFallbackToPage'),
  'static assets must be mapped before the Blazor fallback endpoint');

for (const relative of staticAssetFiles) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  assert.doesNotMatch(source, /https?:\/\//i,
    `${relative} must not introduce a remote browser asset`);
  assert.doesNotMatch(source, /\/\/(?:cdn\.|cdnjs\.|unpkg\.|jsdelivr\.|fonts\.googleapis\.)/i,
    `${relative} must not introduce an external CDN browser asset`);
}

console.log('Static asset regression: manifest mapping, local versioning, startup order, and CDN-free browser assets passed.');
