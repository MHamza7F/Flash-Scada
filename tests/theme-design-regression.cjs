const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/scada_demo_test.Web/wwwroot/css/site.css'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'src/scada_demo_test.Web/wwwroot/js/theme.js'), 'utf8');

function tokenBlock(source, expression) {
  const blocks = [...source.matchAll(expression)].map((match) => match[1]);
  assert.ok(blocks.length, `missing token block: ${expression}`);
  return blocks.at(-1);
}

function token(block, name) {
  const match = block.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `missing ${name}`);
  return match[1];
}

function luminance(hex) {
  const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset + 1, offset + 3), 16) / 255);
  const linear = channels.map((channel) => channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}

function contrast(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + .05) / (dark + .05);
}

const light = tokenBlock(css, /:root\s*\{([\s\S]*?)\}/g);
const dark = tokenBlock(css, /html\[data-theme="dark"\], body\.dark-theme\s*\{([\s\S]*?)\}/g);
for (const [name, block, surface] of [['light', light, '--bg-card'], ['dark', dark, '--bg-card']]) {
  const primary = token(block, '--text-main');
  const muted = token(block, '--text-muted');
  const background = token(block, '--bg-body');
  const card = token(block, surface);
  const action = token(block, '--primary-action');
  assert.ok(contrast(primary, background) >= 4.5, `${name} primary text contrast`);
  assert.ok(contrast(muted, card) >= 4.5, `${name} muted text contrast`);
  assert.ok(contrast('#ffffff', action) >= 4.5, `${name} primary button contrast`);
}

assert.match(css, /\.device-card\.online, \.device-card\.offline, \.device-card\.error \{ border-top-color: var\(--border-color\); \}/);
assert.doesNotMatch(css, /--connection-(?:online|offline)|background:\s*#(?:0f172a|0e1626|111c2e|16223a)/i);
assert.match(css, /\.status-pill\.online[\s\S]*?var\(--accent-emerald-light\)/);
assert.match(css, /\.status-pill\.offline[\s\S]*?var\(--accent-rose-light\)/);
assert.match(css, /\.modal-card \{ min-width: 0;[\s\S]*?max-height: calc\(100dvh - 32px\)/);
assert.match(css, /\.modal-body \{ min-height: 0; overflow-y: auto/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /animation-duration: \.01ms !important/);
assert.match(css, /\[aria-invalid="true"\]/);
assert.match(css, /button:disabled, input:disabled, select:disabled, textarea:disabled/);

function runTheme(storage, systemDark) {
  let listener;
  const attributes = {};
  const context = {
    localStorage: storage,
    document: {
      documentElement: { setAttribute: (key, value) => { attributes[key] = value; } },
      body: { classList: { toggle: () => {} } }
    },
    window: {
      matchMedia: () => ({
        matches: systemDark,
        addEventListener: (_, callback) => { listener = callback; }
      })
    }
  };
  vm.runInNewContext(theme, context);
  const initial = attributes['data-theme'];
  const result = context.window.theme.initTheme();
  assert.equal(result, initial === 'dark');
  return { context, attributes, listener };
}

const throwingStorage = {
  getItem() { throw new Error('storage blocked'); },
  setItem() { throw new Error('storage blocked'); }
};
const blocked = runTheme(throwingStorage, false);
assert.equal(blocked.attributes['data-theme'], 'light');
assert.doesNotThrow(() => blocked.context.window.theme.setTheme(true), 'blocked storage must not break setTheme');
assert.equal(blocked.attributes['data-theme'], 'dark');
if (blocked.listener) blocked.listener({ matches: false });
assert.equal(blocked.attributes['data-theme'], 'dark', 'a session choice remains stable when storage is blocked');
const blockedDarkSystem = runTheme(throwingStorage, true);
assert.equal(blockedDarkSystem.attributes['data-theme'], 'light', 'first visit remains light when storage is blocked');

console.log('Theme design regression: contrast, neutral cards, responsive dialogs, reduced motion and blocked storage passed.');
