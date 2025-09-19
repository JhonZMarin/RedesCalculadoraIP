// -------------------- UTILIDADES --------------------
function validarIP(ip) {
  if(!ip) return false;
  const r = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return r.test(ip);
}
function ipToInt(ip) {
  return ip.split('.').reduce((acc,oct)=> (acc<<8) + parseInt(oct,10) ,0) >>> 0;
}
function intToIp(int){
  return [(int>>>24)&255,(int>>>16)&255,(int>>>8)&255,int&255].join('.');
}
function prefixToMask(prefix){
  prefix = Number(prefix);
  if(prefix<=0) return 0;
  return ((0xFFFFFFFF << (32-prefix))>>>0);
}
function maskToDotted(maskInt){
  return intToIp(maskInt);
}
function hostsPorPrefijo(prefix){ return prefix>=31? (prefix===32?0:0): ((1<< (32-prefix)) -2); }

// Detectar prefijo por clase
function detectarPrefijoPorClase(ip){
  if(!validarIP(ip)) return null;
  const first = Number(ip.split('.')[0]);
  if(first>=1 && first<=126) return 8;
  if(first>=128 && first<=191) return 16;
  if(first>=192 && first<=223) return 24;
  return 24;
}

// -------------------- NAV TABS --------------------
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    document.getElementById('seccion-'+target).classList.remove('hidden');
  });
});

// -------------------- MODAL LOG --------------------
const logModal = document.getElementById('logModal');
const logText = document.getElementById('logText');
const logTitle = document.getElementById('logTitle');
document.getElementById('closeLog').addEventListener('click', ()=> closeLog());
function showLog(title, text){
  logTitle.textContent = title;
  logText.textContent = text || '(sin datos)';
  logModal.classList.remove('hidden');
}
function closeLog(){ logModal.classList.add('hidden'); }

// -------------------- EXPLICACIONES (logs) --------------------
const logs = { ip:[], flsm:[], vlsm:[] };
function pushLog(tipo, line){ logs[tipo].push(line); }

// -------------------- CALCULADORA IP --------------------
const ipInput = document.getElementById('ipInput');
const prefixInput = document.getElementById('prefixInput');
const ipResult = document.getElementById('ipResult');

ipInput.addEventListener('input', ()=>{
  const val = ipInput.value.trim();
  // if they provide /prefijo inside input, split it and set prefixInput
  if(val.includes('/')){
    const [ip, pre] = val.split('/');
    if(validarIP(ip) && pre && !isNaN(Number(pre))) prefixInput.value = pre;
    else prefixInput.value = '';
  } else {
    // auto-detect by class if ip valid
    const detected = detectarPrefijoPorClase(val);
    prefixInput.value = detected ? detected : '';
  }
});

document.getElementById('calcIpBtn').addEventListener('click', ()=>{
  logs.ip = [];
  const raw = ipInput.value.trim();
  if(!raw) return alert('Introduce una IPv4 (ej: 178.89.8.0 o 178.89.8.0/16)');
  let ip, pref;
  if(raw.includes('/')){ [ip,pref] = raw.split('/'); }
  else { ip = raw; pref = prefixInput.value || detectarPrefijoPorClase(ip); }
  if(!validarIP(ip)) return alert('IP inválida');
  pref = Number(pref);
  if(isNaN(pref) || pref<0 || pref>32) return alert('Prefijo inválido');

  const ipInt = ipToInt(ip);
  const maskInt = prefixToMask(pref);
  const wildcard = (~maskInt)>>>0;
  const netInt = ipInt & maskInt;
  const bcast = netInt | wildcard;
  const first = (pref===32)? netInt : netInt + 1;
  const last = (pref>=31)? bcast : bcast - 1;
  const hosts = hostsPorPrefijo(pref);

  pushLog('ip', `IP ingresada: ${ip} /${pref}`);
  pushLog('ip', `IP entero: ${ipInt}`);
  pushLog('ip', `Máscara: ${maskToDotted(maskInt)} -> binario ${maskInt.toString(2).padStart(32,'0')}`);
  pushLog('ip', `Wildcard: ${intToIp(wildcard)}`);
  pushLog('ip', `Red: ${intToIp(netInt)}`);
  pushLog('ip', `Broadcast: ${intToIp(bcast)}`);
  pushLog('ip', `Primer host: ${ (first>bcast)? 'N/A' : intToIp(first) }`);
  pushLog('ip', `Último host: ${ (last<intToIp)? 'N/A' : intToIp(last) }`);
  pushLog('ip', `Hosts asignables: ${hosts}`);

  // Mostrar tabla
  const rows = [
    ['Dirección IPv4', ip, ipInt.toString(2).match(/.{1,8}/g).join('.')],
    ['Máscara de red', maskToDotted(maskInt), maskInt.toString(2).match(/.{1,8}/g).join('.')],
    ['Wildcard', intToIp(wildcard), intToIp(wildcard).split('.').map(n=>Number(n).toString(2).padStart(8,'0')).join('.')],
    ['Dirección de red', intToIp(netInt), intToIp(netInt).split('.').map(n=>Number(n).toString(2).padStart(8,'0')).join('.')],
    ['Primer host', (first>bcast)? 'N/A' : intToIp(first), (first>bcast)? '-' : intToIp(first).split('.').map(n=>Number(n).toString(2).padStart(8,'0')).join('.')],
    ['Último host', (last<intToIp)? 'N/A' : intToIp(last), (last<intToIp)? '-' : intToIp(last).split('.').map(n=>Number(n).toString(2).padStart(8,'0')).join('.')],
    ['Broadcast', intToIp(bcast), bcast.toString(2).match(/.{1,8}/g).join('.')],
    ['Hosts asignables', hosts, '-']
  ];

  let html = '<table><thead><tr><th>Item</th><th>Decimal</th><th>Binario</th></tr></thead><tbody>';
  rows.forEach(r=> html += `<tr><td style="font-weight:700;background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#041014">${r[0]}</td><td>${r[1]}</td><td class="small">${r[2]}</td></tr>`);
  html += '</tbody></table>';
  ipResult.innerHTML = html;
});

