const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/scada_demo_test.Web/wwwroot/js/theme.js'), 'utf8');
for (const saved of [null, 'light', 'dark']) {
  for (const systemDark of [false, true]) {
    let preference = saved;
    let listener;
    const attributes = {};
    const context = {
      localStorage: { getItem: () => preference, setItem: (_, value) => { preference = value; } },
      document: { documentElement: { setAttribute: (key, value) => { attributes[key] = value; } }, body: { classList: { toggle() {} } } },
      window: { matchMedia: () => ({ matches: systemDark, addEventListener: (_, callback) => { listener = callback; } }) }
    };
    vm.runInNewContext(source, context);
    const expected = saved ?? 'light';
    assert.equal(attributes['data-theme'], expected, 'pre-paint theme');
    assert.equal(context.window.theme.initTheme(), expected === 'dark');
    if (listener) listener({ matches: !systemDark });
    assert.equal(attributes['data-theme'], saved ?? 'light');
    context.window.theme.setTheme(true);
    assert.equal(preference, 'dark');
    assert.equal(attributes['data-theme'], 'dark');
    if (listener) listener({ matches: false });
    assert.equal(attributes['data-theme'], 'dark', 'explicit preference must win');
  }
}
console.log('Theme regression: six preference scenarios passed.');
const root = path.join(__dirname, '../src/scada_demo_test.Web');
const host = fs.readFileSync(path.join(root, 'Pages/_Host.cshtml'), 'utf8');
assert.match(host, /href="scada_demo_test\.Web\.styles\.css"/, 'isolated content CSS must load');
assert.match(host, /href="css\/site\.css" asp-append-version="true"/, 'theme assets must invalidate browser caches');
const navigation = fs.readFileSync(path.join(root, 'Shared/NavMenu.razor'), 'utf8');
assert.match(navigation, /new NavItem\("\/infrastructure", "View Instruments"/, 'infrastructure page must be a standalone View Instruments navigation item');
assert.match(navigation, /<span class="brand-logo-frame">\s*<img class="brand-logo" src="\/images\/logo\.jpg" alt="ALAM globe logo" \/>\s*<\/span>/, 'sidebar must frame the compact globe logo mark');
assert.match(navigation, /class="brand-title">ALAM IOT<\/div>/, 'sidebar brand must identify ALAM IOT');
assert.match(navigation, /class="brand-sub">ENTERPRISE<\/div>/, 'sidebar brand subtitle must omit the SCADA label');
assert.doesNotMatch(navigation, /SCADA ENTERPRISE/, 'sidebar brand must not repeat the old tagline');
assert.equal((navigation.match(/"\/infrastructure"/g) || []).length, 1, 'do not duplicate the tab in a collapsed group');
const login = fs.readFileSync(path.join(root, 'Pages/Login.razor'), 'utf8');
assert.match(login, /class="login-brand-frame" aria-hidden="true">\s*<img class="login-brand-logo" src="\/images\/logo\.jpg" alt="" \/>/, 'login page must use the same globe logo as the sidebar');
assert.match(login, /class="login-brand-title">ALAM IOT<\/div>[\s\S]*?class="login-brand-sub">ENTERPRISE<\/div>/, 'login branding must match the sidebar text');
assert.doesNotMatch(login, /<h2>\s*ALAM IOT Enterprises\s*<\/h2>/, 'login page must not repeat the removed brand heading');
const siteStyles = fs.readFileSync(path.join(root, 'wwwroot/css/site.css'), 'utf8');
assert.match(siteStyles, /html\[data-theme="dark"\] \.brand-logo,[\s\S]*?filter: invert\(1\);[\s\S]*?mix-blend-mode: screen;/, 'dark mode must invert the logo and blend away its light background');
assert.match(siteStyles, /\.sidebar-brand \{\s*height: var\(--topbar-h\);\s*flex-shrink: 0;\s*display: flex;\s*align-items: center;\s*padding: 0 16px;\s*gap: 12px;\s*justify-content: center;/, 'expanded sidebar branding must be centered in the available space');
assert.match(siteStyles, /\.sidebar-brand \.brand-logo-frame \{\s*width: 74px;\s*height: 52px;\s*flex: 0 0 74px;\s*overflow: hidden;\s*border: 1px solid transparent;/, 'expanded sidebar globe must be slightly zoomed without adding a light-mode frame');
assert.match(siteStyles, /\.sidebar-brand \.brand-logo \{\s*width: 100%;\s*height: 100%;\s*object-fit: cover;\s*object-position: left center;\s*\}/, 'sidebar must crop the horizontal logo to its globe mark');
assert.match(siteStyles, /--sidebar-w-collapsed:\s*80px;/, 'collapsed desktop sidebar must provide a little extra room');
assert.match(siteStyles, /\.app-shell\.sidebar-collapsed \.app-main \{\s*margin-left: var\(--sidebar-w-collapsed\);/, 'collapsed main content must stay aligned with the wider sidebar');
assert.match(siteStyles, /\.sidebar\.collapsed \.sidebar-brand \{ padding: 0; justify-content: center; gap: 0; \}/, 'collapsed sidebar branding must remain centered');
assert.match(siteStyles, /\.sidebar\.collapsed \.sidebar-brand \.brand-logo-frame \{ width: 72px; flex-basis: 72px; \}/, 'collapsed sidebar must fit the logo mark with a small margin');
assert.doesNotMatch(siteStyles, /(?:html\[data-theme="dark"\]|body\.dark-theme)\s+\.sidebar-brand\s+\.brand-logo-frame/, 'dark mode must not add a visible logo frame border');
assert.match(siteStyles, /\.sidebar\.collapsed \.brand-text \{ display: none; \}/, 'collapsed sidebar must hide the text brand');
assert.match(siteStyles, /\.brand-sub \{ color: var\(--text-main\); \}/, 'enterprise text must follow the active theme text color');
assert.doesNotMatch(siteStyles, /\.brand-sub,\s*\.view-all-link, \.user-role-badge, \.view-telemetry-btn \{ color: var\(--primary-blue\); \}/, 'enterprise text must not use the accent color');
assert.match(siteStyles, /\.login-brand-logo \{\s*width: 100%;\s*height: 100%;\s*object-fit: cover;\s*object-position: left center;[\s\S]*?mix-blend-mode: multiply;/, 'login logo must use the sidebar globe crop and blend into the light background');
assert.match(siteStyles, /\.login-brand-frame \{\s*width: 112px;\s*height: 80px;\s*flex: 0 0 112px;/, 'login globe mark must be larger than the sidebar mark');
assert.match(siteStyles, /\.login-brand-lockup \{\s*display: flex;\s*align-items: center;\s*justify-content: center;\s*gap: 8px;/, 'login logo and text must sit closer together');
assert.match(siteStyles, /\.login-brand-title \{\s*color: var\(--text-main\);\s*font-size: 21px;/, 'login brand title must remain prominent');
assert.match(siteStyles, /\.login-brand-sub \{\s*color: var\(--text-main\);\s*width: max-content;\s*font-size: 18px;/, 'login enterprise text must be large enough to extend past ALAM IOT');
assert.match(siteStyles, /\.login-brand \{\s*display: flex;\s*flex-direction: column;\s*align-items: center;\s*text-align: center;\s*margin-bottom: 28px;\s*transform: translateX\(-6px\);/, 'login logo, brand text, and subtitle must shift slightly left together');
assert.match(siteStyles, /\.login-brand p \{\s*font-size: 12px;/, 'login platform subtitle must be slightly larger');
assert.match(siteStyles, /\.login-card \{\s*width: 100%;\s*max-width: 440px;[\s\S]*?padding: 40px 32px;/, 'login card must grow evenly with balanced vertical padding');
const page = fs.readFileSync(path.join(root, 'Pages/Infrastructure.razor'), 'utf8');
assert.match(page, /@page "\/infrastructure"/);
assert.match(page, /<PageTitle>View Instruments<\/PageTitle>/);
assert.match(page, /<h1>View Instruments<\/h1>/);
assert.match(page, /class="infra-add-menu"/);
assert.match(page, /href="\/gateway"/);
assert.match(page, /href="\/devices"/);
const infrastructureStyles = fs.readFileSync(path.join(root, 'Pages/Infrastructure.razor.css'), 'utf8');
assert.match(infrastructureStyles, /\.device-art\{display:grid;place-items:center;height:90px;/, 'device image panels must keep their original height');
assert.match(infrastructureStyles, /\.device-art img\{max-width:100%;max-height:120px;object-fit:contain\}/, 'device images must keep their original sizing and position rules');
assert.doesNotMatch(infrastructureStyles, /\.gateway-card \.device-art \{\s*height: 128px;/, 'device cards must not override the original image panel height');
assert.match(siteStyles, /\.gw-device-card \.status-pill \{[\s\S]*?overflow-wrap: normal;[\s\S]*?word-break: normal;/);
assert.match(siteStyles, /\.gw-device-card \.sensor-row-layout \{\s*flex-wrap: wrap;/);
assert.match(siteStyles, /\.gw-device-card \.status-pill-label \{[\s\S]*?white-space: nowrap;[\s\S]*?overflow-wrap: normal;/);
assert.match(page, /GetGatewayDevicesAsync/);
assert.match(page, /GetSensorsAsync/);
assert.match(page, /GetMeterSnapshot\(s\.UniqueSensorId\)/);
assert.doesNotMatch(page, /Math\.random|new Random\(|Simulated data/);
console.log('Navigation, CSS loading and real-data source contracts passed.');
