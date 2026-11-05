/* Experimento isolado. Não é implementação da biblioteca Sinaliza.
 * Assets upstream ficam fora do repositório. Use um checkout fixado do player-webjs.
 */
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { values } = parseArgs({ options: {
  assets: { type: 'string' },
  output: { type: 'string' },
  chromium: { type: 'string', default: '/usr/bin/chromium' },
  'playwright-module': { type: 'string', default: 'playwright' },
  screenshot: { type: 'string' },
} });
if (!values.assets || !values.output) {
  console.error('Uso: node avatar-probe.cjs --assets DIR_TARGET --output LOG.json [--playwright-module MODULE] [--chromium BIN] [--screenshot PNG]');
  process.exit(2);
}
const assets = path.resolve(values.assets);
const { chromium } = require(values['playwright-module']);
const playwrightVersion = require(path.join(values['playwright-module'], 'package.json')).version;
const origin = 'http://127.0.0.1:8871';
const log = { startedAt: new Date().toISOString(), environment: {
  node: process.version, playwright: playwrightVersion,
}, observations: [], requests: [], limitations: [
  'Prova de inicialização local e ponte; não valida sinal OLA nem qualidade da soletração.',
  'Todos os sinais externos recebem 404 deliberado; nenhum bundle de dicionário é fornecido.',
  'Este experimento não é benchmark de latência nem prova de movimento por comparação de frames.',
] };
let browser;
(async () => {
  browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--enable-unsafe-swiftshader'] });
  log.environment.chromium = browser.version();
  const page = await browser.newPage({ viewport: { width: 700, height: 600 } });
  page.on('console', m => log.observations.push({ kind: 'console', type: m.type(), text: m.text() }));
  page.on('pageerror', e => log.observations.push({ kind: 'pageerror', text: e.message }));
  await page.exposeFunction('recordAvatar', (...args) => log.observations.push({ kind: 'bridge', args }));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    log.requests.push(url.href);
    if (url.origin !== origin) { await route.abort(); return; }
    if (url.pathname === '/') {
      await route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body><div id="gameContainer" style="width:640px;height:550px"></div><script>
window.onLoadPlayer=()=>{recordAvatar('onLoadPlayer');player.SendMessage('PlayerManager','setBaseUrl','${origin}/signs/');player.SendMessage('PlayerManager','playNow','OLA');};
for (const name of ['updateProgress','onPlayingStateChange','CounterGloss','GetAvatar','FinishWelcome']) window[name]=(...a)=>recordAvatar(name,...a);
</script><script src="/UnityLoader.js"></script><script>window.player=UnityLoader.instantiate('gameContainer','/playerweb.json',{compatibilityCheck:(_,accept)=>accept()});</script></body></html>` });
      return;
    }
    const allowed = ['UnityLoader.js', 'playerweb.json', 'playerweb.wasm.code.unityweb', 'playerweb.wasm.framework.unityweb', 'playerweb.data.unityweb'];
    const filename = url.pathname.slice(1);
    const local = path.join(assets, filename);
    if (allowed.includes(filename) && fs.existsSync(local)) {
      await route.fulfill({ body: fs.readFileSync(local), contentType: filename.endsWith('.js') ? 'application/javascript' : filename.endsWith('.json') ? 'application/json' : 'application/octet-stream' });
    } else {
      await route.fulfill({ status: 404, body: 'Asset absent in inspected repository' });
    }
  });
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(20000);
  log.canvas = await page.locator('canvas').count();
  log.body = await page.locator('body').innerText();
  if (values.screenshot) await page.screenshot({ path: values.screenshot });
  log.checks = {
    initialized: log.observations.some(x => x.kind === 'bridge' && x.args[0] === 'onLoadPlayer'),
    canvasCreated: log.canvas === 1,
    localSignRequested: log.requests.includes(origin + '/signs/OLA'),
    onlyLocalRequests: log.requests.every(x => new URL(x).origin === origin),
    spellingFallbackReported: log.observations.some(x => x.kind === 'console' && x.text.includes('To spell: OLA')),
  };
  log.status = Object.values(log.checks).every(Boolean) ? 'PASS_INITIALIZATION_AND_MISSING_SIGN_PATH' : 'INCOMPLETE';
  if (log.status === 'INCOMPLETE') process.exitCode = 1;
})().catch(e => {
  log.status = 'ERROR'; log.error = String(e); process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
  fs.writeFileSync(values.output, JSON.stringify(log, null, 2) + '\n');
  console.log(JSON.stringify({ status: log.status, environment: log.environment, checks: log.checks }));
});
