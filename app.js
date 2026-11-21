'use strict';

/* =========================================================
   ZIAD EXTRACTOR + SPF CHECKER · v2.0
   ========================================================= */
const APP_VERSION='4.0.0';
const DB_NAME='ziad-extractor-spf';
const DB_VERSION=4;
const DB_TTL=7*24*60*60*1000;
const DNS={google:'https://dns.google/resolve',cloudflare:'https://cloudflare-dns.com/dns-query'};
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg,type='info'){if(globalThis.ZToolsNotify){globalThis.ZToolsNotify(msg,type);return}const e=document.createElement('div');e.textContent=msg;$('toast').appendChild(e);setTimeout(()=>e.remove(),type==='error'?6000:3200)}
async function copyText(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch(e){void e}try{const x=document.createElement('textarea');x.value=text;x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.select();const ok=document.execCommand('copy');x.remove();return ok}catch(e){void e;return false}}
function download(name,text,type='text/plain'){try{const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}catch(e){toast('Download failed: '+String(e?.message||e),'error')}}
function csv(v){v=String(v??'');return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function fmtTime(s){s=Math.max(0,Math.floor(s||0));return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0')).join(':')}
function iso(){return new Date().toISOString()}

/* ---------- UNIFIED APP SHELL / THEME ---------- */
const VIEW_NAMES={home:'Overview',extract:'Extract',spf:'SPF Checker',rdns:'rDNS Lookup',analytics:'Analytics',settings:'Settings'};
function syncThemeButton(){
 const mode=localStorage.getItem('ziad_theme')||'dark';
 $('themeLabel').textContent=mode==='system'?'System':mode==='light'?'Light':'Dark';
 $('themeIcon').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
}
function syncModuleThemes(){
 const theme=document.body.classList.contains('light')?'light':'dark';
 document.querySelectorAll('z-rdns-module,z-analytics-module').forEach(el=>{
  if(typeof el.setTheme==='function')el.setTheme(theme);
  else el.setAttribute('data-theme',theme);
 });
}
function setActiveView(view){
 if(!VIEW_NAMES[view])view='home';
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));
 document.querySelectorAll('[data-view]').forEach(b=>{
  const active=b.dataset.view===view;
  b.classList.toggle('active',active);
  if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 document.querySelectorAll('z-rdns-module,z-analytics-module').forEach(el=>{
  const isActive=(view==='rdns'&&el.matches('z-rdns-module'))||(view==='analytics'&&el.matches('z-analytics-module'));
  if(isActive&&typeof el.activate==='function')el.activate();
  else if(!isActive&&typeof el.deactivate==='function')el.deactivate();
 });
 if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);
 if($('rememberWorkspace').checked)localStorage.setItem('ztools_last_view',view);
 document.body.classList.remove('nav-open');
 $('sidebar')?.classList.remove('open');
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setActiveView(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setActiveView(b.dataset.go)));
$('helpNav').onclick=()=>$('helpModal').classList.add('open');
$('themeBtn').onclick=()=>{
 const current=localStorage.getItem('ziad_theme')||'dark';
 const next=current==='dark'?'light':current==='light'?'system':'dark';
 localStorage.setItem('ziad_theme',next);applyStoredTheme();syncThemeButton();syncModuleThemes();
};
$('settingsTheme').onclick=()=>$('themeBtn').click();
$('compactSidebar').onchange=e=>{document.body.classList.toggle('sidebar-collapsed',e.target.checked);localStorage.setItem('ztools_sidebar',e.target.checked?'collapsed':'expanded')};
$('mobileMenu').onclick=()=>{document.body.classList.toggle('nav-open');$('sidebar').classList.toggle('open')};
$('globalSearch').onfocus=()=>openCommandPalette($('globalSearch').value);
$('globalSearch').onkeydown=e=>{if(e.key==='Enter'){openCommandPalette(e.target.value);e.preventDefault()}};
$('notificationsEnabled').onchange=e=>{localStorage.setItem('ztools_notifications',String(e.target.checked));if(globalThis.ZToolsRuntime)globalThis.ZToolsRuntime.notifications=e.target.checked;if(e.target.checked)toast('Notifications enabled')} ;
$('helpBtn').onclick=()=> $('helpModal').classList.add('open');
$('closeHelp').onclick=()=> $('helpModal').classList.remove('open');
$('helpModal').onclick=e=>{if(e.target===$('helpModal'))$('helpModal').classList.remove('open')};
function applyStoredTheme(){
 const mode=localStorage.getItem('ziad_theme')||'dark';
 const light=mode==='light'||(mode==='system'&&!window.matchMedia('(prefers-color-scheme: dark)').matches);
 document.body.classList.toggle('light',light);
}
applyStoredTheme();
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{
 if((localStorage.getItem('ziad_theme')||'dark')==='system'){applyStoredTheme();syncThemeButton();syncModuleThemes();}
});
if(localStorage.getItem('ztools_sidebar')==='collapsed'){document.body.classList.add('sidebar-collapsed');$('compactSidebar').checked=true}
$('notificationsEnabled').checked=localStorage.getItem('ztools_notifications')!=='false';
if(globalThis.ZToolsRuntime)globalThis.ZToolsRuntime.notifications=$('notificationsEnabled').checked;
function settingBool(key,fallback=true){const v=localStorage.getItem(key);return v===null?fallback:v==='true'}
$('reduceAnimations').checked=settingBool('ztools_reduce_motion',false);
$('rememberWorkspace').checked=settingBool('ztools_remember_workspace',true);
$('confirmDestructive').checked=settingBool('ztools_confirm_destructive',true);
$('autoSaveSetting').checked=settingBool('ztools_autosave',true);
document.body.classList.toggle('reduce-motion',$('reduceAnimations').checked);
$('reduceAnimations').onchange=e=>{localStorage.setItem('ztools_reduce_motion',String(e.target.checked));document.body.classList.toggle('reduce-motion',e.target.checked)};
$('rememberWorkspace').onchange=e=>localStorage.setItem('ztools_remember_workspace',String(e.target.checked));
$('confirmDestructive').onchange=e=>localStorage.setItem('ztools_confirm_destructive',String(e.target.checked));
$('autoSaveSetting').onchange=e=>{localStorage.setItem('ztools_autosave',String(e.target.checked));$('autoSave').checked=e.target.checked};
function confirmDestructiveAction(message){return !$('confirmDestructive').checked||window.confirm(message)}
async function clearIndexedDatabase(name){
 return new Promise(resolve=>{try{const r=indexedDB.deleteDatabase(name);r.onsuccess=r.onerror=r.onblocked=()=>resolve()}catch(e){console.warn('Database deletion failed',e);resolve()}});
}
function refreshStorageSummary(){
 const localBytes=new Blob([JSON.stringify(localStorage)]).size;
 $('storageSummary').textContent=`LocalStorage: ${Math.round(localBytes/1024)} KB · SPF IndexedDB: ${indexedDB?'available':'unavailable'} · rDNS IndexedDB: ${indexedDB?'available':'unavailable'} · Analytics snapshots: ${JSON.parse(localStorage.getItem('ztools_analytics')||'{}')?.history?.length||0}`;
}
$('exportSettings').onclick=()=>{
 const data={version:APP_VERSION,theme:localStorage.getItem('ziad_theme')||'dark',sidebar:localStorage.getItem('ztools_sidebar')||'expanded',notifications:settingBool('ztools_notifications',true),reduceAnimations:$('reduceAnimations').checked,rememberWorkspace:$('rememberWorkspace').checked,confirmDestructive:$('confirmDestructive').checked,autoSave:$('autoSaveSetting').checked,spf:JSON.parse(localStorage.getItem('ziad_spf_settings')||'null')};
 download('z-tools-settings.json',JSON.stringify(data,null,2),'application/json');
};
$('importSettings').onclick=()=>$('settingsFile').click();
$('settingsFile').onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{
  const x=JSON.parse(await f.text());
  if(x.theme)localStorage.setItem('ziad_theme',x.theme);
  if(x.sidebar)localStorage.setItem('ztools_sidebar',x.sidebar);
  for(const [k,v] of [['ztools_notifications',x.notifications],['ztools_reduce_motion',x.reduceAnimations],['ztools_remember_workspace',x.rememberWorkspace],['ztools_confirm_destructive',x.confirmDestructive],['ztools_autosave',x.autoSave]])if(typeof v==='boolean')localStorage.setItem(k,String(v));
  if(x.spf)localStorage.setItem('ziad_spf_settings',JSON.stringify(x.spf));
  location.reload();
 }catch(err){toast('Settings import failed: '+String(err?.message||err),'error')}
 finally{e.target.value=''}
};
$('clearSpfData').onclick=async()=>{if(!confirmDestructiveAction('Clear saved SPF data?'))return;await clearDb();toast('SPF data cleared','success');refreshStorageSummary()};
$('clearAnalyticsData').onclick=()=>{if(!confirmDestructiveAction('Clear Analytics history and baseline?'))return;localStorage.removeItem('ztools_analytics');toast('Analytics data cleared','success');refreshStorageSummary()};
$('clearAllData').onclick=async()=>{if(!confirmDestructiveAction('Clear all Z Tools local data? This cannot be undone.'))return;await clearDb();await clearIndexedDatabase('RDNS_LOOKUP_V2');localStorage.removeItem('ztools_analytics');localStorage.removeItem('ziad_spf_settings');toast('Local application data cleared','success');refreshStorageSummary()};
function diagnostics(){
 const checks=[
  ['DOM',document.body? 'PASS':'FAIL'],
  ['IndexedDB',('indexedDB' in window)?'PASS':'FAIL'],
  ['LocalStorage',(()=>{try{const k='__zt_diag';localStorage.setItem(k,'1');localStorage.removeItem(k);return'PASS'}catch(e){return'FAIL'}})()],
  ['Clipboard API',navigator.clipboard?'AVAILABLE':'LIMITED'],
  ['Download API',typeof Blob==='function'&&typeof URL.createObjectURL==='function'?'PASS':'FAIL'],
  ['Custom Elements',customElements.get('z-rdns-module')&&customElements.get('z-analytics-module')?'PASS':'FAIL'],
  ['Command Palette',document.getElementById('commandModal')?'PASS':'FAIL'],
  ['Notification bridge',typeof window.ZToolsNotify==='function'?'PASS':'FAIL'],
  ['SPF resolver endpoints',DNS.google&&DNS.cloudflare?'CONFIGURED':'FAIL']
 ];
 const report=['Z TOOLS DIAGNOSTICS',`Version: ${APP_VERSION}`,`Generated: ${new Date().toISOString()}`,'',...checks.map(x=>`${x[0]}: ${x[1]}`)].join('\n');
 $('diagnosticsReport').textContent=report;$('diagnosticsSummary').textContent=checks.filter(x=>x[1]==='FAIL').length? 'Issues detected':'All core checks passed';$('diagnosticsModal').classList.add('open');return report;
}
$('runDiagnostics').onclick=diagnostics;
$('copyDiagnostics').onclick=async()=>{const r=diagnostics();if(await copyText(r))toast('Diagnostic report copied','success')};
$('closeDiagnostics').onclick=()=>$('diagnosticsModal').classList.remove('open');
$('diagnosticsModal').onclick=e=>{if(e.target===$('diagnosticsModal'))$('diagnosticsModal').classList.remove('open')};
refreshStorageSummary();

