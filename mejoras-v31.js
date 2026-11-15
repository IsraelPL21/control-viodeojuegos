/* ControlVideojuegos v31: bitácora de sesiones y avisos de fin. Sin servidor. */
(function () {
  'use strict';
  const LLAVE = 'controlVideojuegosV31_bitacora';
  const LLAVE_AVISOS = 'controlVideojuegosV31_avisos';
  const LLAVE_ALARMA = 'controlVideojuegosV31_alarma';
  let registros = [];
  let avisos = [];
  let audio = null;
  let audioListo = false;

  function leer(clave, fallback) {
    try { const dato = JSON.parse(localStorage.getItem(clave)); return dato === null ? fallback : dato; }
    catch (e) { console.error('No se pudo leer', clave, e); return fallback; }
  }
  function escribir(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
    catch (e) { console.error('No se pudo almacenar', clave, e); alert('⚠️ El historial no se pudo guardar. Exporta el historial y libera espacio en el dispositivo.'); return false; }
  }
  registros = leer(LLAVE, []);
  avisos = leer(LLAVE_AVISOS, []);
  if (!Array.isArray(registros)) registros = [];
  if (!Array.isArray(avisos)) avisos = [];
  function fecha(ms) { return ms && Number.isFinite(Number(ms)) ? new Date(Number(ms)).toLocaleString('es-MX', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—'; }
  function html(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function cuentaDe(id) { return cuentasJugadores.find(c => c && c.estado === 'abierta' && Number(c.estacionId) === Number(id)); }
  function estadoDe(e, cuenta) { return e.terminado ? 'Terminada' : e.activo ? 'En curso' : e.pausada ? 'Pausada' : cuenta ? 'Detenida / pendiente' : 'Cerrada'; }
  function evento(r, tipo, cuando) {
    r.eventos = Array.isArray(r.eventos) ? r.eventos : [];
    r.eventos.push({tipo: tipo, fechaMs: cuando});
    if (r.eventos.length > 50) r.eventos = r.eventos.slice(-50);
  }
  function detectarCambios() {
    const ahora = Date.now();
    let cambio = false;
    const identificadoresActivos = new Set();
    estaciones.forEach(e => {
      if (!e) return;
      const cuenta = cuentaDe(e.id);
      const existeSesion = Boolean(cuenta || e.activo || e.pausada || e.terminado || Number(e.segundos) > 0);
      if (!existeSesion) return;
      const huella = cuenta && cuenta.creadaEn ? String(cuenta.creadaEn) : '';
      let registro = registros.find(r => r.id === e.registroV31Id);
      if (registro && ((huella && registro.huellaCuenta && huella !== registro.huellaCuenta) || (registro.cerradaMs && (e.activo || e.pausada)))) registro = null;
      if (!registro) {
        const inicioCuenta = huella ? Date.parse(huella) : NaN;
        const inicioCalculado = Number(e.finalizaEn) - Number(e.duracionTotalSegundos || e.segundos) * 1000;
        const inicioMs = Number.isFinite(inicioCuenta) ? inicioCuenta : Number.isFinite(inicioCalculado) && inicioCalculado > 0 ? inicioCalculado : ahora;
        registro = {
          id: 'S-' + ahora.toString(36) + '-' + Math.random().toString(36).slice(2,8),
          estacionId: Number(e.id), nombre: String(e.nombre || 'Estación'), cliente: cuenta ? String(cuenta.cliente || 'Sin nombre') : String(e.cliente || 'Sin nombre'),
          huellaCuenta: huella, cuentaId: cuenta ? cuenta.id : null,
          inicioMs, finPrevistoMs: Number(e.finalizaEn || e.ultimoFinProgramadoV31) || null,
          finRealMs: e.terminado && e.ultimoFinProgramadoV31 ? Number(e.ultimoFinProgramadoV31) : null,
          cerradaMs: null,
          minutos: Number(cuenta && cuenta.game && cuenta.game.minutos) || Math.ceil(Number(e.duracionTotalSegundos || e.segundos) / 60),
          precioJuego: Number(cuenta && cuenta.game && cuenta.game.precio) || 0,
          totalPendiente: cuenta ? Math.round(obtenerTotalCuenta(cuenta) * 100) / 100 : 0,
          estado: estadoDe(e, cuenta), eventos: []
        };
        evento(registro,'Inició sesión',inicioMs);
        registros.push(registro);
        e.registroV31Id = registro.id;
        cambio = true;
      }
      identificadoresActivos.add(registro.id);
      const nuevoEstado = estadoDe(e, cuenta);
      const nuevosMinutos = Number(cuenta && cuenta.game && cuenta.game.minutos) || Math.ceil(Number(e.duracionTotalSegundos || e.segundos) / 60);
      const nuevoPrecio = Number(cuenta && cuenta.game && cuenta.game.precio) || 0;
      const nuevoFin = e.activo && e.finalizaEn ? Number(e.finalizaEn) : null;
      const nuevoTotal = cuenta ? Math.round(obtenerTotalCuenta(cuenta) * 100) / 100 : 0;
      if (!nuevoFin && e.pausada && registro.finPrevistoMs) {
        evento(registro, 'Pausa; anterior fin previsto: ' + fecha(registro.finPrevistoMs), ahora);
        registro.finPrevistoMs = null;
        cambio = true;
      }
      if (nuevoFin && Math.abs((registro.finPrevistoMs || 0) - nuevoFin) > 1500) {
        evento(registro, 'Nuevo fin previsto: ' + fecha(nuevoFin), ahora);
        registro.finPrevistoMs = nuevoFin;
        cambio = true;
      }
      if (nuevosMinutos !== registro.minutos || Math.abs(nuevoPrecio - registro.precioJuego) > 0.001) { registro.minutos = nuevosMinutos; registro.precioJuego = nuevoPrecio; evento(registro, 'Tiempo contratado: ' + nuevosMinutos + ' min; importe juego $' + nuevoPrecio.toFixed(2), ahora); cambio = true; }
      if (nuevoEstado !== registro.estado) {
        registro.estado = nuevoEstado;
        evento(registro,nuevoEstado,ahora);
        if (nuevoEstado === 'Terminada' && !registro.finRealMs) registro.finRealMs = registro.finPrevistoMs && registro.finPrevistoMs <= ahora ? registro.finPrevistoMs : ahora;
        cambio = true;
      }
      if (registro.nombre !== String(e.nombre) || registro.cliente !== String(cuenta ? cuenta.cliente : e.cliente || 'Sin nombre') || registro.totalPendiente !== nuevoTotal) {
        registro.nombre = String(e.nombre); registro.cliente = String(cuenta ? cuenta.cliente : e.cliente || 'Sin nombre'); registro.totalPendiente = nuevoTotal; cambio = true;
      }
    });
    for (const r of registros) {
      if (r.cerradaMs || identificadoresActivos.has(r.id)) continue;
      if (r.estado !== 'Terminada' && r.estado !== 'Cerrada') r.estado = 'Cerrada';
      r.cerradaMs = ahora;
      if (!r.finRealMs) r.finRealMs = ahora;
      evento(r,'Cuenta retirada de estación',ahora);
      cambio = true;
    }
    if (cambio) {
      if (registros.length > 2000) registros = registros.slice(-2000);
      escribir(LLAVE, registros);
    }
    return cambio;
  }

  const guardarAnterior = guardarDatos;
  guardarDatos = function () { detectarCambios(); const expiraron = estaciones.filter(e => e && e.activo && e.finalizaEn && Number(e.finalizaEn) <= Date.now()).map(e => e.id); const resultado = guardarAnterior.apply(this, arguments); detectarCambios(); expiraron.forEach(notificarFin); return resultado; };
  const actualizarAnterior = actualizarTiempos;
  actualizarTiempos = function () { const expiraron = estaciones.filter(e => e && e.activo && e.finalizaEn && Number(e.finalizaEn) <= Date.now()).map(e => e.id); const resultado = actualizarAnterior.apply(this, arguments); detectarCambios(); expiraron.forEach(notificarFin); return resultado; };
  function notificarFin(id) {
    const e = estaciones.find(item => Number(item.id) === Number(id));
    if (!e) return;
    detectarCambios();
    const r = registros.find(item => item.id === e.registroV31Id);
    if (!r || avisos.some(a => a.registroId === r.id)) return;
    avisos.push({ registroId:r.id, estacion:String(e.nombre), fechaMs:Date.now(), atendido:false });
    escribir(LLAVE_AVISOS, avisos);
    sonar();
    if (vistaActual === 'inicio' && sesionUsuarioIniciadaPro) mostrarEstaciones();
  }
  function audioDisponible() {
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) return false;
    if (!audio) audio = new Constructor();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    audioListo = true;
    return true;
  }
  function sonar() {
    if (localStorage.getItem(LLAVE_ALARMA) !== 'si' || !audioListo || !audio) return;
    try {
      const t = audio.currentTime + .04;
      [784,988,784,988,1175,988].forEach((frecuencia,i) => {
        const osc=audio.createOscillator(), volumen=audio.createGain(), comienzo=t+i*.28;
        osc.type='sine'; osc.frequency.value=frecuencia;
        volumen.gain.setValueAtTime(.0001,comienzo);
        volumen.gain.exponentialRampToValueAtTime(.22,comienzo+.035);
        volumen.gain.exponentialRampToValueAtTime(.0001,comienzo+.23);
        osc.connect(volumen); volumen.connect(audio.destination);
        osc.start(comienzo); osc.stop(comienzo+.25);
      });
    } catch(e) { console.warn('No se pudo emitir alarma', e); }
  }
  window.activarAlarmaV31 = function () {
    if (!audioDisponible()) { alert('Este navegador no admite esta alarma.'); return; }
    localStorage.setItem(LLAVE_ALARMA,'si');
    sonar();
    alert('🔔 Alarma activada. Mantén el volumen del iPad encendido. Si Safari se cierra por completo, el sonido se reproducirá solamente al volver a abrir la aplicación, si iOS lo permite.');
    if (vistaActual === 'inicio') mostrarEstaciones();
  };
  document.addEventListener('pointerdown', function () {
    if (localStorage.getItem(LLAVE_ALARMA) === 'si' && !audioListo) audioDisponible();
  }, {capture:true});
  window.atenderAvisoV31 = function (id) {
    const aviso = avisos.find(a => a.registroId === id);
    if (aviso) { aviso.atendido = true; escribir(LLAVE_AVISOS, avisos); }
    if (vistaActual === 'inicio') mostrarEstaciones();
  };
  const mostrarAntes = mostrarEstaciones;
  mostrarEstaciones = function () {
    const resultado = mostrarAntes.apply(this, arguments);
    if (vistaActual !== 'inicio' || !sesionUsuarioIniciadaPro) return resultado;
    const contenedor = document.getElementById('estaciones');
    if (!contenedor) return resultado;
    const panel = document.createElement('section');
    panel.id = 'panelBitacoraV31';
    panel.style.cssText = 'margin:12px 0;padding:13px;border:1px solid #64748b;border-radius:12px;background:#182536;color:white';
    const pendientes = avisos.filter(a => !a.atendido);
    panel.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><button onclick="mostrarBitacoraV31()">📒 Historial de sesiones</button><button onclick="activarAlarmaV31()">🔔 Activar / probar alarma</button><span style="font-size:12px">Versión 31.1 · Registros: '+registros.length+' · '+(audioListo?'Alarma lista':'Toca activar alarma después de abrir la app')+'</span></div>';
    pendientes.slice(-4).forEach(a => {
      const linea = document.createElement('div');
      linea.style.cssText='background:#7f1d1d;color:#fff;padding:10px;margin-top:8px;border-radius:9px';
      linea.append(document.createTextNode('🔴 TERMINÓ '+a.estacion+' · '+fecha(a.fechaMs)+' '));
      const boton=document.createElement('button'); boton.textContent='Entendido'; boton.addEventListener('click',()=>window.atenderAvisoV31(a.registroId)); linea.appendChild(boton); panel.appendChild(linea);
    });
    contenedor.prepend(panel);
    return resultado;
  };
  window.mostrarBitacoraV31 = function () {
    if (!exigirPermisoPro('reportes')) return;
    detectarCambios();
    vistaActual = 'bitacoraV31';
    const contenedor = document.getElementById('estaciones');
    contenedor.innerHTML='';
    const cabecera=document.createElement('div');
    cabecera.innerHTML='<h1>📒 Historial de sesiones</h1><p>Fechas y horas del dispositivo. Las sesiones siguen registradas después de cerrar la app.</p><button onclick="exportarBitacoraV31()">📥 Exportar CSV</button> <button onclick="volverInicio()">⬅ Inicio</button>';
    contenedor.appendChild(cabecera);
    const lista = document.createElement('div');
    registros.slice().reverse().forEach(r=>{
      const tarjeta=document.createElement('details'); tarjeta.style.cssText='margin:10px 0;padding:12px;background:#182536;color:#fff;border-radius:12px;border:1px solid #64748b';
      tarjeta.innerHTML='<summary style="cursor:pointer;font-weight:bold">'+html(r.nombre)+' · '+html(r.estado)+' · '+fecha(r.inicioMs)+'</summary><p>👤 '+html(r.cliente)+'</p><p>▶️ Inicio: '+fecha(r.inicioMs)+'</p><p>⏰ Fin previsto: '+fecha(r.finPrevistoMs)+'</p><p>🏁 Fin registrado: '+fecha(r.finRealMs)+'</p><p>⏱️ Minutos contratados: '+Number(r.minutos||0)+'</p><p>💰 Importe juego: $'+Number(r.precioJuego||0).toFixed(2)+' · Pendiente al último registro: $'+Number(r.totalPendiente||0).toFixed(2)+'</p><p>📝 Movimientos: '+(r.eventos||[]).map(ev=>html(ev.tipo)+' ('+fecha(ev.fechaMs)+')').join(' · ')+'</p>';
      lista.appendChild(tarjeta);
    });
    if (!registros.length) lista.textContent='Todavía no hay sesiones registradas.';
    contenedor.appendChild(lista);
  };
  window.exportarBitacoraV31 = function () {
    const columnas=['ID','Estación','Cliente','Inicio','Fin previsto','Fin real','Estado','Minutos','Precio juego','Pendiente'];
    const filas=[columnas,...registros.map(r=>[r.id,r.nombre,r.cliente,fecha(r.inicioMs),fecha(r.finPrevistoMs),fecha(r.finRealMs),r.estado,r.minutos,r.precioJuego,r.totalPendiente])];
    const csv='\ufeff'+filas.map(f=>f.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='sesiones-videojuegos-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  };
  document.addEventListener('visibilitychange',function(){ if (document.visibilityState === 'visible') { actualizarTiempos(); detectarCambios(); } });
  window.addEventListener('pageshow',function(){ actualizarTiempos(); detectarCambios(); });
  if (detectarCambios()) guardarAnterior();
  estaciones.filter(e=>e && e.terminado && cuentaDe(e.id)).forEach(e => {
    const r=registros.find(item=>item.id===e.registroV31Id);
    if (r && r.estado === 'Terminada' && !avisos.some(a=>a.registroId===r.id)) notificarFin(e.id);
  });
  if (vistaActual === 'inicio' && sesionUsuarioIniciadaPro) mostrarEstaciones();
})();