document.getElementById('explainIpBtn').addEventListener('click', ()=> {
  showLog('Explicación IP', logs.ip.join('\n'));
});
document.getElementById('resetIpBtn').addEventListener('click', ()=> {
  ipInput.value=''; prefixInput.value=''; ipResult.innerHTML=''; logs.ip=[];
});

// -------------------- FLSM --------------------
const flsmIp = document.getElementById('flsmIp');
const flsmPrefix = document.getElementById('flsmPrefix');
const flsmResult = document.getElementById('flsmResult');

flsmIp.addEventListener('input', ()=> {
  const v = flsmIp.value.trim();
  const detected = detectarPrefijoPorClase(v);
  if(detected) flsmPrefix.value = detected;
});

document.getElementById('calcFlsmBtn').addEventListener('click', ()=>{
  logs.flsm = [];
  const red = flsmIp.value.trim();
  let pref = Number(flsmPrefix.value);
  const n = Number(document.getElementById('flsmSubnets').value);
  const hostsReq = Number(document.getElementById('flsmHosts').value);

  if(!validarIP(red)) return alert('Red inválida');
  if(!pref) pref = detectarPrefijoPorClase(red);
  if(isNaN(pref) || isNaN(n) || isNaN(hostsReq)) return alert('Completa todos los campos');

  const redInt = ipToInt(red) & prefixToMask(pref);
  // bits needed for hosts
  let bitsHosts = Math.ceil(Math.log2(hostsReq + 2));
  let newPref = 32 - bitsHosts;
  const size = (1<<bitsHosts)>>>0;

  if(newPref < pref) return alert('No cabe: la subred solicitada necesita más espacio que la red base');

  // total possible subnets
  const total = Math.pow(2, newPref - pref);
  if(n > total) return alert(`No caben ${n} subredes en ${red}/${pref} (máx ${total})`);

  let html = '<table><thead><tr><th>Subred</th><th>Hosts</th><th>IP de red</th><th>Máscara</th><th>Primer Host</th><th>Último Host</th><th>Broadcast</th></tr></thead><tbody>';
  for(let i=0;i<n;i++){
    const net = (redInt + (i * size))>>>0;
    const b = (net + size -1)>>>0;
    const first = (newPref===32? net : net+1)>>>0;
    const last = (newPref>=31? b : b-1)>>>0;
    html += `<tr><td style="font-weight:700;background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#041014">Subred ${i+1}</td><td>${hostsReq}</td><td>${intToIp(net)} /${newPref}</td><td>${maskToDotted(prefixToMask(newPref))}</td><td>${first>b? 'N/A' : intToIp(first)}</td><td>${last<intToIp? 'N/A' : intToIp(last)}</td><td>${intToIp(b)}</td></tr>`;
    pushLog('flsm', `Subred ${i+1}: ${intToIp(net)}/${newPref} (broadcast ${intToIp(b)})`);
  }
  html += '</tbody></table>';
  flsmResult.innerHTML = html;
  pushLog('flsm', `FLSM base: ${intToIp(redInt)}/${pref} -> subprefijo /${newPref}, direcciones/subred: ${size}`);
});

document.getElementById('flsmLog1').addEventListener('click', ()=> showLog('FLSM - 1', logs.flsm.join('\n')));
document.getElementById('flsmLog2').addEventListener('click', ()=> showLog('FLSM - 2', logs.flsm.join('\n')));
document.getElementById('flsmLog3').addEventListener('click', ()=> showLog('FLSM - 3', logs.flsm.join('\n')));
document.getElementById('resetFlsm').addEventListener('click', ()=> {
  flsmIp.value=''; flsmPrefix.value=''; document.getElementById('flsmSubnets').value=''; document.getElementById('flsmHosts').value=''; flsmResult.innerHTML=''; logs.flsm=[];
});
document.getElementById('downloadFlsm').addEventListener('click', ()=> {
  const table = flsmResult.querySelector('table');
  if(!table) return alert('Calcula FLSM antes de descargar');
  downloadTableAsCSV(table, 'flsm_subnets.csv');
});