syncThemeButton();
syncModuleThemes();
const initialHash=location.hash.replace('#',''); const remembered=localStorage.getItem('ztools_last_view'); if(VIEW_NAMES[initialHash])setActiveView(initialHash); else if($('rememberWorkspace').checked&&VIEW_NAMES[remembered])setActiveView(remembered);
function setStatus(t,run=false){$('statusText').textContent=t;$('statusDot').className='dot'+(run?' run':'')}

/* ---------- COMMAND PALETTE ---------- */
const COMMANDS=[
 {id:'home',label:'Overview',hint:'Open workspace overview',kind:'Navigation'},
 {id:'extract',label:'Extract',hint:'Open extraction workspace',kind:'Navigation'},
 {id:'spf',label:'SPF Checker',hint:'Open SPF checking workspace',kind:'Navigation'},
 {id:'rdns',label:'rDNS Lookup',hint:'Open reverse DNS workspace',kind:'Navigation'},
 {id:'analytics',label:'Analytics',hint:'Open mailing analytics',kind:'Navigation'},
 {id:'settings',label:'Settings',hint:'Open application preferences',kind:'System'},
 {id:'help',label:'Help',hint:'Open usage guidance',kind:'System'},
 {id:'theme',label:'Toggle theme',hint:'Cycle dark / light / system theme',kind:'System'},
 {id:'sidebar',label:'Toggle sidebar',hint:'Expand or collapse navigation',kind:'System'},
 {id:'spf-start',label:'Start SPF scan',hint:'Start the current SPF job',kind:'Action'},
 {id:'spf-pause',label:'Pause or resume SPF scan',hint:'Toggle current SPF job state',kind:'Action'},
 {id:'spf-clear',label:'Clear SPF results',hint:'Clear current SPF job',kind:'Action'},
 {id:'spf-export',label:'Export SPF CSV',hint:'Export all SPF results as CSV',kind:'Export'},
 {id:'spf-jsonl',label:'Export SPF JSONL',hint:'Export all SPF results as JSONL',kind:'Export'},
 {id:'rdns-start',label:'Start rDNS job',hint:'Start the current rDNS job',kind:'Action'},
 {id:'rdns-export-csv',label:'Export rDNS CSV',hint:'Export rDNS results as CSV',kind:'Export'},
 {id:'rdns-export-txt',label:'Export rDNS TXT',hint:'Export rDNS results as TXT',kind:'Export'},
 {id:'extract-run',label:'Run Extract',hint:'Extract all supported values',kind:'Action'},
 {id:'extract-clear',label:'Clear Extract',hint:'Clear extraction input and results',kind:'Action'}
];
let commandIndex=0;
function commandItems(query){const q=String(query||'').trim().toLowerCase();return COMMANDS.filter(c=>!q||`${c.label} ${c.hint} ${c.kind}`.toLowerCase().includes(q))}
function renderCommands(query){const list=$('commandList'),items=commandItems(query);commandIndex=Math.min(commandIndex,Math.max(0,items.length-1));list.innerHTML=items.length?items.map((c,i)=>`<button class="command-item${i===commandIndex?' active':''}" type="button" data-command="${c.id}"><span><b>${esc(c.label)}</b><br><small>${esc(c.hint)}</small></span><small>${esc(c.kind)}</small></button>`).join(''):'<div class="empty">No commands found.</div>';list.querySelectorAll('[data-command]').forEach((b,i)=>b.onclick=()=>runCommand(b.dataset.command))}
function openCommandPalette(query=''){const m=$('commandModal');m.classList.add('open');m.setAttribute('aria-hidden','false');$('commandInput').value=query;commandIndex=0;renderCommands(query);setTimeout(()=>$('commandInput').focus(),0)}
function closeCommandPalette(){const m=$('commandModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function runCommand(id){
 const actions={
  theme:()=>$('themeBtn').click(),
  sidebar:()=>{$('compactSidebar').checked=!$('compactSidebar').checked;$('compactSidebar').dispatchEvent(new Event('change'))},
  help:()=>$('helpModal').classList.add('open'),
  'spf-start':()=>{setActiveView('spf');$('startBtn').click()},
  'spf-pause':()=>{setActiveView('spf');$('pauseBtn').click()},
  'spf-clear':()=>{setActiveView('spf');$('clearBtn').click()},
  'spf-export':()=>{setActiveView('spf');$('exportAll').click()},
  'spf-jsonl':()=>{setActiveView('spf');$('exportJsonl').click()},
  'rdns-start':()=>{setActiveView('rdns');document.querySelector('z-rdns-module')?._api?.startJob?.()},
  'rdns-export-csv':()=>{setActiveView('rdns');document.querySelector('z-rdns-module')?._api?.downloadCSV?.()},
  'rdns-export-txt':()=>{setActiveView('rdns');document.querySelector('z-rdns-module')?._api?.downloadTXT?.()},
  'extract-run':()=>{setActiveView('extract');$('extractAll').click()},
  'extract-clear':()=>{setActiveView('extract');$('extractClear').click()}
 };
 if(actions[id])actions[id]();else if(VIEW_NAMES[id])setActiveView(id);
 closeCommandPalette();$('globalSearch').value='';
}
$('closeCommand').onclick=closeCommandPalette;$('commandModal').onclick=e=>{if(e.target===$('commandModal'))closeCommandPalette()};$('commandInput').oninput=e=>{commandIndex=0;renderCommands(e.target.value)};
$('commandInput').onkeydown=e=>{const items=commandItems(e.target.value);if(e.key==='ArrowDown'){e.preventDefault();commandIndex=Math.min(items.length-1,commandIndex+1);renderCommands(e.target.value)}else if(e.key==='ArrowUp'){e.preventDefault();commandIndex=Math.max(0,commandIndex-1);renderCommands(e.target.value)}else if(e.key==='Enter'){e.preventDefault();if(items[commandIndex])runCommand(items[commandIndex].id)}else if(e.key==='Escape'){e.preventDefault();closeCommandPalette()}};

/* ---------- EXTRACTOR ---------- */
const ex={all:[],domains:[],urls:[],ipv4:[],ipv6:[],emails:[]},exState={filter:'all',search:''};
const urlRx=/\bhttps?:\/\/[^\s<>'"`]+/gi;
const emailRx=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/gi;
const ipv4Rx=/\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g;
const ipv6Rx=/(?:(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){1,7}:|(?:[0-9a-f]{1,4}:){6}(?:\d{1,3}(?:\.\d{1,3}){3}))/gi;
const domainRx=/(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})/gi;
function validIPv4(s){const p=s.split('.');return p.length===4&&p.every(x=>/^\d+$/.test(x)&&+x>=0&&+x<=255)}
function validDomain(d){d=String(d||'').toLowerCase().replace(/^\.+|\.+$/g,'');if(!d||d.length>253||d.includes('..')||/[^a-z0-9.-]/.test(d))return false;return d.split('.').every(x=>x.length>=1&&x.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x))&&d.includes('.')&&/^(?:[a-z0-9-]+\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(d)}
function uniq(a){return [...new Set(a.map(x=>String(x).trim()).filter(Boolean))]}
function cleanUrl(x){return x.replace(/[,.!?:;)\]}]+$/,'')}
function extract(text){
 const raw=String(text||'');
 const ipv4=uniq(raw.match(ipv4Rx)||[]).filter(validIPv4);
 const ipv4Set=new Set(ipv4);
 const ipv6=uniq(raw.match(ipv6Rx)||[]);
 const emails=uniq(raw.match(emailRx)||[]).map(x=>x.toLowerCase());
 const urls=uniq((raw.match(urlRx)||[]).map(cleanUrl));
 const domains=uniq((raw.match(domainRx)||[]).map(x=>x.toLowerCase()).filter(d=>validDomain(d)&&!ipv4Set.has(d)));
 ex.urls=urls;ex.emails=emails;ex.ipv4=ipv4;ex.ipv6=ipv6;ex.domains=domains;ex.all=uniq([...domains,...urls,...ipv4,...ipv6,...emails]);
 $('xUrls').textContent=urls.length.toLocaleString();$('xDomains').textContent=domains.length.toLocaleString();$('x4').textContent=ipv4.length.toLocaleString();$('x6').textContent=ipv6.length.toLocaleString();renderExtract();
}
function renderExtract(){let vals=exState.filter==='all'?ex.all:ex[exState.filter]||[];if(exState.search)vals=vals.filter(v=>v.toLowerCase().includes(exState.search));$('extractCount').textContent=vals.length.toLocaleString();if(!vals.length){$('extractBody').innerHTML='<tr><td colspan="2" class="empty">No matching results.</td></tr>';return}const type=exState.filter==='all'?'VALUE':exState.filter.toUpperCase();$('extractBody').innerHTML=vals.slice(0,1000).map(v=>`<tr><td><span class="badge bblue">${esc(type)}</span></td><td class="mono">${esc(v)}</td></tr>`).join('')+(vals.length>1000?`<tr><td colspan="2" class="empty">Showing first 1,000 rows. Export/copy contains all ${vals.length.toLocaleString()}.</td></tr>`:'')}
function runExtract(){extract($('extractInput').value);toast('Extraction complete')}
$('extractInput').addEventListener('input',()=>{$('extractChars').textContent=$('extractInput').value.length.toLocaleString()+' chars';if($('liveExtract').checked){clearTimeout(window.__live);window.__live=setTimeout(runExtract,350)}});
$('extractAll').onclick=runExtract;
document.querySelectorAll('[data-extract]').forEach(b=>b.onclick=()=>{extract($('extractInput').value);exState.filter=b.dataset.extract;document.querySelectorAll('#extractFilters .filter').forEach(x=>x.classList.toggle('active',x.dataset.filter===exState.filter));renderExtract()});
document.querySelectorAll('#extractFilters .filter').forEach(b=>b.onclick=()=>{exState.filter=b.dataset.filter;document.querySelectorAll('#extractFilters .filter').forEach(x=>x.classList.toggle('active',x===b));renderExtract()});
$('extractSearch').oninput=e=>{exState.search=e.target.value.trim().toLowerCase();renderExtract()};
$('extractClear').onclick=()=>{$('extractInput').value='';$('extractChars').textContent='0 chars';Object.keys(ex).forEach(k=>ex[k]=[]);renderExtract();toast('Extractor cleared')};
$('extractFile').onchange=async e=>{const f=e.target.files[0];if(f){try{$('extractInput').value=await f.text();$('extractInput').dispatchEvent(new Event('input'));runExtract()}catch(e){toast('Could not read file: '+String(e?.message||e),'error')}}e.target.value=''};
const ed=$('extractDrop');ed.onclick=()=>$('extractFile').click();ed.ondragover=e=>{e.preventDefault();ed.classList.add('over')};ed.ondragleave=()=>ed.classList.remove('over');ed.ondrop=async e=>{e.preventDefault();ed.classList.remove('over');const f=e.dataTransfer.files[0];if(f?.name.toLowerCase().endsWith('.txt')){try{$('extractInput').value=await f.text();$('extractInput').dispatchEvent(new Event('input'));runExtract()}catch(e){toast('Could not read file: '+String(e?.message||e),'error')}}else toast('TXT files only')};
function currentExtract(){let a=exState.filter==='all'?ex.all:ex[exState.filter]||[];return exState.search?a.filter(v=>v.toLowerCase().includes(exState.search)):a}
$('copyExtract').onclick=async()=>{const a=currentExtract();if(!a.length)return toast('Nothing to copy');toast(await copyText(a.join('\n'))?`Copied ${a.length.toLocaleString()}`:'Copy failed')};
$('downloadExtract').onclick=()=>{const a=currentExtract();if(!a.length)return toast('Nothing to export');download('extracted.txt',a.join('\n'))};
$('sendToSpf').onclick=()=>{if(!ex.domains.length)extract($('extractInput').value);if(!ex.domains.length)return toast('No domains extracted');$('domainInput').value=ex.domains.join('\n');updateDomainHint();setActiveView('spf');toast(`${ex.domains.length.toLocaleString()} domains sent to SPF Checker`)};

