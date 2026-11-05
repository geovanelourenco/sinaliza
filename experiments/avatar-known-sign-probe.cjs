/* Experimento isolado. Não contém ativos upstream e não implementa biblioteca. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { values } = parseArgs({options:{
 assets:{type:'string'}, manifest:{type:'string'}, bundle:{type:'string'}, output:{type:'string'},
 'playwright-module':{type:'string',default:'playwright'}, chromium:{type:'string',default:'/usr/bin/chromium'},
 'frames-dir':{type:'string'},
}});
for (const name of ['assets','manifest','bundle','output']) if (!values[name]) throw new Error('Argumento necessário: --'+name);
const {chromium}=require(values['playwright-module']);
const origin='http://127.0.0.1:8872';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const logs={startedAt:new Date().toISOString(),environment:{node:process.version,playwright:require(path.join(values['playwright-module'],'package.json')).version},files:[],observations:[],requests:[],frames:[],limitations:['Valida carregamento e reprodução técnica do bundle OBRIGADO. Não valida correção linguística.','Não é benchmark. Frames locais não são redistribuídos no JSON.']};
const sources=new Map([['/playerweb.json',values.manifest],['/signs/OBRIGADO',values.bundle]]);
for(const name of ['unity-loader.js','playerweb.data.unityweb','playerweb.wasm.code.unityweb','playerweb.wasm.framework.unityweb']) sources.set('/'+name,path.join(values.assets,name));
for(const [url,filename] of sources) {const b=fs.readFileSync(filename);logs.files.push({url,bytes:b.length,sha256:digest(b)});}
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:values.chromium,headless:true,args:['--enable-unsafe-swiftshader']}); logs.environment.chromium=browser.version();
 const page=await browser.newPage({viewport:{width:700,height:600}});
 const start=Date.now();
 page.on('console',m=>logs.observations.push({ms:Date.now()-start,kind:'console',type:m.type(),text:m.text()}));
 page.on('pageerror',e=>logs.observations.push({ms:Date.now()-start,kind:'pageerror',text:e.message}));
 await page.exposeFunction('recordAvatar',(...args)=>logs.observations.push({ms:Date.now()-start,kind:'bridge',args}));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()); const request={ms:Date.now()-start,url:url.href};logs.requests.push(request);
  if(url.origin!==origin){request.blocked=true;await route.abort();return;}
  if(url.pathname==='/'){
   request.status=200;
   await route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><div id="gameContainer" style="width:640px;height:550px"></div><script>
window.loaded=false;window.onLoadPlayer=()=>{window.loaded=true;recordAvatar('onLoadPlayer');};
for(const name of ['updateProgress','onPlayingStateChange','CounterGloss','GetAvatar','FinishWelcome']) window[name]=(...a)=>recordAvatar(name,...a);
</script><script src="/unity-loader.js"></script><script>window.player=UnityLoader.instantiate('gameContainer','/playerweb.json',{compatibilityCheck:(_,accept)=>accept()});</script></body></html>`});return;
  }
  const filename=sources.get(url.pathname);
  if(filename){request.status=200;await route.fulfill({body:fs.readFileSync(filename),contentType:url.pathname.endsWith('.js')?'application/javascript':url.pathname.endsWith('.json')?'application/json':'application/octet-stream'});}
  else {request.status=404;await route.fulfill({status:404,body:'Not included in probe'});}
 });
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.loaded===true,{},{timeout:30000});
 const frame=async label=>{
  const b=await page.screenshot();logs.frames.push({label,ms:Date.now()-start,sha256:digest(b),bytes:b.length});
  if(values['frames-dir']) {fs.mkdirSync(values['frames-dir'],{recursive:true});fs.writeFileSync(path.join(values['frames-dir'],label+'.png'),b);}
 };
 await frame('loaded');
 logs.playStartedMs=Date.now()-start;
 await page.evaluate(()=>{player.SendMessage('PlayerManager','setBaseUrl','http://127.0.0.1:8872/signs/');player.SendMessage('PlayerManager','playNow','OBRIGADO');});
 for(let i=0;i<12;i++){await page.waitForTimeout(250);await frame('play-'+i);}
 await page.waitForTimeout(3000);
 logs.canvas=await page.locator('canvas').count();
 const states=logs.observations.filter(x=>x.kind==='bridge'&&x.args[0]==='onPlayingStateChange'&&x.ms>=logs.playStartedMs);
 const playing=states.find(x=>x.args[1]==='True');
 const finished=playing&&states.find(x=>x.ms>playing.ms&&x.args[1]==='False'&&x.args[4]==='False');
 const playbackFrames=logs.frames.filter(x=>x.label.startsWith('play-')&&playing&&x.ms>playing.ms&&(!finished||x.ms<finished.ms));
 logs.playbackWindow={playingMs:playing?.ms,finishedMs:finished?.ms,frameLabels:playbackFrames.map(x=>x.label)};
 logs.checks={initialized:logs.observations.some(x=>x.kind==='bridge'&&x.args[0]==='onLoadPlayer'),bundleServed:logs.requests.some(x=>x.url===origin+'/signs/OBRIGADO'&&x.status===200),onlyLocalRequests:logs.requests.every(x=>new URL(x.url).origin===origin),playingState:states.some(x=>x.args[1]==='True'),finishedState:!!finished,noSpellingFallback:!logs.observations.some(x=>x.kind==='console'&&x.text.includes('To spell:')),differentPlaybackFrames:new Set(playbackFrames.map(x=>x.sha256)).size>1,bundleLoadReported:logs.observations.some(x=>x.kind==='console'&&x.text.includes('BUNDLE (OBRIGADO) CARREGADO COM SUCESSO'))};
 logs.status=Object.values(logs.checks).every(Boolean)?'PASS_KNOWN_BUNDLE_TECHNICAL_PLAYBACK':'INCOMPLETE';
 if(logs.status==='INCOMPLETE')process.exitCode=1;
})().catch(e=>{logs.status='ERROR';logs.error=String(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(values.output,JSON.stringify(logs,null,2)+'\n');console.log(JSON.stringify({status:logs.status,environment:logs.environment,checks:logs.checks,error:logs.error}));});
