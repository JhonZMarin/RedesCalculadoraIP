/* script.js - explicaciones dinámicas para IP, FLSM y VLSM
   Reemplaza todo tu script.js por este. */
(function () {
  "use strict";

  /* ----------------- UTILIDADES ----------------- */
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
  function formatBits32(n) {
    return n.toString(2).padStart(32, "0");
  }
  function groupBits(bits) {
    if (!bits) return "";
    return bits.match(/.{1,8}/g).join(".");
  }
  function pow2(n) { return Math.pow(2, n); }

  /* ----------------- Explicaciones (HTML strings) ----------------- */
  const explicaciones = { ip: "", flsm: "", vlsm: "" };

  /* ----------------- DOM Init ----------------- */
  document.addEventListener("DOMContentLoaded", () => {
    // NAV
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        mostrarSeccion(target);
      });
    });

    // show only welcome
    document.querySelectorAll(".seccion").forEach(s => s.classList.add("oculto"));
    const bienvenida = document.getElementById("bienvenida");
    if (bienvenida) bienvenida.classList.remove("oculto");

    // IP elements
    const ipInput = document.getElementById("ipInput");
    const prefixInput = document.getElementById("prefixInput");
    const calcIpBtn = document.getElementById("calcIpBtn");
    const explainIpBtn = document.getElementById("explainIpBtn");
    const resetIpBtn = document.getElementById("resetIpBtn");

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

    // FLSM elements
    const redFLSM = document.getElementById("redFLSM");
    const prefijoFLSM = document.getElementById("prefijoFLSM");
    const calcFlsmBtn = document.getElementById("calcFlsmBtn");
    const explainFlsmBtn = document.getElementById("explainFlsmBtn");
    const resetFlsmBtn = document.getElementById("resetFlsmBtn");
    const downloadFlsmBtn = document.getElementById("downloadFlsmBtn");
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

    // VLSM elements
    const redVLSM = document.getElementById("redVLSM");
    const prefijoVLSM = document.getElementById("prefijoVLSM");
    const genVlsmBtn = document.getElementById("genVlsmBtn");
    const calcVlsmBtn = document.getElementById("calcVlsmBtn");
    const explainVlsmBtn = document.getElementById("explainVlsmBtn");
    const resetVlsmBtn = document.getElementById("resetVlsmBtn");
    const downloadVlsmBtn = document.getElementById("downloadVlsmBtn");
    const camposVLSM = document.getElementById("camposVLSM");

    if (redVLSM) {
      redVLSM.addEventListener("input", () => {
        const raw = redVLSM.value.trim().split("/")[0];
        if (validarIP(raw) && prefijoVLSM) prefijoVLSM.value = detectarPrefijoPorClase(raw);
      });
    }
    if (genVlsmBtn) genVlsmBtn.addEventListener("click", () => {
      const c = Number(document.getElementById("numSubredesVLSM") ? document.getElementById("numSubredesVLSM").value : 0);
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

    console.info("script.js inicializado (explicaciones dinámicas).");
  }); // DOMContentLoaded

  /* ----------------- NAVEGACIÓN ----------------- */
  function mostrarSeccion(tipo) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.add("oculto"));
    const bienvenida = document.getElementById("bienvenida");
    if (bienvenida) bienvenida.classList.add("oculto");
    const panel = document.getElementById("seccion-" + tipo);
    if (panel) panel.classList.remove("oculto");
  }

  /* ----------------- CALCULAR IP (y construir explicación dinámica) ----------------- */
  function calcularIP() {
    try {
      const ipRaw = document.getElementById("ipInput") ? document.getElementById("ipInput").value.trim() : "";
      if (!ipRaw) return alert("Introduce una IP (ej: 192.168.1.1 o 192.168.1.1/24)");
      let ip = ipRaw, pref;
      if (ipRaw.includes("/")) [ip, pref] = ipRaw.split("/");
      else {
        ip = ipRaw.split("/")[0];
        pref = detectarPrefijoPorClase(ip);
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

      // Mostrar tabla (resultado)
      const rows = [
        ["Dirección IPv4", ip, formatBits32(ipInt).match(/.{1,8}/g).join(".")],
        ["Máscara de red", intToIp(maskInt) + ` /${pref}`, formatBits32(maskInt).match(/.{1,8}/g).join(".")],
        ["Wildcard", intToIp(wildcard), formatBits32(wildcard).match(/.{1,8}/g).join(".")],
        ["Dirección de red", intToIp(redInt), formatBits32(redInt).match(/.{1,8}/g).join(".")],
        ["Primer host", primerHost > broadcastInt ? "N/A" : intToIp(primerHost), (primerHost > broadcastInt ? "-" : formatBits32(primerHost).match(/.{1,8}/g).join("."))],
        ["Último host", ultimoHost < redInt ? "N/A" : intToIp(ultimoHost), (ultimoHost < redInt ? "-" : formatBits32(ultimoHost).match(/.{1,8}/g).join("."))],
        ["Broadcast", intToIp(broadcastInt), formatBits32(broadcastInt).match(/.{1,8}/g).join(".")],
        ["Hosts asignables", hosts, "-"]
      ];
      let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr><th>Item</th><th>Decimal</th><th>Binario</th></tr></thead><tbody>';
      rows.forEach(r => {
        html += `<tr><td style="font-weight:700">${r[0]}</td><td>${r[1]}</td><td style="font-family:monospace">${r[2]}</td></tr>`;
      });
      html += '</tbody></table>';
      const resultadoIP = document.getElementById("resultadoIP");
      if (resultadoIP) resultadoIP.innerHTML = html;

      // --- Construir explicación dinámica (HTML) ---
      const bit32 = formatBits32(ipInt);
      const octets = bit32.match(/.{1,8}/g);
      const dottedBinary = octets.join(".");
      const networkBits = bit32.slice(0, pref);
      const hostBits = bit32.slice(pref);
      const networkGrouped = groupBits(networkBits);
      const hostGrouped = hostBits ? groupBits(hostBits) : "(0 bits)";
      const maskBin = formatBits32(maskInt);
      const wildcardBin = formatBits32(wildcard);

      let exp = `<div class="explicacion">
        <h3>📘 Explicación detallada</h3>
        <p>Una Dirección IP es un número de 32 bits que identifica un host en la red. Ejemplo (binario):</p>
        <pre style="background:transparent;border:none;color:inherit;font-family:monospace">${bit32}</pre>

        <p>Se divide en octetos (8 bits):</p>
        <pre style="font-family:monospace">${dottedBinary}</pre>

        <p>Convertido a decimal (notación punteada):</p>
        <pre style="font-family:monospace">${ip}</pre>

        <p>Prefijo: <b>/${pref}</b> — indica que los primeros <b>${pref}</b> bits son la porción de red y los últimos <b>${32 - pref}</b> la porción de host.</p>

        <p><b>Porción de red (${pref} bits):</b></p>
        <pre style="font-family:monospace">${networkGrouped || '(0 bits)'}</pre>

        <p><b>Porción de host (${32 - pref} bits):</b></p>
        <pre style="font-family:monospace">${hostGrouped}</pre>

        <hr>

        <p><b>Máscara de red</b>: ${intToIp(maskInt)} (binario: <code style="font-family:monospace">${maskBin.match(/.{1,8}/g).join(".")}</code>)</p>
        <p><b>Wildcard</b>: ${intToIp(wildcard)} (binario: <code style="font-family:monospace">${wildcardBin.match(/.{1,8}/g).join(".")}</code>)</p>

        <p><b>Cálculos:</b></p>
        <ul>
          <li>Dirección de red = IP & máscara → <b>${intToIp(redInt)}</b></li>
          <li>Broadcast = red | wildcard → <b>${intToIp(broadcastInt)}</b></li>
          <li>Primer host = red + 1 → <b>${primerHost > broadcastInt ? "N/A" : intToIp(primerHost)}</b></li>
          <li>Último host = broadcast - 1 → <b>${ultimoHost < redInt ? "N/A" : intToIp(ultimoHost)}</b></li>
          <li>Hosts asignables = 2^(bits de host) - 2 = 2^${32 - pref} - 2 = <b>${hosts}</b></li>
        </ul>

        <p>En resumen: la IP <b>${ip}/${pref}</b> pertenece a la red <b>${intToIp(redInt)}/${pref}</b> con rango de hosts <b>${primerHost > broadcastInt ? "N/A" : intToIp(primerHost)}</b> a <b>${ultimoHost < redInt ? "N/A" : intToIp(ultimoHost)}</b>.</p>
      </div>`;

      explicaciones.ip = exp;

    } catch (err) {
      console.error("Error calcularIP:", err);
      alert("Error en cálculo IP (ver consola).");
    }
  }

  /* ----------------- CALCULAR FLSM (y explicación dinámica) ----------------- */
  function calcularFLSM() {
    try {
      const red = document.getElementById("redFLSM") ? document.getElementById("redFLSM").value.trim() : "";
      let pref = document.getElementById("prefijoFLSM") ? Number(document.getElementById("prefijoFLSM").value) : NaN;
      const n = Number(document.getElementById("numSubredesFLSM") ? document.getElementById("numSubredesFLSM").value : 0);
      const hostsReq = Number(document.getElementById("hostsFLSM") ? document.getElementById("hostsFLSM").value : 0);

      if (!validarIP(red)) return alert("Red inválida");
      if (!Number.isFinite(pref)) pref = detectarPrefijoPorClase(red);
      if (!Number.isFinite(pref) || isNaN(n) || isNaN(hostsReq) || n < 1 || hostsReq < 1) return alert("Completa todos los campos");

      // bits necesarios para alojar hostsReq
      const bitsHosts = Math.ceil(Math.log2(hostsReq + 2));
      const prefSub = 32 - bitsHosts;
      if (prefSub < pref) return alert("No cabe: la subred solicitada necesita más espacio que la red base");

      const redInt = ipToInt(red) & prefixToMask(pref);
      const bloque = (1 << (32 - prefSub)) >>> 0; // direcciones por subred
      const usable = (bloque >= 2) ? (bloque - 2) : 0;
      const totalPosibles = Math.pow(2, prefSub - pref);
      if (n > totalPosibles) return alert(`No caben ${n} subredes en ${red}/${pref} (máx ${totalPosibles})`);

      // tabla de resultados
      let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr><th>#</th><th>Red</th><th>Máscara</th><th>Primer Host</th><th>Último Host</th><th>Broadcast</th></tr></thead><tbody>';
      const filasExp = [];
      for (let i = 0; i < n; i++) {
        const net = (redInt + (i * bloque)) >>> 0;
        const bcast = (net + bloque - 1) >>> 0;
        const first = (prefSub === 32 ? net : net + 1) >>> 0;
        const last = (prefSub >= 31 ? bcast : bcast - 1) >>> 0;
        html += `<tr><td style="font-weight:700">Subred ${i+1}</td><td>${intToIp(net)}/${prefSub}</td><td>${intToIp(prefixToMask(prefSub))}</td><td>${first > bcast ? 'N/A' : intToIp(first)}</td><td>${last < net ? 'N/A' : intToIp(last)}</td><td>${intToIp(bcast)}</td></tr>`;
        // detalle para explicación
        filasExp.push({
          idx: i+1,
          net, bcast, first, last
        });
      }
      html += '</tbody></table>';
      const resultadoFLSM = document.getElementById("resultadoFLSM");
      if (resultadoFLSM) resultadoFLSM.innerHTML = html;

      // explicación dinámica
      let exp = `<div class="explicacion">
        <h3>📘 Explicación FLSM</h3>
        <p>Red base: <b>${red}/${pref}</b> (máscara: ${intToIp(prefixToMask(pref))}).</p>
        <p>Se solicitan <b>${n}</b> subredes con <b>${hostsReq}</b> hosts cada una.</p>
        <ul>
          <li>Bits necesarios para hosts: ceil(log2(hosts + 2)) = ceil(log2(${hostsReq + 2})) = <b>${bitsHosts}</b> bits.</li>
          <li>Nuevo prefijo por subred = 32 - ${bitsHosts} = <b>/${prefSub}</b>.</li>
          <li>Direcciones por subred = 2^${bitsHosts} = <b>${bloque}</b> (utilizables: ${usable}).</li>
          <li>Total subredes posibles en la red base = 2^(${prefSub} - ${pref}) = <b>${totalPosibles}</b>.</li>
        </ul>
        <p>A continuación se muestran las subredes generadas (cada bloque tiene ${bloque} direcciones):</p>
        <ol>`;
      filasExp.forEach(r => {
        exp += `<li><b>Subred ${r.idx}:</b> red=${intToIp(r.net)}/${prefSub}, primer host=${r.first > r.bcast ? 'N/A' : intToIp(r.first)}, último host=${r.last < r.net ? 'N/A' : intToIp(r.last)}, broadcast=${intToIp(r.bcast)}</li>`;
      });
      exp += `</ol>
        <p>Cómo se obtiene cada subred: la dirección de red se calcula sumando los bloques de tamaño ${bloque} desde la red base. El broadcast es la última dirección del bloque.</p>
      </div>`;

      explicaciones.flsm = exp;

    } catch (err) {
      console.error("Error FLSM:", err);
      alert("Error en FLSM (ver consola).");
    }
  }

  /* ----------------- CALCULAR VLSM (y explicación dinámica) ----------------- */
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
      // ordenar descendente (greedy)
      reqs.sort((a,b) => b.hosts - a.hosts);

      const allocs = [];
      let current = baseNet;
      for (let r of reqs) {
        const bits = Math.ceil(Math.log2(r.hosts + 2)); // bits de host necesarios
        const subPref = 32 - bits;
        if (subPref < pref) return alert(`Subred ${r.id} necesita más espacio que la red base`);
        const size = (1 << bits) >>> 0; // direcciones totales
        const net = current >>> 0;
        const bcast = (net + size - 1) >>> 0;
        const first = (subPref === 32 ? net : net + 1) >>> 0;
        const last = (subPref >= 31 ? bcast : bcast - 1) >>> 0;
        allocs.push({ id: r.id, requested: r.hosts, net, bcast, first, last, pref: subPref, size });
        current = (bcast + 1) >>> 0;
      }

      // ordenar por id (orden original) para mostrar
      const allocsSortedById = allocs.slice().sort((a,b) => a.id - b.id);
      let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr><th>Subred</th><th>Hosts req</th><th>IP de red</th><th>Máscara</th><th>Prefijo</th><th>Primer Host</th><th>Último Host</th><th>Broadcast</th></tr></thead><tbody>';
      allocsSortedById.forEach((a,i) => {
        html += `<tr><td style="font-weight:700">Subred ${i+1}</td><td>${a.requested}</td><td>${intToIp(a.net)}</td><td>${intToIp(prefixToMask(a.pref))}</td><td>/${a.pref}</td><td>${intToIp(a.first)}</td><td>${intToIp(a.last)}</td><td>${intToIp(a.bcast)}</td></tr>`;
      });
      html += '</tbody></table>';
      const resultadoVLSM = document.getElementById("resultadoVLSM");
      if (resultadoVLSM) resultadoVLSM.innerHTML = html;

      // explicación dinámica
      let exp = `<div class="explicacion"><h3>📘 Explicación VLSM</h3>
        <p>Red base: <b>${red}/${pref}</b> (máscara: ${intToIp(prefixToMask(pref))}).</p>
        <p>Se ordenaron las solicitudes de hosts de mayor a menor para asignar primero las subredes más grandes (estrategia greedy).</p>
        <ol>`;
      allocs.forEach((a, idx) => {
        const usable = a.size >= 2 ? a.size - 2 : 0;
        exp += `<li><b>Solicitud ${a.id}:</b> necesita ${a.requested} hosts → bits host necesarios = ceil(log2(${a.requested + 2})) = <b>${32 - a.pref}</b> bits de host → máscara asignada /${a.pref}. 
          Esto da ${a.size} direcciones totales (${usable} utilizables). Resultado: red=${intToIp(a.net)}/${a.pref}, primer host=${intToIp(a.first)}, último host=${intToIp(a.last)}, broadcast=${intToIp(a.bcast)}.</li>`;
      });
      exp += `</ol>
        <p>Observación: asignando en orden descendente minimizamos el desperdicio de direcciones.</p>
      </div>`;

      explicaciones.vlsm = exp;

    } catch (err) {
      console.error("Error VLSM:", err);
      alert("Error en VLSM (ver consola).");
    }
  }

  /* ----------------- Mostrar / ocultar explicación ----------------- */
  function mostrarExplicacion(tipo) {
    const targetId = tipo === "ip" ? "explicacionIP" : (tipo === "flsm" ? "explicacionFLSM" : "explicacionVLSM");
    const target = document.getElementById(targetId);
    if (!target) return;
    const text = explicaciones[tipo] || "";
    if (!text) {
      target.innerHTML = `<div class="explicacion">No hay explicación generada aún. Primero pulsa "Calcular".</div>`;
      target.classList.remove("oculto");
      return;
    }
    // toggle
    if (target.classList.contains("oculto")) {
      target.innerHTML = text;
      target.classList.remove("oculto");
    } else {
      target.classList.add("oculto");
    }
  }

  /* ----------------- Reset / CSV ----------------- */
  function resetear(tipo) {
    if (tipo === "ip") {
      if (document.getElementById("ipInput")) document.getElementById("ipInput").value = "";
      if (document.getElementById("prefixInput")) document.getElementById("prefixInput").value = "";
      if (document.getElementById("resultadoIP")) document.getElementById("resultadoIP").innerHTML = "";
      if (document.getElementById("explicacionIP")) { document.getElementById("explicacionIP").innerHTML = ""; document.getElementById("explicacionIP").classList.add("oculto"); }
      explicaciones.ip = "";
    } else if (tipo === "flsm") {
      if (document.getElementById("redFLSM")) document.getElementById("redFLSM").value = "";
      if (document.getElementById("prefijoFLSM")) document.getElementById("prefijoFLSM").value = "";
      if (document.getElementById("numSubredesFLSM")) document.getElementById("numSubredesFLSM").value = "";
      if (document.getElementById("hostsFLSM")) document.getElementById("hostsFLSM").value = "";
      if (document.getElementById("resultadoFLSM")) document.getElementById("resultadoFLSM").innerHTML = "";
      if (document.getElementById("explicacionFLSM")) { document.getElementById("explicacionFLSM").innerHTML = ""; document.getElementById("explicacionFLSM").classList.add("oculto"); }
      explicaciones.flsm = "";
    } else if (tipo === "vlsm") {
      if (document.getElementById("redVLSM")) document.getElementById("redVLSM").value = "";
      if (document.getElementById("prefijoVLSM")) document.getElementById("prefijoVLSM").value = "";
      if (document.getElementById("numSubredesVLSM")) document.getElementById("numSubredesVLSM").value = "";
      if (document.getElementById("camposVLSM")) document.getElementById("camposVLSM").innerHTML = "";
      if (document.getElementById("resultadoVLSM")) document.getElementById("resultadoVLSM").innerHTML = "";
      if (document.getElementById("explicacionVLSM")) { document.getElementById("explicacionVLSM").innerHTML = ""; document.getElementById("explicacionVLSM").classList.add("oculto"); }
      explicaciones.vlsm = "";
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

  /* ----------------- Exponer funciones globales ----------------- */
  window.mostrarSeccion = mostrarSeccion;
  window.calcularIP = calcularIP;
  window.calcularFLSM = calcularFLSM;
  window.calcularVLSM = calcularVLSM;
  window.mostrarExplicacion = mostrarExplicacion;
  window.resetear = resetear;
  window.descargarCSV = descargarCSV;

})();