/* ---------- SPF STATE / SETTINGS ---------- */
const S={token:'',domains:[],results:[],processed:0,total:0,found:0,notFound:0,errors:0,running:false,paused:false,stop:false,start:0,elapsed:0,concurrency:20,effectiveConcurrency:20,timeout:5000,retry:1,match:'include',resolver:'auto',mx:false,autoSave:true,filter:'all',reasonFilter:'all',search:'',page:1,pageSize:100,scanId:'',nextIndex:0,rolling:[],responseTotal:0,responseCount:0,stats:{google:{requests:0,successes:0,failures:0},cloudflare:{requests:0,successes:0,failures:0},timeouts:0,httpErrors:0,nxdomains:0,servfails:0,rateLimits:0}};
let pauseWait=[],uiTimer=null,saveTimer=null,dbPromise=null,checkpointPromise=null;
function uniqueDomains(text){const seen=new Set(),out=[];for(const raw of String(text||'').split(/[\n,;\s]+/)){const d=raw.trim().toLowerCase().replace(/^\.+|\.+$/g,'');if(!validDomain(d)||seen.has(d))continue;seen.add(d);out.push(d)}return out}
function updateDomainHint(){const n=uniqueDomains($('domainInput').value);$('domainHint').textContent=n.length.toLocaleString()+' unique domains';return n}
$('domainInput').oninput=updateDomainHint;
$('spfFile').onchange=async e=>{const f=e.target.files[0];if(f){try{$('domainInput').value=(await f.text()).replace(/[,;]/g,'\n');updateDomainHint();toast('Domain list imported')}catch(e){toast('Import failed: '+String(e?.message||e),'error')}}e.target.value=''};
$('pasteDomains').onclick=async()=>{try{$('domainInput').value=await navigator.clipboard.readText();updateDomainHint();toast('Clipboard pasted')}catch(e){toast('Clipboard permission denied: '+String(e?.message||e),'error')}};