// -------------------- VLSM --------------------
const vlsmIp = document.getElementById('vlsmIp');
const vlsmPrefix = document.getElementById('vlsmPrefix');
const vlsmHostsContainer = document.getElementById('vlsmHostsContainer');
const vlsmResult = document.getElementById('vlsmResult');

vlsmIp.addEventListener('input', ()=> {
  const d = detectarPrefijoPorClase(vlsmIp.value.trim());
  if(d) vlsmPrefix.value = d;
});

document.getElementById('genVlsmFields').addEventListener('click', ()=>{
  const c = Number(document.getElementById('vlsmCount').value);
  if(!c || c<1) return alert('Ingresa un número de subredes válido');
  let html = '';
  for(let i=1;i<=c;i++){
    html += `<label>Hosts requeridos subred ${i}</label><input type="number" id="hostsVLSM${i}" placeholder="Ej: 50" min="1"><br>`;
  }
  vlsmHostsContainer.innerHTML = html;
});

document.getElementById('calcVlsmBtn').addEventListener('click', ()=>{
  logs.vlsm = [];
  const red = vlsmIp.value.trim();
  let pref = Number(vlsmPrefix.value);
  const count = Number(document.getElementById('vlsmCount').value);
  if(!validarIP(red)) return alert('Red inválida');
  if(!pref) pref = detectarPrefijoPorClase(red);
  const baseNet = ipToInt(red) & prefixToMask(pref);
  if(!count || count<1) return alert('Genera primero los campos de hosts');

  const reqs = [];
  for(let i=1;i<=count;i++){
    const h = Number(document.getElementById(`hostsVLSM${i}`).value);
    if(!h || h<1) return alert(`Completa hosts para la subred ${i}`);
    reqs.push({id:i,hosts:h});
  }

  // ordenar por hosts decreciente
  reqs.sort((a,b)=> b.hosts - a.hosts);

  let allocations = [];
  let current = baseNet;
  for(let r of reqs){
    let bits = Math.ceil(Math.log2(r.hosts + 2));
    let subPref = 32 - bits;
    if(subPref < pref) return alert(`Subred ${r.id} necesita más espacio que la red base`);
    let size = (1<<bits)>>>0;
    let net = current;
    let bcast = (net + size -1)>>>0;
    let first = (subPref===32?net:net+1)>>>0;
    let last = (subPref>=31?bcast:bcast-1)>>>0;
    allocations.push({reqIdx:r.id,reqHosts:r.hosts,net,pref:subPref,mask:prefixToMask(subPref),size,first,last,bcast});
    pushLog('vlsm', `Asignada solicitud ${r.id}: ${intToIp(net)}/${subPref} (hosts requeridos ${r.hosts})`);
    current = (bcast + 1)>>>0;
  }

  // ordenar por id para mostrar en orden original de solicitud
  allocations.sort((a,b)=> a.reqIdx - b.reqIdx);

  let html = `<table><thead><tr><th>Subred</th><th>Hosts req</th><th>IP de red</th><th>Máscara</th><th>Prefijo</th><th>Primer Host</th><th>Último Host</th><th>Broadcast</th></tr></thead><tbody>`;
  allocations.forEach((a,i)=>{
    html += `<tr><td style="font-weight:700;background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#041014">Subred ${i+1}</td><td>${a.reqHosts}</td><td>${intToIp(a.net)}</td><td>${maskToDotted(a.mask)}</td><td>/${a.pref}</td><td>${intToIp(a.first)}</td><td>${intToIp(a.last)}</td><td>${intToIp(a.bcast)}</td></tr>`;
  });
  html += '</tbody></table>';
  vlsmResult.innerHTML = html;
});

document.getElementById('vlsmLog1').addEventListener('click', ()=> showLog('VLSM - 1', logs.vlsm.join('\n')));
document.getElementById('vlsmLog2').addEventListener('click', ()=> showLog('VLSM - 2', logs.vlsm.join('\n')));
document.getElementById('vlsmLog3').addEventListener('click', ()=> showLog('VLSM - 3', logs.vlsm.join('\n')));
document.getElementById('resetVlsm').addEventListener('click', ()=> {
  vlsmIp.value=''; vlsmPrefix.value=''; document.getElementById('vlsmCount').value=''; vlsmHostsContainer.innerHTML=''; vlsmResult.innerHTML=''; logs.vlsm=[];
});
document.getElementById('downloadVlsm').addEventListener('click', ()=> {
  const table = vlsmResult.querySelector('table');
  if(!table) return alert('Calcula VLSM antes de descargar');
  downloadTableAsCSV(table, 'vlsm_subnets.csv');
});

// -------------------- CSV UTILS --------------------
function downloadTableAsCSV(table, filename){
  const rows = Array.from(table.rows);
  const csv = rows.map(r=> Array.from(r.cells).map(c=> `"${c.innerText.replace(/"/g,'""')}"`).join(',')).join("\n");
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
        this.parentElement.style.display = 'none'; // Oculta el modal
    });
});