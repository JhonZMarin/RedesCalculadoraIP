
(function () {
  "use strict";


  function validarIP(ip) {
    if (!ip || typeof ip !== "string") return false;
    const r = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    return r.test(ip.trim());
  }

  function ipToInt(ip) {
    return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  }
  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }
  function prefixToMask(prefix) {
    prefix = Number(prefix);
    if (!Number.isFinite(prefix) || prefix < 0 || prefix > 32) return 0;
    return ((0xFFFFFFFF << (32 - prefix)) >>> 0);
  }
  function hostsPorPrefijo(prefix) {
    prefix = Number(prefix);
    if (prefix >= 31) return 0;
    return (1 << (32 - prefix)) - 2;
  }
  function detectarPrefijoPorClase(ip) {
    if (!validarIP(ip)) return null;
    const first = Number(ip.split(".")[0]);
    if (first >= 1 && first <= 126) return 8;
    if (first >= 128 && first <= 191) return 16;
    if (first >= 192 && first <= 223) return 24;
    return 24;
  }


  const explicaciones = { ip: [], flsm: [], vlsm: [] };
  function logExplicacion(tipo, texto) {
    if (!explicaciones[tipo]) explicaciones[tipo] = [];
    explicaciones[tipo].push(texto);
  }


  document.addEventListener("DOMContentLoaded", () => {
    // NAV botones
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        mostrarSeccion(target);
      });
    });


    document.querySelectorAll(".seccion").forEach(s => s.classList.add("oculto"));
    const bienvenida = document.getElementById("bienvenida");
    if (bienvenida) bienvenida.classList.remove("oculto");


    const ipInput = document.getElementById("ipInput");
    const prefixInput = document.getElementById("prefixInput");
    const calcIpBtn = document.getElementById("calcIpBtn");
    const explainIpBtn = document.getElementById("explainIpBtn");
    const resetIpBtn = document.getElementById("resetIpBtn");
    const resultadoIP = document.getElementById("resultadoIP");
    const explicacionIP = document.getElementById("explicacionIP");

    if (ipInput) {
      ipInput.addEventListener("input", () => {
        const raw = ipInput.value.trim().split("/")[0];
        if (validarIP(raw)) {
          const pref = detectarPrefijoPorClase(raw);
          if (prefixInput) prefixInput.value = "/" + pref;
        } else if (prefixInput) {
          prefixInput.value = "";
        }
      });
    }

    if (calcIpBtn) calcIpBtn.addEventListener("click", calcularIP);
    if (explainIpBtn) explainIpBtn.addEventListener("click", () => mostrarExplicacion("ip"));
    if (resetIpBtn) resetIpBtn.addEventListener("click", () => resetear("ip"));

    const redFLSM = document.getElementById("redFLSM");
    const prefijoFLSM = document.getElementById("prefijoFLSM");
    const numSubredesFLSM = document.getElementById("numSubredesFLSM");
    const hostsFLSM = document.getElementById("hostsFLSM");
    const calcFlsmBtn = document.getElementById("calcFlsmBtn");
    const explainFlsmBtn = document.getElementById("explainFlsmBtn");
    const resetFlsmBtn = document.getElementById("resetFlsmBtn");
    const downloadFlsmBtn = document.getElementById("downloadFlsmBtn");
    const resultadoFLSM = document.getElementById("resultadoFLSM");
    const explicacionFLSM = document.getElementById("explicacionFLSM");

    if (redFLSM) {
      redFLSM.addEventListener("input", () => {
        const raw = redFLSM.value.trim().split("/")[0];
        if (validarIP(raw) && prefijoFLSM) prefijoFLSM.value = detectarPrefijoPorClase(raw);
      });
    }
    if (calcFlsmBtn) calcFlsmBtn.addEventListener("click", calcularFLSM);
    if (explainFlsmBtn) explainFlsmBtn.addEventListener("click", () => mostrarExplicacion("flsm"));
    if (resetFlsmBtn) resetFlsmBtn.addEventListener("click", () => resetear("flsm"));
    if (downloadFlsmBtn) downloadFlsmBtn.addEventListener("click", () => descargarCSV("flsm"));

    
    const redVLSM = document.getElementById("redVLSM");
    const prefijoVLSM = document.getElementById("prefijoVLSM");
    const numSubredesVLSM = document.getElementById("numSubredesVLSM");
    const genVlsmBtn = document.getElementById("genVlsmBtn");
    const camposVLSM = document.getElementById("camposVLSM");
    const calcVlsmBtn = document.getElementById("calcVlsmBtn");
    const explainVlsmBtn = document.getElementById("explainVlsmBtn");
    const resetVlsmBtn = document.getElementById("resetVlsmBtn");
    const downloadVlsmBtn = document.getElementById("downloadVlsmBtn");
    const resultadoVLSM = document.getElementById("resultadoVLSM");
    const explicacionVLSM = document.getElementById("explicacionVLSM");

    if (redVLSM) {
      redVLSM.addEventListener("input", () => {
        const raw = redVLSM.value.trim().split("/")[0];
        if (validarIP(raw) && prefijoVLSM) prefijoVLSM.value = detectarPrefijoPorClase(raw);
      });
    }

    if (genVlsmBtn) genVlsmBtn.addEventListener("click", () => {
      const c = Number(numSubredesVLSM ? numSubredesVLSM.value : 0);
      if (!c || c < 1) return alert("Ingresa un número de subredes válido");
      let html = "";
      for (let i = 1; i <= c; i++) {
        html += `<label>Hosts requeridos subred ${i}</label><input type="number" id="hostsVLSM${i}" placeholder="Ej: 50" min="1">`;
      }
      if (camposVLSM) camposVLSM.innerHTML = html;
    });

    if (calcVlsmBtn) calcVlsmBtn.addEventListener("click", calcularVLSM);
    if (explainVlsmBtn) explainVlsmBtn.addEventListener("click", () => mostrarExplicacion("vlsm"));
    if (resetVlsmBtn) resetVlsmBtn.addEventListener("click", () => resetear("vlsm"));
    if (downloadVlsmBtn) downloadVlsmBtn.addEventListener("click", () => descargarCSV("vlsm"));

    console.info("Inicializado script.js");
  }); // end DOMContentLoaded

  function mostrarSeccion(tipo) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.add("oculto"));
    // ocultar bienvenida si existe
    const bienvenida = document.getElementById("bienvenida");
    if (bienvenida) bienvenida.classList.add("oculto");

    const panel = document.getElementById("seccion-" + tipo);
    if (panel) panel.classList.remove("oculto");
    else console.warn("Panel no encontrado:", tipo);
  }


  function calcularIP() {
    try {
      const ipRaw = document.getElementById("ipInput") ? document.getElementById("ipInput").value.trim() : "";
      if (!ipRaw) return alert("Introduce una IP (ej: 192.168.1.1 o 192.168.1.1/24)");
      let ip = ipRaw, pref;
      if (ipRaw.includes("/")) [ip, pref] = ipRaw.split("/");
      else {
        ip = ipRaw.split("/")[0];
        const detected = detectarPrefijoPorClase(ip);
        pref = detected;
      }
      if (!validarIP(ip)) return alert("IP inválida");
      pref = Number(pref);
      if (!Number.isFinite(pref) || pref < 0 || pref > 32) return alert("Prefijo inválido");

      const ipInt = ipToInt(ip);
      const maskInt = prefixToMask(pref);
      const wildcard = (~maskInt) >>> 0;
      const redInt = ipInt & maskInt;
      const broadcastInt = redInt | wildcard;
      const primerHost = (pref === 32) ? redInt : redInt + 1;
      const ultimoHost = (pref >= 31) ? broadcastInt : broadcastInt - 1;
      const hosts = hostsPorPrefijo(pref);

      logExplicacion("ip", `IP: ${ip}/${pref}`);
      logExplicacion("ip", `Red: ${intToIp(redInt)}  Broadcast: ${intToIp(broadcastInt)}`);
      logExplicacion("ip", `Máscara: ${intToIp(maskInt)}  Wildcard: ${intToIp(wildcard)}`);
      logExplicacion("ip", `Primer host: ${primerHost > broadcastInt ? "N/A" : intToIp(primerHost)}`);
      logExplicacion("ip", `Último host: ${ultimoHost < redInt ? "N/A" : intToIp(ultimoHost)}`);
      logExplicacion("ip", `Hosts asignables: ${hosts}`);

      // mostrar tabla
      const rows = [
        ["Dirección IPv4", ip, ipInt.toString(2).match(/.{1,8}/g).join(".")],
        ["Máscara de red", intToIp(maskInt) + ` /${pref}`, maskInt.toString(2).match(/.{1,8}/g).join(".")],
        ["Wildcard", intToIp(wildcard), intToIp(wildcard).split(".").map(n => Number(n).toString(2).padStart(8,"0")).join(".")],
        ["Dirección de red", intToIp(redInt), intToIp(redInt).split(".").map(n => Number(n).toString(2).padStart(8,"0")).join(".")],
        ["Primer host", primerHost > broadcastInt ? "N/A" : intToIp(primerHost), primerHost > broadcastInt ? "-" : intToIp(primerHost).split(".").map(n => Number(n).toString(2).padStart(8,"0")).join(".")],
        ["Último host", ultimoHost < redInt ? "N/A" : intToIp(ultimoHost), ultimoHost < redInt ? "-" : intToIp(ultimoHost).split(".").map(n => Number(n).toString(2).padStart(8,"0")).join(".")],
        ["Broadcast", intToIp(broadcastInt), broadcastInt.toString(2).match(/.{1,8}/g).join(".")],
        ["Hosts asignables", hosts, "-"]
      ];

      let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr><th>Item</th><th>Decimal</th><th>Binario</th></tr></thead><tbody>';
      rows.forEach(r => {
        html += `<tr><td style="font-weight:700;background:rgba(0,0,0,0.2)">${r[0]}</td><td>${r[1]}</td><td style="font-family:monospace">${r[2]}</td></tr>`;
      });
      html += '</tbody></table>';

      const resultadoIP = document.getElementById("resultadoIP");
      if (resultadoIP) resultadoIP.innerHTML = html;
    } catch (err) {
      console.error("Error calcularIP:", err);
      alert("Error en cálculo IP (ver consola).");
    }
  }


  function calcularFLSM() {
    try {
      const red = document.getElementById("redFLSM") ? document.getElementById("redFLSM").value.trim() : "";
      let pref = document.getElementById("prefijoFLSM") ? Number(document.getElementById("prefijoFLSM").value) : NaN;
      const n = Number(document.getElementById("numSubredesFLSM") ? document.getElementById("numSubredesFLSM").value : 0);
      const hostsReq = Number(document.getElementById("hostsFLSM") ? document.getElementById("hostsFLSM").value : 0);

      if (!validarIP(red)) return alert("Red inválida");
      if (!Number.isFinite(pref)) pref = detectarPrefijoPorClase(red);
      if (!Number.isFinite(pref) || isNaN(n) || isNaN(hostsReq) || n < 1 || hostsReq < 1) return alert("Completa todos los campos");

      // calcular prefijo necesario por hosts
      const bitsHosts = Math.ceil(Math.log2(hostsReq + 2));
      const prefSub = 32 - bitsHosts;
      if (prefSub < pref) return alert("No cabe: la subred solicitada necesita más espacio que la red base");

      const redInt = ipToInt(red) & prefixToMask(pref);
      const bloque = (1 << (32 - prefSub)) >>> 0;
      const totalPosibles = Math.pow(2, prefSub - pref);
      if (n > totalPosibles) return alert(`No caben ${n} subredes en ${red}/${pref} (máx ${totalPosibles})`);

      let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr><th>#</th><th>Red</th><th>Máscara</th><th>Primer Host</th><th>Último Host</th><th>Broadcast</th></tr></thead><tbody>';
      for (let i = 0; i < n; i++) {
        const net = (redInt + (i * bloque)) >>> 0;
        const bcast = (net + bloque - 1) >>> 0;
        const first = (prefSub === 32 ? net : net + 1) >>> 0;
        const last = (prefSub >= 31 ? bcast : bcast - 1) >>> 0;
        html += `<tr><td style="font-weight:700">Subred ${i+1}</td><td>${intToIp(net)}/${prefSub}</td><td>${intToIp(prefixToMask(prefSub))}</td><td>${first > bcast ? 'N/A' : intToIp(first)}</td><td>${last < net ? 'N/A' : intToIp(last)}</td><td>${intToIp(bcast)}</td></tr>`;
        logExplicacion('flsm', `Subred ${i+1}: ${intToIp(net)}/${prefSub} (broadcast ${intToIp(bcast)})`);
      }
      html += '</tbody></table>';
      const resultadoFLSM = document.getElementById("resultadoFLSM");
      if (resultadoFLSM) resultadoFLSM.innerHTML = html;
      logExplicacion('flsm', `FLSM calculado: base ${intToIp(redInt)}/${pref} -> subprefijo /${prefSub}`);
    } catch (err) {
      console.error("Error FLSM:", err);
      alert("Error en FLSM (ver consola).");
    }
  }


  function calcularVLSM() {
    try {
      const red = document.getElementById("redVLSM") ? document.getElementById("redVLSM").value.trim() : "";
      let pref = document.getElementById("prefijoVLSM") ? Number(document.getElementById("prefijoVLSM").value) : NaN;
      const count = Number(document.getElementById("numSubredesVLSM") ? document.getElementById("numSubredesVLSM").value : 0);
      if (!validarIP(red)) return alert("Red inválida");
      if (!Number.isFinite(pref)) pref = detectarPrefijoPorClase(red);
      if (!count || count < 1) return alert("Genera primero los campos de hosts");

      const baseNet = ipToInt(red) & prefixToMask(pref);
      const reqs = [];
      for (let i = 1; i <= count; i++) {
        const el = document.getElementById(`hostsVLSM${i}`);
        const h = el ? Number(el.value) : NaN;
        if (!h || h < 1) return alert(`Completa hosts para la subred ${i}`);
        reqs.push({ id: i, hosts: h });
      }
      // ordenar descendente
      reqs.sort((a,b) => b.hosts - a.hosts);

      const allocs = [];
      let current = baseNet;
      for (let r of reqs) {
        const bits = Math.ceil(Math.log2(r.hosts + 2));
        const subPref = 32 - bits;
        if (subPref < pref) return alert(`Subred ${r.id} necesita más espacio que la red base`);
        const size = (1 << bits) >>> 0;
        const net = current >>> 0;
        const bcast = (net + size - 1) >>> 0;
        const first = (subPref === 32 ? net : net + 1) >>> 0;
        const last = (subPref >= 31 ? bcast : bcast - 1) >>> 0;
        allocs.push({ id: r.id, hosts: r.hosts, net, pref: subPref, mask: prefixToMask(subPref), first, last, bcast });
        logExplicacion('vlsm', `Asignada solicitud ${r.id}: ${intToIp(net)}/${subPref} (hosts ${r.hosts})`);
        current = (bcast + 1) >>> 0;
      }

      // ordenar por id para mostrar en orden original
      allocs.sort((a,b) => a.id - b.id);
      let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr><th>Subred</th><th>Hosts req</th><th>IP de red</th><th>Máscara</th><th>Prefijo</th><th>Primer Host</th><th>Último Host</th><th>Broadcast</th></tr></thead><tbody>';
      allocs.forEach((a,i) => {
        html += `<tr><td style="font-weight:700">Subred ${i+1}</td><td>${a.hosts}</td><td>${intToIp(a.net)}</td><td>${intToIp(a.mask)}</td><td>/${a.pref}</td><td>${intToIp(a.first)}</td><td>${intToIp(a.last)}</td><td>${intToIp(a.bcast)}</td></tr>`;
      });
      html += '</tbody></table>';
      const resultadoVLSM = document.getElementById("resultadoVLSM");
      if (resultadoVLSM) resultadoVLSM.innerHTML = html;
    } catch (err) {
      console.error("Error VLSM:", err);
      alert("Error en VLSM (ver consola).");
    }
  }

  function mostrarExplicacion(tipo) {
    const targetId = tipo === "ip" ? "explicacionIP" : (tipo === "flsm" ? "explicacionFLSM" : "explicacionVLSM");
    const target = document.getElementById(targetId);
    if (!target) return;
    const list = explicaciones[tipo] || [];
    target.innerHTML = list.length ? list.join("<br>") : "No hay explicación generada aún.";
  }

  function resetear(tipo) {
    if (tipo === "ip") {
      if (document.getElementById("ipInput")) document.getElementById("ipInput").value = "";
      if (document.getElementById("prefixInput")) document.getElementById("prefixInput").value = "";
      if (document.getElementById("resultadoIP")) document.getElementById("resultadoIP").innerHTML = "";
      if (document.getElementById("explicacionIP")) document.getElementById("explicacionIP").innerHTML = "";
      explicaciones.ip = [];
    } else if (tipo === "flsm") {
      if (document.getElementById("redFLSM")) document.getElementById("redFLSM").value = "";
      if (document.getElementById("prefijoFLSM")) document.getElementById("prefijoFLSM").value = "";
      if (document.getElementById("numSubredesFLSM")) document.getElementById("numSubredesFLSM").value = "";
      if (document.getElementById("hostsFLSM")) document.getElementById("hostsFLSM").value = "";
      if (document.getElementById("resultadoFLSM")) document.getElementById("resultadoFLSM").innerHTML = "";
      if (document.getElementById("explicacionFLSM")) document.getElementById("explicacionFLSM").innerHTML = "";
      explicaciones.flsm = [];
    } else if (tipo === "vlsm") {
      if (document.getElementById("redVLSM")) document.getElementById("redVLSM").value = "";
      if (document.getElementById("prefijoVLSM")) document.getElementById("prefijoVLSM").value = "";
      if (document.getElementById("numSubredesVLSM")) document.getElementById("numSubredesVLSM").value = "";
      if (document.getElementById("camposVLSM")) document.getElementById("camposVLSM").innerHTML = "";
      if (document.getElementById("resultadoVLSM")) document.getElementById("resultadoVLSM").innerHTML = "";
      if (document.getElementById("explicacionVLSM")) document.getElementById("explicacionVLSM").innerHTML = "";
      explicaciones.vlsm = [];
    }
  }


  function descargarCSV(tipo) {
    let table;
    if (tipo === "flsm") table = document.querySelector("#resultadoFLSM table");
    else if (tipo === "vlsm") table = document.querySelector("#resultadoVLSM table");
    if (!table) return alert("No hay datos para descargar");
    const rows = Array.from(table.rows);
    const csv = rows.map(r => Array.from(r.cells).map(c => `"${c.innerText.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${tipo}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }


  window.mostrarSeccion = mostrarSeccion;
  window.calcularIP = calcularIP;
  window.calcularFLSM = calcularFLSM;
  window.generarCamposVLSM = function () { document.getElementById("genVlsmBtn").click(); }; // no usado
  window.calcularVLSM = calcularVLSM;
  window.mostrarExplicacion = mostrarExplicacion;
  window.resetear = resetear;
  window.descargarCSV = descargarCSV;

})();