function readSettings(){S.token=$('spfToken').value.trim();S.concurrency=Math.max(1,Math.min(50,parseInt($('concurrency').value,10)||20));S.effectiveConcurrency=S.concurrency;S.timeout=Math.max(1000,parseInt($('timeout').value,10)||5000);S.retry=Math.max(0,Math.min(4,parseInt($('retry').value,10)||0));S.match=$('matchMode').value;S.resolver=$('resolver').value;S.mx=$('checkMx').checked;S.autoSave=$('autoSave').checked && $('autoSaveSetting').checked;localStorage.setItem('ziad_spf_settings',JSON.stringify({concurrency:S.concurrency,timeout:S.timeout,retry:S.retry,match:S.match,resolver:S.resolver,mx:S.mx,autoSave:S.autoSave,pageSize:S.pageSize,version:APP_VERSION}))}

/* ---------- DNS ENGINE / CLASSIFICATION ---------- */
function resolverOrder(){return S.resolver==='google'?['google']:S.resolver==='cloudflare'?['cloudflare']:['google','cloudflare']}
function classifyFetchError(e){if(e?.name==='AbortError')return 'TIMEOUT';const m=String(e?.message||'').toLowerCase();if(m.includes('429'))return 'RATE_LIMIT';if(m.startsWith('http '))return 'HTTP_ERROR';if(m.includes('network')||m.includes('failed to fetch')||m.includes('load failed'))return 'NETWORK_ERROR';return 'NETWORK_ERROR'}
function classifyDnsJson(data){const rc=Number(data?.Status);if(rc===0)return 'NOERROR';if(rc===3)return 'NXDOMAIN';if(rc===2)return 'SERVFAIL';return rc?`RCODE_${rc}`:'DNS_ERROR'}
async function dns(name,type){
 let last='DNS_ERROR';
 for(const p of resolverOrder()){
  S.stats[p].requests++;
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),S.timeout);
  try{
   const r=await fetch(`${DNS[p]}?name=${encodeURIComponent(name)}&type=${type}`,{signal:c.signal,cache:'no-store',headers:{Accept:'application/dns-json'}});
   if(r.status===429){S.stats[p].failures++;S.stats.rateLimits++;last='RATE_LIMIT';continue}
   if(!r.ok){S.stats[p].failures++;S.stats.httpErrors++;last='HTTP_ERROR';continue}
   let data;try{data=await r.json()}catch(e){S.stats[p].failures++;last='HTTP_ERROR';continue}
   const dnsStatus=classifyDnsJson(data);
   if(dnsStatus==='SERVFAIL')S.stats.servfails++;
   if(dnsStatus==='NXDOMAIN')S.stats.nxdomains++;
   S.stats[p].successes++;
   return {data,provider:p,error:null,dnsStatus};
  }catch(e){S.stats[p].failures++;last=classifyFetchError(e);if(last==='TIMEOUT')S.stats.timeouts++}
  finally{clearTimeout(timer)}
 }
 return {data:null,provider:resolverOrder().at(-1)||'',error:last,dnsStatus:'UNKNOWN'}
}
function txt(data){return (data?.Answer||[]).filter(a=>Number(a.type)===16&&typeof a.data==='string').map(a=>a.data.replace(/^"|"$/g,'').replace(/""/g,'"'))}
function spfs(a){return a.filter(x=>/^v=spf1(?:\s|$)/i.test(x.trim()))}
function parseSpf(spf){
 const out={version:'v=spf1',mechanisms:[],includes:[],a:[],mx:[],ip4:[],ip6:[],ptr:[],exists:[],redirects:[],all:'',exp:[],unknown:[],lookupCount:0};
 const tokens=String(spf||'').trim().split(/\s+/).filter(Boolean);if(!tokens.length)return out;
 out.version=/^v=spf1$/i.test(tokens[0])?tokens[0]:'v=spf1';
 for(const token of tokens.slice(1)){
  const m=token.match(/^([+?~-]?)([A-Za-z][A-Za-z0-9_-]*)(?:(?::|=)(.*))?$/);if(!m){out.unknown.push(token);continue}
  const q=m[1]||'+';const mech=m[2].toLowerCase();const value=m[3]??'';const item={token,qualifier:q,mechanism:mech,value};out.mechanisms.push(item);
  if(mech==='include')out.includes.push(item),out.lookupCount++;else if(mech==='a')out.a.push(item),out.lookupCount++;else if(mech==='mx')out.mx.push(item),out.lookupCount++;else if(mech==='ptr')out.ptr.push(item),out.lookupCount++;else if(mech==='exists')out.exists.push(item),out.lookupCount++;else if(mech==='redirect')out.redirects.push(item),out.lookupCount++;else if(mech==='ip4')out.ip4.push(item);else if(mech==='ip6')out.ip6.push(item);else if(mech==='all')out.all=q+'all';else if(mech==='exp')out.exp.push(item);else out.unknown.push(item)
 }
 return out;
}
function normalizeNeedle(n){return String(n||'').trim().toLowerCase().replace(/^include\s*[:=]\s*/,'')}
function matchSpf(records,needle,mode){
 const n=String(needle||'').trim().toLowerCase();if(!records.length)return {found:false,matchedBy:'',matchedMechanism:'',spf:null};
 for(const record of records){const p=parseSpf(record);for(const m of p.mechanisms){const full=m.token.toLowerCase(),domain=(m.value||'').toLowerCase();let ok=false;
  if(mode==='exact')ok=full===n;
  else if(mode==='include')ok=m.mechanism==='include'&&domain===normalizeNeedle(n);
  else if(mode==='domain')ok=domain===normalizeNeedle(n);
  else ok=record.toLowerCase().includes(n);
  if(ok)return {found:true,matchedBy:m.token,matchedMechanism:m.mechanism,spf:records.join(' | ')};
 }}
 return {found:false,matchedBy:'',matchedMechanism:'',spf:records.join(' | ')}
}
function transient(reason){return ['TIMEOUT','SERVFAIL','HTTP_ERROR','NETWORK_ERROR','RATE_LIMIT'].includes(reason)}
function classifyNoAnswer(r){if(r.error)return r.error;return r.dnsStatus==='NXDOMAIN'?'NXDOMAIN':'NO_SPF'}

