const RDNS_BODY = '<div class="app">\n\n    <h1>rDNS Lookup</h1>\n    <div class="subtitle">\n        SERV + IP → PTR / rDNS resolver with cache, retry, timeout, queue and resume\n    </div>\n\n    <div class="panel">\n\n        <textarea id="input" aria-label="SERV and IP input" placeholder="Paste SERV + IP:\n\nvar2718    95.173.172.140\nvar2718    95.173.172.141\nsys1992    51.38.79.137\nsys1430    104.168.99.125\nsys953     198.23.211.67\nsys953     198.23.211.68"></textarea>\n\n        <div class="controls">\n\n            <button id="startBtn" data-z-action="startJob"> Start</button>\n            <button class="secondary" data-z-action="pauseJob"> Pause</button>\n            <button class="green" data-z-action="resumeJob"> Resume</button>\n            <button class="secondary" data-z-action="stopJob"> Stop</button>\n\n            <button class="secondary" data-z-action="copyResults">\n                Copy\n            </button>\n\n            <button class="secondary" data-z-action="downloadTXT">\n                TXT\n            </button>\n\n            <button class="secondary" data-z-action="downloadCSV">\n                CSV\n            </button>\n\n            <button class="danger" data-z-action="clearAll">\n                Clear\n            </button>\n\n            <span class="option">\n                Concurrency\n                <select id="concurrency">\n                    <option value="5">5</option>\n                    <option value="10">10</option>\n                    <option value="20" selected>20</option>\n                    <option value="30">30</option>\n                    <option value="50">50</option>\n                    <option value="100">100</option>\n                </select>\n            </span>\n\n            <span class="option">\n                Timeout\n                <select id="timeout">\n                    <option value="4000">4s</option>\n                    <option value="6000" selected>6s</option>\n                    <option value="8000">8s</option>\n                    <option value="10000">10s</option>\n                </select>\n            </span>\n\n            <span class="option">\n                Retries\n                <select id="retries">\n                    <option value="0">0</option>\n                    <option value="1">1</option>\n                    <option value="2" selected>2</option>\n                    <option value="3">3</option>\n                </select>\n            </span>\n\n        </div>\n\n        <div class="progress">\n            <div id="progressBar" class="progress-bar"></div>\n        </div>\n\n        <div class="progress-info">\n            <span id="progressText">Ready</span>\n            <span id="speedText">0 req/s</span>\n        </div>\n\n    </div>\n\n    <div class="stats">\n\n        <div class="stat">\n            <div class="label">TOTAL ROWS</div>\n            <div id="total" class="value">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">UNIQUE IPs</div>\n            <div id="uniqueIPs" class="value blue">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">FOUND</div>\n            <div id="found" class="value green">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">NO RDNS</div>\n            <div id="noRdns" class="value orange">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">NXDOMAIN</div>\n            <div id="nxdomain" class="value" style="color:var(--zt-accent-2,#5b8cff)">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">SERVFAIL</div>\n            <div id="servfail" class="value" style="color:var(--zt-warning,#f2c05c)">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">ERROR</div>\n            <div id="errors" class="value red">0</div>\n        </div>\n\n        <div class="stat">\n            <div class="label">PROCESSED</div>\n            <div id="processed" class="value">0</div>\n        </div>\n\n    </div>\n\n    <div class="panel">\n\n        <div class="panel-head">\n            <div>\n                <div class="panel-title">Lookup Results</div>\n                <div class="panel-subtitle">Live PTR results are grouped by unique IP and reused across duplicate SERV entries.</div>\n            </div>\n        </div>\n\n        <div class="toolbar">\n\n            <input\n                id="search"\n                class="search"\n                placeholder="Search SERV / IP / RDNS..."\n               \n            >\n\n            <select\n                id="filter"\n                class="filter"\n               \n            >\n                <option value="ALL">ALL</option>\n                <option value="FOUND">FOUND</option>\n                <option value="NO_RDNS">NO RDNS</option>\n                <option value="NXDOMAIN">NXDOMAIN</option>\n                <option value="SERVFAIL">SERVFAIL</option>\n                <option value="ERROR">ERROR</option>\n                <option value="WAITING">WAITING</option>\n                <option value="LOOKUP">LOOKUP</option>\n            </select>\n\n        </div>\n\n        <div class="table-wrap">\n            <table>\n                <thead>\n                    <tr>\n                        <th>SERV</th>\n                        <th>IP</th>\n                        <th>RDNS domains</th>\n                        <th>STATUS</th>\n                    </tr>\n                </thead>\n                <tbody id="resultsBody"></tbody>\n            </table>\n        </div>\n\n    </div>\n\n</div>';
const RDNS_CSS = ':host{--rdns-bg:var(--bg);--rdns-panel:var(--panel);--rdns-panel2:var(--panel2);--rdns-border:var(--border);--rdns-text:var(--text);--rdns-muted:var(--muted);--rdns-blue:var(--accent);--rdns-green:var(--green);--rdns-orange:var(--yellow);--rdns-red:var(--red)}\n:host{margin:0;min-height:100%;background:var(--rdns-bg);color:var(--rdns-text)}\n:host{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;padding:18px}\n.app{width:100%;max-width:none;margin:0}\nh1{margin:0;font-size:18px;line-height:1.2;letter-spacing:-.2px;color:var(--zt-text,#dce7f8)}\n.subtitle{color:var(--rdns-muted);margin:5px 0 15px;font-size:11px}\n.panel{background:linear-gradient(180deg,var(--rdns-panel),var(--zt-surface,#101827));border:1px solid var(--rdns-border);border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 14px 35px rgba(0,0,0,.14)}\ntextarea{width:100%;height:220px;resize:vertical;background:var(--rdns-panel2);color:var(--rdns-text);border:1px solid var(--rdns-border);border-radius:13px;padding:12px;outline:none;font:12px Consolas,monospace}\ntextarea:focus,input:focus,select:focus{border-color:var(--zt-accent-2,#5b8cff);box-shadow:0 0 0 3px rgba(47,112,255,.10)}\n.controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:11px}\nbutton,select,input{font:inherit;border:1px solid var(--rdns-border);border-radius:10px}\nbutton{padding:8px 12px;cursor:pointer;color:var(--zt-text,#dce7f8);background:var(--zt-surface-2,#141f31);border-color:var(--zt-border,#26364f);font-size:11px;font-weight:700;letter-spacing:.15px}\nbutton:hover{background:var(--zt-surface,#101827);border-color:var(--zt-border,#26364f)}\nbutton.secondary{background:var(--zt-surface-2,#141f31)}button.danger{background:var(--zt-danger,#ff6f70);border-color:var(--zt-danger,#ff6f70);color:#fff}button.green{background:var(--zt-success,#22c77a);border-color:var(--zt-success,#22c77a);color:#fff}\nselect{background:var(--rdns-panel2);color:var(--rdns-text);padding:7px 9px}\n.option{color:var(--rdns-muted);font-size:11px;display:flex;align-items:center;gap:6px}.option input{accent-color:var(--rdns-blue)}\n.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin-bottom:14px}\n.stat{background:var(--rdns-panel2);border:1px solid var(--rdns-border);border-radius:13px;padding:12px;text-align:center}\n.label{color:var(--rdns-muted);font-size:9px;letter-spacing:.35px}.value{font-size:20px;font-weight:800;margin-top:5px}\n.green{color:var(--rdns-green)}.orange{color:var(--rdns-orange)}.red{color:var(--rdns-red)}.blue{color:var(--zt-accent-2,#5b8cff)}\n.progress{height:8px;background:var(--zt-surface-2,#141f31);border-radius:99px;overflow:hidden;margin-top:11px;border:1px solid var(--zt-border,#26364f)}.progress-bar{width:0;height:100%;background:linear-gradient(90deg,var(--zt-accent,#2f70ff),var(--zt-accent-2,#5b8cff));transition:width .2s}\n.progress-info{display:flex;justify-content:space-between;color:var(--rdns-muted);font:11px Consolas,monospace;margin-top:7px}\n.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.search{flex:1;min-width:250px;padding:9px 10px;background:var(--rdns-panel2);color:var(--rdns-text);outline:none}.filter{padding:9px 10px;background:var(--rdns-panel2);color:var(--rdns-text)}\n.table-wrap{max-height:650px;overflow:auto;border:1px solid var(--rdns-border);border-radius:13px;background:rgba(8,15,28,.2)}\ntable{width:100%;min-width:850px;border-collapse:collapse;font:11px Consolas,monospace}th{position:sticky;top:0;z-index:2;background:var(--zt-surface-2,#141f31);color:var(--zt-text-muted,#8191aa);padding:10px;text-align:left;border-bottom:1px solid var(--rdns-border);font-size:9px;letter-spacing:.55px}td{padding:9px 10px;border-bottom:1px solid rgba(38,54,80,.65)}tr:hover td{background:rgba(47,112,255,.055)}\n.status-found{color:var(--zt-success,#22c77a)}.status-no{color:var(--zt-warning,#f2c05c)}.status-error{color:var(--zt-danger,#ff6f70)}.status-running{color:var(--zt-accent-2,#5b8cff)}.status-waiting{color:var(--zt-text-muted,#8191aa)}.empty{text-align:center;padding:30px;color:var(--rdns-muted)}\n.badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:3px 8px;font-size:9px;font-weight:800;letter-spacing:.3px}.status-nxdomain{color:var(--zt-accent-2,#5b8cff)}.status-servfail{color:var(--zt-warning,#f2c05c)}.status-error{color:var(--zt-danger,#ff6f70)}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.panel-title{font-size:13px;font-weight:800;letter-spacing:.2px}.panel-subtitle{color:var(--rdns-muted);font-size:10px;margin-top:3px}.toolbar{align-items:center}\n@media(max-width:1000px){.stats{grid-template-columns:repeat(3,1fr)}}\n@media(max-width:600px){:host{padding:12px}.stats{grid-template-columns:repeat(2,1fr)}.progress-info{gap:10px;flex-wrap:wrap}}\n:host([data-theme="light"]){--rdns-bg:var(--bg);--rdns-panel:var(--panel);--rdns-panel2:var(--panel2);--rdns-border:var(--border);--rdns-text:var(--text);--rdns-muted:var(--muted);--rdns-blue:var(--accent);--rdns-green:var(--green);--rdns-orange:var(--yellow);--rdns-red:var(--red)}';
function initRdns(root,host){


/* =========================================================
   CONFIG
========================================================= */

const DB_NAME = "RDNS_LOOKUP_V2";
const DB_VERSION = 2;
const STORE = "jobs";

const RENDER_INTERVAL = 400;
const SAVE_INTERVAL = 1000;

const RESOLVERS = [
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/resolve"
];


/* =========================================================
   STATE
========================================================= */

let rows = [];
let ipCache = new Map();

let running = false;
let paused = false;

let processed = 0;
let totalIPs = 0;

let renderTimer = null;
let saveTimer = null;

let jobId = null;

let startedAt = 0;
let completedRequests = 0;

const stats = {
    found:0,
    noRdns:0,
    nxdomain:0,
    servfail:0,
    errors:0
};

let uniqueIPSet = new Set();


/* =========================================================
   DOM
========================================================= */

const $ = id => root.getElementById(id);


/* =========================================================
   DATABASE
========================================================= */

let dbPromise = null;

function openDB(){

    if(dbPromise) return dbPromise;

    dbPromise = new Promise((resolve,reject)=>{

        const request =
            indexedDB.open(DB_NAME,DB_VERSION);

        request.onupgradeneeded = () => {

            const db = request.result;

            if(!db.objectStoreNames.contains(STORE)){
                db.createObjectStore(
                    STORE,
                    {keyPath:"id"}
                );
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

    });

    return dbPromise;
}


async function saveJob(){

    if(!jobId) return;

    try{

        const db = await openDB();

        const payload = {
            id:jobId,
            rows:rows,
            ipCache:[...ipCache.entries()],
            processed:processed,
            savedAt:Date.now()
        };

        await new Promise((resolve,reject)=>{

            const tx =
                db.transaction(STORE,"readwrite");

            tx.objectStore(STORE)
              .put(payload);

            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);

        });

    }catch(e){
        console.warn("Save failed",e);
    }
}


async function loadLastJob(){

    try{

        const db = await openDB();

        const data = await new Promise((resolve,reject)=>{

            const tx =
                db.transaction(STORE,"readonly");

            const req =
                tx.objectStore(STORE).getAll();

            req.onsuccess =
                () => resolve(req.result);

            req.onerror =
                () => reject(req.error);

        });

        if(!data.length) return null;

        data.sort(
            (a,b)=>b.savedAt-a.savedAt
        );

        return data[0];

    }catch(e){

        console.warn("Load failed",e);
        return null;
    }
}


async function deleteAllJobs(){

    try{

        const db = await openDB();

        await new Promise((resolve,reject)=>{

            const tx =
                db.transaction(STORE,"readwrite");

            tx.objectStore(STORE).clear();

            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);

        });

    }catch(e){}
}


/* =========================================================
   INPUT PARSER
========================================================= */

function parseInput(text){

    const result = [];
    const seen = new Set();

    for(const line of text.split(/\r?\n/)){

        const clean = line.trim();

        if(!clean) continue;

        const parts =
            clean.split(/[\s,;|]+/);

        if(parts.length < 2) continue;

        let ip = "";

        for(const part of parts){

            if(isIPv4(part) || isIPv6(part)){
                ip = part;
                break;
            }
        }

        if(!ip) continue;

        const index =
            parts.indexOf(ip);

        let serv =
            index > 0
                ? parts.slice(0,index).join(" ")
                : parts[0];

        const key =
            serv + "|" + ip;

        if(seen.has(key)) continue;

        seen.add(key);

        result.push({
            serv:serv,
            ip:ip,
            rdns:"",
            status:"WAITING"
        });
    }

    return result;
}


function isIPv4(ip){

    const p = ip.split(".");

    if(p.length !== 4) return false;

    return p.every(x=>{
        if(!/^\d+$/.test(x)) return false;
        const n = Number(x);
        return n >= 0 && n <= 255;
    });
}


function normalizeIPv6(ip){

    let value = String(ip || "").trim().replace(/^\[|\]$/g,"").toLowerCase();

    if(!value || value.includes("%")) return null;

    let ipv4Tail = null;

    if(value.includes(".")){
        const lastColon = value.lastIndexOf(":");
        if(lastColon < 0) return null;
        ipv4Tail = value.slice(lastColon + 1);
        if(!isIPv4(ipv4Tail)) return null;
        const octets = ipv4Tail.split(".").map(Number);
        const h1 = ((octets[0] << 8) | octets[1]).toString(16);
        const h2 = ((octets[2] << 8) | octets[3]).toString(16);
        value = value.slice(0,lastColon + 1) + h1 + ":" + h2;
    }

    const double = value.indexOf("::");
    if(double !== -1 && value.indexOf("::", double + 1) !== -1) return null;

    const hasCompression = double !== -1;
    let left = [];
    let right = [];

    if(hasCompression){
        left = value.slice(0,double).split(":").filter(Boolean);
        right = value.slice(double + 2).split(":").filter(Boolean);
    }else{
        left = value.split(":");
    }

    const validGroup = x => /^[0-9a-f]{1,4}$/.test(x);
    if(!left.every(validGroup) || !right.every(validGroup)) return null;

    const total = left.length + right.length;

    if(hasCompression){
        if(total >= 8) return null;
    }else if(total !== 8){
        return null;
    }

    const groups = [
        ...left,
        ...(hasCompression ? Array(8 - total).fill("0") : []),
        ...right
    ].map(x => x.padStart(4,"0"));

    return groups.length === 8 ? groups : null;
}

function isIPv6(ip){
    return normalizeIPv6(ip) !== null;
}


/* =========================================================
   IPv6
========================================================= */

function expandIPv6(ip){
    const groups = normalizeIPv6(ip);
    return groups ? groups.join(":") : null;
}

function ptrName(ip){

    if(isIPv4(ip)){

        return ip
            .split(".")
            .reverse()
            .join(".") +
            ".in-addr.arpa";
    }

    const expanded = expandIPv6(ip);

    if(!expanded) return null;

    return expanded
        .replace(/:/g,"")
        .split("")
        .reverse()
        .join(".") +
        ".ip6.arpa";
}


/* =========================================================
   DNS
========================================================= */

async function fetchWithTimeout(
    url,
    timeout
){

    const controller =
        new AbortController();

    const timer =
        setTimeout(
            ()=>controller.abort(),
            timeout
        );

    try{

        const response =
            await fetch(
                url,
                {
                    method:"GET",
                    headers:{
                        "Accept":
                        "application/dns-json"
                    },
                    signal:
                        controller.signal,
                    cache:"no-store"
                }
            );

        return response;

    }finally{

        clearTimeout(timer);
    }
}


async function queryResolver(
    resolver,
    name,
    timeout
){

    const separator =
        resolver.includes("?")
            ? "&"
            : "?";

    const url =
        resolver +
        separator +
        "name=" +
        encodeURIComponent(name) +
        "&type=PTR";

    const response =
        await fetchWithTimeout(
            url,
            timeout
        );

    if(!response.ok){
        throw new Error(
            "HTTP " + response.status
        );
    }

    const data =
        await response.json();

    const dnsStatus = Number(data.Status);

    if(dnsStatus === 3){
        return {status:"NXDOMAIN", rdns:[]};
    }

    if(dnsStatus === 2){
        throw new Error("SERVFAIL");
    }

    if(dnsStatus !== 0){
        throw new Error("DNS_STATUS_" + dnsStatus);
    }

    const answers = Array.isArray(data.Answer) ? data.Answer : [];

    const rdns = answers
        .filter(x=>x.type === 12)
        .map(x=>
            String(x.data || "")
                .trim()
                .replace(/\.$/,"")
        )
        .filter(Boolean);

    return {
        status:rdns.length ? "FOUND" : "NO_RDNS",
        rdns:[...new Set(rdns)]
    };
}


async function lookupPTR(
    ip,
    timeout,
    retries
){

    const cacheKey = ip.toLowerCase();

    if(ipCache.has(cacheKey)){
        return ipCache.get(cacheKey);
    }

    const name = ptrName(ip);

    if(!name){
        return {rdns:"",status:"ERROR",error:"INVALID_IP"};
    }

    let lastError = null;

    for(
        let attempt=0;
        attempt<=retries;
        attempt++
    ){

        /*
         * Try resolver #1 then resolver #2.
         */

        for(const resolver of RESOLVERS){

            try{

                const result =
                    await queryResolver(
                        resolver,
                        name,
                        timeout
                    );

                if(result.status === "NXDOMAIN"){
                    const finalResult = {rdns:"",status:"NXDOMAIN"};
                    ipCache.set(cacheKey,finalResult);
                    return finalResult;
                }

                const finalResult = {
                    rdns:result.rdns.join(" | "),
                    status:result.status
                };

                ipCache.set(cacheKey,finalResult);
                return finalResult;

            }catch(e){

                lastError = e;
            }
        }

        /*
         * Small exponential delay.
         */

        if(attempt < retries){

            const delay = Math.min(3000,400 * Math.pow(2,attempt));
            const jitter = Math.floor(Math.random() * 250);
            await sleep(delay + jitter);
        }
    }

    const finalError = lastError ? lastError.message : "Unknown error";

    return {
        rdns:"",
        status: finalError === "SERVFAIL" ? "SERVFAIL" : "ERROR",
        error: finalError
    };
}


/* =========================================================
   QUEUE
========================================================= */

async function processIP(ip){

    const timeout =
        Number($("timeout").value);

    const retries =
        Number($("retries").value);

    return lookupPTR(
        ip,
        timeout,
        retries
    );
}


async function runQueue(){

    const concurrency =
        Number($("concurrency").value);

    const unique = new Set();
    uniqueIPSet = new Set();

    for(const row of rows){
        const ip = row.ip.toLowerCase();
        uniqueIPSet.add(ip);
        if(row.status === "WAITING" || row.status === "LOOKUP") unique.add(ip);
    }

    totalIPs = uniqueIPSet.size;
    const pendingIPs = [...unique];

    let cursor = 0;

    async function worker(){

        while(running){

            while(paused && running){
                await sleep(150);
            }

            if(!running) return;

            const index = cursor++;

            if(index >= pendingIPs.length){
                return;
            }

            const ip = pendingIPs[index];

            /*
             * Mark all rows with this IP as LOOKUP.
             */

            for(const row of rows){

                if(
                    row.ip.toLowerCase() === ip &&
                    row.status === "WAITING"
                ){
                    setRowStatus(row,"LOOKUP");
                }
            }

            scheduleRender();

            const result =
                await processIP(ip);

            /*
             * Apply same PTR result to
             * every SERV using this IP.
             */

            for(const row of rows){

                if(
                    row.ip.toLowerCase() === ip
                ){

                    row.rdns =
                        result.rdns || "";

                    setRowStatus(row,result.status);
                }
            }

            processed++;
            completedRequests++;

            updateStats();
            updateProgress();
            scheduleRender();

            scheduleSave();
        }
    }

    const workers = [];

    for(
        let i=0;
        i<Math.min(
            concurrency,
            pendingIPs.length
        );
        i++
    ){
        workers.push(worker());
    }

    await Promise.all(workers);
}


function updateButtonState(){
    const start=root.querySelector('[data-z-action="startJob"]');
    const pause=root.querySelector('[data-z-action="pauseJob"]');
    const resume=root.querySelector('[data-z-action="resumeJob"]');
    const stop=root.querySelector('[data-z-action="stopJob"]');
    if(!start||!pause||!resume||!stop)return;
    start.disabled=running;
    pause.disabled=!running||paused;
    resume.disabled=!running||!paused;
    stop.disabled=!running;
}
/* =========================================================
   JOB CONTROL
========================================================= */

async function startJob(){

    if(running) return;

    const parsed =
        parseInput(
            $("input").value
        );

    if(!parsed.length){

        alert(
            "No valid SERV + IP pairs found."
        );

        return;
    }

    rows = parsed;

    ipCache.clear();
    rebuildStats();

    processed = 0;
    completedRequests = 0;

    jobId =
        "job_" +
        Date.now();

    running = true;
    paused = false;
    updateButtonState();

    startedAt = Date.now();

    updateStats();
    updateProgress();
    scheduleRender();

    await saveJob();

    await runQueue();

    if(running){

        running = false;

        $("progressText").textContent =
            "Completed";

        updateProgress();
        updateStats();
        scheduleRender();

        await saveJob();
    }
}


function pauseJob(){

    if(!running) return;

    paused = true;
    updateButtonState();

    $("progressText").textContent =
        "Paused";
}


function resumeJob(){

    if(!running) return;

    paused = false;
    updateButtonState();

    updateProgress();
}


function stopJob(){

    running = false;
    paused = false;
    updateButtonState();

    $("progressText").textContent =
        "Stopped";

    scheduleSave();
}


/* =========================================================
   RESUME LAST SAVED JOB
========================================================= */

async function checkSavedJob(){

    const job =
        await loadLastJob();

    if(!job) return;

    if(
        !job.rows ||
        !job.rows.length
    ) return;

    const remaining =
        job.rows.filter(
            x =>
                x.status === "WAITING" ||
                x.status === "LOOKUP"
        ).length;

    if(!remaining) return;

    const use =
        confirm(
            "A previous unfinished job was found.\n\n" +
            "Rows: " + job.rows.length +
            "\nRemaining: " + remaining +
            "\n\nResume it?"
        );

    if(!use) return;

    rows = job.rows;
    rebuildStats();

    ipCache =
        new Map(
            job.ipCache || []
        );

    processed =
        job.processed || 0;

    jobId = job.id;

    running = true;
    paused = false;
    updateButtonState();

    startedAt = Date.now();

    $("input").value =
        rows
            .map(
                x =>
                    x.serv +
                    "\t" +
                    x.ip
            )
            .join("\n");

    updateStats();
    updateProgress();
    scheduleRender();

    await runQueue();

    if(running){

        running = false;

        $("progressText").textContent =
            "Completed";

        await saveJob();
    }
}


/* =========================================================
   SAVE THROTTLE
========================================================= */

function scheduleSave(){

    if(saveTimer) return;

    saveTimer =
        setTimeout(
            async ()=>{

                saveTimer = null;

                await saveJob();

            },
            SAVE_INTERVAL
        );
}


/* =========================================================
   RENDER THROTTLE
========================================================= */

function scheduleRender(){

    if(renderTimer) return;

    renderTimer =
        setTimeout(
            ()=>{
                renderTimer = null;
                renderTable();
            },
            RENDER_INTERVAL
        );
}


function renderTable(){

    const search =
        $("search")
            .value
            .trim()
            .toLowerCase();

    const filter =
        $("filter").value;

    let html = "";

    /*
     * Limit visible DOM rows.
     * The data itself remains complete.
     */

    const MAX_VISIBLE = 2500;

    let count = 0;

    for(const row of rows){

        if(count >= MAX_VISIBLE) break;

        if(
            filter !== "ALL" &&
            row.status !== filter
        ){
            continue;
        }

        const combined =
            (
                row.serv +
                " " +
                row.ip +
                " " +
                row.rdns +
                " " +
                row.status
            ).toLowerCase();

        if(
            search &&
            !combined.includes(search)
        ){
            continue;
        }

        let cls = "status-waiting";

        if(row.status === "FOUND")
            cls = "status-found";

        else if(row.status === "NO_RDNS")
            cls = "status-no";

        else if(row.status === "NXDOMAIN")
            cls = "status-nxdomain";

        else if(row.status === "SERVFAIL")
            cls = "status-servfail";

        else if(row.status === "ERROR")
            cls = "status-error";

        else if(row.status === "LOOKUP")
            cls = "status-running";

        html += `
            <tr>
                <td>${esc(row.serv)}</td>
                <td>${esc(row.ip)}</td>
                <td class="${cls}">
                    ${esc(row.rdns || "—")}
                </td>
                <td class="${cls}">
                    ${esc(row.status)}
                </td>
            </tr>
        `;

        count++;
    }

    if(!html){

        html =
            `<tr>
                <td colspan="4" class="empty">
                    No results
                </td>
            </tr>`;
    }

    $("resultsBody").innerHTML = html;
}


/* =========================================================
   STATS
========================================================= */

function rebuildStats(){

    stats.found = 0;
    stats.noRdns = 0;
    stats.nxdomain = 0;
    stats.servfail = 0;
    stats.errors = 0;
    uniqueIPSet = new Set();

    for(const row of rows){
        uniqueIPSet.add(row.ip.toLowerCase());
        countStatus(row.status,1);
    }
}

function countStatus(status,delta){
    if(status === "FOUND") stats.found += delta;
    else if(status === "NO_RDNS") stats.noRdns += delta;
    else if(status === "NXDOMAIN") stats.nxdomain += delta;
    else if(status === "SERVFAIL") stats.servfail += delta;
    else if(status === "ERROR") stats.errors += delta;
}

function setRowStatus(row,status){
    if(row.status === status) return;
    countStatus(row.status,-1);
    row.status = status;
    countStatus(row.status,1);
}

function updateStats(){

    $("total").textContent = rows.length;
    $("uniqueIPs").textContent = uniqueIPSet.size;
    $("found").textContent = stats.found;
    $("noRdns").textContent = stats.noRdns;
    $("nxdomain").textContent = stats.nxdomain;
    $("servfail").textContent = stats.servfail;
    $("errors").textContent = stats.errors;
    $("processed").textContent = processed;
}

function updateProgress(){

    if(!totalIPs){

        $("progressBar").style.width =
            "0%";

        return;
    }

    const percent =
        Math.min(
            100,
            Math.round(
                processed /
                totalIPs *
                100
            )
        );

    $("progressBar").style.width =
        percent + "%";

    const elapsed =
        (Date.now() - startedAt) / 1000;

    const speed =
        elapsed > 0
            ? processed / elapsed
            : 0;

    $("progressText").textContent =
        processed +
        " / " +
        totalIPs +
        " IPs (" +
        percent +
        "%)";

    $("speedText").textContent =
        speed.toFixed(2) +
        " IP/s";
}


/* =========================================================
   EXPORT
========================================================= */

function buildTXT(){

    const lines = [];

    lines.push(
        "SERV\tIP\tRDNS domains"
    );

    lines.push(
        "=============================================================="
    );

    for(const row of rows){

        lines.push(
            row.serv +
            "\t" +
            row.ip +
            "\t" +
            (row.rdns || "NO_RDNS")
        );
    }

    return lines.join("\n");
}


function downloadTXT(){

    if(!rows.length) return;

    download(
        buildTXT(),
        "rdns-results.txt",
        "text/plain;charset=utf-8"
    );
}


function buildCSV(){

    const lines = [];

    lines.push(
        '"SERV","IP","RDNS domains","STATUS"'
    );

    for(const row of rows){

        lines.push(
            csv(row.serv) +
            "," +
            csv(row.ip) +
            "," +
            csv(row.rdns) +
            "," +
            csv(row.status)
        );
    }

    return lines.join("\n");
}


function downloadCSV(){

    if(!rows.length) return;

    download(
        buildCSV(),
        "rdns-results.csv",
        "text/csv;charset=utf-8"
    );
}


async function copyResults(){

    if(!rows.length) return;

    try{

        await navigator.clipboard.writeText(
            buildTXT()
        );

        alert("Results copied.");

    }catch(e){

        alert(
            "Clipboard access failed."
        );
    }
}


function download(
    content,
    filename,
    type
){

    const blob =
        new Blob(
            [content],
            {type:type}
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);
}


/* =========================================================
   CLEAR
========================================================= */

async function clearAll(){

    if(
        !confirm(
            "Clear current results and saved job?"
        )
    ){
        return;
    }

    running = false;
    paused = false;

    rows = [];
    ipCache.clear();
    rebuildStats();

    processed = 0;
    totalIPs = 0;
    jobId = null;

    $("input").value = "";
    $("search").value = "";

    $("progressBar").style.width =
        "0%";

    $("progressText").textContent =
        "Ready";

    $("speedText").textContent =
        "0 req/s";

    updateStats();
    renderTable();

    await deleteAllJobs();
}


/* =========================================================
   HELPERS
========================================================= */

function sleep(ms){

    return new Promise(
        resolve =>
            setTimeout(resolve,ms)
    );
}


function esc(value){

    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


function csv(value){

    return '"' +
        String(value ?? "")
            .replace(/"/g,'""') +
        '"';
}


/* =========================================================
   INIT
========================================================= */

(async function init(){

    rebuildStats();
    updateStats();
    renderTable();

    try{
        await checkSavedJob();
    }catch(e){
        console.warn(
            "Resume initialization failed",
            e
        );
    }

})();
return {startJob,pauseJob,resumeJob,stopJob,copyResults,downloadCSV,downloadTXT,clearAll,scheduleRender,updateButtonState};
}

class ZRdnsModule extends HTMLElement {
 constructor() { super(); this.root=this.attachShadow({mode:'open'}); }
 connectedCallback() {
 if(this._ready)return;
 this._ready=true;
 this.setAttribute('data-theme',document.body.classList.contains('light')?'light':'dark');
 this.root.innerHTML=`<style>${RDNS_CSS}</style><div class="z-rdns-module">${RDNS_BODY}</div>`;
 const api=initRdns(this.root,this);
 this.root.querySelectorAll('[data-z-action]').forEach(el=>{const n=el.dataset.zAction;if(api[n])el.addEventListener('click',api[n]);el.removeAttribute('data-z-action')});
 this.root.querySelector('#search')?.addEventListener('input',()=>api.scheduleRender?.());
 this.root.querySelector('#filter')?.addEventListener('change',()=>api.scheduleRender?.());
 this._api=api;
 api.updateButtonState?.();
}
 activate() { this.dataset.viewName=this.tagName.toLowerCase().includes('rdns')?'rdns':'analytics'; this.setAttribute('aria-hidden','false'); }
 deactivate() { this.setAttribute('aria-hidden','true'); }
 destroy() { this.root.innerHTML=''; this._ready=false; }
 setTheme(theme) { this.setAttribute('data-theme',theme==='light'?'light':'dark'); }
}
customElements.define('z-rdns-module',ZRdnsModule);