/* ---------- DOMAIN CHECK ---------- */
async function checkDomain(domain){
 let lastReason='DNS_ERROR',rt=0,lastResolver='';
 for(let attempt=0;attempt<=S.retry;attempt++){
  const t=performance.now(),r=await dns(domain,'TXT');rt=Math.round(performance.now()-t);lastResolver=r.provider;
  if(!r.error){
   const records=spfs(txt(r.data));
   if(records.length>1)return {domain,status:'ERROR',reason:'MULTIPLE_SPF',rawStatus:'MULTIPLE_SPF',spf:records.join(' | '),spfCount:records.length,lookupCount:records.reduce((n,x)=>n+parseSpf(x).lookupCount,0),matchedBy:'',matchedMechanism:'',responseTime:rt,resolver:r.provider,dnsStatus:r.dnsStatus,mxStatus:'NOT_CHECKED',mx:'',checkedAt:iso()};
   const m=matchSpf(records,S.token,S.match);let mx='',mxStatus='SKIPPED';
   if(S.mx){const mr=await dns(domain,'MX');const vals=(mr.data?.Answer||[]).filter(x=>Number(x.type)===15&&typeof x.data==='string').map(x=>x.data);mx=vals.join(' | ');mxStatus=mr.error||((mr.dnsStatus==='NXDOMAIN')?'NXDOMAIN':(vals.length?'FOUND':'NOT_FOUND'))}
   if(!records.length)return {domain,status:'NOT_FOUND',reason:classifyNoAnswer(r),rawStatus:classifyNoAnswer(r),spf:'NO SPF',spfCount:0,lookupCount:0,matchedBy:'',matchedMechanism:'',responseTime:rt,resolver:r.provider,dnsStatus:r.dnsStatus,mxStatus:mxStatus,mx,checkedAt:iso()};
   const an=parseSpf(records[0]);return {domain,status:m.found?'FOUND':'NOT_FOUND',reason:m.found?'MATCH':'NO_MATCH',rawStatus:m.found?'FOUND':'NO_MATCH',spf:m.spf,spfCount:records.length,lookupCount:an.lookupCount,matchedBy:m.matchedBy||'',matchedMechanism:m.matchedMechanism||'',responseTime:rt,resolver:r.provider,dnsStatus:r.dnsStatus,mxStatus,mx,checkedAt:iso()};
  }
  lastReason=r.error||'DNS_ERROR';if(!transient(lastReason)||attempt>=S.retry)break;await sleep(Math.min(1500,250*Math.pow(2,attempt)));
 }
 return {domain,status:'ERROR',reason:lastReason,rawStatus:lastReason,spf:'',spfCount:0,lookupCount:0,matchedBy:'',matchedMechanism:'',responseTime:rt,resolver:lastResolver,dnsStatus:'UNKNOWN',mxStatus:S.mx?'NOT_CHECKED':'SKIPPED',mx:'',checkedAt:iso()}
}

/* ---------- WORKER POOL / BACKOFF ---------- */
function adjustBackoff(r){const bad=['RATE_LIMIT','TIMEOUT','HTTP_ERROR','NETWORK_ERROR','SERVFAIL'].includes(r.reason);if(bad)S._bad=(S._bad||0)+1;else S._bad=Math.max(0,(S._bad||0)-1);if(S._bad>=4)S.effectiveConcurrency=Math.max(1,Math.ceil(S.effectiveConcurrency*.75));else if(S._bad===0&&S.effectiveConcurrency<S.concurrency)S.effectiveConcurrency=Math.min(S.concurrency,S.effectiveConcurrency+1)}
async function processQueue(){
 let cursor=0;
 const worker=async()=>{while(true){if(S.stop)return;if(S.paused){await waitPause();if(S.stop)return}let i=cursor++;while(i<S.total&&S.results[i])i=cursor++;if(i>=S.total)return;const r=await checkDomain(S.domains[i]);if(S.stop)return;S.results[i]=r;S._dirty.add(i);S.responseTotal+=Number(r.responseTime)||0;S.responseCount++;S.processed++;if(r.status==='FOUND')S.found++;else if(r.status==='NOT_FOUND')S.notFound++;else S.errors++;adjustBackoff(r);S.rolling.push({t:Date.now(),count:S.processed});if(S.rolling.length>20)S.rolling.shift();if(S.autoSave&&(S.processed%100===0))await checkpoint();}};
 while(S.processed<S.total&&!S.stop){const n=Math.min(S.effectiveConcurrency,Math.max(1,S.total-S.processed));await Promise.all(Array.from({length:n},()=>worker()));if(S.paused)await waitPause()}
}
function waitPause(){return S.paused?new Promise(r=>pauseWait.push(r)):Promise.resolve()}
function releasePause(){const a=pauseWait;pauseWait=[];a.forEach(r=>r())}

/* ---------- INDEXEDDB INCREMENTAL STORE ---------- */
function openDb(){if(dbPromise)return dbPromise;dbPromise=new Promise((res,rej)=>{const q=indexedDB.open(DB_NAME,DB_VERSION);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'id'});if(!d.objectStoreNames.contains('results'))d.createObjectStore('results',{keyPath:'i'})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}).catch(e=>{dbPromise=null;throw e});return dbPromise}
async function putMeta(){const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction('meta','readwrite');tx.objectStore('meta').put({id:'current',version:APP_VERSION,scanId:S.scanId,token:S.token,domains:S.domains,total:S.total,processed:S.processed,nextIndex:S.nextIndex,found:S.found,notFound:S.notFound,errors:S.errors,elapsed:S.elapsed,match:S.match,resolver:S.resolver,mx:S.mx,concurrency:S.concurrency,timeout:S.timeout,retry:S.retry,timestamp:Date.now(),startedAt:S.start||Date.now()});tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function putResultIndices(indices){const rows=[];for(const i of indices){const r=S.results[i];if(r)rows.push({i,value:r})}if(!rows.length)return;const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction('results','readwrite'),st=tx.objectStore('results');rows.forEach(x=>st.put(x));tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
function firstMissing(){for(let i=0;i<S.total;i++)if(!S.results[i])return i;return S.total}
async function checkpoint(){if(!S.autoSave)return;if(checkpointPromise)return checkpointPromise;checkpointPromise=(async()=>{clearTimeout(saveTimer);saveTimer=null;const dirty=[...(S._dirty||new Set())];if(!dirty.length){S.elapsed=S.running?Math.max(0,(Date.now()-S.start)/1000):S.elapsed;S.nextIndex=firstMissing();await putMeta();return}try{await putResultIndices(dirty);for(const i of dirty)S._dirty.delete(i);S.elapsed=S.running?Math.max(0,(Date.now()-S.start)/1000):S.elapsed;S.nextIndex=firstMissing();await putMeta()}catch(e){toast('Auto-save checkpoint failed; scan remains in memory: '+String(e?.message||e),'error')}})().finally(()=>{checkpointPromise=null});return checkpointPromise}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>checkpoint(),1800)}
async function loadScan(){try{const d=await openDb();const meta=await new Promise((res,rej)=>{const q=d.transaction('meta').objectStore('meta').get('current');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});if(!meta||meta.version!==APP_VERSION||Date.now()-meta.timestamp>DB_TTL)return null;const rows=[];await new Promise((res,rej)=>{const q=d.transaction('results').objectStore('results').openCursor();q.onsuccess=()=>{const c=q.result;if(c){rows[c.value.i]=c.value.value;c.continue()}else res()};q.onerror=()=>rej(q.error)});const filled=rows.filter(Boolean);if(meta.processed>0&&filled.length!==meta.processed)return null;return {...meta,results:rows}}catch(e){console.warn('SPF scan could not be loaded',e);return null}}
async function clearDb(){try{const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction(['meta','results'],'readwrite');tx.objectStore('meta').clear();tx.objectStore('results').clear();tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}catch(e){toast('Saved scan could not be cleared: '+String(e?.message||e),'error')}
}

/* ---------- SCAN UI ---------- */
function updateSpfUI(){const p=S.total?S.processed/S.total*100:0;$('progressBar').style.width=Math.min(100,p)+'%';$('progressLabel').textContent=`${S.processed.toLocaleString()} / ${S.total.toLocaleString()}`;$('statTotal').textContent=S.total.toLocaleString();$('statFound').textContent=S.found.toLocaleString();$('statNotFound').textContent=S.notFound.toLocaleString();$('statErrors').textContent=S.errors.toLocaleString();const elapsed=S.running?(Date.now()-S.start)/1000:S.elapsed;$('elapsed').textContent='Elapsed: '+fmtTime(elapsed);const avg=S.responseCount?Math.round(S.responseTotal/S.responseCount):0;const speed=S.rolling.length>1?(S.rolling.at(-1).count-S.rolling[0].count)/Math.max(.001,(S.rolling.at(-1).t-S.rolling[0].t)/1000):(S.processed&&elapsed?S.processed/elapsed:0);const overall=elapsed?S.processed/elapsed:0;$('speed').textContent=`Speed: ${speed.toFixed(1)}/s · Avg ${overall.toFixed(1)}/s`;$('eta').textContent=overall&&S.processed<S.total?'ETA: '+fmtTime((S.total-S.processed)/Math.max(speed,overall)):'ETA: —';$('avg').textContent=avg?avg+'ms':'—';$('success').textContent=S.results.filter(Boolean).length?((S.found+S.notFound)/S.results.filter(Boolean).length*100).toFixed(1)+'%':'—';updateHealth()}
function updateHealth(){const g=S.stats.google,c=S.stats.cloudflare;const pct=x=>x.requests?((x.successes/x.requests)*100).toFixed(1)+'%':'—';let el=$('resolverHealth');if(!el){el=document.createElement('div');el.id='resolverHealth';el.className='notice';$('success').parentElement.parentElement.after(el)}el.innerHTML=`<b>Resolver health</b> · GOOGLE ${pct(g)} success (${g.requests} req / ${g.failures} err) · CLOUDFLARE ${pct(c)} success (${c.requests} req / ${c.failures} err) · TIMEOUT ${S.stats.timeouts} · HTTP ${S.stats.httpErrors} · NXDOMAIN ${S.stats.nxdomains} · SERVFAIL ${S.stats.servfails}`}
function visible(){let a=S.results.filter(Boolean);if(S.filter!=='all')a=a.filter(x=>x.status===S.filter);if(S.reasonFilter!=='all')a=a.filter(x=>x.reason===S.reasonFilter);if(S.search)a=a.filter(x=>(x.domain+' '+x.spf+' '+x.reason+' '+x.resolver).toLowerCase().includes(S.search));return a}
function renderResults(){const a=visible(),pages=Math.max(1,Math.ceil(a.length/S.pageSize));S.page=Math.min(S.page,pages);const st=(S.page-1)*S.pageSize,v=a.slice(st,st+S.pageSize);$('tableInfo').textContent=a.length?`Showing ${st+1}–${Math.min(st+S.pageSize,a.length)} of ${a.length.toLocaleString()}`:'Showing 0–0 of 0';$('prevPage').disabled=S.page<=1;$('nextPage').disabled=S.page>=pages;if(!v.length){$('resultsBody').innerHTML='<tr><td colspan="9" class="empty">No results match.</td></tr>';return}$('resultsBody').innerHTML=v.map(r=>{const cls=r.status==='FOUND'?'bgreen':r.status==='NOT_FOUND'?'bred':'byellow';return `<tr data-index="${S.results.indexOf(r)}"><td class="mono">${esc(r.domain)}</td><td class="mono" title="${esc(r.spf)}">${esc(r.spf||'—')}</td><td><span class="badge ${cls}">${esc(r.status)}</span></td><td><span class="badge ${r.reason==='MATCH'?'bgreen':r.reason==='NO_SPF'||r.reason==='NO_MATCH'?'bblue':'byellow'}">${esc(r.reason||'UNKNOWN')}</span></td><td>${r.lookupCount||0}</td><td>${esc(r.mxStatus||'—')}</td><td>${r.responseTime?esc(r.responseTime+'ms'):'—'}</td><td>${esc(r.resolver||'—')}</td><td>${esc(r.checkedAt||'—')}</td></tr>`}).join('')}
function updateAll(){updateSpfUI();renderResults()}
$('resultsBody').addEventListener('click',e=>{const tr=e.target.closest('tr[data-index]');if(!tr)return;const r=S.results[+tr.dataset.index];if(r)openDetails(r)});
function openDetails(r){$('detailTitle').textContent=r.domain;$('detailBody').innerHTML=`<div class="notice"><b>Status:</b> ${esc(r.status)} · <b>Reason:</b> ${esc(r.reason)}</div><div class="history-item"><b>SPF records</b><pre class="mono">${esc(r.spf||'—')}</pre></div><div class="history-item"><b>SPF count:</b> ${r.spfCount||0}<br><b>Matched token:</b> ${esc(S.token)}<br><b>Matched mechanism:</b> ${esc(r.matchedMechanism||'—')}<br><b>Matched by:</b> ${esc(r.matchedBy||'—')}<br><b>Lookup count:</b> ${r.lookupCount||0}</div><div class="history-item"><b>MX:</b> ${esc(r.mxStatus||'—')}<br><b>MX records:</b> ${esc(r.mx||'—')}</div><div class="history-item"><b>Response:</b> ${esc(r.responseTime||'—')} ms<br><b>Resolver:</b> ${esc(r.resolver||'—')}<br><b>DNS status:</b> ${esc(r.dnsStatus||'—')}<br><b>Checked:</b> ${esc(r.checkedAt||'—')}</div>`;$('detailModal').classList.add('open')}
function ensureDetailModal(){if($('detailModal'))return;const m=document.createElement('div');m.className='modal';m.id='detailModal';m.innerHTML='<div class="modal-box"><div class="between"><div class="title" id="detailTitle">DETAIL</div><button class="btn" id="closeDetail">CLOSE</button></div><div id="detailBody"></div></div>';document.body.appendChild(m);$('closeDetail').onclick=()=>m.classList.remove('open');m.onclick=e=>{if(e.target===m)m.classList.remove('open')}}ensureDetailModal();

/* ---------- CONTROLS ---------- */
async function runScan(resume=false){if(S.running||!S.domains.length)return;readSettings();S.running=true;S.stop=false;S.paused=false;S.effectiveConcurrency=S.concurrency;setStatus('RUNNING',true);$('startBtn').disabled=true;$('pauseBtn').disabled=false;$('stopBtn').disabled=false;$('clearBtn').disabled=true;if(!resume){S.results=[];S.processed=0;S.nextIndex=0;S.found=0;S.notFound=0;S.errors=0;S.elapsed=0;S.responseTotal=0;S.responseCount=0;S._dirty=new Set();S.scanId=globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(16).slice(2);S.stats={google:{requests:0,successes:0,failures:0},cloudflare:{requests:0,successes:0,failures:0},timeouts:0,httpErrors:0,nxdomains:0,servfails:0,rateLimits:0};await clearDb()}else{S._dirty=new Set();S.nextIndex=firstMissing()}S.start=Date.now()-S.elapsed*1000;S.rolling=[];clearInterval(uiTimer);uiTimer=setInterval(updateSpfUI,500);try{await processQueue()}catch(e){toast('Scanner stopped safely: '+String(e?.message||e));S.stop=true}finally{S.elapsed=(Date.now()-S.start)/1000;S.running=false;clearInterval(uiTimer);$('startBtn').disabled=false;$('pauseBtn').disabled=true;$('stopBtn').disabled=true;$('clearBtn').disabled=false;$('pauseBtn').textContent='PAUSE';await checkpoint();updateAll();if(S.stop){setStatus('STOPPED');toast('Scan stopped. Progress saved.')}else{setStatus('COMPLETE');toast(`Scan complete · ${S.found.toLocaleString()} FOUND`)}}}
$('startBtn').onclick=async()=>{const d=updateDomainHint();if(!d.length)return toast('Enter at least one valid domain');S.domains=d;S.total=d.length;$('resumeNotice').style.display='none';await runScan(false)};
$('pauseBtn').onclick=()=>{if(!S.running)return;if(S.paused){S.paused=false;$('pauseBtn').textContent='PAUSE';releasePause()}else{S.paused=true;$('pauseBtn').textContent='RESUME'}updateSpfUI()};
$('stopBtn').onclick=()=>{if(S.running){S.stop=true;S.paused=false;releasePause()}};
$('clearBtn').onclick=async()=>{if(S.running)return toast('Stop the scan first');Object.assign(S,{domains:[],results:[],processed:0,total:0,found:0,notFound:0,errors:0,elapsed:0,nextIndex:0,page:1,rolling:[],responseTotal:0,responseCount:0,_dirty:new Set(),stats:{google:{requests:0,successes:0,failures:0},cloudflare:{requests:0,successes:0,failures:0},timeouts:0,httpErrors:0,nxdomains:0,servfails:0,rateLimits:0}});$('domainInput').value='';$('resumeNotice').style.display='none';await clearDb();updateDomainHint();updateAll();setStatus('READY')};
$('resumeBtn').onclick=async()=>{const x=await loadScan();if(!x)return toast('Saved scan is unavailable or incompatible');Object.assign(S,{scanId:x.scanId||'',token:(x.version===APP_VERSION?(x.token||''):''),domains:x.domains||[],results:x.results||[],processed:x.processed||0,total:x.total||0,nextIndex:x.nextIndex??x.processed??0,found:x.found||0,notFound:x.notFound||0,errors:x.errors||0,elapsed:x.elapsed||0,match:x.match||'include',resolver:x.resolver||'auto',mx:x.mx===true,concurrency:x.concurrency||20,timeout:x.timeout||5000,retry:x.retry||0,_savedThrough:x.processed||0,_dirty:new Set()});$('spfToken').value=S.token;$('domainInput').value=S.domains.join('\n');$('matchMode').value=S.match;$('resolver').value=S.resolver;$('checkMx').checked=S.mx;$('concurrency').value=S.concurrency;$('timeout').value=S.timeout;$('retry').value=S.retry;updateDomainHint();$('resumeNotice').style.display='none';updateAll();await runScan(true)};
$('discardBtn').onclick=async()=>{await clearDb();$('resumeNotice').style.display='none';toast('Saved scan discarded')};

/* ---------- FILTER / SEARCH / EXPORT ---------- */
$('resultSearch').oninput=e=>{S.search=e.target.value.trim().toLowerCase();S.page=1;renderResults()};
document.querySelectorAll('#spfFilters .filter').forEach(b=>b.onclick=()=>{S.filter=b.dataset.filter;S.page=1;document.querySelectorAll('#spfFilters .filter').forEach(x=>x.classList.toggle('active',x===b));renderResults()});
$('reasonFilter').onchange=e=>{S.reasonFilter=e.target.value;S.page=1;renderResults()}
$('prevPage').onclick=()=>{if(S.page>1){S.page--;renderResults()}};$('nextPage').onclick=()=>{const p=Math.max(1,Math.ceil(visible().length/S.pageSize));if(S.page<p){S.page++;renderResults()}};
function exportSpf(filter,label){let a=filter==='all'?S.results.filter(Boolean):S.results.filter(x=>x?.status===filter);if(!a.length)return toast('Nothing to export');const rows=[['domain','status','reason','spf','spf_count','dns_lookups','matched_by','mx_status','mx_records','response_time','resolver','dns_status','checked_at']];a.forEach(r=>rows.push([r.domain,r.status,r.reason,r.spf,r.spfCount,r.lookupCount,r.matchedBy,r.mxStatus,r.mx,r.responseTime,r.resolver,r.dnsStatus,r.checkedAt]));download(`spf_${label}.csv`,rows.map(x=>x.map(csv).join(',')).join('\r\n')+'\r\n','text/csv;charset=utf-8')}
$('exportAll').onclick=()=>exportSpf('all','all');$('exportFound').onclick=()=>exportSpf('FOUND','found');$('exportNotFound').onclick=()=>exportSpf('NOT_FOUND','notfound');$('exportErrors').onclick=()=>exportSpf('ERROR','errors');$('exportJsonl').onclick=()=>{const a=S.results.filter(Boolean);if(!a.length)return toast('Nothing to export');download('spf_results.jsonl',a.map(x=>JSON.stringify(x)).join('\n')+'\n','application/x-ndjson')};
async function copyStatus(st,label){const a=S.results.filter(x=>x?.status===st);if(!a.length)return toast(`No ${label} results`);toast(await copyText(a.map(x=>x.domain).join('\n'))?`Copied ${a.length.toLocaleString()} ${label}`:'Copy failed')}
$('copyFound').onclick=()=>copyStatus('FOUND','FOUND');$('copyNotFound').onclick=()=>copyStatus('NOT_FOUND','NOT FOUND');
if(!$('copyErrors')){const b=document.createElement('button');b.className='btn';b.id='copyErrors';b.textContent='COPY ERRORS';$('retryErrors').before(b);b.onclick=()=>copyStatus('ERROR','ERROR')}
$('retryErrors').onclick=async()=>{if(S.running)return toast('Stop the current scan first');const indices=S.results.map((x,i)=>x?.status==='ERROR'&&transient(x.reason)?i:-1).filter(i=>i>=0);if(!indices.length)return toast('No transient errors to retry');readSettings();const savedResults=S.results.slice();const savedProcessed=S.processed;const savedTotal=S.total;const savedFound=S.found;const savedNotFound=S.notFound;const savedErrors=S.errors;const targets=indices.map(i=>S.domains[i]);let cursor=0;S.running=true;S.stop=false;S.paused=false;S.effectiveConcurrency=S.concurrency;setStatus('RETRYING',true);$('startBtn').disabled=true;$('pauseBtn').disabled=true;$('stopBtn').disabled=false;$('clearBtn').disabled=true;try{const worker=async()=>{while(true){if(S.stop)return;if(S.paused){await waitPause();if(S.stop)return}const pos=cursor++;if(pos>=indices.length)return;const i=indices[pos];const r=await checkDomain(S.domains[i]);if(S.stop)return;S.results[i]=r;if(r.status==='FOUND'){}if(S.autoSave)S._dirty.add(i)}};await Promise.all(Array.from({length:Math.min(S.effectiveConcurrency,indices.length)},()=>worker()));if(!S.stop){S.found=S.results.filter(x=>x?.status==='FOUND').length;S.notFound=S.results.filter(x=>x?.status==='NOT_FOUND').length;S.errors=S.results.filter(x=>x?.status==='ERROR').length;S.processed=S.results.filter(Boolean).length;S.total=savedTotal;S.domains=S.domains.slice();S._dirty=new Set(indices);await checkpoint();toast(`Retried ${indices.length.toLocaleString()} transient errors`)}else{S.results=savedResults;S.processed=savedProcessed;S.total=savedTotal;S.found=savedFound;S.notFound=savedNotFound;S.errors=savedErrors}}catch(e){S.results=savedResults;S.processed=savedProcessed;S.total=savedTotal;S.found=savedFound;S.notFound=savedNotFound;S.errors=savedErrors;toast('Retry failed: '+String(e?.message||e),'error')}finally{S.running=false;$('startBtn').disabled=false;$('pauseBtn').disabled=true;$('stopBtn').disabled=true;$('clearBtn').disabled=false;setStatus('READY');updateAll()}};

/* ---------- HELP ---------- */
const help=document.querySelector('#helpModal .modal-box');if(help){const notes=help.querySelectorAll('.notice');if(notes.length>=3){notes[0].textContent='EXTRACT extracts domains, URLs, IPv4, IPv6 and emails. Extraction is manual by default for large inputs and renders only the first 1,000 rows.';notes[1].textContent='SPF CHECKER uses DNS-over-HTTPS with Google and Cloudflare. AUTO tries Google first and falls back only when the DNS request fails. MX is OFF by default because it adds DNS workload.';notes[2].textContent='Match modes: EXACT compares a complete SPF token; INCLUDE matches include:<domain>; DOMAIN compares the mechanism domain; CONTAINS is loose substring matching and is not the default. FOUND means a match, NOT FOUND means DNS worked but no requested match was found, and ERROR means a DNS/request problem or MULTIPLE_SPF. Reasons include NO_SPF, NXDOMAIN, TIMEOUT, SERVFAIL, RATE_LIMIT, HTTP_ERROR and NETWORK_ERROR. Resume/Auto-save use incremental IndexedDB checkpoints.'}}

/* ---------- INIT ---------- */
(async function init(){
 try{const z=JSON.parse(localStorage.getItem('ziad_spf_settings')||'null');if(z){if(z.concurrency)$('concurrency').value=z.concurrency;if(z.timeout)$('timeout').value=z.timeout;if(Number.isFinite(z.retry))$('retry').value=z.retry;if(z.match&&['contains','include','exact','domain'].includes(z.match))$('matchMode').value=z.match;if(z.resolver)$('resolver').value=z.resolver;if(typeof z.mx==='boolean')$('checkMx').checked=z.mx;if(typeof z.autoSave==='boolean')$('autoSave').checked=z.autoSave;if(z.pageSize)S.pageSize=Math.max(25,Math.min(500,+z.pageSize))}}catch(e){console.warn('SPF settings could not be restored',e)}
 updateDomainHint();ensureDetailModal();const x=await loadScan();if(x&&x.results?.length){$('resumeInfo').textContent=`${x.processed||x.results.filter(Boolean).length.toLocaleString()} / ${(x.total||x.domains?.length||0).toLocaleString()} completed · saved ${new Date(x.timestamp).toLocaleString()}`;$('resumeNotice').style.display='block';$('spfToken').value=(x.version===APP_VERSION?(x.token||''):'');$('domainInput').value=(x.domains||[]).join('\n');Object.assign(S,{scanId:x.scanId||'',token:(x.version===APP_VERSION?(x.token||''):''),domains:x.domains||[],results:x.results||[],processed:x.processed||0,total:x.total||x.domains?.length||0,found:x.found||0,notFound:x.notFound||0,errors:x.errors||0,elapsed:x.elapsed||0,nextIndex:x.nextIndex??x.processed??0,match:x.match||'include',resolver:x.resolver||'auto',mx:x.mx===true,concurrency:x.concurrency||20,timeout:x.timeout||5000,retry:x.retry||0,_savedThrough:x.processed||0,_dirty:new Set()});$('matchMode').value=S.match;$('resolver').value=S.resolver;$('checkMx').checked=S.mx;$('concurrency').value=S.concurrency;$('timeout').value=S.timeout;$('retry').value=S.retry;S.responseTotal=S.results.filter(Boolean).reduce((a,r)=>a+(Number(r.responseTime)||0),0);S.responseCount=S.results.filter(Boolean).length;updateDomainHint()}updateAll();
})();
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette('')}if(e.key==='Escape'){document.querySelectorAll('.modal.open').forEach(x=>x.classList.remove('open'))}if(e.ctrlKey&&e.key==='Enter'&&!S.running&&document.querySelector('#view-spf').classList.contains('active'))$('startBtn').click();if(e.code==='Space'&&S.running&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$('pauseBtn').click()}});
