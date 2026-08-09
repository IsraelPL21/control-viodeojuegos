// ========================================
// CONTROL DE VIDEOJUEGOS - VERSION 29.24
// RESERVAS PRO
// ========================================

let configuracion = {
    // Mantiene "precios" por compatibilidad con versiones anteriores.
    // "tarifas" es la nueva fuente para duración + precio.
    precios: {
        treintaMin: 15,
        unaHora: 30,
        dosHoras: 60,
        tresHoras: 70
    },
    tarifas: [
        { id: "T1", minutos: 30, precio: 15 },
        { id: "T2", minutos: 60, precio: 30 },
        { id: "T3", minutos: 120, precio: 60 },
        { id: "T4", minutos: 180, precio: 70 }
    ],
    avisoMinutos: 10,
    bloqueoInactividadMinutos: 30,
    promociones: {
        descuentoClienteFrecuente: 10,
        sesionesParaDescuento: 5
    }
};

let estaciones = [
    { id: 1, nombre: "Xbox 1", tipo: "Xbox", habilitada: true, segundos: 0, activo: false, finalizaEn: null, terminado: false, cliente: "", precioSesion: 0, metodoPagoSesion: "", duracionTotalSegundos: 0, inicioSesion: null, avisoMostrado: false },
    { id: 2, nombre: "Xbox 2", tipo: "Xbox", habilitada: true, segundos: 0, activo: false, finalizaEn: null, terminado: false, cliente: "", precioSesion: 0, metodoPagoSesion: "", duracionTotalSegundos: 0, inicioSesion: null, avisoMostrado: false },
    { id: 3, nombre: "Xbox 3", tipo: "Xbox", habilitada: true, segundos: 0, activo: false, finalizaEn: null, terminado: false, cliente: "", precioSesion: 0, metodoPagoSesion: "", duracionTotalSegundos: 0, inicioSesion: null, avisoMostrado: false }
];

let ventasDelDia = 0;
let sesionesDelDia = 0;
let historial = [];
let gastos = [];
let gastosDelDia = 0;
let reportes = [];
let cierresCaja = [];
let cajaCerrada = false;
let estadoCaja = "abierta"; // pendiente | abierta | cerrada
let fechaCaja = null;
let fondoCajaInicial = 0;
let movimientosCaja = [];

let cajaAperturaUsuario = "";
let cajaAperturaHora = "";
let cajaCierreUsuario = "";
let cajaCierreHora = "";
let cajaUltimaReaperturaUsuario = "";
let cajaUltimaReaperturaHora = "";
let vistaActual = "inicio";

let contadorTicketPro = 0;
let fechaContadorTicketPro = ""; 

let ventasPorMetodo = {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
};

let reservas = [];
let usuariosPro = [];
let registroActividadPro = [];
let usuarioActualPro = null;
let sesionUsuarioIniciadaPro = false;
let ultimaActividadSeguridadPro = Date.now();
let bloqueoAutomaticoEnCursoPro = false;
let cobroCuentaEnProcesoId = null;


let cuentasJugadores = [];
let clientesMembresia = [];
let historialCortes = [];
let estadisticasDia = {
    fecha: "",
    ventasJuegos: 0,
    ventasProductos: 0,
    totalVentas: 0,
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    clientes: 0,
    tickets: 0,
    minutosJugados: 0,
    puntosOtorgados: 0,
    productosVendidos: 0
};

let movimientosInventario = [];

let productos = [
    {
        id: 1,
        nombre: "Agua",
        precio: 15,
        costo: 8,
        stock: 20,
        stockMinimo: 5,
        activo: true
    },
    {
        id: 2,
        nombre: "Refresco",
        precio: 20,
        costo: 12,
        stock: 20,
        stockMinimo: 5,
        activo: true
    },
    {
        id: 3,
        nombre: "Papas",
        precio: 18,
        costo: 11,
        stock: 20,
        stockMinimo: 5,
        activo: true
    },
    {
        id: 4,
        nombre: "Dulce",
        precio: 10,
        costo: 5,
        stock: 20,
        stockMinimo: 5,
        activo: true
    }
];



// ========================================
// TARIFAS CONFIGURABLES
// ========================================

function tarifasPredeterminadasPro() {
    return [
        { id: "T1", minutos: 30, precio: 15 },
        { id: "T2", minutos: 60, precio: 30 },
        { id: "T3", minutos: 120, precio: 60 },
        { id: "T4", minutos: 180, precio: 70 }
    ];
}

function formatearDuracionTarifa(minutos) {
    const total =
        Math.max(
            1,
            Math.floor(
                Number(minutos) || 0
            )
        );

    const horas =
        Math.floor(total / 60);

    const resto =
        total % 60;

    if (horas === 0) {
        return total + " min";
    }

    if (resto === 0) {
        return horas === 1
            ? "1 hora"
            : horas + " horas";
    }

    return horas + " h " + resto + " min";
}

function normalizarListaTarifasPro(lista) {
    const entrada =
        Array.isArray(lista)
            ? lista
            : tarifasPredeterminadasPro();

    const salida = [];

    entrada.forEach(function(item, indice) {
        const minutos =
            Math.floor(
                Number(
                    item &&
                    item.minutos
                ) || 0
            );

        const precio =
            Number(
                item &&
                item.precio
            );

        if (
            minutos < 1 ||
            minutos > 1440 ||
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            return;
        }

        if (
            salida.some(function(existente) {
                return existente.minutos === minutos;
            })
        ) {
            return;
        }

        salida.push({
            id:
                String(
                    item.id ||
                    (
                        "T" +
                        (indice + 1)
                    )
                ),
            minutos: minutos,
            precio:
                Math.round(
                    precio * 100
                ) / 100
        });
    });

    if (salida.length === 0) {
        return tarifasPredeterminadasPro();
    }

    salida.sort(function(a, b) {
        return a.minutos - b.minutos;
    });

    salida.forEach(function(item, indice) {
        item.id = "T" + (indice + 1);
    });

    return salida;
}

function obtenerTarifasConfiguracion() {
    configuracion.tarifas =
        normalizarListaTarifasPro(
            configuracion.tarifas
        );

    return configuracion.tarifas;
}

function sincronizarPreciosCompatibilidadPro() {
    const tarifas =
        obtenerTarifasConfiguracion();

    const precioPorMinutos =
        function(minutos, respaldo) {
            const encontrada =
                tarifas.find(function(item) {
                    return Number(item.minutos) ===
                        Number(minutos);
                });

            return encontrada
                ? Number(encontrada.precio) || 0
                : Number(respaldo) || 0;
        };

    configuracion.precios = {
        treintaMin:
            precioPorMinutos(
                30,
                configuracion.precios &&
                configuracion.precios.treintaMin
            ),
        unaHora:
            precioPorMinutos(
                60,
                configuracion.precios &&
                configuracion.precios.unaHora
            ),
        dosHoras:
            precioPorMinutos(
                120,
                configuracion.precios &&
                configuracion.precios.dosHoras
            ),
        tresHoras:
            precioPorMinutos(
                180,
                configuracion.precios &&
                configuracion.precios.tresHoras
            )
    };
}

function tarifaPorMinutosPro(precios, minutos) {
    const lista =
        precios &&
        Array.isArray(precios.lista)
            ? precios.lista
            : obtenerTarifasConfiguracion();

    const exacta =
        lista.find(function(item) {
            return Number(item.minutos) ===
                Number(minutos);
        });

    if (exacta) {
        return Number(exacta.precio) || 0;
    }

    // Si no existe una tarifa exacta, conservamos el
    // comportamiento anterior: prorratear desde 30 minutos.
    const base =
        lista.find(function(item) {
            return Number(item.minutos) === 30;
        });

    return (
        Number(
            base
                ? base.precio
                : 0
        ) || 0
    ) *
    (
        Number(minutos) / 30
    );
}

function listaTarifasEstacionPro(estacion) {
    const globales =
        obtenerTarifasConfiguracion();

    if (
        estacion &&
        estacion.preciosPersonalizados
    ) {
        const personalizados =
            estacion.preciosPersonalizados;

        if (
            Array.isArray(
                personalizados.tarifas
            )
        ) {
            return normalizarListaTarifasPro(
                personalizados.tarifas
            );
        }

        // Migración transparente de las tarifas antiguas
        // por estación.
        const preciosViejos = [
            Number(personalizados.treintaMin),
            Number(personalizados.unaHora),
            Number(personalizados.dosHoras),
            Number(personalizados.tresHoras)
        ];

        return normalizarListaTarifasPro(
            globales.map(function(item, indice) {
                return {
                    id: item.id,
                    minutos: item.minutos,
                    precio:
                        Number.isFinite(
                            preciosViejos[indice]
                        )
                            ? preciosViejos[indice]
                            : item.precio
                };
            })
        );
    }

    return globales.map(function(item) {
        return {
            id: item.id,
            minutos: item.minutos,
            precio: item.precio
        };
    });
}

function construirPreciosCompatiblesPro(lista) {
    const normalizada =
        normalizarListaTarifasPro(
            lista
        );

    const precioDe =
        function(minutos) {
            const tarifa =
                normalizada.find(function(item) {
                    return Number(item.minutos) ===
                        Number(minutos);
                });

            return tarifa
                ? Number(tarifa.precio) || 0
                : 0;
        };

    return {
        lista: normalizada,
        treintaMin: precioDe(30),
        unaHora: precioDe(60),
        dosHoras: precioDe(120),
        tresHoras: precioDe(180)
    };
}

// ========================================
// ESTACIONES DINAMICAS
// ========================================

function iconoTipoEstacion(tipo) {
    const valor = String(tipo || "Xbox").toLowerCase();

    if (valor === "pc") {
        return "🖥️";
    }

    if (valor === "playstation") {
        return "🎮";
    }

    if (valor === "otra") {
        return "🕹️";
    }

    return "🎮";
}

function obtenerEstacionesDisponibles() {
    return estaciones.filter(function(estacion) {
        return estacion.habilitada !== false;
    });
}

function siguienteIdEstacion() {
    if (estaciones.length === 0) {
        return 1;
    }

    return Math.max.apply(
        null,
        estaciones.map(function(estacion) {
            return Number(estacion.id) || 0;
        })
    ) + 1;
}

function normalizarEstaciones() {
    if (!Array.isArray(estaciones)) {
        estaciones = [];
    }

    estaciones.forEach(function(estacion, indice) {
        if (typeof estacion.id === "undefined") {
            estacion.id = indice + 1;
        }

        if (!estacion.nombre) {
            estacion.nombre =
                "Estación " +
                estacion.id;
        }

        if (!estacion.tipo) {
            estacion.tipo =
                /pc/i.test(estacion.nombre)
                    ? "PC"
                    : "Xbox";
        }

        if (
            typeof estacion.habilitada ===
            "undefined"
        ) {
            estacion.habilitada = true;
        }

        if (
            typeof estacion.usarPreciosPersonalizados ===
            "undefined"
        ) {
            estacion.usarPreciosPersonalizados =
                false;
        }

        if (
            !estacion.preciosPersonalizados
        ) {
            estacion.preciosPersonalizados = {
                tarifas:
                    obtenerTarifasConfiguracion()
                        .map(function(item) {
                            return {
                                id: item.id,
                                minutos: item.minutos,
                                precio: item.precio
                            };
                        })
            };
        } else if (
            !Array.isArray(
                estacion
                    .preciosPersonalizados
                    .tarifas
            )
        ) {
            estacion.preciosPersonalizados = {
                tarifas:
                    listaTarifasEstacionPro(
                        estacion
                    )
            };
        } else {
            estacion.preciosPersonalizados.tarifas =
                normalizarListaTarifasPro(
                    estacion
                        .preciosPersonalizados
                        .tarifas
                );
        }
    });

    if (estaciones.length === 0) {
        estaciones = [
            {
                id: 1,
                nombre: "Xbox 1",
                tipo: "Xbox",
                habilitada: true,
                segundos: 0,
                activo: false,
                finalizaEn: null,
                terminado: false,
                cliente: "",
                precioSesion: 0,
                metodoPagoSesion: "",
                duracionTotalSegundos: 0,
                inicioSesion: null,
                avisoMostrado: false,
                usarPreciosPersonalizados: false,
                preciosPersonalizados: {
                    tarifas:
                        obtenerTarifasConfiguracion()
                            .map(function(item) {
                                return {
                                    id: item.id,
                                    minutos: item.minutos,
                                    precio: item.precio
                                };
                            })
                }
            }
        ];
    }
}


function obtenerEstacionPorId(id) {
    return estaciones.find(function(estacion) {
        return Number(estacion.id) === Number(id);
    });
}

function crearEstacion() {
    const nombre = prompt(
        "Nombre de la nueva estación:\n\n" +
        "Ejemplo: Xbox 4, PC 1, PC 2"
    );

    if (!nombre || !nombre.trim()) {
        return;
    }

    const tipoTexto = prompt(
        "Tipo de estación:\n\n" +
        "1 = 🎮 Xbox\n" +
        "2 = 🖥️ PC\n" +
        "3 = 🎮 PlayStation\n" +
        "4 = 🕹️ Otra"
    );

    if (tipoTexto === null) {
        return;
    }

    const tipos = {
        "1": "Xbox",
        "2": "PC",
        "3": "PlayStation",
        "4": "Otra"
    };

    const tipo = tipos[String(tipoTexto).trim()];

    if (!tipo) {
        alert("❌ Selecciona un tipo válido.");
        return;
    }

    estaciones.push({
        id: siguienteIdEstacion(),
        nombre: nombre.trim(),
        tipo: tipo,
        habilitada: true,
        segundos: 0,
        activo: false,
        finalizaEn: null,
        terminado: false,
        pausada: false,
        cliente: "",
        precioSesion: 0,
        metodoPagoSesion: "",
        duracionTotalSegundos: 0,
        inicioSesion: null,
        avisoMostrado: false,
        usarPreciosPersonalizados: false,
        preciosPersonalizados: {
            tarifas:
                obtenerTarifasConfiguracion()
                    .map(function(item) {
                        return {
                            id: item.id,
                            minutos: item.minutos,
                            precio: item.precio
                        };
                    })
        }
    });

    guardarDatos();
    mostrarAdministrarEstaciones();

    alert(
        "✅ Estación agregada.\n\n" +
        iconoTipoEstacion(tipo) +
        " " + nombre.trim()
    );
}

function editarEstacion(id) {
    const estacion = obtenerEstacionPorId(id);

    if (!estacion) {
        return;
    }

    if (estacion.activo) {
        alert(
            "⚠️ No puedes editar una estación mientras está jugando.\n\n" +
            "Detén la sesión primero."
        );
        return;
    }

    const nombre = prompt(
        "Nombre de la estación:",
        estacion.nombre
    );

    if (nombre === null || !nombre.trim()) {
        return;
    }

    const tipoTexto = prompt(
        "Tipo de estación:\n\n" +
        "1 = 🎮 Xbox\n" +
        "2 = 🖥️ PC\n" +
        "3 = 🎮 PlayStation\n" +
        "4 = 🕹️ Otra",
        estacion.tipo === "Xbox"
            ? "1"
            : estacion.tipo === "PC"
                ? "2"
                : estacion.tipo === "PlayStation"
                    ? "3"
                    : "4"
    );

    if (tipoTexto === null) {
        return;
    }

    const tipos = {
        "1": "Xbox",
        "2": "PC",
        "3": "PlayStation",
        "4": "Otra"
    };

    const tipo = tipos[String(tipoTexto).trim()];

    if (!tipo) {
        alert("❌ Selecciona un tipo válido.");
        return;
    }

    estacion.nombre = nombre.trim();
    estacion.tipo = tipo;

    guardarDatos();
    mostrarAdministrarEstaciones();
}

function cambiarHabilitadaEstacion(id) {
    const estacion = obtenerEstacionPorId(id);

    if (!estacion) {
        return;
    }

    if (estacion.activo) {
        alert(
            "⚠️ No puedes ocultar una estación mientras está jugando.\n\n" +
            "Detén la sesión primero."
        );
        return;
    }

    if (estacion.habilitada !== false) {
        const tieneReserva = reservas.some(function(reserva) {
            const reservaId =
                Number(
                    reserva.estacionId ||
                    reserva.xboxId
                );

            return (
                reserva.estado === "pendiente" &&
                reservaId === Number(estacion.id)
            );
        });

        if (tieneReserva) {
            const continuar = confirm(
                "⚠️ Esta estación tiene reservas pendientes.\n\n" +
                "Si la ocultas, ya no se podrá crear nuevas reservas para ella, " +
                "pero las reservas existentes permanecerán en la agenda.\n\n" +
                "¿Continuar?"
            );

            if (!continuar) {
                return;
            }
        }
    }

    estacion.habilitada =
        estacion.habilitada === false;

    guardarDatos();
    mostrarAdministrarEstaciones();
}

function obtenerPreciosEstacion(estacion) {
    return construirPreciosCompatiblesPro(
        listaTarifasEstacionPro(
            estacion
        )
    );
}

function editarPreciosEstacion(id) {
    const estacion =
        obtenerEstacionPorId(id);

    if (!estacion) {
        return;
    }

    if (estacion.activo) {
        alert(
            "⚠️ No puedes cambiar la tarifa mientras la estación está jugando."
        );
        return;
    }

    const globales =
        obtenerTarifasConfiguracion();

    const actuales =
        listaTarifasEstacionPro(
            estacion
        );

    const tarifasNuevas = [];

    for (
        let indice = 0;
        indice < globales.length;
        indice++
    ) {
        const global =
            globales[indice];

        const actual =
            actuales.find(function(item) {
                return Number(item.minutos) ===
                    Number(global.minutos);
            });

        const precio =
            Number(
                prompt(
                    formatearDuracionTarifa(
                        global.minutos
                    ) +
                    " - precio:",
                    actual
                        ? actual.precio
                        : global.precio
                )
            );

        if (
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            alert(
                "❌ Una o más tarifas no son válidas."
            );
            return;
        }

        tarifasNuevas.push({
            id: global.id,
            minutos: global.minutos,
            precio: precio
        });
    }

    const modo =
        confirm(
            "💰 TARIFA DE " +
            estacion.nombre +
            "\n\n" +
            "Aceptar = usar estas tarifas personalizadas.\n" +
            "Cancelar = usar las tarifas generales."
        );

    if (!modo) {
        estacion.usarPreciosPersonalizados =
            false;
        guardarDatos();
        mostrarAdministrarEstaciones();
        return;
    }

    estacion.usarPreciosPersonalizados =
        true;

    estacion.preciosPersonalizados = {
        tarifas:
            normalizarListaTarifasPro(
                tarifasNuevas
            )
    };

    guardarDatos();
    mostrarAdministrarEstaciones();

    alert(
        "✅ Tarifas guardadas para " +
        estacion.nombre +
        "."
    );
}


function mostrarAdministrarEstaciones() {
    if (!exigirPermisoPro("configuracion")) {
        return;
    }

    vistaActual = "administrar_estaciones";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div = document.createElement("div");

    let html =
        "<h1>🎮 Administrar estaciones</h1>" +
        "<p>Agrega Xbox, PC u otros equipos sin modificar el programa.</p>" +

        "<button onclick='crearEstacion()'>" +
        "➕ Agregar estación" +
        "</button>" +

        "<button onclick='mostrarConfiguracion()'>" +
        "⚙️ Configuración" +
        "</button>" +

        "<button onclick='volverInicio()'>" +
        "🏠 Inicio" +
        "</button>" +

        "<hr>";

    if (estaciones.length === 0) {
        html +=
            "<p>No hay estaciones configuradas.</p>";
    }

    estaciones.forEach(function(estacion) {
        const habilitada =
            estacion.habilitada !== false;

        const estado = estacion.activo
            ? "🟢 Jugando"
            : habilitada
                ? "⚪ Disponible"
                : "⚫ Deshabilitada";

        html +=
            "<div style='" +
            "margin-bottom:12px;" +
            "padding:16px;" +
            "border-radius:16px;" +
            "background:rgba(255,255,255,.05);" +
            "border:1px solid rgba(255,255,255,.10);" +
            "'>" +

            "<h2 style='margin-top:0;'>" +
            iconoTipoEstacion(estacion.tipo) +
            " " +
            escaparHTML(estacion.nombre) +
            "</h2>" +

            "<p>Tipo: <strong>" +
            escaparHTML(estacion.tipo || "Xbox") +
            "</strong> · Estado: <strong>" +
            estado +
            "</strong></p>" +

            "<p>💰 Tarifa: <strong>" +
            (
                estacion.usarPreciosPersonalizados
                    ? "Personalizada"
                    : "General"
            ) +
            "</strong></p>" +

            "<button onclick='editarEstacion(" +
            estacion.id +
            ")'>✏️ Editar</button>" +

            "<button onclick='editarPreciosEstacion(" +
            estacion.id +
            ")'>💰 Tarifas</button>" +

            "<button onclick='cambiarHabilitadaEstacion(" +
            estacion.id +
            ")'>" +
            (
                habilitada
                    ? "🗃️ Deshabilitar"
                    : "↩️ Habilitar"
            ) +
            "</button>" +

            "</div>";
    });

    div.innerHTML = html;
    contenedor.appendChild(div);
}


// ========================================
// FECHA / HORA
// ========================================

function obtenerFecha() {
    const fecha = new Date();

    return fecha.getFullYear() + "-" +
        String(fecha.getMonth() + 1).padStart(2, "0") + "-" +
        String(fecha.getDate()).padStart(2, "0");
}

function obtenerFechaBonita(fechaTexto) {
    const partes = fechaTexto.split("-");

    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function obtenerHora() {
    const fecha = new Date();

    return String(fecha.getHours()).padStart(2, "0") +
        ":" +
        String(fecha.getMinutes()).padStart(2, "0");
}


// ========================================
// GUARDAR / CARGAR
// ========================================

function sincronizarTemporizadoresPersistidos() {
    const ahora = Date.now();

    if (!Array.isArray(estaciones)) {
        return;
    }

    estaciones.forEach(function(estacion) {
        if (
            estacion &&
            estacion.activo === true &&
            estacion.finalizaEn
        ) {
            const restante =
                Number(estacion.finalizaEn) - ahora;

            if (restante <= 0) {
                estacion.segundos = 0;
                estacion.activo = false;
                estacion.finalizaEn = null;
                estacion.terminado = true;
                estacion.pausada = false;
            } else {
                estacion.segundos =
                    Math.ceil(restante / 1000);
            }
        }
    });
}

function guardarDatos() {
    sincronizarTemporizadoresPersistidos();

    const datos = {
        estaciones,
        configuracion,
        ventasDelDia,
        sesionesDelDia,
        historial,
        gastos,
        gastosDelDia,
        reportes,
        cierresCaja,
        cajaCerrada,
        estadoCaja,
        fechaCaja,
        fondoCajaInicial,
        movimientosCaja,
        cajaAperturaUsuario,
        cajaAperturaHora,
        cajaCierreUsuario,
        cajaCierreHora,
        cajaUltimaReaperturaUsuario,
        cajaUltimaReaperturaHora,
        contadorTicketPro,
        fechaContadorTicketPro,
        ventasPorMetodo,
        productos,
        movimientosInventario,
        reservas,
        usuariosPro,
        registroActividadPro,
        cuentasJugadores,
        clientesMembresia,
        configuracionMembresia,
        estadisticasDia,
        historialCortes,
        fecha: obtenerFecha()
    };

    localStorage.setItem(
        "controlVideojuegosV6",
        JSON.stringify(datos)
    );
}

function cargarDatos() {
    let guardado = localStorage.getItem("controlVideojuegosV6");

    if (!guardado) {
        guardado = localStorage.getItem("controlVideojuegos");
    }

    if (!guardado) {
        return;
    }

    let datos;

    try {
        datos = JSON.parse(guardado);
    } catch (error) {
        console.error(
            "No se pudo leer el almacenamiento local:",
            error
        );

        try {
            localStorage.setItem(
                "controlVideojuegosV6_corrupto_" +
                Date.now(),
                guardado
            );
        } catch (backupError) {
            console.error(
                "No se pudo respaldar el almacenamiento corrupto:",
                backupError
            );
        }

        return;
    }

    if (Array.isArray(datos.usuariosPro)) {
        usuariosPro = datos.usuariosPro;
    }

    if (Array.isArray(datos.registroActividadPro)) {
        registroActividadPro =
            datos.registroActividadPro;
    }


    if (datos.configuracion) {
        configuracion = datos.configuracion;
    }

    if (!configuracion.precios) {
        configuracion.precios = {
            treintaMin: 15,
            unaHora: 30,
            dosHoras: 60,
            tresHoras: 70
        };
    }

    if (
        !Array.isArray(
            configuracion.tarifas
        )
    ) {
        configuracion.tarifas = [
            {
                id: "T1",
                minutos: 30,
                precio:
                    Number(
                        configuracion.precios.treintaMin
                    ) || 0
            },
            {
                id: "T2",
                minutos: 60,
                precio:
                    Number(
                        configuracion.precios.unaHora
                    ) || 0
            },
            {
                id: "T3",
                minutos: 120,
                precio:
                    Number(
                        configuracion.precios.dosHoras
                    ) || 0
            },
            {
                id: "T4",
                minutos: 180,
                precio:
                    Number(
                        configuracion.precios.tresHoras
                    ) || 0
            }
        ];
    }

    configuracion.tarifas =
        normalizarListaTarifasPro(
            configuracion.tarifas
        );

    sincronizarPreciosCompatibilidadPro();

    if (
        typeof configuracion.avisoMinutos === "undefined" ||
        Number(configuracion.avisoMinutos) < 1
    ) {
        configuracion.avisoMinutos = 10;
    }

    if (
        typeof configuracion.bloqueoInactividadMinutos === "undefined" ||
        Number(configuracion.bloqueoInactividadMinutos) < 0
    ) {
        configuracion.bloqueoInactividadMinutos = 30;
    }

    if (!configuracion.promociones) {
        configuracion.promociones = {
            descuentoClienteFrecuente: 10,
            sesionesParaDescuento: 5
        };
    }

    if (
        typeof configuracion.promociones.descuentoClienteFrecuente === "undefined"
    ) {
        configuracion.promociones.descuentoClienteFrecuente = 10;
    }

    if (
        typeof configuracion.promociones.sesionesParaDescuento === "undefined"
    ) {
        configuracion.promociones.sesionesParaDescuento = 5;
    }

    if (datos.estaciones) {
        estaciones = datos.estaciones;

        estaciones.forEach(function(estacion) {
            if (typeof estacion.terminado === "undefined") {
                estacion.terminado = false;
            }

            if (typeof estacion.pausada === "undefined") {
                estacion.pausada = false;
            }

            if (typeof estacion.cliente === "undefined") {
                estacion.cliente = "";
            }

            if (typeof estacion.precioSesion === "undefined") {
                estacion.precioSesion = 0;
            }

            if (typeof estacion.metodoPagoSesion === "undefined") {
                estacion.metodoPagoSesion = "";
            }

            if (typeof estacion.duracionTotalSegundos === "undefined") {
                estacion.duracionTotalSegundos = 0;
            }

            if (typeof estacion.inicioSesion === "undefined") {
                estacion.inicioSesion = null;
            }

            if (typeof estacion.avisoMostrado === "undefined") {
                estacion.avisoMostrado = false;
            }

            if (!estacion.tipo) {
                estacion.tipo =
                    /pc/i.test(estacion.nombre || "")
                        ? "PC"
                        : "Xbox";
            }

            if (typeof estacion.habilitada === "undefined") {
                estacion.habilitada = true;
            }
        });
    }

    normalizarEstaciones();

    reportes = datos.reportes || [];
    cierresCaja = datos.cierresCaja || [];

    fondoCajaInicial =
        Number(datos.fondoCajaInicial) || 0;

    cajaAperturaUsuario =
        String(datos.cajaAperturaUsuario || "");

    cajaAperturaHora =
        String(datos.cajaAperturaHora || "");

    cajaCierreUsuario =
        String(datos.cajaCierreUsuario || "");

    cajaCierreHora =
        String(datos.cajaCierreHora || "");

    cajaUltimaReaperturaUsuario =
        String(datos.cajaUltimaReaperturaUsuario || "");

    cajaUltimaReaperturaHora =
        String(datos.cajaUltimaReaperturaHora || "");

    contadorTicketPro =
        Math.max(
            0,
            Number(datos.contadorTicketPro) || 0
        );

    fechaContadorTicketPro =
        String(
            datos.fechaContadorTicketPro ||
            ""
        );

    movimientosCaja =
        Array.isArray(datos.movimientosCaja)
            ? datos.movimientosCaja
            : [];

    movimientosCaja.forEach(function(movimiento) {
        movimiento.monto =
            Number(movimiento.monto) || 0;

        if (
            movimiento.tipo !== "entrada" &&
            movimiento.tipo !== "salida"
        ) {
            movimiento.tipo = "entrada";
        }

        movimiento.hora =
            movimiento.hora || "";
        movimiento.concepto =
            movimiento.concepto || "";
    });

    movimientosInventario =
        Array.isArray(datos.movimientosInventario)
            ? datos.movimientosInventario
            : [];

    movimientosInventario.forEach(function(movimiento) {
        movimiento.id =
            movimiento.id ||
            (
                "INV-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7)
            );

        movimiento.fecha =
            movimiento.fecha ||
            obtenerFecha();

        movimiento.hora =
            movimiento.hora ||
            "";

        movimiento.tipo =
            movimiento.tipo ||
            "ajuste";

        movimiento.productoId =
            Number(movimiento.productoId) || 0;

        movimiento.cantidad =
            Number(movimiento.cantidad) || 0;

        movimiento.delta =
            Number(
                typeof movimiento.delta !== "undefined"
                    ? movimiento.delta
                    : movimiento.cantidad
            ) || 0;

        movimiento.stockAnterior =
            Math.max(
                0,
                Number(movimiento.stockAnterior) || 0
            );

        movimiento.stockNuevo =
            Math.max(
                0,
                Number(movimiento.stockNuevo) || 0
            );

        movimiento.costoUnitario =
            Math.max(
                0,
                Number(movimiento.costoUnitario) || 0
            );

        movimiento.importe =
            Math.max(
                0,
                Number(movimiento.importe) || 0
            );

        movimiento.motivo =
            String(movimiento.motivo || "");

        movimiento.usuario =
            String(
                movimiento.usuario ||
                "Histórico"
            );
    });

    reservas = Array.isArray(datos.reservas)
        ? datos.reservas
        : [];

    cuentasJugadores =
        Array.isArray(datos.cuentasJugadores)
            ? datos.cuentasJugadores
            : [];

    clientesMembresia =
        Array.isArray(datos.clientesMembresia)
            ? datos.clientesMembresia
            : [];

    if (datos.estadisticasDia && typeof datos.estadisticasDia === "object") {
        estadisticasDia = Object.assign(estadisticasDia, datos.estadisticasDia);
    }

    historialCortes =
        Array.isArray(datos.historialCortes)
            ? datos.historialCortes
            : [];

    if (
        datos.configuracionMembresia &&
        typeof datos.configuracionMembresia === "object"
    ) {
        configuracionMembresia = {
            puntosActivos:
                datos.configuracionMembresia.puntosActivos !== false,
            puntosPorPeso:
                Number(datos.configuracionMembresia.puntosPorPeso),
            puntosPorHora:
                Number(datos.configuracionMembresia.puntosPorHora),
            descuentoPuntos:
                Number(datos.configuracionMembresia.descuentoPuntos),
            descuentoPesos:
                Number(datos.configuracionMembresia.descuentoPesos),
            mediaHoraPuntos:
                Number(datos.configuracionMembresia.mediaHoraPuntos),
            unaHoraPuntos:
                Number(datos.configuracionMembresia.unaHoraPuntos)
        };

        Object.keys(configuracionMembresia).forEach(function(clave) {
            if (
                !Number.isFinite(
                    configuracionMembresia[clave]
                ) ||
                configuracionMembresia[clave] < 0
            ) {
                configuracionMembresia[clave] = 0;
            }
        });
    }

    clientesMembresia.forEach(function(cliente) {
        normalizarClientePro(cliente);

        cliente.puntos = Number(cliente.puntos) || 0;
        cliente.sesiones = Number(cliente.sesiones) || 0;
        cliente.minutos = Number(cliente.minutos) || 0;
        cliente.gasto = Number(cliente.gasto) || 0;
        cliente.descuentoPendiente =
            Number(cliente.descuentoPendiente) || 0;
        cliente.tiempoGratisPendiente =
            Number(cliente.tiempoGratisPendiente) || 0;

        if (!Array.isArray(cliente.movimientos)) {
            cliente.movimientos = [];
        }
    });

    inicializarReservasPro();

    sincronizarDatosClientePro();

    cuentasJugadores =
        cuentasJugadores.filter(function(cuenta) {
            return cuenta &&
                cuenta.estado === "abierta";
        });

    cuentasJugadores.forEach(function(cuenta) {
        if (!Array.isArray(cuenta.productos)) {
            cuenta.productos = [];
        }

        if (!cuenta.game) {
            cuenta.game = {
                minutos: 0,
                precioOriginal: 0,
                descuento: 0,
                precio: 0,
                promociones: []
            };
        }

        if (!Array.isArray(cuenta.game.promociones)) {
            cuenta.game.promociones = [];
        }

        if (typeof cuenta.nota === "undefined") {
            cuenta.nota = "";
        }

        if (!Array.isArray(cuenta.cambiosEstacion)) {
            cuenta.cambiosEstacion = [];
        }
    });

    reservas.forEach(function(reserva) {
        if (!reserva.estado) {
            reserva.estado = "pendiente";
        }
    });

    if (Array.isArray(datos.productos)) {
        productos = datos.productos;

        productos.forEach(function(producto) {
            if (typeof producto.activo === "undefined") {
                producto.activo = true;
            }

            producto.nombre =
                String(
                    producto.nombre ||
                    "Producto " + producto.id
                ).trim();

            producto.precio =
                Math.max(
                    0,
                    Number(producto.precio) || 0
                );

            producto.costo =
                Math.max(
                    0,
                    Number(producto.costo) || 0
                );

            producto.stock =
                Math.max(0, Number(producto.stock) || 0);

            producto.stockMinimo =
                Math.max(
                    0,
                    Number(producto.stockMinimo) || 0
                );
        });
    }

    if (datos.fecha === obtenerFecha()) {
        ventasDelDia = datos.ventasDelDia || 0;
        sesionesDelDia = datos.sesionesDelDia || 0;
        historial = datos.historial || [];
        gastos = datos.gastos || [];
        gastosDelDia = datos.gastosDelDia || 0;
        cajaCerrada = datos.cajaCerrada || false;

        if (datos.estadoCaja) {
            estadoCaja = datos.estadoCaja;
        } else {
            estadoCaja = cajaCerrada ? "cerrada" : "abierta";
        }

        fechaCaja = datos.fecha;

        ventasPorMetodo = datos.ventasPorMetodo || {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0
        };

        ventasPorMetodo.efectivo =
            Number(ventasPorMetodo.efectivo) || 0;

        ventasPorMetodo.tarjeta =
            Number(ventasPorMetodo.tarjeta) || 0;

        ventasPorMetodo.transferencia =
            Number(ventasPorMetodo.transferencia) || 0;
    } else {
        if (datos.fecha) {
            guardarReporteAnterior(
                datos.fecha,
                datos.ventasDelDia || 0,
                datos.gastosDelDia || 0,
                datos.sesionesDelDia || 0
            );
        }

        ventasDelDia = 0;
        sesionesDelDia = 0;
        historial = [];
        gastos = [];
        gastosDelDia = 0;

        fondoCajaInicial = 0;
        movimientosCaja = [];

        cajaAperturaUsuario = "";
        cajaAperturaHora = "";
        cajaCierreUsuario = "";
        cajaCierreHora = "";
        cajaUltimaReaperturaUsuario = "";
        cajaUltimaReaperturaHora = "";

        contadorTicketPro = 0;
        fechaContadorTicketPro = obtenerFecha();

        ventasPorMetodo = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0
        };

        // El nuevo día empieza con la caja cerrada.
        // El usuario debe pulsar "Abrir caja".
        cajaCerrada = true;
        estadoCaja = "pendiente";
        fechaCaja = obtenerFecha();

        estaciones.forEach(function(estacion) {
            estacion.segundos = 0;
            estacion.activo = false;
            estacion.finalizaEn = null;
            estacion.terminado = false;
        });

        guardarDatos();
    }
}


// ========================================
// REPORTES
// ========================================

function guardarReporteAnterior(fecha, ingresos, gastosTotales, sesiones) {
    if (!fecha) {
        return;
    }

    const ganancia = ingresos - gastosTotales;

    const existente = reportes.find(function(reporte) {
        return reporte.fecha === fecha;
    });

    if (existente) {
        existente.ingresos = ingresos;
        existente.gastos = gastosTotales;
        existente.ganancia = ganancia;
        existente.sesiones = sesiones;
    } else {
        reportes.push({
            fecha,
            ingresos,
            gastos: gastosTotales,
            ganancia,
            sesiones
        });
    }
}

function calcularGanancia() {
    return ventasDelDia - gastosDelDia;
}

function inicioDeSemana() {
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const dia = hoy.getDay();
    const diferencia = dia === 0 ? 6 : dia - 1;

    hoy.setDate(hoy.getDate() - diferencia);

    return hoy;
}

function convertirFecha(fechaTexto) {
    const partes = fechaTexto.split("-");

    return new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );
}

function obtenerTodosLosReportes() {
    const todos = [...reportes];

    todos.push({
        fecha: obtenerFecha(),
        ingresos: ventasDelDia,
        gastos: gastosDelDia,
        ganancia: calcularGanancia(),
        sesiones: sesionesDelDia
    });

    return todos;
}

function calcularPeriodo(tipo) {
    const todos = obtenerTodosLosReportes();

    let ingresos = 0;
    let gastosTotales = 0;
    let sesiones = 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    todos.forEach(function(reporte) {
        const fecha = convertirFecha(reporte.fecha);
        let incluir = false;

        if (tipo === "hoy") {
            incluir = reporte.fecha === obtenerFecha();
        }

        if (tipo === "semana") {
            incluir =
                fecha >= inicioDeSemana() &&
                fecha <= hoy;
        }

        if (tipo === "mes") {
            incluir =
                fecha.getFullYear() === hoy.getFullYear() &&
                fecha.getMonth() === hoy.getMonth();
        }

        if (incluir) {
            ingresos += Number(reporte.ingresos) || 0;
            gastosTotales += Number(reporte.gastos) || 0;
            sesiones += Number(reporte.sesiones) || 0;
        }
    });

    return {
        ingresos,
        gastos: gastosTotales,
        ganancia: ingresos - gastosTotales,
        sesiones
    };
}


// ========================================
// TEMPORIZADORES
// ========================================

function actualizarTiempos() {
    const ahora = Date.now();

    estaciones.forEach(function(estacion) {
        if (estacion.activo && estacion.finalizaEn) {
            const restante = estacion.finalizaEn - ahora;

            if (restante <= 0) {
                estacion.segundos = 0;
                estacion.activo = false;
                estacion.finalizaEn = null;
                estacion.terminado = true;
                estacion.pausada = false;
                estacion.avisoMostrado = false;

                mostrarAvisoTiempo(
                    "🔴 " + estacion.nombre + " terminó la sesión.",
                    true
                );

                guardarDatos();
            } else {
                estacion.segundos =
                    Math.ceil(restante / 1000);

                const avisoSegundos =
                    Number(configuracion.avisoMinutos || 10) * 60;

                if (
                    estacion.segundos <= avisoSegundos &&
                    !estacion.avisoMostrado
                ) {
                    estacion.avisoMostrado = true;

                    mostrarAvisoTiempo(
                        "⚠️ " +
                        estacion.nombre +
                        " tiene " +
                        formatearTiempo(estacion.segundos) +
                        " restantes.",
                        false
                    );

                    guardarDatos();
                }
            }
        }
    });
}

function mostrarAvisoTiempo(mensaje, terminado) {
    let aviso = document.getElementById("avisoTiempo");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "avisoTiempo";

        aviso.style.position = "fixed";
        aviso.style.top = "18px";
        aviso.style.left = "50%";
        aviso.style.transform = "translateX(-50%)";
        aviso.style.zIndex = "10000";
        aviso.style.width = "min(520px, calc(100% - 30px))";
        aviso.style.padding = "16px 18px";
        aviso.style.borderRadius = "14px";
        aviso.style.boxShadow = "0 12px 35px rgba(0,0,0,0.35)";
        aviso.style.fontSize = "17px";
        aviso.style.fontWeight = "bold";
        aviso.style.textAlign = "center";

        document.body.appendChild(aviso);
    }

    aviso.textContent = mensaje;
    aviso.style.background = terminado ? "#7f1d1d" : "#854d0e";
    aviso.style.color = "#fff";

    clearTimeout(window.avisoTiempoTimeout);

    window.avisoTiempoTimeout = setTimeout(function() {
        if (aviso) {
            aviso.remove();
        }
    }, 7000);
}

function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);

    const minutos = Math.floor(
        (segundos % 3600) / 60
    );

    const segundosRestantes = segundos % 60;

    return (
        String(horas).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0") +
        ":" +
        String(segundosRestantes).padStart(2, "0")
    );
}


// ========================================
// DATOS DE SESION ACTUAL
// ========================================

function escaparHTML(valor) {
    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function obtenerTiempoUsado(estacion) {
    const total =
        Number(estacion.duracionTotalSegundos) || 0;

    const restante =
        Number(estacion.segundos) || 0;

    return Math.max(
        0,
        total - restante
    );
}


// ========================================
// RESERVAS / AGENDA
// ========================================

function siguienteIdReserva() {
    if (reservas.length === 0) {
        return 1;
    }

    return Math.max.apply(
        null,
        reservas.map(function(reserva) {
            return Number(reserva.id) || 0;
        })
    ) + 1;
}

function obtenerEstacionReserva(id) {
    return obtenerEstacionPorId(id);
}

function normalizarHoraReserva(hora) {
    const valor =
        String(hora == null ? "" : hora)
            .trim()
            .toUpperCase()
            .replace(/\./g, "");

    // 24 horas: 0:00 - 23:59 o 00:00 - 23:59
    let match =
        valor.match(/^(\d{1,2}):(\d{2})$/);

    if (match) {
        const h = Number(match[1]);
        const m = Number(match[2]);

        if (
            h >= 0 &&
            h <= 23 &&
            m >= 0 &&
            m <= 59
        ) {
            return (
                String(h).padStart(2, "0") +
                ":" +
                String(m).padStart(2, "0")
            );
        }

        return null;
    }

    // 12 horas: 12:49 PM / 12:49 AM / 6:30 p.m.
    match =
        valor.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );

    if (!match) {
        return null;
    }

    let h = Number(match[1]);
    const minutos = Number(match[2]);
    const periodo = match[3];

    if (
        h < 1 ||
        h > 12 ||
        minutos < 0 ||
        minutos > 59
    ) {
        return null;
    }

    if (periodo === "AM") {
        if (h === 12) {
            h = 0;
        }
    } else if (h !== 12) {
        h += 12;
    }

    return (
        String(h).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0")
    );
}

function formatearHoraReserva(hora) {
    const normalizada =
        normalizarHoraReserva(hora);

    if (!normalizada) {
        return String(hora || "");
    }

    const partes =
        normalizada.split(":");

    let h = Number(partes[0]);
    const minutos = partes[1];

    const periodo =
        h >= 12 ? "PM" : "AM";

    h = h % 12;

    if (h === 0) {
        h = 12;
    }

    return (
        String(h).padStart(2, "0") +
        ":" +
        minutos +
        " " +
        periodo
    );
}

function fechaHoraReservaMs(fecha, hora) {
    if (!esFechaValidaReserva(fecha)) {
        return null;
    }

    const horaNormalizada =
        normalizarHoraReserva(hora);

    if (!horaNormalizada) {
        return null;
    }

    const partesFecha =
        String(fecha).split("-").map(Number);

    const partesHora =
        horaNormalizada.split(":").map(Number);

    // Constructor numérico: usa la hora local del dispositivo,
    // evitando ambigüedades de zona horaria del parser de strings.
    const objeto =
        new Date(
            partesFecha[0],
            partesFecha[1] - 1,
            partesFecha[2],
            partesHora[0],
            partesHora[1],
            0,
            0
        );

    if (isNaN(objeto.getTime())) {
        return null;
    }

    return objeto.getTime();
}

function esFechaValidaReserva(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const partes = fecha.split("-").map(Number);

    const objeto =
        new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

    return (
        objeto.getFullYear() === partes[0] &&
        objeto.getMonth() === partes[1] - 1 &&
        objeto.getDate() === partes[2]
    );
}

function esHoraValidaReserva(hora) {
    return normalizarHoraReserva(hora) !== null;
}


function esFechaValidaReserva(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const partes = fecha.split("-").map(Number);

    const objeto =
        new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

    return (
        objeto.getFullYear() === partes[0] &&
        objeto.getMonth() === partes[1] - 1 &&
        objeto.getDate() === partes[2]
    );
}

function esHoraValidaReserva(hora) {
    if (!/^\d{2}:\d{2}$/.test(hora)) {
        return false;
    }

    const partes = hora.split(":").map(Number);

    return (
        partes[0] >= 0 &&
        partes[0] <= 23 &&
        partes[1] >= 0 &&
        partes[1] <= 59
    );
}

function hayConflictoReserva(
    xboxId,
    fecha,
    hora,
    duracion,
    ignorarId
) {
    const inicio =
        fechaHoraReservaMs(fecha, hora);

    if (inicio === null) {
        return true;
    }

    const fin =
        inicio +
        Number(duracion) * 60 * 1000;

    return reservas.some(function(reserva) {
        const estacionReservaId =
            Number(
                reserva.estacionId ||
                reserva.xboxId
            );

        if (
            estacionReservaId !==
            Number(xboxId)
        ) {
            return false;
        }

        if (reserva.fecha !== fecha) {
            return false;
        }

        if (
            reserva.estado === "cancelada" ||
            reserva.estado === "completada"
        ) {
            return false;
        }

        if (
            ignorarId &&
            (
                String(reserva.id) === String(ignorarId) ||
                (
                    Number.isFinite(Number(reserva.id)) &&
                    Number.isFinite(Number(ignorarId)) &&
                    Number(reserva.id) === Number(ignorarId)
                )
            )
        ) {
            return false;
        }

        const inicioExistente =
            fechaHoraReservaMs(
                reserva.fecha,
                reserva.hora
            );

        if (inicioExistente === null) {
            return false;
        }

        const finExistente =
            inicioExistente +
            Number(reserva.duracion) *
            60 *
            1000;

        return (
            inicio < finExistente &&
            fin > inicioExistente
        );
    });
}

function obtenerProximaReserva() {
    const ahora = Date.now();

    return obtenerReservasActivasAgendaPro()
        .filter(function(reserva) {
            return (
                fechaHoraReservaMs(
                    reserva.fecha,
                    reserva.hora
                ) !== null
            );
        })
        .map(function(reserva) {
            return {
                reserva: reserva,
                inicio:
                    fechaHoraReservaMs(
                        reserva.fecha,
                        reserva.hora
                    )
            };
        })
        .filter(function(item) {
            return item.inicio >= ahora;
        })
        .sort(function(a, b) {
            return a.inicio - b.inicio;
        })
        .map(function(item) {
            return item.reserva;
        })[0] || null;
}


function obtenerReservasHoy() {
    const hoy = obtenerFecha();

    return obtenerReservasActivasAgendaPro().filter(
        function(reserva) {
            return reserva.fecha === hoy;
        }
    );
}


function obtenerReservaPorId(id) {
    const buscado = String(id == null ? "" : id);

    return reservas.find(function(reserva) {
        if (!reserva) {
            return false;
        }

        if (String(reserva.id) === buscado) {
            return true;
        }

        const numeroA = Number(reserva.id);
        const numeroB = Number(id);

        return (
            Number.isFinite(numeroA) &&
            Number.isFinite(numeroB) &&
            numeroA === numeroB
        );
    }) || null;
}


function obtenerReservasActivasAgendaPro() {
    return reservas.filter(function(reserva) {
        return (
            reserva &&
            (
                reserva.estado === "pendiente" ||
                reserva.estado === "confirmada"
            )
        );
    });
}

function obtenerReservasPendientes() {
    return reservas.filter(function(reserva) {
        return reserva.estado === "pendiente";
    });
}

function obtenerReservaActivaEstacion(
    id,
    fecha,
    hora,
    duracion
) {
    const inicioNuevo =
        fechaHoraReservaMs(
            fecha,
            hora
        );

    if (inicioNuevo === null) {
        return null;
    }

    const finNuevo =
        inicioNuevo +
        Number(duracion || 0) *
        60 * 1000;

    return obtenerReservasActivasAgendaPro().find(
        function(reserva) {
            if (
                Number(reserva.estacionId) !==
                Number(id) ||
                reserva.fecha !== fecha
            ) {
                return false;
            }

            const inicioExistente =
                fechaHoraReservaMs(
                    reserva.fecha,
                    reserva.hora
                );

            if (inicioExistente === null) {
                return false;
            }

            const finExistente =
                inicioExistente +
                Number(reserva.duracion || 0) *
                60 * 1000;

            return (
                inicioNuevo < finExistente &&
                finNuevo > inicioExistente
            );
        }
    ) || null;
}


function obtenerProximaReservaEstacion(id) {
    const ahora = Date.now();

    return obtenerReservasActivasAgendaPro()
        .filter(function(reserva) {
            return Number(reserva.estacionId) === Number(id);
        })
        .map(function(reserva) {
            return {
                reserva: reserva,
                inicio:
                    fechaHoraReservaMs(
                        reserva.fecha,
                        reserva.hora
                    ) || Infinity
            };
        })
        .filter(function(item) {
            return item.inicio >= ahora;
        })
        .sort(function(a, b) {
            return a.inicio - b.inicio;
        })
        .map(function(item) {
            return item.reserva;
        })[0] || null;
}


function obtenerReservaEnCursoEstacion(id) {
    const ahora = Date.now();

    return obtenerReservasActivasAgendaPro().find(
        function(reserva) {
            if (
                Number(reserva.estacionId) !==
                Number(id)
            ) {
                return false;
            }

            const inicio =
                fechaHoraReservaMs(
                    reserva.fecha,
                    reserva.hora
                );

            if (inicio === null) {
                return false;
            }

            const fin =
                inicio +
                Number(reserva.duracion || 0) *
                60 * 1000;

            return ahora >= inicio && ahora < fin;
        }
    ) || null;
}


function obtenerReservaProximaOEnCurso(id) {
    return (
        obtenerReservaEnCursoEstacion(id) ||
        obtenerProximaReservaEstacion(id)
    );
}

function puedeIniciarReserva(reserva) {
    if (!reserva) {
        return false;
    }

    const inicio =
        fechaHoraReservaMs(
            reserva.fecha,
            reserva.hora
        );

    if (inicio === null) {
        return false;
    }

    const ahora = Date.now();

    // Permitimos iniciar hasta 15 minutos antes de la hora reservada.
    const margenAntes =
        15 * 60 * 1000;

    const fin =
        inicio +
        Number(reserva.duracion || 0) *
        60 * 1000;

    return (
        ahora >= inicio - margenAntes &&
        ahora < fin
    );
}

function reservaBloqueaNuevaSesion(
    estacionId,
    minutos
) {
    const hoy = obtenerFecha();
    const ahora = Date.now();

    const finSesion =
        ahora +
        Number(minutos || 0) *
        60 * 1000;

    return obtenerReservasActivasAgendaPro().find(
        function(reserva) {
            if (
                Number(reserva.estacionId) !==
                Number(estacionId) ||
                reserva.fecha !== hoy
            ) {
                return false;
            }

            const inicioReserva =
                fechaHoraReservaMs(
                    reserva.fecha,
                    reserva.hora
                );

            if (inicioReserva === null) {
                return false;
            }

            const finReserva =
                inicioReserva +
                Number(reserva.duracion || 0) *
                60 * 1000;

            return (
                ahora < finReserva &&
                finSesion > inicioReserva
            );
        }
    ) || null;
}


function iniciarReserva(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const reserva =
        obtenerReservaPorId(id);

    if (
        !reserva ||
        (
            reserva.estado !== "pendiente" &&
            reserva.estado !== "confirmada"
        )
    ) {
        alert("❌ La reserva ya no está disponible.");

        if (vistaActual === "reservas_pro") {
            mostrarReservasPro();
        } else {
            mostrarReservas();
        }

        return;
    }

    if (!puedeIniciarReserva(reserva)) {
        alert(
            "⏰ Todavía no puedes iniciar esta reserva.\n\n" +
            "Puedes iniciarla hasta 15 minutos antes de la hora reservada " +
            "y hasta que termine su horario."
        );
        return;
    }

    const estacion =
        obtenerEstacionPorId(
            reserva.estacionId
        );

    if (!estacion) {
        alert(
            "❌ La estación de la reserva ya no existe."
        );
        return;
    }

    if (
        estacion.activo ||
        estacion.segundos > 0 ||
        estacion.pausada
    ) {
        alert(
            "⚠️ La estación todavía está ocupada.\n\n" +
            "Primero termina la sesión actual."
        );
        return;
    }

    if (obtenerCuentaPorEstacion(estacion.id)) {
        alert(
            "⚠️ Esta estación ya tiene una cuenta abierta."
        );
        return;
    }

    const precios =
        obtenerPreciosEstacion(estacion);

    const precioBase =
        tarifaPorMinutosPro(
            precios,
            Number(reserva.duracion)
        );

    // Si la reserva tiene un precio acordado mayor que cero,
    // respetamos ese precio en lugar de ignorarlo.
    if (
        Number(reserva.precio) > 0
    ) {
        precioBase =
            Number(reserva.precio);
    }

    const resumen =
        calcularPrecioPromocional(
            precioBase,
            reserva.cliente
        );

    const anticipo =
        Math.min(
            Math.max(
                0,
                Number(reserva.anticipo) || 0
            ),
            Number(resumen.precioFinal) || 0
        );

    const pendiente =
        Math.max(
            0,
            (
                Number(resumen.precioFinal) || 0
            ) -
            anticipo
        );

    const confirmar =
        confirm(
            "📅 INICIAR RESERVA\n\n" +
            "👤 " + reserva.cliente +
            "\n" +
            iconoTipoEstacion(estacion.tipo) +
            " " + estacion.nombre +
            "\n🕐 " + reserva.hora +
            "\n⏱️ " + reserva.duracion + " minutos" +
            "\n💰 Total acordado: $" +
            Number(resumen.precioFinal).toFixed(2) +
            (
                anticipo > 0
                    ? "\n💵 Anticipo: $" +
                      anticipo.toFixed(2) +
                      "\n📌 Pendiente: $" +
                      pendiente.toFixed(2)
                    : ""
            ) +
            (
                resumen.descuento > 0
                    ? "\n🎟️ " + resumen.motivo +
                      "\n💚 Ahorro: $" +
                      resumen.descuento.toFixed(2)
                    : ""
            ) +
            "\n\n¿Iniciar la reserva?"
        );

    if (!confirmar) {
        return;
    }

    const cuenta =
        crearCuentaJugador(
            estacion,
            Number(reserva.duracion),
            precioBase,
            reserva.cliente,
            resumen
        );

    // Importante: los IDs de reservas PRO pueden ser R-XXXX.
    // Nunca convertirlos a Number porque terminarían como NaN.
    cuenta.reservaId =
        String(reserva.id);

    cuenta.reservaFecha =
        reserva.fecha;

    cuenta.reservaHora =
        reserva.hora;

    cuenta.reservaDuracion =
        Number(reserva.duracion);

    cuenta.reservaPrecioTotal =
        Number(resumen.precioFinal) || 0;

    cuenta.reservaAnticipo =
        anticipo;

    cuenta.reservaSaldoPendiente =
        pendiente;

    estacion.segundos =
        Number(reserva.duracion) * 60;

    estacion.duracionTotalSegundos =
        estacion.segundos;

    estacion.terminado = false;
    estacion.pausada = false;
    estacion.activo = true;
    estacion.finalizaEn =
        Date.now() +
        estacion.segundos * 1000;

    estacion.cliente =
        reserva.cliente;

    estacion.precioSesion =
        resumen.precioFinal;

    estacion.metodoPagoSesion = "";

    estacion.inicioSesion =
        obtenerHora();

    estacion.avisoMostrado = false;

    reserva.estado =
        "en_curso";

    reserva.iniciadaEn =
        new Date().toISOString();

    reserva.precio =
        Number(resumen.precioFinal) || 0;

    reserva.anticipo =
        anticipo;

    guardarDatos();
    mostrarEstaciones();

    alert(
        "✅ Reserva iniciada.\n\n" +
        "🧾 Se creó la cuenta del jugador." +
        (
            anticipo > 0
                ? "\n💵 Anticipo aplicado: $" +
                  anticipo.toFixed(2) +
                  "\n📌 Pendiente: $" +
                  pendiente.toFixed(2)
                : ""
        ) +
        "\n\nAhora puedes agregar consumos desde la estación."
    );
}


function editarReserva(id) {
    const reserva =
        obtenerReservaPorId(id);

    if (!reserva) {
        return;
    }

    if (reserva.estado === "en_curso") {
        alert(
            "⚠️ No puedes editar una reserva que ya está en curso."
        );
        return;
    }

    const fecha =
        prompt(
            "📅 Nueva fecha (AAAA-MM-DD):",
            reserva.fecha
        );

    if (fecha === null) {
        return;
    }

    const fechaLimpia =
        fecha.trim();

    if (!esFechaValidaReserva(fechaLimpia)) {
        alert("❌ Fecha no válida.");
        return;
    }

    const hora =
        prompt(
            "🕐 Nueva hora (HH:MM):",
            reserva.hora
        );

    if (hora === null) {
        return;
    }

    const horaLimpia =
        normalizarHoraReserva(hora.trim());

    if (!esHoraValidaReserva(horaLimpia)) {
        alert("❌ Hora no válida. Usa 18:49 o 06:49 PM.");
        return;
    }

    const duracionTexto =
        prompt(
            "⏱️ Duración en minutos:\n\n30 / 60 / 120 / 180",
            reserva.duracion
        );

    if (duracionTexto === null) {
        return;
    }

    const duracion =
        Number(duracionTexto);

    if (
        ![30, 60, 120, 180].includes(duracion)
    ) {
        alert("❌ Duración no válida.");
        return;
    }

    const conflicto =
        obtenerReservaActivaEstacion(
            reserva.estacionId,
            fechaLimpia,
            horaLimpia,
            duracion
        );

    if (
        conflicto &&
        String(conflicto.id) !== String(reserva.id) &&
        !(
            Number.isFinite(Number(conflicto.id)) &&
            Number.isFinite(Number(reserva.id)) &&
            Number(conflicto.id) === Number(reserva.id)
        )
    ) {
        alert(
            "⚠️ Ese horario se cruza con otra reserva de " +
            conflicto.cliente +
            "."
        );
        return;
    }

    const notas =
        prompt(
            "📝 Nota:",
            reserva.notas || ""
        );

    if (notas === null) {
        return;
    }

    reserva.fecha =
        fechaLimpia;

    reserva.hora =
        horaLimpia;

    reserva.duracion =
        duracion;

    reserva.notas =
        notas.trim();

    guardarDatos();
    mostrarReservas();

    alert("✅ Reserva modificada.");
}

function crearReserva() {
    const cliente = prompt(
        "👤 Nombre del cliente:"
    );

    if (!cliente || !cliente.trim()) {
        return;
    }

    const fecha = prompt(
        "📅 Fecha de la reserva (AAAA-MM-DD):",
        obtenerFecha()
    );

    if (fecha === null) {
        return;
    }

    const fechaLimpia = fecha.trim();

    if (!esFechaValidaReserva(fechaLimpia)) {
        alert(
            "❌ La fecha no es válida.\n\n" +
            "Usa el formato AAAA-MM-DD."
        );
        return;
    }

    const hora = prompt(
        "🕐 Hora de la reserva (HH:MM):",
        "18:00"
    );

    if (hora === null) {
        return;
    }

    const horaLimpia = hora.trim();

    if (!esHoraValidaReserva(horaLimpia)) {
        alert(
            "❌ La hora no es válida.\n\n" +
            "Usa 24 horas (18:49) o 12 horas (06:49 PM)."
        );
        return;
    }

    const estacionesReserva =
        obtenerEstacionesDisponibles();

    if (estacionesReserva.length === 0) {
        alert(
            "❌ No hay estaciones habilitadas para reservar."
        );
        return;
    }

    let opcionesEstaciones =
        "🎮🖥️ Estación:\n\n";

    estacionesReserva.forEach(function(estacion, indice) {
        opcionesEstaciones +=
            (indice + 1) +
            " = " +
            iconoTipoEstacion(estacion.tipo) +
            " " +
            estacion.nombre +
            "\n";
    });

    const estacionTexto = prompt(
        opcionesEstaciones
    );

    if (estacionTexto === null) {
        return;
    }

    const indiceEstacion =
        Number(estacionTexto.trim()) - 1;

    const estacion =
        estacionesReserva[indiceEstacion];

    if (!estacion) {
        alert("❌ Estación no válida.");
        return;
    }

    const estacionId = Number(estacion.id);

    const tarifasReserva =
        obtenerTarifasConfiguracion();

    const opcionesTarifaReserva =
        tarifasReserva
            .map(function(item, indice) {
                return (
                    (indice + 1) +
                    " = " +
                    formatearDuracionTarifa(
                        item.minutos
                    ) +
                    " · $" +
                    Number(item.precio).toFixed(2)
                );
            })
            .join("\n");

    const duracionTexto = prompt(
        "⏱️ Duración de la reserva:\n\n" +
        opcionesTarifaReserva +
        "\n\nEscribe el número de la tarifa:",
        "2"
    );

    if (duracionTexto === null) {
        return;
    }

    const indiceTarifa =
        Number(duracionTexto) - 1;

    const tarifaSeleccionada =
        tarifasReserva[indiceTarifa];

    if (!tarifaSeleccionada) {
        alert(
            "❌ Tarifa no válida."
        );
        return;
    }

    const duracion =
        Number(tarifaSeleccionada.minutos);

    if (
        hayConflictoReserva(
            estacionId,
            fechaLimpia,
            horaLimpia,
            duracion
        )
    ) {
        alert(
            "⚠️ Esa Xbox ya tiene una reserva " +
            "que se cruza con ese horario."
        );
        return;
    }

    const precios =
        obtenerPreciosEstacion(estacion);

    const precioReserva =
        tarifaPorMinutosPro(
            precios,
            duracion
        );

    const resumenPrecio =
        calcularPrecioPromocional(
            precioReserva,
            cliente.trim()
        );

    const notas =
        prompt(
            "📝 Nota opcional:",
            ""
        );

    if (notas === null) {
        return;
    }

    reservas.push({
        id: siguienteIdReserva(),
        cliente: cliente.trim(),
        fecha: fechaLimpia,
        hora: horaLimpia,
        estacionId: estacionId,
        estacion: estacion.nombre,
        tipoEstacion: estacion.tipo,
        // xbox/xboxId se conservan para compatibilidad con reservas antiguas.
        xboxId: estacionId,
        xbox: estacion.nombre,
        duracion: duracion,
        precioEstimado:
            resumenPrecio.precioFinal,
        precioBase:
            resumenPrecio.precioOriginal,
        descuentoEstimado:
            resumenPrecio.descuento,
        notas: notas.trim(),
        estado: "pendiente",
        creadaEn: new Date().toISOString()
    });

    guardarDatos();
    mostrarReservas();

    alert(
        "✅ Reserva creada.\n\n" +
        cliente.trim() +
        "\n" +
        estacion.nombre +
        "\n" +
        fechaLimpia +
        " · " +
        horaLimpia +
        "\n💰 Precio estimado: $" +
        resumenPrecio.precioFinal
    );
}

function mostrarCuentaPorReserva(reservaId) {
    const buscado =
        String(
            reservaId == null
                ? ""
                : reservaId
        );

    const cuenta =
        cuentasJugadores.find(function(item) {
            if (!item) {
                return false;
            }

            const idCuenta =
                String(
                    item.reservaId == null
                        ? ""
                        : item.reservaId
                );

            return idCuenta === buscado;
        });

    if (!cuenta) {
        alert(
            "❌ No se encontró una cuenta activa para esta reserva."
        );
        return;
    }

    mostrarCuentaJugador(cuenta.id);
}


function cambiarEstadoReserva(id, estado) {
    const reserva =
        reservas.find(function(item) {
            return Number(item.id) ===
                Number(id);
        });

    if (!reserva) {
        return;
    }

    reserva.estado = estado;

    if (estado === "pendiente") {
        delete reserva.iniciadaEn;
    }

    guardarDatos();
    mostrarReservas();
}

function eliminarReserva(id) {
    const indice =
        reservas.findIndex(function(item) {
            return Number(item.id) ===
                Number(id);
        });

    if (indice < 0) {
        return;
    }

    const reserva = reservas[indice];

    const confirmar = confirm(
        "🗑️ Eliminar reserva\n\n" +
        reserva.cliente +
        "\n" +
        reserva.fecha +
        " · " +
        reserva.hora +
        "\n\n" +
        "¿Eliminarla definitivamente?"
    );

    if (!confirmar) {
        return;
    }

    reservas.splice(indice, 1);

    guardarDatos();
    mostrarReservas();
}

function mostrarReservas() {
    vistaActual = "reservas";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    const ordenadas =
        reservas.slice().sort(function(a, b) {
            const fechaA =
                fechaHoraReservaMs(
                    a.fecha,
                    a.hora
                ) || 0;

            const fechaB =
                fechaHoraReservaMs(
                    b.fecha,
                    b.hora
                ) || 0;

            return fechaA - fechaB;
        });

    let html =
        "<h1>📅 Reservas</h1>" +
        "<p>Agenda sesiones futuras y evita cruces de horario.</p>" +

        "<button onclick='crearReserva()'>" +
        "➕ Nueva reserva" +
        "</button>" +

        "<button onclick='volverInicio()'>" +
        "🏠 Inicio" +
        "</button>" +

        "<hr>";

    if (ordenadas.length === 0) {
        html +=
            "<p>No hay reservas registradas.</p>";
    }

    ordenadas.forEach(function(reserva) {
        const inicio =
            fechaHoraReservaMs(
                reserva.fecha,
                reserva.hora
            );

        const hoy =
            reserva.fecha === obtenerFecha();

        let etiquetaEstado =
            "🟡 PENDIENTE";

        if (reserva.estado === "atendida") {
            etiquetaEstado =
                "🟢 ATENDIDA";
        } else if (
            reserva.estado === "en_curso"
        ) {
            etiquetaEstado =
                "🔵 EN CURSO";
        } else if (
            reserva.estado === "cancelada"
        ) {
            etiquetaEstado =
                "🔴 CANCELADA";
        } else if (
            inicio !== null &&
            inicio < Date.now()
        ) {
            etiquetaEstado =
                "🟠 HORARIO PASADO";
        }

        html +=
            "<div style='" +
            "margin-bottom:12px;" +
            "padding:16px;" +
            "border-radius:16px;" +
            "background:rgba(255,255,255,.05);" +
            "border:1px solid rgba(255,255,255,.1);" +
            "'>" +

            "<h2 style='margin-top:0;'>" +
            "👤 " +
            escaparHTML(reserva.cliente) +
            "</h2>" +

            "<p>" +
            "📅 <strong>" +
            obtenerFechaBonita(reserva.fecha) +
            "</strong>" +
            (hoy ? " · <strong>HOY</strong>" : "") +
            "</p>" +

            "<p>" +
            "🕐 <strong>" +
            escaparHTML(reserva.hora) +
            "</strong>" +
            " · " +
            iconoTipoEstacion(
                reserva.tipoEstacion || "Xbox"
            ) +
            " " +
            escaparHTML(
                reserva.estacion || reserva.xbox
            ) +
            " · ⏱️ " +
            reserva.duracion +
            " min" +
            "</p>" +

            "<p>" +
            "Estado: <strong>" +
            etiquetaEstado +
            "</strong>" +
            "</p>" +

            (
                reserva.precioEstimado !== undefined
                    ? "<p>💰 Precio estimado: <strong>$" +
                      Number(reserva.precioEstimado || 0) +
                      "</strong></p>"
                    : ""
            ) +

            (
                reserva.notas
                    ? "<p>📝 " +
                      escaparHTML(reserva.notas) +
                      "</p>"
                    : ""
            );

        if (reserva.estado === "pendiente") {
            if (
                hoy &&
                puedeIniciarReserva(reserva)
            ) {
                html +=
                    "<button onclick='iniciarReserva(" +
                    reserva.id +
                    ")'>" +
                    "▶️ Iniciar reserva" +
                    "</button>";
            }

            html +=
                "<button onclick='editarReserva(" +
                reserva.id +
                ")'>" +
                "✏️ Editar" +
                "</button>" +

                "<button onclick='cambiarEstadoReserva(" +
                reserva.id +
                ",\"atendida\")'>" +
                "✅ Atendida" +
                "</button>" +

                "<button onclick='cambiarEstadoReserva(" +
                reserva.id +
                ",\"cancelada\")'>" +
                "❌ Cancelar" +
                "</button>";
        } else if (reserva.estado === "en_curso") {
            html +=
                "<button onclick='mostrarCuentaPorReserva(" +
                reserva.id +
                ")'>" +
                "🧾 Ver cuenta" +
                "</button>";
        } else {
            html +=
                "<button onclick='cambiarEstadoReserva(" +
                reserva.id +
                ",\"pendiente\")'>" +
                "↩️ Reactivar" +
                "</button>";
        }

        html +=
            "<button onclick='eliminarReserva(" +
            reserva.id +
            ")'>" +
            "🗑️ Eliminar" +
            "</button>" +

            "</div>";
    });

    div.innerHTML = html;
    contenedor.appendChild(div);
}


// ========================================
// DASHBOARD
// ========================================

function obtenerMinutosVenta(tiempo) {
    const numero = parseInt(String(tiempo || "0"), 10);

    if (isNaN(numero)) {
        return 0;
    }

    return numero;
}

function esRegistroDeHoyDashboardPro(registro) {
    return (
        registro &&
        String(registro.fecha || "") ===
        String(obtenerFecha())
    );
}

function calcularDashboardHoy() {
    asegurarEstadisticasDia();

    let descuentos = 0;

    historial.forEach(function(venta) {
        if (!esRegistroDeHoyDashboardPro(venta)) {
            return;
        }

        descuentos +=
            Number(venta.descuento) || 0;
    });

    const totalVentas =
        Number(
            estadisticasDia.totalVentas
        ) || Number(ventasDelDia) || 0;

    const ventasProductos =
        Number(
            estadisticasDia.ventasProductos
        ) || 0;

    const unidadesProductos =
        Number(
            estadisticasDia.productosVendidos
        ) || 0;

    const minutosVendidos =
        Number(
            estadisticasDia.minutosJugados
        ) || 0;

    const tickets =
        Number(
            estadisticasDia.tickets
        ) || Number(sesionesDelDia) || 0;

    const clientes =
        Number(
            estadisticasDia.clientes
        ) || Number(sesionesDelDia) || 0;

    const ocupadas =
        obtenerEstacionesDisponibles()
            .filter(function(estacion) {
                return estacion.activo;
            }).length;

    const estacionesHabilitadas =
        obtenerEstacionesDisponibles();

    const disponibles =
        Math.max(
            0,
            estacionesHabilitadas.length -
            ocupadas
        );

    return {
        ventas: totalVentas,
        descuentos: descuentos,
        gastos: Number(gastosDelDia) || 0,
        ganancia:
            totalVentas -
            (Number(gastosDelDia) || 0),
        sesiones:
            Number(sesionesDelDia) || tickets,
        tickets: tickets,
        clientes: clientes,
        minutosVendidos: minutosVendidos,
        horasVendidas: minutosVendidos / 60,
        efectivo:
            Number(estadisticasDia.efectivo) ||
            Number(ventasPorMetodo.efectivo) ||
            0,
        tarjeta:
            Number(estadisticasDia.tarjeta) ||
            Number(ventasPorMetodo.tarjeta) ||
            0,
        transferencia:
            Number(estadisticasDia.transferencia) ||
            Number(ventasPorMetodo.transferencia) ||
            0,
        ventasProductos: ventasProductos,
        unidadesProductos: unidadesProductos,
        utilidadProductos:
            historial
                .filter(esRegistroDeHoyDashboardPro)
                .filter(function(venta) {
                    return venta.tipo === "producto";
                })
                .reduce(function(total, venta) {
                    return total +
                        (
                            Number(venta.utilidad) || 0
                        );
                }, 0),
        cuentasAbiertas:
            cuentasJugadores.length,
        pendienteCobro:
            obtenerTotalCuentasAbiertas(),
        reservasPendientes:
            obtenerReservasPendientes().length,
        reservasHoy:
            obtenerReservasHoy().length,
        ocupadas: ocupadas,
        disponibles: disponibles,
        puntos:
            Number(
                estadisticasDia.puntosOtorgados
            ) || 0
    };
}


function crearTarjetaDashboard(emoji, titulo, valor, detalle) {
    return (
        "<div class='v27-metric-card'>" +

        "<div class='v27-metric-title'>" +
        emoji + " " + titulo +
        "</div>" +

        "<div class='v27-metric-value'>" +
        valor +
        "</div>" +

        "<div class='v27-metric-detail'>" +
        (detalle || "") +
        "</div>" +

        "</div>"
    );
}

function crearTarjetaEstadoEstacion(estacion) {
    let estado;
    let clase;
    let detalle;

    const cuenta =
        obtenerCuentaPorEstacion(estacion.id);

    if (estacion.pausada && estacion.segundos > 0) {
        estado = "⏸️ PAUSADA";
        clase = "v27-mini-paused";
        detalle =
            (estacion.cliente
                ? "👤 " + escaparHTML(estacion.cliente)
                : "👤 Sin nombre") +
            " · ⏳ " +
            formatearTiempo(estacion.segundos);
    } else if (estacion.activo) {
        estado = "🟢 JUGANDO";
        clase = "v27-mini-playing";
        detalle =
            (estacion.cliente
                ? "👤 " + escaparHTML(estacion.cliente)
                : "👤 Sin nombre") +
            " · ⏳ " +
            formatearTiempo(estacion.segundos) +
            (
                cuenta
                    ? " · 🧾 $" +
                      obtenerTotalCuenta(cuenta)
                    : ""
            );
    } else if (estacion.terminado) {
        estado = "🔴 TERMINADA";
        clase = "v27-mini-ended";
        detalle = "Sesión terminada";
    } else {
        estado = "⚪ DISPONIBLE";
        clase = "v27-mini-available";
        detalle = "Lista para una nueva sesión";
    }

    return (
        "<div class='v27-mini-station " +
        clase +
        "'>" +

        "<div class='v27-mini-name'>" +
        iconoTipoEstacion(estacion.tipo) +
        " " + escaparHTML(estacion.nombre) +
        "</div>" +

        "<div class='v27-mini-state'>" +
        estado +
        "</div>" +

        "<div class='v27-mini-detail'>" +
        detalle +
        "</div>" +

        "</div>"
    );
}


function obtenerTopProductoDashboard() {
    const acumulado = {};

    historial.forEach(function(venta) {
        if (
            !esRegistroDeHoyDashboardPro(venta) ||
            venta.tipo !== "producto"
        ) {
            return;
        }

        const nombre =
            String(venta.producto || "Producto");

        const cantidad =
            Number(venta.cantidad) || 0;

        if (!acumulado[nombre]) {
            acumulado[nombre] = {
                nombre: nombre,
                cantidad: 0,
                ingresos: 0
            };
        }

        acumulado[nombre].cantidad +=
            cantidad;

        acumulado[nombre].ingresos +=
            Number(venta.precio) || 0;
    });

    const lista =
        Object.keys(acumulado).map(function(clave) {
            return acumulado[clave];
        });

    lista.sort(function(a, b) {
        return (
            b.cantidad - a.cantidad ||
            b.ingresos - a.ingresos
        );
    });

    return lista.length
        ? lista[0]
        : null;
}


function obtenerTopEstacionDashboard() {
    const acumulado = {};

    historial.forEach(function(venta) {
        if (
            !esRegistroDeHoyDashboardPro(venta) ||
            venta.tipo !== "sesion"
        ) {
            return;
        }

        const nombre =
            String(
                venta.estacion ||
                venta.xbox ||
                "Estación"
            );

        if (!acumulado[nombre]) {
            acumulado[nombre] = {
                nombre: nombre,
                ingresos: 0,
                sesiones: 0
            };
        }

        acumulado[nombre].ingresos +=
            Number(venta.precio) || 0;

        acumulado[nombre].sesiones += 1;
    });

    const lista =
        Object.keys(acumulado).map(function(clave) {
            return acumulado[clave];
        });

    lista.sort(function(a, b) {
        return (
            b.ingresos - a.ingresos ||
            b.sesiones - a.sesiones
        );
    });

    return lista.length
        ? lista[0]
        : null;
}


function construirGraficaHorasDashboard() {
    asegurarVentasPorHora();

    const datos =
        estadisticasDia.ventasPorHora;

    const maximo =
        Math.max.apply(
            null,
            datos.concat([1])
        );

    let html =
        "<div class='v27-hour-chart'>";

    for (let hora = 0; hora < 24; hora++) {
        const valor =
            Number(datos[hora]) || 0;

        const alto =
            valor > 0
                ? Math.max(7, Math.round((valor / maximo) * 100))
                : 3;

        const etiqueta =
            String(hora).padStart(2, "0") + "h";

        html +=
            "<div class='v27-hour-column' title='" +
            etiqueta +
            " · " +
            dinero(valor) +
            "'>" +
                "<div class='v27-hour-value'>" +
                    (valor > 0 ? dinero(valor) : "") +
                "</div>" +
                "<div class='v27-hour-track'>" +
                    "<i style='height:" +
                    alto +
                    "%'></i>" +
                "</div>" +
                "<span>" +
                    (hora % 2 === 0 ? etiqueta : "") +
                "</span>" +
            "</div>";
    }

    html += "</div>";

    return html;
}

function crearTarjetaEstadoDashboard(estacion) {
    let estado = "⚪ Disponible";
    let detalle = "Lista para iniciar";
    let clase = "available";

    const cuenta =
        obtenerCuentaPorEstacion(estacion.id);

    if (estacion.pausada && estacion.segundos > 0) {
        estado = "⏸️ Pausada";
        detalle =
            (estacion.cliente
                ? "👤 " + escaparHTML(estacion.cliente)
                : "👤 Sin nombre") +
            " · " +
            formatearTiempo(estacion.segundos);
        clase = "paused";
    } else if (estacion.activo) {
        estado = "🟢 Jugando";
        detalle =
            (estacion.cliente
                ? "👤 " + escaparHTML(estacion.cliente)
                : "👤 Sin nombre") +
            " · " +
            formatearTiempo(estacion.segundos) +
            (
                cuenta
                    ? " · 🧾 " +
                      dinero(obtenerTotalCuenta(cuenta))
                    : ""
            );
        clase = "playing";
    } else if (estacion.terminado) {
        estado = "🔴 Terminada";
        detalle = "Sesión finalizada";
        clase = "ended";
    }

    return (
        "<div class='v27-live-station v27-live-" +
        clase +
        "'>" +
            "<div class='v27-live-station-top'>" +
                "<strong>" +
                    iconoTipoEstacion(estacion.tipo) +
                    " " +
                    escaparHTML(estacion.nombre) +
                "</strong>" +
                "<span>" +
                    estado +
                "</span>" +
            "</div>" +
            "<div class='v27-live-station-detail'>" +
                detalle +
            "</div>" +
        "</div>"
    );
}


function obtenerCuentasAgotadasDashboardPro() {
    return cuentasJugadores.filter(
        function(cuenta) {
            if (cuenta.estado !== "abierta") {
                return false;
            }

            const estacion =
                obtenerEstacionPorId(
                    cuenta.estacionId
                );

            return (
                estacion &&
                Number(estacion.segundos) <= 0 &&
                !estacion.activo
            );
        }
    );
}

function obtenerProductosStockBajoDashboardPro() {
    return productos
        .filter(function(producto) {
            if (producto.activo === false) {
                return false;
            }

            const stock =
                Number(producto.stock) || 0;

            const minimo =
                Number(producto.stockMinimo);

            const limite =
                isFinite(minimo)
                    ? minimo
                    : 0;

            return stock <= limite;
        })
        .sort(function(a, b) {
            return (
                (Number(a.stock) || 0) -
                (Number(b.stock) || 0)
            );
        });
}

function obtenerProximasReservasDashboardPro(limite) {
    const hoy =
        obtenerFecha();

    const ahora =
        new Date();

    return reservas
        .filter(function(reserva) {
            if (
                String(reserva.fecha) !==
                String(hoy)
            ) {
                return false;
            }

            if (
                reserva.estado === "cancelada" ||
                reserva.estado === "completada"
            ) {
                return false;
            }

            return (
                fechaHoraReservaPro(
                    reserva
                ).getTime() >=
                ahora.getTime()
            );
        })
        .sort(function(a, b) {
            return (
                fechaHoraReservaPro(a) -
                fechaHoraReservaPro(b)
            );
        })
        .slice(
            0,
            Number(limite) || 3
        );
}



function cerrarMenuPro() {
    const menu =
        document.getElementById("v292-menu-overlay");

    if (menu) {
        menu.remove();
    }
}

function mostrarMenuPro() {
    cerrarMenuPro();

    const overlay =
        document.createElement("div");

    overlay.id =
        "v292-menu-overlay";

    overlay.className =
        "v292-menu-overlay";

    overlay.innerHTML =
        "<div class='v292-menu-backdrop' " +
            "onclick='cerrarMenuPro()'></div>" +

        "<section class='v292-menu-panel' " +
            "role='dialog' " +
            "aria-modal='true'>" +

            "<header class='v292-menu-header'>" +
                "<div>" +
                    "<span class='v292-menu-kicker'>CONTROL DE VIDEOJUEGOS</span>" +
                    "<h2>☰ Menú</h2>" +
                    "<p>Accesos rápidos de administración</p>" +
                "</div>" +
                "<button class='v292-close' " +
                    "onclick='cerrarMenuPro()'>✕</button>" +
            "</header>" +

            "<div class='v298-menu-list'>" +

                "<button onclick='cerrarMenuPro(); mostrarCuentasAbiertas()'>" +
                    "🧾 Cuentas abiertas" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarAdministrarEstaciones()'>" +
                    "🎮 Estaciones" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarReservasPro()'>" +
                    "📅 Reservas PRO" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarHistorial()'>" +
                    "📋 Historial" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarTicketsPro()'>" +
                    "🧾 Tickets PRO" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarInventario()'>" +
                    "🛒 Inventario" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarGastos()'>" +
                    "💸 Gastos" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarReportesAvanzados()'>" +
                    "📈 Reportes PRO" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarClientes()'>" +
                    "👥 Clientes PRO" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarMembresias()'>" +
                    "⭐ Membresías" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarUsuariosPro()'>" +
                    "🛡️ Usuarios PRO" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarConfiguracion()'>" +
                    "⚙️ Configuración" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarRespaldo()'>" +
                    "💾 Respaldo" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarCierreCaja()'>" +
                    "🔒 Cierre de caja" +
                "</button>" +

                "<button onclick='cerrarMenuPro(); mostrarHistorialCierres()'>" +
                    "📚 Historial de cierres" +
                "</button>" +

            "</div>" +

            "<footer class='v292-menu-footer'>" +
                "<span>💡 El Panel PRO contiene las estadísticas.</span>" +
                "<button onclick='cerrarMenuPro(); mostrarPanelPro()'>" +
                    "📊 Panel PRO" +
                "</button>" +
            "</footer>" +

        "</section>";

    document.body.appendChild(overlay);

    requestAnimationFrame(function() {
        overlay.classList.add("v292-menu-visible");
    });
}


function mostrarPanelPro() {
    vistaActual = "panel_pro";

    const contenedor =
        document.getElementById("estaciones");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    const panel =
        document.createElement("div");

    panel.className =
        "v289-panel-page";

    panel.innerHTML =
        "<div class='v289-panel-header'>" +
            "<div>" +
                "<div class='v27-eyebrow'>📊 CENTRO DE CONTROL</div>" +
                "<h1>Panel PRO</h1>" +
                "<p>Ventas, operación y estadísticas en un solo lugar.</p>" +
            "</div>" +
            "<button class='v289-back-button' onclick='mostrarEstaciones()'>← Estaciones</button>" +
        "</div>" +

        "<div class='v289-panel-content'>" +
            construirDashboard() +
            construirOperacionDashboardPro() +
        "</div>";

    contenedor.appendChild(panel);
}

function construirOperacionDashboardPro() {
    const cuentasAgotadas =
        obtenerCuentasAgotadasDashboardPro();

    const stockBajo =
        obtenerProductosStockBajoDashboardPro();

    const proximas =
        obtenerProximasReservasDashboardPro(
            3
        );

    let alertas = "";

    if (cuentasAgotadas.length) {
        alertas +=
            "<button class='v285-alert-card v285-alert-danger' " +
            "onclick='mostrarCuentasAbiertas()'>" +
                "<div>⏰</div>" +
                "<span>TIEMPO AGOTADO</span>" +
                "<strong>" +
                    cuentasAgotadas.length +
                " cuenta" +
                    (
                        cuentasAgotadas.length === 1
                            ? ""
                            : "s"
                    ) +
                "</strong>" +
                "<small>Revisa y cobra o agrega tiempo.</small>" +
            "</button>";
    }

    if (stockBajo.length) {
        alertas +=
            "<button class='v285-alert-card v285-alert-warning' " +
            "onclick='mostrarInventario()'>" +
                "<div>📦</div>" +
                "<span>STOCK BAJO</span>" +
                "<strong>" +
                    stockBajo.length +
                " producto" +
                    (
                        stockBajo.length === 1
                            ? ""
                            : "s"
                    ) +
                "</strong>" +
                "<small>" +
                    escaparHTML(
                        stockBajo
                            .slice(0, 2)
                            .map(
                                function(p) {
                                    return (
                                        p.nombre +
                                        " (" +
                                        Number(
                                            p.stock
                                        ) +
                                        ")"
                                    );
                                }
                            )
                            .join(" · ")
                    ) +
                    (
                        stockBajo.length > 2
                            ? " · ..."
                            : ""
                    ) +
                "</small>" +
            "</button>";
    }

    if (!alertas) {
        alertas =
            "<div class='v285-alert-card v285-alert-ok'>" +
                "<div>✅</div>" +
                "<span>OPERACIÓN</span>" +
                "<strong>Todo bajo control</strong>" +
                "<small>No hay alertas operativas importantes.</small>" +
            "</div>";
    }

    let reservasHTML =
        "";

    if (proximas.length) {
        reservasHTML =
            proximas.map(
                function(reserva) {
                    return (
                        "<div class='v285-next-row'>" +
                            "<strong>" +
                                escaparHTML(
                                    reserva.hora
                                ) +
                            "</strong>" +
                            "<span>" +
                                escaparHTML(
                                    reserva.cliente
                                ) +
                                " · " +
                                escaparHTML(
                                    reserva.estacion
                                ) +
                            "</span>" +
                        "</div>"
                    );
                }
            ).join("");
    } else {
        reservasHTML =
            "<div class='v285-next-empty'>" +
                "No hay reservas próximas hoy." +
            "</div>";
    }

    return (
        "<section class='v285-operation'>" +

            "<div class='v285-section-head'>" +
                "<div>" +
                    "<span>CONTROL EN TIEMPO REAL</span>" +
                    "<h2>⚡ Operación</h2>" +
                "</div>" +
                "<small>" +
                    obtenerHora() +
                "</small>" +
            "</div>" +

            "<div class='v285-operation-grid'>" +

                "<div class='v285-operation-card'>" +
                    "<div class='v285-operation-icon'>🎮</div>" +
                    "<span>SESIONES ACTIVAS</span>" +
                    "<strong>" +
                        obtenerEstacionesDisponibles()
                            .filter(
                                function(e) {
                                    return e.activo;
                                }
                            ).length +
                    "</strong>" +
                    "<small>Estaciones jugando ahora</small>" +
                "</div>" +

                "<div class='v285-operation-card'>" +
                    "<div class='v285-operation-icon'>🧾</div>" +
                    "<span>CUENTAS ABIERTAS</span>" +
                    "<strong>" +
                        cuentasJugadores.length +
                    "</strong>" +
                    "<small>" +
                        dinero(
                            obtenerTotalCuentasAbiertas()
                        ) +
                        " por cobrar" +
                    "</small>" +
                "</div>" +

                "<div class='v285-operation-card'>" +
                    "<div class='v285-operation-icon'>⏰</div>" +
                    "<span>AGOTADAS</span>" +
                    "<strong>" +
                        cuentasAgotadas.length +
                    "</strong>" +
                    "<small>Esperando cobro o más tiempo</small>" +
                "</div>" +

                "<div class='v285-operation-card'>" +
                    "<div class='v285-operation-icon'>📦</div>" +
                    "<span>STOCK BAJO</span>" +
                    "<strong>" +
                        stockBajo.length +
                    "</strong>" +
                    "<small>Productos para revisar</small>" +
                "</div>" +

            "</div>" +

            "<div class='v285-operation-columns'>" +

                "<div class='v285-subpanel'>" +
                    "<div class='v285-subpanel-head'>" +
                        "<div>" +
                            "<span>ATENCIÓN</span>" +
                            "<h3>🚨 Alertas</h3>" +
                        "</div>" +
                    "</div>" +
                    "<div class='v285-alert-grid'>" +
                        alertas +
                    "</div>" +
                "</div>" +

                "<div class='v285-subpanel'>" +
                    "<div class='v285-subpanel-head'>" +
                        "<div>" +
                            "<span>AGENDA</span>" +
                            "<h3>📅 Próximas reservas</h3>" +
                        "</div>" +
                        "<button onclick='mostrarReservasPro()'>Ver todas</button>" +
                    "</div>" +
                    "<div class='v285-next-list'>" +
                        reservasHTML +
                    "</div>" +
                "</div>" +

            "</div>" +

            "<div class='v285-quick-actions'>" +
                "<button onclick='mostrarCaja()'>💰 Caja</button>" +
                "<button onclick='mostrarTicketsPro()'>🧾 Tickets</button>" +
                "<button class='v291-panel-button' onclick='mostrarInventario()'>🛒 Inventario</button>" +
                "<button onclick='mostrarCuentasAbiertas()'>📋 Cuentas</button>" +
                "<button onclick='mostrarReservasPro()'>📅 Reservas</button>" +
                "<button onclick='mostrarReportesAvanzados()'>📈 Reportes</button>" +
            "</div>" +

        "</section>"
    );
}

function construirDashboard() {
    asegurarEstadisticasDia();

    const datos = calcularDashboardHoy();
    const topProducto =
        obtenerTopProductoDashboard();
    const topEstacion =
        obtenerTopEstacionDashboard();

    const estaciones =
        obtenerEstacionesDisponibles();

    const ocupadas =
        estaciones.filter(function(estacion) {
            return estacion.activo ||
                (estacion.pausada && estacion.segundos > 0);
        }).length;

    const disponibles =
        estaciones.length - ocupadas;

    const horaActual =
        new Date().getHours();

    let estacionesHTML = "";

    estaciones.forEach(function(estacion) {
        estacionesHTML +=
            crearTarjetaEstadoDashboard(estacion);
    });

    const proximaReserva =
        obtenerProximaReserva();

    const reservasHoy =
        obtenerReservasHoy().length;

    const reservasPendientes =
        obtenerReservasPendientes().length;

    const horaTexto =
        new Date().toLocaleTimeString(
            "es-MX",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    let reservaDetalle =
        "No hay próximas reservas.";

    if (proximaReserva) {
        reservaDetalle =
            "<strong>" +
            escaparHTML(
                proximaReserva.reserva.cliente
            ) +
            "</strong> · " +
            escaparHTML(
                proximaReserva.reserva.hora
            ) +
            " · " +
            escaparHTML(
                proximaReserva.reserva.xbox
            );
    }

    const promedioTicket =
        datos.sesiones > 0
            ? Number(datos.ventas) /
              Number(datos.sesiones)
            : 0;

    const utilizacion =
        estaciones.length > 0
            ? Math.round(
                (ocupadas /
                estaciones.length) *
                100
              )
            : 0;

    return (
        "<div class='v27-dashboard-hero v27-dashboard-pro'>" +

            "<div class='v27-dashboard-header'>" +
                "<div>" +
                    "<div class='v27-eyebrow'>🎮 CONTROL GAMING CENTER</div>" +
                    "<h1>Dashboard</h1>" +
                    "<p>" +
                        obtenerFechaBonita(obtenerFecha()) +
                        " · Actualizado a las " +
                        horaTexto +
                    "</p>" +
                "</div>" +

                "<div class='v27-dashboard-status'>" +
                    (
                        estadoCaja === "abierta"
                            ? "<span class='v27-live-dot'></span> CAJA ABIERTA"
                            : "<span class='v27-live-dot v27-live-dot-off'></span> CAJA CERRADA"
                    ) +
                "</div>" +
            "</div>" +

            "<div class='v27-dashboard-main-money'>" +
                "<div>" +
                    "<span>VENTAS DE HOY</span>" +
                    "<strong>" + dinero(datos.ventas) + "</strong>" +
                    "<small>" +
                        datos.tickets +
                        " tickets · promedio " +
                        dinero(promedioTicket) +
                    "</small>" +
                "</div>" +
                "<div class='v27-money-icon'>💰</div>" +
            "</div>" +

            "<div class='v27-dashboard-metrics'>" +

                crearTarjetaDashboard(
                    "🎮",
                    "Videojuegos",
                    dinero(datos.ventas - datos.ventasProductos),
                    "Ingresos por sesiones"
                ) +

                crearTarjetaDashboard(
                    "🛒",
                    "Consumos",
                    dinero(datos.ventasProductos),
                    datos.unidadesProductos + " unidades"
                ) +

                crearTarjetaDashboard(
                    "⏱️",
                    "Tiempo vendido",
                    datos.horasVendidas.toFixed(1) + " h",
                    datos.minutosVendidos + " minutos"
                ) +

                crearTarjetaDashboard(
                    "🟢",
                    "Ganancia",
                    dinero(datos.ganancia),
                    "Ventas menos gastos"
                ) +

                crearTarjetaDashboard(
                    "💸",
                    "Gastos",
                    dinero(datos.gastos),
                    "Registrados hoy"
                ) +

                crearTarjetaDashboard(
                    "🧾",
                    "Por cobrar",
                    dinero(datos.pendienteCobro),
                    datos.cuentasAbiertas + " cuentas abiertas"
                ) +

                crearTarjetaDashboard(
                    "⭐",
                    "Puntos",
                    estadisticasDia.puntosOtorgados,
                    "Otorgados hoy"
                ) +

                crearTarjetaDashboard(
                    "👥",
                    "Clientes",
                    estadisticasDia.clientes,
                    "Atendidos hoy"
                ) +

                crearTarjetaDashboard(
                    "🔥",
                    "Uso de estaciones",
                    utilizacion + "%",
                    ocupadas + " ocupadas · " + disponibles + " libres"
                ) +

            "</div>" +

            construirOperacionDashboardPro() +

            "<div class='v27-dashboard-grid'>" +

                "<section class='v27-dashboard-panel v27-hour-panel'>" +
                    "<div class='v27-panel-head'>" +
                        "<div><span>VENTAS</span><h2>📈 Ventas por hora</h2></div>" +
                        "<strong>" +
                            (horaActual < 10 ? "0" : "") +
                            horaActual +
                            ":00" +
                        "</strong>" +
                    "</div>" +
                    construirGraficaHorasDashboard() +
                    "<p class='v27-panel-note'>" +
                        "Ventas registradas durante el día actual." +
                    "</p>" +
                "</section>" +

                "<section class='v27-dashboard-panel'>" +
                    "<div class='v27-panel-head'>" +
                        "<div><span>RESUMEN</span><h2>💳 Métodos de pago</h2></div>" +
                        "<small>Hoy</small>" +
                    "</div>" +

                    "<div class='v27-payment-row'>" +
                        "<span>💵 Efectivo</span>" +
                        "<strong>" + dinero(datos.efectivo) + "</strong>" +
                    "</div>" +
                    "<div class='v27-payment-row'>" +
                        "<span>💳 Tarjeta</span>" +
                        "<strong>" + dinero(datos.tarjeta) + "</strong>" +
                    "</div>" +
                    "<div class='v27-payment-row'>" +
                        "<span>📱 Transferencia</span>" +
                        "<strong>" + dinero(datos.transferencia) + "</strong>" +
                    "</div>" +

                    "<div class='v27-payment-total'>" +
                        "<span>CAJA ESPERADA</span>" +
                        "<strong>" + dinero(obtenerEfectivoEsperado()) + "</strong>" +
                    "</div>" +

                    "<div class='v285-payment-extra'>" +
                        "<div>" +
                            "<span>💸 GASTOS</span>" +
                            "<strong>" +
                                dinero(datos.gastos) +
                            "</strong>" +
                        "</div>" +
                        "<div>" +
                            "<span>📈 NETO</span>" +
                            "<strong>" +
                                dinero(
                                    Number(datos.ventas) -
                                    Number(datos.gastos)
                                ) +
                            "</strong>" +
                        "</div>" +
                    "</div>" +

                "</section>" +

                "<section class='v27-dashboard-panel'>" +
                    "<div class='v27-panel-head'>" +
                        "<div><span>DESTACADOS</span><h2>🏆 Lo que más vende</h2></div>" +
                        "<small>Hoy</small>" +
                    "</div>" +

                    "<div class='v27-highlight'>" +
                        "<div class='v27-highlight-icon'>🛒</div>" +
                        "<div>" +
                            "<span>PRODUCTO MÁS VENDIDO</span>" +
                            "<strong>" +
                                (
                                    topProducto
                                        ? escaparHTML(topProducto.nombre)
                                        : "Sin ventas todavía"
                                ) +
                            "</strong>" +
                            "<small>" +
                                (
                                    topProducto
                                        ? "x" + topProducto.cantidad +
                                          " · " +
                                          dinero(topProducto.ingresos)
                                        : "Agrega productos para ver el ranking."
                                ) +
                            "</small>" +
                        "</div>" +
                    "</div>" +

                    "<div class='v27-highlight'>" +
                        "<div class='v27-highlight-icon'>🎮</div>" +
                        "<div>" +
                            "<span>ESTACIÓN CON MÁS INGRESOS</span>" +
                            "<strong>" +
                                (
                                    topEstacion
                                        ? escaparHTML(topEstacion.nombre)
                                        : "Sin sesiones todavía"
                                ) +
                            "</strong>" +
                            "<small>" +
                                (
                                    topEstacion
                                        ? topEstacion.sesiones +
                                          " sesiones · " +
                                          dinero(topEstacion.ingresos)
                                        : "Inicia sesiones para crear el ranking."
                                ) +
                            "</small>" +
                        "</div>" +
                    "</div>" +
                "</section>" +

                "<section class='v27-dashboard-panel'>" +
                    "<div class='v27-panel-head'>" +
                        "<div><span>AGENDA</span><h2>📅 Reservas</h2></div>" +
                        "<button onclick='mostrarReservas()'>Ver agenda</button>" +
                    "</div>" +
                    "<div class='v27-reservation-summary'>" +
                        "<div><span>HOY</span><strong>" + reservasHoy + "</strong></div>" +
                        "<div><span>PENDIENTES</span><strong>" + reservasPendientes + "</strong></div>" +
                    "</div>" +
                    "<p class='v27-next-reservation'>" +
                        "Próxima: " + reservaDetalle +
                    "</p>" +
                "</section>" +

            "</div>" +

            "<section class='v27-dashboard-panel v27-live-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>EN TIEMPO REAL</span><h2>🎮 Estaciones</h2></div>" +
                    "<strong>" +
                        ocupadas + " ocupadas · " +
                        disponibles + " disponibles" +
                    "</strong>" +
                "</div>" +

                (
                    estacionesHTML
                        ? "<div class='v27-live-stations'>" +
                          estacionesHTML +
                          "</div>"
                        : "<div class='v27-empty-inline'>No hay estaciones habilitadas.</div>"
                ) +
            "</section>" +

            "<div class='v27-dashboard-tools'>" +
                "<button onclick='guardarCorteDia()'>🔒 Guardar corte</button>" +
                "<button onclick='mostrarHistorialCortes()'>📚 Cortes</button>" +
                "<button onclick='exportarDashboardCSV()'>📄 Exportar CSV</button>" +
                "<button onclick='volverInicio()'>🏠 Inicio</button>" +
            "</div>" +

        "</div>"
    );
}

// ========================================
// PANTALLA PRINCIPAL
// ========================================

function mostrarEstaciones() {
    if (typeof sesionUsuarioIniciadaPro !== "undefined" &&
        !sesionUsuarioIniciadaPro) {
        mostrarLoginPro();
        return;
    }

    vistaActual = "inicio";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const resumen =
        document.createElement("div");

    resumen.className =
        "v27-home v291-home";

    resumen.innerHTML =
        "<div class='v299-home-actions'>" +

            "<button class='v291-panel-button' " +
                "onclick='mostrarPanelPro()'>" +
                "📊 Panel PRO" +
            "</button>" +

            "<button class='v291-panel-button' onclick='mostrarCuentasAbiertas()'>🧾 Cuentas abiertas</button>" +
            "<button class='v291-panel-button' onclick='mostrarAdministrarEstaciones()'>🎮 Estaciones</button>" +
            "<button class='v291-panel-button' onclick='mostrarReservasPro()'>📅 Reservas PRO</button>" +
            "<button class='v291-panel-button' onclick='mostrarHistorial()'>📋 Historial</button>" +
            "<button class='v291-panel-button' onclick='mostrarTicketsPro()'>🧾 Tickets PRO</button>" +
            "<button class='v291-panel-button' onclick='mostrarInventario()'>🛒 Inventario</button>" +
            "<button class='v291-panel-button' onclick='mostrarGastos()'>💸 Gastos</button>" +
            "<button class='v291-panel-button' onclick='mostrarReportesAvanzados()'>📈 Reportes PRO</button>" +
            "<button class='v291-panel-button' onclick='mostrarClientes()'>👥 Clientes PRO</button>" +
            "<button class='v291-panel-button' onclick='mostrarMembresias()'>⭐ Membresías</button>" +
            "<button class='v291-panel-button' onclick='mostrarUsuariosPro()'>🛡️ Usuarios PRO</button>" +
            "<button class='v291-panel-button' onclick='mostrarConfiguracion()'>⚙️ Configuración</button>" +
            "<button class='v291-panel-button' onclick='mostrarRespaldo()'>💾 Respaldo</button>" +
            "<button class='v291-panel-button' onclick='mostrarCierreCaja()'>🔒 Cierre de caja</button>" +
            "<button class='v291-panel-button' onclick='mostrarHistorialCierres()'>📚 Historial de cierres</button>" +

        "</div>";

    if (estadoCaja === "pendiente") {
        resumen.innerHTML +=
            "<div class='v291-cash-notice'>" +
                "<strong>🔒 CAJA CERRADA</strong>" +
                "<span>La jornada de hoy todavía no ha comenzado.</span>" +
                "<button onclick='abrirCaja()'>" +
                    "🌅 Abrir caja" +
                "</button>" +
            "</div>";
    }

    if (estadoCaja === "cerrada") {
        resumen.innerHTML +=
            "<div class='v291-cash-notice'>" +
                "<strong>🔒 CAJA CERRADA</strong>" +
                "<span>La caja de hoy ya fue cerrada.</span>" +
                "<div>" +
                    "<button onclick='nuevoDia()'>🌅 Nuevo día / 🔓 Abrir caja</button>" +
                    "<button onclick='reabrirCaja()'>🔓 Reabrir caja</button>" +
                "</div>" +
            "</div>";
    }

    if (estadoCaja === "pendiente") {
        resumen.innerHTML +=
            "<h3>🔒 CAJA CERRADA</h3>" +
            "<p>La jornada de hoy todavía no ha comenzado.</p>" +
            "<button onclick='abrirCaja()'>" +
            "🌅 Nuevo día / 🔓 Abrir caja" +
            "</button>";
    }

    if (estadoCaja === "cerrada") {
        resumen.innerHTML +=
            "<h3>🔒 CAJA CERRADA</h3>" +
            "<p>La caja de hoy ya fue cerrada.</p>" +
            "<button onclick='nuevoDia()'>" +
            "🌅 Nuevo día / 🔓 Abrir caja" +
            "</button>" +
            "<button onclick='reabrirCaja()'>" +
            "🔓 Reabrir caja (si fue por error)" +
            "</button>";
    }

    if (estadoCaja === "abierta") {
        resumen.innerHTML +=
            "<h3>🟢 CAJA ABIERTA</h3>";
    }

    contenedor.appendChild(resumen);

    const estacionesHabilitadas =
        obtenerEstacionesDisponibles();

    if (estacionesHabilitadas.length === 0) {
        const aviso = document.createElement("div");

        aviso.style.margin = "16px 0";
        aviso.style.padding = "18px";
        aviso.style.borderRadius = "16px";
        aviso.style.background = "rgba(245,158,11,.12)";

        aviso.innerHTML =
            "<h2>⚠️ No hay estaciones habilitadas</h2>" +
            "<p>Agrega o habilita una estación desde configuración.</p>" +
            "<button onclick='mostrarAdministrarEstaciones()'>" +
            "🎮 Administrar estaciones" +
            "</button>";

        contenedor.appendChild(aviso);
    }

    estacionesHabilitadas.forEach(function(estacion) {
        const preciosEstacion =
            obtenerPreciosEstacion(estacion);

        const cuentaEstacion =
            obtenerCuentaPorEstacion(estacion.id);

        const reservaEnCurso =
            obtenerReservaEnCursoEstacion(
                estacion.id
            );

        const proximaReserva =
            obtenerProximaReservaEstacion(
                estacion.id
            );

        const tarjeta = document.createElement("div");

        const tipoClase =
            String(estacion.tipo || "otro")
                .toLowerCase()
                .replace(/[^a-z0-9áéíóúñ]+/gi, "-");

        tarjeta.className =
            "estacion v27-station-card v27-station-" +
            tipoClase;

        let textoEstado;
        let claseEstado;

        const cuentaAbiertaSinTiempo =
            cuentaEstacion &&
            !estacion.activo &&
            Number(estacion.segundos) <= 0 &&
            !estacion.pausada;

        const avisoSegundos =
            Number(configuracion.avisoMinutos || 10) * 60;

        if (
            estacion.pausada &&
            estacion.segundos > 0
        ) {
            textoEstado = "⏸️ PAUSADA";
            claseEstado = "pausada";
        } else if (
            estacion.activo &&
            estacion.segundos > 0 &&
            estacion.segundos <= avisoSegundos
        ) {
            textoEstado =
                "⚠️ QUEDAN " +
                Math.ceil(estacion.segundos / 60) +
                " MIN";

            claseEstado = "por-terminar";
        } else if (estacion.activo) {
            textoEstado = "🟢 JUGANDO";
            claseEstado = "jugando";
        } else if (estacion.terminado) {
            textoEstado = "🔴 TERMINADA";
            claseEstado = "terminada";
        } else {
            textoEstado = "⚪ DISPONIBLE";
            claseEstado = "disponible";
        }

        if (cuentaAbiertaSinTiempo) {
            textoEstado =
                "🔴 TIEMPO AGOTADO · CUENTA ABIERTA";
            claseEstado =
                "terminada";
        }

        tarjeta.classList.add(claseEstado);

        if (
            reservaEnCurso &&
            !estacion.activo
        ) {
            textoEstado = "🔵 RESERVADA AHORA";
            claseEstado = "por-terminar";
        } else if (
            proximaReserva &&
            !estacion.activo
        ) {
            textoEstado = "📅 RESERVADA";
            claseEstado = "terminada";
        }

        let infoSesion = "";

        if (estacion.cliente) {
            infoSesion =
                "<div class='sesion-info'>" +
                "<p><strong>👤 Cliente:</strong> " +
                escaparHTML(estacion.cliente) +
                "</p>" +

                "<p><strong>🧾 Cuenta:</strong> $" +
                (
                    cuentaEstacion
                        ? obtenerTotalCuenta(cuentaEstacion)
                        : (Number(estacion.precioSesion) || 0)
                ) +
                "</p>" +

                "<p><strong>⏱️ Usado:</strong> " +
                formatearTiempo(
                    obtenerTiempoUsado(estacion)
                ) +
                "</p>" +

                "<p><strong>⏳ Restante:</strong> " +
                formatearTiempo(estacion.segundos) +
                "</p>" +

                (
                    estacion.inicioSesion
                        ? "<p><strong>🕐 Inicio:</strong> " +
                          estacion.inicioSesion +
                          "</p>"
                        : ""
                ) +

                (
                    cuentaEstacion &&
                    cuentaEstacion.nota
                        ? "<p><strong>📝 Nota:</strong> " +
                          escaparHTML(cuentaEstacion.nota) +
                          "</p>"
                        : ""
                ) +

                "</div>";
        } else if (estacion.segundos > 0) {
            infoSesion =
                "<div class='sesion-info'>" +
                "<p><strong>👤 Cliente:</strong> Sin nombre</p>" +
                "<p><strong>⏳ Tiempo:</strong> " +
                formatearTiempo(estacion.segundos) +
                "</p>" +
                "</div>";
        }

        tarjeta.innerHTML =
            "<div class='v27-station-head v27-pro-head'>" +
            "<div class='v27-station-title-wrap'>" +
            "<div class='v27-station-icon'>" +
            iconoTipoEstacion(estacion.tipo) +
            "</div>" +
            "<div>" +
            "<h2>" + escaparHTML(estacion.nombre) + "</h2>" +
            "<div class='v27-station-subtitle'>" +
            escaparHTML(estacion.tipo || "Estación") +
            "</div>" +
            "</div>" +
            "</div>" +
            "<span class='v27-station-type'>" +
            (estacion.tipo || "ESTACIÓN").toUpperCase() +
            "</span>" +
            "</div>" +
            "<div class='estado " + claseEstado + "'>" +
            textoEstado +
            "</div>" +

            "<div class='v27-session-strip'>" +
            "<div><span>ESTADO</span><strong>" +
            textoEstado +
            "</strong></div>" +
            "<div><span>TIEMPO</span><strong>" +
            formatearTiempo(estacion.segundos) +
            "</strong></div>" +
            (
                estacion.cliente
                    ? "<div><span>CLIENTE</span><strong>" +
                      escaparHTML(estacion.cliente) +
                      "</strong></div>"
                    : "<div><span>CLIENTE</span><strong>Disponible</strong></div>"
            ) +
            "</div>" +
            "<div class='tiempo'>" +
            formatearTiempo(estacion.segundos) +
            "</div>" +

            infoSesion +

            (
                reservaEnCurso
                    ? "<div class='sesion-info' style='border:1px solid rgba(59,130,246,.5);'>" +
                      "<p><strong>📅 Reserva:</strong> " +
                      escaparHTML(reservaEnCurso.cliente) +
                      "</p>" +
                      "<p>🕐 " +
                      escaparHTML(reservaEnCurso.hora) +
                      " · " +
                      reservaEnCurso.duracion +
                      " min</p>" +
                      "</div>"
                    : (
                        proximaReserva
                            ? "<div class='sesion-info'>" +
                              "<p><strong>📅 Próxima reserva:</strong> " +
                              escaparHTML(proximaReserva.cliente) +
                              "</p>" +
                              "<p>🕐 " +
                              escaparHTML(proximaReserva.fecha) +
                              " · " +
                              escaparHTML(proximaReserva.hora) +
                              " · " +
                              proximaReserva.duracion +
                              " min</p>" +
                              "</div>"
                            : ""
                      )
            ) +

            "<p style='opacity:.75;font-size:13px;'>" +
            "💰 " +
            (
                estacion.usarPreciosPersonalizados
                    ? "Tarifa personalizada"
                    : "Tarifa general"
            ) +
            "</p>" +

            "<div class='v27-actions-title'>💰 Nueva sesión</div>" +

            "<div class='v27-time-options'>" +

            preciosEstacion.lista.map(function(tarifa, indice) {
                return (
                    "<button class='v27-action-primary " +
                    (
                        indice ===
                        preciosEstacion.lista.length - 1
                            ? "v27-action-featured"
                            : ""
                    ) +
                    "' onclick='venderTiempo(" +
                    estacion.id +
                    "," +
                    Number(tarifa.minutos) +
                    "," +
                    Number(tarifa.precio) +
                    ")'>" +
                    (
                        indice ===
                        preciosEstacion.lista.length - 1
                            ? "⭐ "
                            : ""
                    ) +
                    formatearDuracionTarifa(
                        tarifa.minutos
                    ) +
                    " · $" +
                    Number(tarifa.precio).toFixed(2) +
                    "</button>"
                );
            }).join("") +

            "</div>" +

            (
                proximaReserva &&
                puedeIniciarReserva(proximaReserva)
                    ? "<button class='v27-reservation-action' onclick='iniciarReserva(" +
                      proximaReserva.id +
                      ")'>▶️ Iniciar reserva de " +
                      escaparHTML(proximaReserva.cliente) +
                      "</button>"
                    : ""
            ) +

            "<div class='v27-action-divider'></div>" +

            "<div class='v27-actions-title'>⚡ Control de sesión</div>" +

            "<div class='v27-control-options'>" +

            (
                preciosEstacion.lista.length > 0
                    ? "<button onclick='agregarTiempoMinutos(" +
                      estacion.id +
                      "," +
                      Number(preciosEstacion.lista[0].minutos) +
                      "," +
                      Number(preciosEstacion.lista[0].precio) +
                      ")'>+ " +
                      formatearDuracionTarifa(
                          preciosEstacion.lista[0].minutos
                      ) +
                      "</button>"
                    : ""
            ) +

            (
                preciosEstacion.lista.length > 1
                    ? "<button onclick='agregarTiempoMinutos(" +
                      estacion.id +
                      "," +
                      Number(preciosEstacion.lista[1].minutos) +
                      "," +
                      Number(preciosEstacion.lista[1].precio) +
                      ")'>+ " +
                      formatearDuracionTarifa(
                          preciosEstacion.lista[1].minutos
                      ) +
                      "</button>"
                    : ""
            ) +

            (
                cuentaEstacion
                    ? "<button onclick='mostrarCuentaJugador(" +
                      cuentaEstacion.id +
                      ")'>🧾 Cuenta $" +
                      obtenerTotalCuenta(cuentaEstacion) +
                      "</button>" +

                      "<button class='v286-pay-account-button' onclick='cobrarCuenta(" +
                      cuentaEstacion.id +
                      ")'>💰 Cobrar cuenta</button>" +

                      "<button onclick='mostrarProductosCuenta(" +
                      cuentaEstacion.id +
                      ")'>🛒 Consumo</button>" +

                      "<button onclick='cambiarEstacionCuenta(" +
                      cuentaEstacion.id +
                      ")'>🔄 Cambiar estación</button>" +

                      "<button onclick='editarNotaCuenta(" +
                      cuentaEstacion.id +
                      ")'>📝 Nota</button>" +

                      (
                          estacion.activo
                              ? "<button onclick='pausarSesion(" +
                                estacion.id +
                                ")'>⏸️ Pausar</button>"
                              : (
                                  estacion.pausada &&
                                  estacion.segundos > 0
                                      ? "<button onclick='reanudarSesion(" +
                                        estacion.id +
                                        ")'>▶️ Reanudar</button>"
                                      : ""
                                )
                      )
                    : ""
            ) +

            "</div>" +

            "<div class='v27-secondary-options'>" +

            "<button class='v27-start-button' onclick='iniciar(" +
            estacion.id + ")'>▶️ Iniciar</button>" +

            "<button class='v27-stop-button' onclick='detener(" +
            estacion.id + ")'>⏹️ Detener</button>" +

            "<button onclick='reiniciar(" +
            estacion.id + ")'>🔄 Reiniciar</button>" +

            "</div>";

        contenedor.appendChild(tarjeta);
    });
}


// ========================================
// DASHBOARD Y CORTE DEL DIA
// ========================================

function asegurarEstadisticasDia() {
    const hoy = obtenerFecha();

    if (!estadisticasDia || estadisticasDia.fecha !== hoy) {
        estadisticasDia = {
            fecha: hoy,
            ventasJuegos: 0,
            ventasProductos: 0,
            totalVentas: 0,
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0,
            clientes: 0,
            tickets: 0,
            minutosJugados: 0,
            puntosOtorgados: 0,
            productosVendidos: 0,
            ventasPorHora: Array(24).fill(0)
        };
    }

    asegurarVentasPorHora();
}

function asegurarVentasPorHora() {
    if (!estadisticasDia) {
        return;
    }

    if (!Array.isArray(estadisticasDia.ventasPorHora) ||
        estadisticasDia.ventasPorHora.length !== 24) {
        estadisticasDia.ventasPorHora =
            Array(24).fill(0);
    }
}

function dinero(valor) {
    return "$" + Number(valor || 0).toFixed(2);
}

function registrarVentaDia(datosVenta) {
    asegurarEstadisticasDia();

    const total = Number(datosVenta.total) || 0;
    const juegos = Number(datosVenta.juegos) || 0;
    const productosVenta = Math.max(0, Number(datosVenta.productos) || 0);
    const metodo = String(datosVenta.metodo || "").toLowerCase();

    estadisticasDia.ventasJuegos += juegos;
    estadisticasDia.ventasProductos += productosVenta;
    estadisticasDia.totalVentas += total;
    estadisticasDia.tickets += 1;
    estadisticasDia.clientes += Number(datosVenta.clienteContado) || 1;
    estadisticasDia.minutosJugados += Number(datosVenta.minutos) || 0;
    estadisticasDia.productosVendidos += Number(datosVenta.cantidadProductos) || 0;

    if (metodo.includes("efectivo") || metodo.includes("cash")) {
        estadisticasDia.efectivo += total;
    } else if (metodo.includes("tarjeta") || metodo.includes("card")) {
        estadisticasDia.tarjeta += total;
    } else if (metodo.includes("transfer")) {
        estadisticasDia.transferencia += total;
    }

    estadisticasDia.puntosOtorgados += Math.max(0, Number(datosVenta.puntos) || 0);

    asegurarVentasPorHora();

    const horaActual =
        new Date().getHours();

    estadisticasDia.ventasPorHora[horaActual] +=
        total;

    guardarDatos();
}

function mostrarDashboard() {
    if (!exigirPermisoPro("reportes")) {
        return;
    }

    asegurarEstadisticasDia();

    vistaActual = "dashboard";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    div.className =
        "v27-dashboard-page";

    div.innerHTML =
        construirDashboard();

    contenedor.appendChild(div);

    setTimeout(function() {
        aplicarPermisosMenuPro();
    }, 0);
}

function guardarCorteDia() {
    asegurarEstadisticasDia();
    const s = estadisticasDia;

    if (!confirm(
        "🔒 CORTE DEL DÍA\n\n" +
        "📅 " + s.fecha + "\n" +
        "💰 Total: " + dinero(s.totalVentas) + "\n" +
        "🎮 Juegos: " + dinero(s.ventasJuegos) + "\n" +
        "🛒 Productos: " + dinero(s.ventasProductos) + "\n" +
        "💵 Efectivo: " + dinero(s.efectivo) + "\n" +
        "💳 Tarjeta: " + dinero(s.tarjeta) + "\n" +
        "📱 Transferencia: " + dinero(s.transferencia) + "\n" +
        "🧾 Tickets: " + s.tickets + "\n" +
        "👥 Clientes: " + s.clientes +
        "\n\n¿Guardar este corte?"
    )) return;

    historialCortes.push(Object.assign({}, s, {
        creadoEn: new Date().toISOString()
    }));

    guardarDatos();
    alert("✅ Corte guardado.\n\nTotal: " + dinero(s.totalVentas));
}

function mostrarHistorialCortes() {
    const contenedor = document.getElementById("estaciones");
    contenedor.innerHTML = "";

    const div = document.createElement("div");
    let html = "<h1>📚 Historial de cortes</h1>";

    if (!historialCortes.length) {
        html += "<p>🟢 Todavía no hay cortes guardados.</p>";
    }

    historialCortes.slice().reverse().forEach(function(corte) {
        html +=
            "<div style='padding:16px;margin-bottom:12px;border-radius:16px;background:rgba(255,255,255,.06);'>" +
            "<h2>📅 " + escaparHTML(corte.fecha) + "</h2>" +
            "<p>💰 Total: <strong>" + dinero(corte.totalVentas) + "</strong></p>" +
            "<p>🎮 " + dinero(corte.ventasJuegos) +
            " · 🛒 " + dinero(corte.ventasProductos) + "</p>" +
            "<p>🧾 " + corte.tickets +
            " tickets · 👥 " + corte.clientes + " clientes</p>" +
            "</div>";
    });

    html += "<button onclick='mostrarDashboard()'>⬅️ Dashboard</button>";
    div.innerHTML = html;
    contenedor.appendChild(div);
}

function exportarDashboardCSV() {
    asegurarEstadisticasDia();
    const s = estadisticasDia;

    const filas = [
        ["Fecha", s.fecha],
        ["Ventas totales", s.totalVentas],
        ["Ventas videojuegos", s.ventasJuegos],
        ["Ventas productos", s.ventasProductos],
        ["Efectivo", s.efectivo],
        ["Tarjeta", s.tarjeta],
        ["Transferencia", s.transferencia],
        ["Clientes", s.clientes],
        ["Tickets", s.tickets],
        ["Minutos jugados", s.minutosJugados],
        ["Puntos otorgados", s.puntosOtorgados],
        ["Productos vendidos", s.productosVendidos]
    ];

    asegurarVentasPorHora();

    for (let hora = 0; hora < 24; hora++) {
        filas.push([
            "Ventas " +
            String(hora).padStart(2, "0") +
            ":00",
            s.ventasPorHora[hora] || 0
        ]);
    }

    const csv = filas.map(function(fila) {
        return fila.map(function(valor) {
            return "\"" + String(valor).replace(/"/g, "\"\"") + "\"";
        }).join(",");
    }).join("\n");

    descargarArchivo(
        "Dashboard_" + s.fecha + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );
}

// ========================================
// MEMBRESIAS + PUNTOS
// ========================================

let configuracionMembresia = {
    puntosActivos: true,
    puntosPorPeso: 1,
    puntosPorHora: 10,
    descuentoPuntos: 100,
    descuentoPesos: 20,
    mediaHoraPuntos: 250,
    unaHoraPuntos: 500
};

function claveMembresia(nombre) {
    return String(nombre || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function obtenerClienteMembresia(nombre) {
    const clave = claveMembresia(nombre);

    if (!clave || clave === "sin nombre") {
        return null;
    }

    return clientesMembresia.find(function(cliente) {
        return claveMembresia(cliente.nombre) === clave;
    }) || null;
}


function inicializarReservasPro() {
    if (!Array.isArray(reservas)) {
        reservas = [];
    }

    reservas.forEach(function(r, i) {
        if (!r) {
            return;
        }

        if (
            r.id === null ||
            typeof r.id === "undefined" ||
            String(r.id).trim() === ""
        ) {
            r.id =
                "R-" +
                Date.now().toString(36).toUpperCase() +
                "-" +
                i;
        }

        r.estado =
            r.estado || "pendiente";

        r.fecha =
            r.fecha || obtenerFecha();

        r.hora =
            r.hora || "18:00";

        r.duracion =
            Math.max(
                30,
                Number(r.duracion) || 60
            );

        if (!r.estacionId) {
            const estacion =
                obtenerEstacionPorNombre(
                    r.estacion
                );

            if (estacion) {
                r.estacionId =
                    Number(estacion.id);
            }
        }

        if (!r.estacion && r.estacionId) {
            const estacion =
                obtenerEstacionPorId(
                    r.estacionId
                );

            if (estacion) {
                r.estacion =
                    estacion.nombre;
            }
        }

        if (r.estacionId) {
            r.estacionId =
                Number(r.estacionId);
        }

        r.estacion =
            String(r.estacion || "");

        r.cliente =
            String(r.cliente || "");

        r.precio =
            Math.max(
                0,
                Number(
                    typeof r.precio !== "undefined"
                        ? r.precio
                        : r.precioEstimado
                ) || 0
            );

        r.precioEstimado =
            Number(
                r.precioEstimado
            ) || r.precio;

        r.anticipo =
            Math.max(
                0,
                Number(r.anticipo) || 0
            );

        if (r.anticipo > r.precio) {
            r.anticipo = r.precio;
        }

        r.notas =
            String(r.notas || "");

        if (!r.tipoEstacion && r.estacionId) {
            const estacion =
                obtenerEstacionPorId(
                    r.estacionId
                );

            if (estacion) {
                r.tipoEstacion =
                    estacion.tipo;
            }
        }
    });
}


function fechaHoraReservaPro(r) {
    return new Date(String(r.fecha) + "T" + String(r.hora || "00:00") + ":00");
}

function finReservaPro(r) {
    return new Date(fechaHoraReservaPro(r).getTime() + Number(r.duracion || 0) * 60000);
}

function solapaReservaPro(a, b) {
    if (String(a.fecha) !== String(b.fecha)) return false;
    return fechaHoraReservaPro(a).getTime() < finReservaPro(b).getTime() &&
           fechaHoraReservaPro(b).getTime() < finReservaPro(a).getTime();
}

function sesionSolapaReservaPro(
    estacionId,
    fecha,
    hora,
    duracion
) {
    if (String(fecha) !== String(obtenerFecha())) {
        return false;
    }

    const estacion =
        obtenerEstacionPorId(estacionId);

    if (!estacion) {
        return false;
    }

    const tieneSesion =
        estacion.activo === true ||
        Number(estacion.segundos) > 0 ||
        estacion.pausada === true;

    if (!tieneSesion) {
        return false;
    }

    const inicioNueva =
        fechaHoraReservaMs(
            fecha,
            hora
        );

    if (inicioNueva === null) {
        return true;
    }

    const ahora =
        Date.now();

    let inicioSesion =
        ahora;

    if (estacion.inicioSesion) {
        const posibleInicio =
            fechaHoraReservaMs(
                obtenerFecha(),
                estacion.inicioSesion
            );

        if (
            posibleInicio !== null &&
            posibleInicio <= ahora
        ) {
            inicioSesion = posibleInicio;
        }
    }

    let finSesion =
        Number(estacion.finalizaEn) || 0;

    if (!finSesion || finSesion <= ahora) {
        finSesion =
            ahora +
            Math.max(
                0,
                Number(estacion.segundos) || 0
            ) *
            1000;
    }

    if (finSesion <= inicioNueva) {
        return false;
    }

    const finNueva =
        inicioNueva +
        Number(duracion || 0) *
        60 *
        1000;

    return (
        inicioNueva < finSesion &&
        finNueva > inicioSesion
    );
}

function estacionDisponibleParaReservaPro(
    estacion,
    fecha,
    hora,
    duracion,
    ignorarId
) {
    const estacionObj =
        typeof estacion === "object"
            ? estacion
            : obtenerEstacionPorNombre(estacion);

    const estacionId =
        estacionObj
            ? estacionObj.id
            : Number(estacion);

    const nombreEstacion =
        estacionObj
            ? String(estacionObj.nombre || "")
            : String(estacion || "");

    if (
        estacionId === null ||
        typeof estacionId === "undefined" ||
        String(estacionId) === "NaN"
    ) {
        return false;
    }

    if (
        sesionSolapaReservaPro(
            estacionId,
            fecha,
            hora,
            duracion
        )
    ) {
        return false;
    }

    const prueba = {
        estacionId: Number(estacionId),
        estacion: nombreEstacion,
        fecha: fecha,
        hora: hora,
        duracion: duracion
    };

    return !reservas.some(function(r) {
        if (!r) {
            return false;
        }

        if (
            ignorarId &&
            String(r.id) === String(ignorarId)
        ) {
            return false;
        }

        if (
            r.estado === "cancelada" ||
            r.estado === "completada"
        ) {
            return false;
        }

        const reservaId =
            Number(r.estacionId);

        const coincidePorId =
            Number.isFinite(reservaId) &&
            reservaId === Number(estacionId);

        const coincidePorNombre =
            !Number.isFinite(reservaId) &&
            String(r.estacion) === nombreEstacion;

        if (
            !coincidePorId &&
            !coincidePorNombre
        ) {
            return false;
        }

        return solapaReservaPro(
            prueba,
            r
        );
    });
}


function estadoReservaPro(r) {
    if (r.estado === "cancelada") {
        return {
            clase: "cancelada",
            texto: "🔴 CANCELADA"
        };
    }

    if (r.estado === "completada") {
        return {
            clase: "completada",
            texto: "⚪ COMPLETADA"
        };
    }

    if (r.estado === "en_curso") {
        return {
            clase: "curso",
            texto: "🟢 EN CURSO"
        };
    }

    const fin =
        fechaHoraReservaMs(
            r.fecha,
            r.hora
        );

    if (
        fin !== null &&
        fin +
            Number(r.duracion || 0) *
            60 *
            1000 <=
            Date.now()
    ) {
        return {
            clase: "vencida",
            texto: "⚠️ VENCIDA"
        };
    }

    if (r.estado === "confirmada") {
        return {
            clase: "confirmada",
            texto: "🔵 CONFIRMADA"
        };
    }

    return {
        clase: "pendiente",
        texto: "🟡 PENDIENTE"
    };
}


function reservasDelDiaPro(fecha) {
    return reservas.filter(function(r) {
        return String(r.fecha) === String(fecha);
    }).sort(function(a, b) {
        return fechaHoraReservaPro(a) - fechaHoraReservaPro(b);
    });
}

function crearReservaPro() {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const estaciones =
        obtenerEstacionesDisponibles();

    if (!estaciones.length) {
        alert(
            "Primero configura al menos una estación."
        );
        return;
    }

    const nombre =
        prompt("👤 Nombre del cliente:");

    if (!nombre) {
        return;
    }

    const limpio =
        String(nombre)
            .trim()
            .replace(/\s+/g, " ");

    if (!limpio) {
        return;
    }

    let cliente =
        obtenerClienteMembresia(limpio);

    if (!cliente) {
        if (
            !confirm(
                "No existe ese cliente.\n\n" +
                "¿Quieres registrarlo?"
            )
        ) {
            return;
        }

        cliente =
            crearClienteMembresia(
                limpio
            );
    }

    const opciones =
        estaciones
            .map(function(e, i) {
                return (
                    (i + 1) +
                    " = " +
                    String(
                        e.nombre ||
                        e.id ||
                        (
                            "Estación " +
                            (i + 1)
                        )
                    )
                );
            })
            .join("\n");

    const seleccion =
        prompt(
            "🎮 Selecciona estación:\n\n" +
            opciones
        );

    const indice =
        Number(seleccion) - 1;

    if (
        indice < 0 ||
        indice >= estaciones.length
    ) {
        alert(
            "❌ Estación no válida."
        );
        return;
    }

    const estacion =
        estaciones[indice];

    const nombreEstacion =
        estacion.nombre ||
        estacion.id ||
        (
            "Estación " +
            (indice + 1)
        );

    const fecha =
        prompt(
            "📅 Fecha (AAAA-MM-DD):",
            obtenerFecha()
        );

    if (
        fecha === null ||
        !esFechaValidaReserva(
            fecha.trim()
        )
    ) {
        alert(
            "❌ Fecha no válida."
        );
        return;
    }

    const fechaLimpia =
        fecha.trim();

    const hora =
        prompt(
            "🕐 Hora de la reserva:\n\n" +
            "Ejemplo: 12:49 PM o 18:49",
            "06:00 PM"
        );

    if (
        hora === null ||
        !esHoraValidaReserva(
            hora.trim()
        )
    ) {
        alert(
            "❌ Hora no válida. Usa 18:49 o 06:49 PM."
        );
        return;
    }

    const horaLimpia =
        normalizarHoraReserva(hora.trim());

    const inicio =
        fechaHoraReservaMs(
            fechaLimpia,
            horaLimpia
        );

    if (
        inicio === null ||
        inicio <= Date.now()
    ) {
        alert(
            "⏰ La reserva debe ser para una hora futura."
        );
        return;
    }

    const duracion =
        Number(
            prompt(
                "⏱️ Duración en minutos:\n\n" +
                "30 / 60 / 90 / 120 / 180",
                "60"
            )
        );

    if (
        !Number.isFinite(duracion) ||
        duracion < 30 ||
        duracion % 30 !== 0
    ) {
        alert(
            "❌ La duración debe ser de al menos 30 minutos " +
            "y en bloques de 30."
        );
        return;
    }

    if (
        !estacionDisponibleParaReservaPro(
            estacion,
            fechaLimpia,
            horaLimpia,
            duracion
        )
    ) {
        alert(
            "🚫 Esa estación ya está ocupada o reservada " +
            "en ese horario."
        );
        return;
    }

    const precios =
        obtenerPreciosEstacion(
            estacion
        );

    const precioSugerido =
        tarifaPorMinutosPro(
            precios,
            duracion
        );

    const precioTexto =
        prompt(
            "💰 Precio acordado:",
            String(precioSugerido)
        );

    if (precioTexto === null) {
        return;
    }

    const precio =
        Number(
            String(precioTexto)
                .replace(",", ".")
        );

    if (
        !Number.isFinite(precio) ||
        precio < 0
    ) {
        alert(
            "❌ Precio no válido."
        );
        return;
    }

    const anticipoTexto =
        prompt(
            "💵 Anticipo (0 si no hay):",
            "0"
        );

    if (anticipoTexto === null) {
        return;
    }

    const anticipo =
        Number(
            String(anticipoTexto)
                .replace(",", ".")
        );

    if (
        !Number.isFinite(anticipo) ||
        anticipo < 0 ||
        anticipo > precio
    ) {
        alert(
            "❌ El anticipo no puede ser mayor que el precio."
        );
        return;
    }

    const notas =
        prompt(
            "📝 Notas (opcional):",
            ""
        );

    if (notas === null) {
        return;
    }

    const reservaNueva = {
        id:
            "R-" +
            Date.now()
                .toString(36)
                .toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 5)
                .toUpperCase(),

        cliente:
            cliente.nombre,

        clienteId:
            cliente.id,

        estacion:
            nombreEstacion,

        estacionId:
            Number(estacion.id),

        tipoEstacion:
            estacion.tipo,

        fecha:
            fechaLimpia,

        hora:
            horaLimpia,

        duracion:
            duracion,

        precio:
            precio,

        precioEstimado:
            precio,

        anticipo:
            anticipo,

        estado:
            "confirmada",

        notas:
            String(notas || "").trim(),

        creadaEn:
            new Date().toISOString()
    };

    reservas.push(
        reservaNueva
    );

    guardarDatos();
    mostrarReservasPro();

    alert(
        "✅ Reserva creada.\n\n" +
        "📅 " +
        fechaLimpia +
        " · " +
        horaLimpia +
        "\n🎮 " +
        nombreEstacion +
        "\n👤 " +
        cliente.nombre +
        "\n⏱️ " +
        duracion +
        " minutos\n💰 " +
        dinero(precio) +
        (
            anticipo > 0
                ? "\n💵 Anticipo: " +
                  dinero(anticipo) +
                  "\n📌 Pendiente: " +
                  dinero(precio - anticipo)
                : ""
        )
    );
}


function cambiarFechaReservasPro(delta) {
    const actual =
        window.reservaFechaSeleccionada ||
        obtenerFecha();

    const partes =
        actual.split("-").map(Number);

    const d =
        new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

    d.setDate(
        d.getDate() +
        Number(delta)
    );

    // No usar toISOString(): en México puede retroceder
    // al día anterior por la zona horaria.
    const fechaLocal =
        d.getFullYear() +
        "-" +
        String(
            d.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            d.getDate()
        ).padStart(2, "0");

    window.reservaFechaSeleccionada =
        fechaLocal;

    mostrarReservasPro();
}


function irHoyReservasPro() {
    window.reservaFechaSeleccionada = obtenerFecha();
    mostrarReservasPro();
}

function confirmarReservaPro(id) {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const r =
        obtenerReservaPorId(id);

    if (!r) {
        return;
    }

    if (r.estado !== "pendiente") {
        return;
    }

    const inicio =
        fechaHoraReservaMs(
            r.fecha,
            r.hora
        );

    if (
        inicio === null ||
        inicio <= Date.now()
    ) {
        alert(
            "⏰ Esta reserva ya no puede confirmarse " +
            "porque su horario ya comenzó."
        );
        return;
    }

    if (
        !estacionDisponibleParaReservaPro(
            r.estacionId,
            r.fecha,
            r.hora,
            Number(r.duracion) || 30,
            r.id
        )
    ) {
        alert(
            "🚫 Ya existe un conflicto con esa estación."
        );
        return;
    }

    r.estado =
        "confirmada";

    r.confirmadaEn =
        new Date().toISOString();

    guardarDatos();
    mostrarReservasPro();
}

function cancelarReservaPro(id) {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const r =
        obtenerReservaPorId(id);

    if (!r) {
        return;
    }

    if (r.estado === "en_curso") {
        alert(
            "⚠️ Esta reserva ya está en curso.\n\n" +
            "Primero cobra o cancela la cuenta de la estación."
        );
        return;
    }

    if (
        r.estado === "cancelada" ||
        r.estado === "completada"
    ) {
        return;
    }

    const pendiente =
        Math.max(
            0,
            Number(r.precio || 0) -
            Number(r.anticipo || 0)
        );

    const confirmar =
        confirm(
            "✕ CANCELAR RESERVA\n\n" +
            "👤 " +
            r.cliente +
            "\n🎮 " +
            r.estacion +
            "\n📅 " +
            r.fecha +
            " · " +
            r.hora +
            (
                Number(r.anticipo) > 0
                    ? "\n💵 Anticipo registrado: " +
                      dinero(r.anticipo) +
                      "\n📌 Pendiente: " +
                      dinero(pendiente)
                    : ""
            ) +
            "\n\n¿Cancelar la reserva?"
        );

    if (!confirmar) {
        return;
    }

    r.estado =
        "cancelada";

    r.canceladaEn =
        new Date().toISOString();

    guardarDatos();
    mostrarReservasPro();
}

function completarReservaPro(id) {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const r =
        obtenerReservaPorId(id);

    if (!r) {
        return;
    }

    if (r.estado !== "en_curso") {
        return;
    }

    const cuenta =
        cuentasJugadores.find(
            function(item) {
                return (
                    item &&
                    String(
                        item.reservaId
                    ) ===
                    String(r.id) &&
                    item.estado === "abierta"
                );
            }
        );

    if (cuenta) {
        alert(
            "💰 Primero cobra la cuenta de esta reserva.\n\n" +
            "La reserva se marcará como completada automáticamente al cobrar."
        );
        return;
    }

    r.estado =
        "completada";

    r.completadaEn =
        new Date().toISOString();

    guardarDatos();
    mostrarReservasPro();
}

function editarReservaPro(id) {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const r =
        obtenerReservaPorId(id);

    if (!r) {
        return;
    }

    if (
        r.estado === "en_curso" ||
        r.estado === "completada" ||
        r.estado === "cancelada"
    ) {
        alert(
            "⚠️ Esta reserva ya no se puede editar."
        );
        return;
    }

    const fecha =
        prompt(
            "📅 Fecha (AAAA-MM-DD):",
            r.fecha
        );

    if (fecha === null) {
        return;
    }

    const fechaLimpia =
        fecha.trim();

    if (
        !esFechaValidaReserva(
            fechaLimpia
        )
    ) {
        alert(
            "❌ Fecha no válida."
        );
        return;
    }

    const hora =
        prompt(
            "🕐 Hora de la reserva:\n\n" +
            "Ejemplo: 12:49 PM o 18:49",
            formatearHoraReserva(r.hora)
        );

    if (hora === null) {
        return;
    }

    const horaLimpia =
        normalizarHoraReserva(hora.trim());

    if (
        !esHoraValidaReserva(
            horaLimpia
        )
    ) {
        alert(
            "❌ Hora no válida. Usa 18:49 o 06:49 PM."
        );
        return;
    }

    const inicio =
        fechaHoraReservaMs(
            fechaLimpia,
            horaLimpia
        );

    if (
        inicio === null ||
        inicio <= Date.now()
    ) {
        alert(
            "⏰ La nueva fecha y hora deben ser futuras."
        );
        return;
    }

    const duracion =
        Number(
            prompt(
                "⏱️ Duración en minutos:",
                String(r.duracion)
            )
        );

    if (
        !Number.isFinite(duracion) ||
        duracion < 30 ||
        duracion % 30 !== 0
    ) {
        alert(
            "❌ La duración debe ser de al menos 30 minutos " +
            "y en bloques de 30."
        );
        return;
    }

    if (
        !estacionDisponibleParaReservaPro(
            r.estacionId,
            fechaLimpia,
            horaLimpia,
            duracion,
            r.id
        )
    ) {
        alert(
            "🚫 El nuevo horario se cruza con otra reserva " +
            "o con una sesión activa."
        );
        return;
    }

    r.fecha =
        fechaLimpia;

    r.hora =
        horaLimpia;

    r.duracion =
        duracion;

    guardarDatos();
    mostrarReservasPro();
}



function obtenerEstacionPorNombre(nombre) {
    const lista = obtenerEstacionesDisponibles();
    return lista.find(function(e) {
        return String(e.nombre || e.id || "") === String(nombre);
    }) || null;
}

function iniciarSesionDesdeReservaPro(id) {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const reserva =
        obtenerReservaPorId(id);

    if (!reserva) {
        alert("❌ No encontré la reserva.");
        return;
    }

    iniciarReserva(reserva.id);
}


function exportarReservasProCSV() {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    const filas = [[
        "ID", "Cliente", "Estacion", "Fecha", "Hora", "Duracion",
        "Precio", "Anticipo", "Pendiente", "Estado", "Notas"
    ]];

    reservas.slice().sort(function(a, b) {
        return fechaHoraReservaPro(a) - fechaHoraReservaPro(b);
    }).forEach(function(r) {
        filas.push([
            r.id, r.cliente, r.estacion, r.fecha, r.hora, r.duracion,
            r.precio, r.anticipo, Math.max(0, r.precio - r.anticipo),
            estadoReservaPro(r).texto, r.notas
        ]);
    });

    const csv = filas.map(function(fila) {
        return fila.map(function(v) {
            return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\n");

    descargarArchivo(
        "Reservas_PRO_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );
}

function mostrarReservasPro() {
    if (!exigirPermisoPro("reservas")) {
        return;
    }

    inicializarReservasPro();
    vistaActual = "reservas_pro";

    const contenedor = document.getElementById("estaciones");
    contenedor.innerHTML = "";

    const fecha = window.reservaFechaSeleccionada || obtenerFecha();
    const dia = reservasDelDiaPro(fecha);

    const div = document.createElement("div");
    div.className = "v27-reservas-pro-page";

    let html =
        "<div class='v27-reservas-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>🎟️ ORGANIZACIÓN DEL NEGOCIO</div>" +
                "<h1>Reservas PRO</h1>" +
                "<p>Aparta estaciones, evita cruces de horarios y convierte una reserva en sesión.</p>" +
            "</div>" +
            "<div class='v27-reservas-hero-icon'>🎟️</div>" +
        "</div>" +

        "<div class='v27-page-actions'>" +
            "<button class='v27-action-primary' onclick='crearReservaPro()'>➕ Nueva reserva</button>" +
            "<button onclick='exportarReservasProCSV()'>📄 Exportar CSV</button>" +
            "<button onclick='mostrarClientes()'>👥 Clientes PRO</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>" +

        "<div class='v27-reservas-summary'>" +
            "<div><span>📅 DÍA</span><strong>" + dia.length + "</strong><small>reservas</small></div>" +
            "<div><span>🟡 PENDIENTES</span><strong>" +
                dia.filter(function(r) { return r.estado === "pendiente"; }).length +
            "</strong><small>por confirmar</small></div>" +
            "<div><span>🔵 CONFIRMADAS</span><strong>" +
                dia.filter(function(r) { return r.estado === "confirmada"; }).length +
            "</strong><small>apartadas</small></div>" +
            "<div><span>🟢 EN CURSO</span><strong>" +
                dia.filter(function(r) { return r.estado === "en_curso"; }).length +
            "</strong><small>actualmente</small></div>" +
            "<div><span>💰 RESERVADO</span><strong>" +
                dinero(
                    dia.reduce(function(t, r) {
                        return t + (Number(r.precio) || 0);
                    }, 0)
                ) +
            "</strong><small>valor del día</small></div>" +
        "</div>" +

        "<div class='v27-reservas-datebar'>" +
            "<button onclick='cambiarFechaReservasPro(-1)'>←</button>" +
            "<div><span>CALENDARIO</span><strong>" +
                (fecha === obtenerFecha() ? "Hoy · " : "") + fecha +
            "</strong></div>" +
            "<button onclick='cambiarFechaReservasPro(1)'>→</button>" +
            "<button onclick='irHoyReservasPro()'>Hoy</button>" +
        "</div>";

    if (!dia.length) {
        html +=
            "<div class='v27-reservas-empty'>" +
                "<div>🎮</div>" +
                "<h2>No hay reservas para este día</h2>" +
                "<p>El horario está libre.</p>" +
                "<button onclick='crearReservaPro()'>➕ Crear reserva</button>" +
            "</div>";
    } else {
        html += "<div class='v27-reservas-list'>";

        dia.forEach(function(r) {
            const estado = estadoReservaPro(r);
            const pendiente = Math.max(0, Number(r.precio || 0) - Number(r.anticipo || 0));

            html +=
                "<article class='v27-reserva-card'>" +
                    "<div class='v27-reserva-time'>" +
                        "<strong>" + formatearHoraReserva(r.hora) + "</strong>" +
                        "<span>" + r.duracion + " min</span>" +
                    "</div>" +
                    "<div class='v27-reserva-main'>" +
                        "<div class='v27-reserva-title'>" +
                            "<div>" +
                                "<span class='v27-reserva-estacion'>🎮 " +
                                    escaparHTML(r.estacion) +
                                "</span>" +
                                "<h3>" + escaparHTML(r.cliente) + "</h3>" +
                            "</div>" +
                            "<span class='v27-reserva-status " + estado.clase + "'>" +
                                estado.texto +
                            "</span>" +
                        "</div>" +
                        "<div class='v27-reserva-meta'>" +
                            "<span>💰 " + dinero(r.precio) + "</span>" +
                            "<span>💵 Anticipo " + dinero(r.anticipo) + "</span>" +
                            "<span>📌 Pendiente " + dinero(pendiente) + "</span>" +
                        "</div>" +
                        (
                            r.notas
                                ? "<div class='v27-reserva-notes'>📝 " +
                                  escaparHTML(r.notas) +
                                  "</div>"
                                : ""
                        ) +
                        "<div class='v27-reserva-actions'>" +
                            (
                                (
                                    r.estado === "confirmada" ||
                                    r.estado === "pendiente"
                                ) &&
                                (
                                    fechaHoraReservaMs(
                                        r.fecha,
                                        r.hora
                                    ) +
                                    Number(r.duracion || 0) *
                                    60 *
                                    1000 >
                                    Date.now()
                                )
                                    ? "<button onclick='iniciarSesionDesdeReservaPro(\"" +
                                      r.id + "\")'>▶️ Iniciar sesión</button>"
                                    : ""
                            ) +
                            (
                                r.estado !== "cancelada" && r.estado !== "completada"
                                    ? "<button onclick='editarReservaPro(\"" +
                                      r.id + "\")'>✏️ Editar</button>"
                                    : ""
                            ) +
                            (
                                r.estado === "pendiente" &&
                                (
                                    fechaHoraReservaMs(
                                        r.fecha,
                                        r.hora
                                    ) === null ||
                                    fechaHoraReservaMs(
                                        r.fecha,
                                        r.hora
                                    ) > Date.now()
                                )
                                    ? "<button onclick='confirmarReservaPro(\"" +
                                      r.id + "\")'>🔵 Confirmar</button>"
                                    : ""
                            ) +
                            (
                                r.estado !== "cancelada" && r.estado !== "completada"
                                    ? "<button class='v27-danger-button' onclick='cancelarReservaPro(\"" +
                                      r.id + "\")'>✕ Cancelar</button>"
                                    : ""
                            ) +
                            (
                                r.estado === "en_curso"
                                    ? "<button onclick='completarReservaPro(\"" +
                                      r.id + "\")'>✅ Completar</button>"
                                    : ""
                            ) +
                        "</div>" +
                    "</div>" +
                "</article>";
        });

        html += "</div>";
    }

    html +=
        "<div class='v27-reservas-footer'>" +
            "💡 Una estación no puede tener dos reservas activas que se crucen en horario." +
        "</div>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}


// ========================================
// USUARIOS Y PERMISOS PRO
// ========================================

const PERMISOS_PRO = {
    operar: "Operar sesiones y ventas",
    caja: "Caja y movimientos",
    inventario: "Inventario y productos",
    clientes: "Clientes y membresías",
    reservas: "Reservas",
    reportes: "Reportes y estadísticas",
    configuracion: "Configuración del sistema",
    usuarios: "Usuarios y permisos"
};

const ROLES_PRO = {
    admin: {
        nombre: "Administrador",
        descripcion: "Acceso total",
        permisos: [
            "operar",
            "caja",
            "inventario",
            "clientes",
            "reservas",
            "reportes",
            "configuracion",
            "usuarios"
        ]
    },
    encargado: {
        nombre: "Encargado",
        descripcion: "Opera el negocio sin administrar usuarios",
        permisos: [
            "operar",
            "caja",
            "inventario",
            "clientes",
            "reservas",
            "reportes",
            "configuracion"
        ]
    },
    operador: {
        nombre: "Operador",
        descripcion: "Operación diaria",
        permisos: [
            "operar",
            "clientes",
            "reservas",
            "inventario"
        ]
    },
    personalizado: {
        nombre: "Personalizado",
        descripcion: "Permisos elegidos manualmente",
        permisos: []
    }
};

function generarIdUsuarioPro() {
    return (
        "USR-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36).slice(2, 7).toUpperCase()
    );
}

function normalizarUsuarioPro(usuario) {
    usuario.id =
        usuario.id ||
        generarIdUsuarioPro();

    usuario.nombre =
        String(
            usuario.nombre ||
            "Usuario"
        ).trim();

    usuario.usuario =
        String(
            usuario.usuario ||
            ""
        ).trim().toLowerCase();

    usuario.pin =
        String(
            usuario.pin ||
            "1234"
        );

    usuario.rol =
        usuario.rol &&
        ROLES_PRO[usuario.rol]
            ? usuario.rol
            : "operador";

    if (!Array.isArray(usuario.permisos)) {
        usuario.permisos =
            ROLES_PRO[usuario.rol].permisos.slice();
    }

    usuario.activo =
        usuario.activo !== false;

    usuario.creadoEn =
        usuario.creadoEn ||
        new Date().toISOString();

    usuario.ultimoAcceso =
        usuario.ultimoAcceso ||
        "";

    return usuario;
}

function inicializarUsuariosPro() {
    if (!Array.isArray(usuariosPro)) {
        usuariosPro = [];
    }

    usuariosPro =
        usuariosPro.map(
            normalizarUsuarioPro
        );

    const admin =
        usuariosPro.find(function(usuario) {
            return usuario.rol === "admin";
        });

    if (!admin) {
        usuariosPro.unshift(
            normalizarUsuarioPro({
                id: generarIdUsuarioPro(),
                nombre: "Administrador",
                usuario: "admin",
                pin: "1234",
                rol: "admin",
                permisos:
                    ROLES_PRO.admin.permisos.slice(),
                activo: true
            })
        );
    }
}

function obtenerUsuarioPorNombrePro(nombreUsuario) {
    const buscado =
        String(
            nombreUsuario || ""
        ).trim().toLowerCase();

    return usuariosPro.find(function(usuario) {
        return (
            usuario.usuario ===
            buscado
        );
    }) || null;
}

function tienePermisoPro(permiso) {
    if (!sesionUsuarioIniciadaPro || !usuarioActualPro) {
        return false;
    }

    if (
        usuarioActualPro.rol === "admin"
    ) {
        return true;
    }

    return (
        Array.isArray(
            usuarioActualPro.permisos
        ) &&
        usuarioActualPro.permisos.includes(
            permiso
        )
    );
}

function exigirPermisoPro(permiso, mostrarMensaje) {
    if (tienePermisoPro(permiso)) {
        return true;
    }

    if (mostrarMensaje !== false) {
        alert(
            "🔒 No tienes permiso para realizar esta acción."
        );
    }

    return false;
}


function registrarActividadSeguridadPro() {
    ultimaActividadSeguridadPro = Date.now();
}

function minutosBloqueoAutomaticoPro() {
    const minutos = Number(
        configuracion &&
        configuracion.bloqueoInactividadMinutos
    );

    if (!isFinite(minutos) || minutos <= 0) {
        return 0;
    }

    return minutos;
}

function comprobarBloqueoAutomaticoPro() {
    if (
        bloqueoAutomaticoEnCursoPro ||
        !sesionUsuarioIniciadaPro ||
        !usuarioActualPro
    ) {
        return;
    }

    const minutos =
        minutosBloqueoAutomaticoPro();

    if (minutos <= 0) {
        return;
    }

    if (
        Date.now() -
        ultimaActividadSeguridadPro >=
        minutos * 60 * 1000
    ) {
        bloquearPorInactividadPro();
    }
}

function bloquearPorInactividadPro() {
    if (
        bloqueoAutomaticoEnCursoPro ||
        !sesionUsuarioIniciadaPro
    ) {
        return;
    }

    bloqueoAutomaticoEnCursoPro = true;

    registrarActividadPro(
        "Bloqueo automático",
        "Sesión bloqueada por inactividad.",
        "seguridad"
    );

    guardarDatos();

    usuarioActualPro = null;
    sesionUsuarioIniciadaPro = false;
    vistaActual = "login";
    ultimaActividadSeguridadPro = Date.now();

    mostrarLoginPro();

    const ayuda =
        document.querySelector(
            "#estaciones .v27-login-help"
        );

    if (ayuda) {
        ayuda.insertAdjacentHTML(
            "afterbegin",
            "<strong>🔒 Sesión bloqueada por seguridad</strong>"
        );
    }

    bloqueoAutomaticoEnCursoPro = false;
}

function configurarBloqueoAutomaticoPro() {
    if (!exigirPermisoPro("configuracion")) {
        return;
    }

    const actual =
        minutosBloqueoAutomaticoPro();

    const respuesta =
        prompt(
            "🔐 Bloqueo automático por inactividad\n\n" +
            "Minutos sin actividad antes de bloquear.\n" +
            "0 = desactivado.\n\n" +
            "Valor actual: " +
            actual +
            " minutos.",
            String(actual)
        );

    if (respuesta === null) {
        return;
    }

    const minutos = Number(respuesta);

    if (
        !isFinite(minutos) ||
        minutos < 0 ||
        minutos > 1440
    ) {
        alert(
            "❌ Escribe un valor entre 0 y 1440 minutos."
        );
        return;
    }

    configuracion.bloqueoInactividadMinutos =
        Math.floor(minutos);

    registrarActividadPro(
        "Seguridad modificada",
        configuracion.bloqueoInactividadMinutos > 0
            ? "Bloqueo automático: " +
              configuracion.bloqueoInactividadMinutos +
              " minutos."
            : "Bloqueo automático desactivado.",
        "seguridad"
    );

    guardarDatos();
    registrarActividadSeguridadPro();

    alert(
        configuracion.bloqueoInactividadMinutos > 0
            ? "✅ Bloqueo automático configurado a " +
              configuracion.bloqueoInactividadMinutos +
              " minutos."
            : "✅ Bloqueo automático desactivado."
    );
}

function registrarActividadPro(
    accion,
    detalle,
    tipo
) {
    registroActividadPro =
        Array.isArray(
            registroActividadPro
        )
            ? registroActividadPro
            : [];

    registroActividadPro.unshift({
        id:
            "ACT-" +
            Date.now().toString(36).toUpperCase(),
        fecha:
            obtenerFecha(),
        hora:
            obtenerHora(),
        usuarioId:
            usuarioActualPro
                ? usuarioActualPro.id
                : "",
        usuario:
            usuarioActualPro
                ? usuarioActualPro.nombre
                : "Sistema",
        accion:
            String(accion || ""),
        detalle:
            String(detalle || ""),
        tipo:
            String(tipo || "info")
    });

    if (
        registroActividadPro.length >
        1000
    ) {
        registroActividadPro =
            registroActividadPro.slice(
                0,
                1000
            );
    }
}

function guardarUsuariosPro() {
    guardarDatos();
}

function iniciarSesionPro() {
    const nombreUsuario =
        document.getElementById(
            "v27-login-user"
        );

    const pin =
        document.getElementById(
            "v27-login-pin"
        );

    const usuario =
        obtenerUsuarioPorNombrePro(
            nombreUsuario
                ? nombreUsuario.value
                : ""
        );

    if (!usuario || !usuario.activo) {
        mostrarErrorLoginPro(
            "Usuario no encontrado o desactivado."
        );
        return;
    }

    if (
        String(usuario.pin) !==
        String(
            pin ? pin.value : ""
        )
    ) {
        mostrarErrorLoginPro(
            "PIN o contraseña incorrecta."
        );
        registrarActividadPro(
            "Inicio de sesión fallido",
            "Usuario: " +
                String(
                    nombreUsuario
                        ? nombreUsuario.value
                        : ""
                ),
            "seguridad"
        );
        guardarDatos();
        return;
    }

    usuarioActualPro =
        usuario;

    sesionUsuarioIniciadaPro =
        true;

    registrarActividadSeguridadPro();

    usuario.ultimoAcceso =
        new Date().toISOString();

    registrarActividadPro(
        "Inicio de sesión",
        "Acceso correcto",
        "seguridad"
    );

    guardarDatos();

    mostrarEstaciones();
}

function cerrarSesionPro() {
    // Cerrar la sesión del administrador NO termina las sesiones
    // de los clientes. Solo persistimos el estado actual y salimos.
    sincronizarTemporizadoresPersistidos();

    if (
        usuarioActualPro
    ) {
        registrarActividadPro(
            "Cierre de sesión",
            "Sesión finalizada",
            "seguridad"
        );
    }

    guardarDatos();

    usuarioActualPro =
        null;

    sesionUsuarioIniciadaPro =
        false;

    registrarActividadSeguridadPro();

    mostrarLoginPro();
}

function mostrarErrorLoginPro(mensaje) {
    const error =
        document.getElementById(
            "v27-login-error"
        );

    if (error) {
        error.textContent =
            mensaje;

        error.style.display =
            "block";
    }
}

function mostrarLoginPro() {
    vistaActual = "login";
    sesionUsuarioIniciadaPro =
        false;

    usuarioActualPro =
        null;

    const contenedor =
        document.getElementById(
            "estaciones"
        );

    contenedor.innerHTML =
        "<div class='v27-login-page'>" +
            "<div class='v27-login-card'>" +
                "<div class='v27-login-icon'>🔐</div>" +
                "<div class='v27-eyebrow'>CONTROL DE VIDEOJUEGOS</div>" +
                "<h1>Acceso al sistema</h1>" +
                "<p>Ingresa con tu usuario para acceder al panel.</p>" +

                "<label>Usuario</label>" +
                "<input id='v27-login-user' autocomplete='username' value='admin' placeholder='Usuario'>" +

                "<label>PIN / contraseña</label>" +
                "<input id='v27-login-pin' type='password' inputmode='numeric' autocomplete='current-password' placeholder='PIN o contraseña'>" +

                "<button class='v27-login-button' onclick='iniciarSesionPro()'>🔓 Entrar</button>" +

                "<div id='v27-login-error' class='v27-login-error'></div>" +

                "<div class='v27-login-help'>" +
                    "<strong>Primer acceso</strong>" +
                    "<span>Usuario: <b>admin</b></span>" +
                    "<span>PIN inicial: <b>1234</b></span>" +
                    "<small>Cámbialo desde Usuarios PRO después de entrar.</small>" +
                "</div>" +
            "</div>" +
        "</div>";

    const input =
        document.getElementById(
            "v27-login-pin"
        );

    if (input) {
        input.addEventListener(
            "keydown",
            function(evento) {
                if (
                    evento.key ===
                    "Enter"
                ) {
                    iniciarSesionPro();
                }
            }
        );
    }
}

function crearUsuarioPro() {
    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const nombre =
        prompt(
            "👤 Nombre del usuario:"
        );

    if (!nombre) {
        return;
    }

    const usuario =
        prompt(
            "🔑 Nombre de usuario:"
        );

    if (!usuario) {
        return;
    }

    const usuarioLimpio =
        String(usuario)
            .trim()
            .toLowerCase();

    if (
        obtenerUsuarioPorNombrePro(
            usuarioLimpio
        )
    ) {
        alert(
            "❌ Ese nombre de usuario ya existe."
        );
        return;
    }

    const pin =
        prompt(
            "🔐 PIN / contraseña:",
            "1234"
        );

    if (!pin) {
        return;
    }

    const rol =
        prompt(
            "🎭 Rol:\n\n" +
            "admin = Administrador\n" +
            "encargado = Encargado\n" +
            "operador = Operador\n" +
            "personalizado = Personalizado",
            "operador"
        );

    const rolLimpio =
        String(
            rol || "operador"
        )
            .trim()
            .toLowerCase();

    if (!ROLES_PRO[rolLimpio]) {
        alert(
            "❌ Rol no válido."
        );
        return;
    }

    const nuevo =
        normalizarUsuarioPro({
            id:
                generarIdUsuarioPro(),
            nombre:
                String(nombre).trim(),
            usuario:
                usuarioLimpio,
            pin:
                String(pin),
            rol:
                rolLimpio,
            permisos:
                ROLES_PRO[
                    rolLimpio
                ].permisos.slice(),
            activo:
                true
        });

    if (
        rolLimpio ===
        "personalizado"
    ) {
        nuevo.permisos =
            seleccionarPermisosPro(
                nuevo.permisos
            );
    }

    usuariosPro.push(
        nuevo
    );

    registrarActividadPro(
        "Usuario creado",
        nuevo.nombre +
            " (" +
            nuevo.usuario +
            ")",
        "seguridad"
    );

    guardarUsuariosPro();
    mostrarUsuariosPro();
}

function seleccionarPermisosPro(
    permisosActuales
) {
    const seleccion =
        Array.isArray(
            permisosActuales
        )
            ? permisosActuales.slice()
            : [];

    Object.keys(
        PERMISOS_PRO
    ).forEach(function(permiso) {
        const tiene =
            seleccion.includes(
                permiso
            );

        const respuesta =
            confirm(
                (
                    tiene
                        ? "☑️ "
                        : "⬜ "
                ) +
                PERMISOS_PRO[
                    permiso
                ] +
                "\n\n" +
                "¿Permitir este acceso?"
            );

        if (respuesta) {
            if (
                !seleccion.includes(
                    permiso
                )
            ) {
                seleccion.push(
                    permiso
                );
            }
        } else {
            const indice =
                seleccion.indexOf(
                    permiso
                );

            if (indice >= 0) {
                seleccion.splice(
                    indice,
                    1
                );
            }
        }
    });

    return seleccion;
}

function editarUsuarioPro(id) {
    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const usuario =
        usuariosPro.find(
            function(item) {
                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );
            }
        );

    if (!usuario) {
        return;
    }

    const nombre =
        prompt(
            "👤 Nombre:",
            usuario.nombre
        );

    if (
        nombre === null
    ) {
        return;
    }

    const pin =
        prompt(
            "🔐 PIN / contraseña:",
            usuario.pin
        );

    if (
        pin === null
    ) {
        return;
    }

    usuario.nombre =
        String(
            nombre
        ).trim();

    usuario.pin =
        String(pin);

    registrarActividadPro(
        "Usuario editado",
        usuario.nombre,
        "seguridad"
    );

    guardarUsuariosPro();
    mostrarUsuariosPro();
}

function cambiarRolUsuarioPro(id) {
    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const usuario =
        usuariosPro.find(
            function(item) {
                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );
            }
        );

    if (!usuario) {
        return;
    }

    const rol =
        prompt(
            "🎭 Rol:\n\n" +
            "admin = Administrador\n" +
            "encargado = Encargado\n" +
            "operador = Operador\n" +
            "personalizado = Personalizado",
            usuario.rol
        );

    if (
        rol === null
    ) {
        return;
    }

    const rolLimpio =
        String(
            rol
        )
            .trim()
            .toLowerCase();

    if (!ROLES_PRO[rolLimpio]) {
        alert(
            "❌ Rol no válido."
        );
        return;
    }

    usuario.rol =
        rolLimpio;

    usuario.permisos =
        ROLES_PRO[
            rolLimpio
        ].permisos.slice();

    if (
        rolLimpio ===
        "personalizado"
    ) {
        usuario.permisos =
            seleccionarPermisosPro(
                usuario.permisos
            );
    }

    registrarActividadPro(
        "Permisos modificados",
        usuario.nombre +
            " → " +
            ROLES_PRO[
                rolLimpio
            ].nombre,
        "seguridad"
    );

    guardarUsuariosPro();
    mostrarUsuariosPro();
}

function cambiarPermisosUsuarioPro(
    id
) {
    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const usuario =
        usuariosPro.find(
            function(item) {
                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );
            }
        );

    if (!usuario) {
        return;
    }

    usuario.permisos =
        seleccionarPermisosPro(
            usuario.permisos
        );

    usuario.rol =
        "personalizado";

    registrarActividadPro(
        "Permisos personalizados",
        usuario.nombre,
        "seguridad"
    );

    guardarUsuariosPro();
    mostrarUsuariosPro();
}

function alternarUsuarioPro(id) {
    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const usuario =
        usuariosPro.find(
            function(item) {
                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );
            }
        );

    if (!usuario) {
        return;
    }

    const activos =
        usuariosPro.filter(
            function(item) {
                return (
                    item.activo &&
                    item.id !==
                        usuario.id
                );
            }
        );

    if (
        usuario.activo &&
        activos.length === 0
    ) {
        alert(
            "❌ Debe quedar al menos un usuario activo."
        );
        return;
    }

    usuario.activo =
        !usuario.activo;

    registrarActividadPro(
        usuario.activo
            ? "Usuario activado"
            : "Usuario desactivado",
        usuario.nombre,
        "seguridad"
    );

    guardarUsuariosPro();
    mostrarUsuariosPro();
}

function mostrarUsuariosPro() {
    vistaActual = "usuarios_pro";

    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const contenedor =
        document.getElementById(
            "estaciones"
        );

    contenedor.innerHTML =
        "<div class='v27-users-page'>" +
            "<div class='v27-users-hero'>" +
                "<div>" +
                    "<div class='v27-eyebrow'>🔐 CONTROL DE ACCESO</div>" +
                    "<h1>Usuarios y permisos PRO</h1>" +
                    "<p>Controla quién puede operar, modificar y administrar el sistema.</p>" +
                "</div>" +
                "<div class='v27-users-icon'>🛡️</div>" +
            "</div>" +

            "<div class='v27-page-actions'>" +
                "<button class='v27-action-primary' onclick='crearUsuarioPro()'>➕ Nuevo usuario</button>" +
                "<button onclick='mostrarActividadPro()'>📜 Actividad</button>" +
                "<button onclick='configurarBloqueoAutomaticoPro()'>🔐 Seguridad</button>" +
                "<button onclick='volverInicio()'>🏠 Inicio</button>" +
                "<button onclick='cerrarSesionPro()'>🔒 Cerrar sesión</button>" +
            "</div>" +

            "<div class='v27-users-grid'>" +
                usuariosPro.map(
                    function(usuario) {
                        const rol =
                            ROLES_PRO[
                                usuario.rol
                            ] ||
                            ROLES_PRO
                                .personalizado;

                        const permisos =
                            Array.isArray(
                                usuario.permisos
                            )
                                ? usuario.permisos
                                : [];

                        return (
                            "<article class='v27-user-card'>" +
                                "<div class='v27-user-card-top'>" +
                                    "<div class='v27-user-avatar'>" +
                                        escaparHTML(
                                            usuario.nombre
                                                .charAt(0)
                                                .toUpperCase()
                                        ) +
                                    "</div>" +
                                    "<div class='v27-user-main'>" +
                                        "<h3>" +
                                            escaparHTML(
                                                usuario.nombre
                                            ) +
                                        "</h3>" +
                                        "<span>@" +
                                            escaparHTML(
                                                usuario.usuario
                                            ) +
                                        "</span>" +
                                    "</div>" +
                                    "<div class='v27-user-status " +
                                        (
                                            usuario.activo
                                                ? "activo"
                                                : "inactivo"
                                        ) +
                                    "'>" +
                                        (
                                            usuario.activo
                                                ? "● ACTIVO"
                                                : "● INACTIVO"
                                        ) +
                                    "</div>" +
                                "</div>" +

                                "<div class='v27-user-role'>" +
                                    "<strong>🎭 " +
                                        escaparHTML(
                                            rol.nombre
                                        ) +
                                    "</strong>" +
                                    "<span>" +
                                        escaparHTML(
                                            rol.descripcion
                                        ) +
                                    "</span>" +
                                "</div>" +

                                "<div class='v27-permission-chips'>" +
                                    (
                                        permisos.length
                                            ? permisos.map(
                                                function(permiso) {
                                                    return (
                                                        "<span>" +
                                                        escaparHTML(
                                                            PERMISOS_PRO[
                                                                permiso
                                                            ] ||
                                                            permiso
                                                        ) +
                                                        "</span>"
                                                    );
                                                }
                                            ).join("")
                                            : "<span>Sin permisos</span>"
                                    ) +
                                "</div>" +

                                "<div class='v27-user-actions'>" +
                                    "<button onclick='editarUsuarioPro(\"" +
                                        usuario.id +
                                    "\")'>✏️ Editar</button>" +
                                    "<button onclick='cambiarRolUsuarioPro(\"" +
                                        usuario.id +
                                    "\")'>🎭 Rol</button>" +
                                    "<button onclick='cambiarPermisosUsuarioPro(\"" +
                                        usuario.id +
                                    "\")'>🛡️ Permisos</button>" +
                                    "<button onclick='alternarUsuarioPro(\"" +
                                        usuario.id +
                                    "\")'>" +
                                        (
                                            usuario.activo
                                                ? "⏸️ Desactivar"
                                                : "▶️ Activar"
                                        ) +
                                    "</button>" +
                                "</div>" +
                            "</article>"
                        );
                    }
                ).join("") +
            "</div>" +

            "<div class='v27-users-note'>" +
                "💡 Los cambios de permisos quedan registrados en el historial de actividad." +
            "</div>" +
        "</div>";
}

function mostrarActividadPro() {
    vistaActual = "actividad_pro";

    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    const contenedor =
        document.getElementById(
            "estaciones"
        );

    const registros =
        Array.isArray(
            registroActividadPro
        )
            ? registroActividadPro
            : [];

    contenedor.innerHTML =
        "<div class='v27-activity-page'>" +
            "<div class='v27-users-hero'>" +
                "<div>" +
                    "<div class='v27-eyebrow'>📜 AUDITORÍA</div>" +
                    "<h1>Registro de actividad</h1>" +
                    "<p>Consulta quién hizo cada operación importante.</p>" +
                "</div>" +
                "<div class='v27-users-icon'>📜</div>" +
            "</div>" +

            "<div class='v27-page-actions'>" +
                "<button onclick='mostrarUsuariosPro()'>🛡️ Usuarios</button>" +
                "<button onclick='volverInicio()'>🏠 Inicio</button>" +
            "</div>" +

            (
                registros.length
                    ? "<div class='v27-activity-list'>" +
                        registros.map(
                            function(registro) {
                                return (
                                    "<article class='v27-activity-card'>" +
                                        "<div class='v27-activity-time'>" +
                                            "<strong>" +
                                                escaparHTML(
                                                    registro.hora
                                                ) +
                                            "</strong>" +
                                            "<span>" +
                                                escaparHTML(
                                                    registro.fecha
                                                ) +
                                            "</span>" +
                                        "</div>" +
                                        "<div class='v27-activity-main'>" +
                                            "<strong>" +
                                                escaparHTML(
                                                    registro.accion
                                                ) +
                                            "</strong>" +
                                            "<span>" +
                                                escaparHTML(
                                                    registro.usuario
                                                ) +
                                            "</span>" +
                                            "<p>" +
                                                escaparHTML(
                                                    registro.detalle
                                                ) +
                                            "</p>" +
                                        "</div>" +
                                    "</article>"
                                );
                            }
                        ).join("") +
                      "</div>"
                    : "<div class='v27-reservas-empty'><div>📜</div><h2>Aún no hay actividad</h2><p>Las acciones importantes aparecerán aquí.</p></div>"
            ) +
        "</div>";
}

function cambiarUsuarioActualPro() {
    if (
        !exigirPermisoPro(
            "usuarios"
        )
    ) {
        return;
    }

    cerrarSesionPro();
}

function aplicarPermisosMenuPro() {
    if (
        !sesionUsuarioIniciadaPro ||
        !usuarioActualPro
    ) {
        return;
    }

    const botones =
        document.querySelectorAll(
            ".v27-main-menu button"
        );

    botones.forEach(
        function(boton) {
            const onclick =
                boton.getAttribute(
                    "onclick"
                ) || "";

            let permiso =
                null;

            if (
                /agregarGasto|mostrarGastos|mostrarCuentasAbiertas|mostrarCierreCaja|mostrarHistorialCierres|abrirCaja/.test(onclick)
            ) {
                permiso = "caja";
            } else if (
                /mostrarInventario/.test(onclick)
            ) {
                permiso = "inventario";
            } else if (
                /mostrarClientes|mostrarMembresias/.test(onclick)
            ) {
                permiso = "clientes";
            } else if (
                /mostrarReservas/.test(onclick)
            ) {
                permiso = "reservas";
            } else if (
                /mostrarReportes|mostrarDashboard|mostrarHistorial/.test(onclick)
            ) {
                permiso = "reportes";
            } else if (
                /mostrarConfiguracion|mostrarAdministrarEstaciones|mostrarRespaldo/.test(onclick)
            ) {
                permiso = "configuracion";
            } else if (
                /mostrarUsuariosPro/.test(onclick)
            ) {
                permiso = "usuarios";
            }

            if (
                permiso &&
                !tienePermisoPro(
                    permiso
                )
            ) {
                boton.style.display =
                    "none";
            }
        }
    );

    const menu =
        document.querySelector(
            ".v27-main-menu"
        );

    if (menu) {
        const oldUserButton =
            document.querySelector(
                ".v27-current-user-button"
            );

        if (oldUserButton) {
            oldUserButton.remove();
        }

        const oldLogoutButton =
            document.querySelector(
                ".v27-current-logout-button"
            );

        if (oldLogoutButton) {
            oldLogoutButton.remove();
        }

        const userButton =
            document.createElement(
                "button"
            );

        userButton.className =
            "v27-current-user-button";

        userButton.innerHTML =
            "👤 " +
            escaparHTML(
                usuarioActualPro.nombre
            ) +
            " · " +
            escaparHTML(
                (
                    ROLES_PRO[
                        usuarioActualPro.rol
                    ] ||
                    ROLES_PRO
                        .personalizado
                ).nombre
            );

        userButton.onclick =
            function() {
                mostrarUsuariosPro();
            };

        menu.appendChild(
            userButton
        );

        const logoutButton =
            document.createElement(
                "button"
            );

        logoutButton.className =
            "v27-current-logout-button";

        logoutButton.innerHTML =
            "🔒 Cerrar sesión";

        logoutButton.onclick =
            cerrarSesionPro;

        menu.appendChild(
            logoutButton
        );
    }
}

function normalizarClientePro(cliente) {
    if (!cliente || typeof cliente !== "object") {
        return cliente;
    }

    if (typeof cliente.nombre !== "string") {
        cliente.nombre = "Cliente";
    }

    cliente.nombre =
        cliente.nombre.trim().replace(/\s+/g, " ");

    if (typeof cliente.telefono !== "string") {
        cliente.telefono = "";
    }

    if (typeof cliente.notas !== "string") {
        cliente.notas = "";
    }

    cliente.saldo =
        Math.max(0, Number(cliente.saldo) || 0);

    cliente.membresiaActiva =
        cliente.membresiaActiva !== false;

    if (typeof cliente.membresiaInicio !== "string") {
        cliente.membresiaInicio =
            cliente.creadoEn
                ? String(cliente.creadoEn).slice(0, 10)
                : obtenerFecha();
    }

    if (typeof cliente.membresiaFin !== "string") {
        cliente.membresiaFin = "";
    }

    if (typeof cliente.ultimaVisita !== "string") {
        cliente.ultimaVisita = "";
    }

    cliente.productosUnidades =
        Number(cliente.productosUnidades) || 0;

    if (!Array.isArray(cliente.movimientosCuenta)) {
        cliente.movimientosCuenta = [];
    }

    if (typeof cliente.creadoEn !== "string") {
        cliente.creadoEn =
            new Date().toISOString();
    }

    return cliente;
}

function membresiaClienteActiva(cliente) {
    if (!cliente) {
        return false;
    }

    if (cliente.membresiaActiva === false) {
        return false;
    }

    const fin =
        String(cliente.membresiaFin || "").trim();

    if (fin && fin < obtenerFecha()) {
        return false;
    }

    return puntosMembresiaActivos();
}

function crearClienteMembresia(nombre) {
    const limpio = String(nombre || "")
        .trim()
        .replace(/\s+/g, " ");

    if (!limpio || claveMembresia(limpio) === "sin nombre") {
        return null;
    }

    const existente = obtenerClienteMembresia(limpio);

    if (existente) {
        normalizarClientePro(existente);
        return existente;
    }

    const nuevoId =
        clientesMembresia.length === 0
            ? 1
            : Math.max.apply(
                null,
                clientesMembresia.map(function(cliente) {
                    return Number(cliente.id) || 0;
                })
            ) + 1;

    const hoy =
        obtenerFecha();

    const cliente = {
        id: nuevoId,
        nombre: limpio,
        telefono: "",
        notas: "",
        puntos: 0,
        sesiones: 0,
        minutos: 0,
        gasto: 0,
        productosUnidades: 0,
        saldo: 0,
        descuentoPendiente: 0,
        tiempoGratisPendiente: 0,
        membresiaActiva: true,
        membresiaInicio: hoy,
        membresiaFin: "",
        ultimaVisita: "",
        movimientos: [],
        movimientosCuenta: [],
        creadoEn: new Date().toISOString()
    };

    clientesMembresia.push(cliente);
    return cliente;
}

function sincronizarDatosClientePro() {
    if (!Array.isArray(clientesMembresia)) {
        clientesMembresia = [];
    }

    clientesMembresia.forEach(function(cliente) {
        normalizarClientePro(cliente);

        cliente.sesiones = 0;
        cliente.minutos = 0;
        cliente.gasto = 0;
        cliente.productosUnidades = 0;
        cliente.ultimaVisita = "";
    });

    historial.forEach(function(venta, indice) {
        const nombre =
            String(venta.cliente || "").trim();

        if (
            !nombre ||
            nombre.toLowerCase() === "sin nombre"
        ) {
            return;
        }

        const cliente =
            obtenerClienteMembresia(nombre);

        if (!cliente) {
            return;
        }

        const monto =
            Number(venta.precio) || 0;

        cliente.gasto += monto;

        if (venta.tipo === "producto") {
            cliente.productosUnidades +=
                Number(venta.cantidad) || 0;
        } else {
            cliente.sesiones += 1;
            cliente.minutos +=
                obtenerMinutosVenta(venta.tiempo);
        }

        const fecha =
            venta.fecha ||
            cliente.ultimaVisita ||
            "";

        const hora =
            String(venta.hora || "");

        const marca =
            String(fecha) + " " + hora + " " + indice;

        const anterior =
            cliente._ultimaMarca || "";

        if (marca > anterior) {
            cliente.ultimaVisita =
                fecha
                    ? String(fecha) +
                      (hora ? " · " + hora : "")
                    : (hora || "Registrada");
            cliente._ultimaMarca = marca;
        }
    });

    clientesMembresia.forEach(function(cliente) {
        delete cliente._ultimaMarca;
    });
}

function obtenerResumenClientePro(cliente) {
    const nombre =
        String(cliente && cliente.nombre || "").trim();

    const ventas =
        historial.filter(function(venta) {
            return (
                String(venta.cliente || "").trim().toLowerCase() ===
                nombre.toLowerCase()
            );
        });

    let gasto = 0;
    let sesiones = 0;
    let minutos = 0;
    let productos = 0;

    ventas.forEach(function(venta) {
        gasto += Number(venta.precio) || 0;

        if (venta.tipo === "producto") {
            productos +=
                Number(venta.cantidad) || 0;
        } else {
            sesiones += 1;
            minutos +=
                obtenerMinutosVenta(venta.tiempo);
        }
    });

    return {
        ventas: ventas,
        gasto: gasto,
        sesiones: sesiones,
        minutos: minutos,
        productos: productos
    };
}

function estadoMembresiaClientePro(cliente) {
    if (!cliente || cliente.membresiaActiva === false) {
        return {
            clase: "off",
            texto: "🔴 INACTIVA"
        };
    }

    const fin =
        String(cliente.membresiaFin || "").trim();

    if (fin && fin < obtenerFecha()) {
        return {
            clase: "expired",
            texto: "🟠 VENCIDA"
        };
    }

    return {
        clase: "on",
        texto: "🟢 ACTIVA"
    };
}

function nivelClientePro(cliente) {
    return nivelMembresia(
        Number(cliente && cliente.puntos) || 0
    );
}

function obtenerClientesProOrdenados() {
    return clientesMembresia
        .slice()
        .sort(function(a, b) {
            const gastoA =
                obtenerResumenClientePro(a).gasto;

            const gastoB =
                obtenerResumenClientePro(b).gasto;

            return (
                gastoB - gastoA ||
                Number(b.puntos) - Number(a.puntos) ||
                String(a.nombre).localeCompare(
                    String(b.nombre)
                )
            );
        });
}

function filtrarClientesPro() {
    const input =
        document.getElementById("v27-client-search");

    const filtro =
        String(input ? input.value : "")
            .trim()
            .toLowerCase();

    document
        .querySelectorAll(".v27-client-pro-card")
        .forEach(function(card) {
            const nombre =
                String(
                    card.getAttribute("data-client-name") || ""
                ).toLowerCase();

            const telefono =
                String(
                    card.getAttribute("data-client-phone") || ""
                ).toLowerCase();

            const estado =
                String(
                    card.getAttribute("data-client-state") || ""
                ).toLowerCase();

            const deuda =
                String(
                    card.getAttribute("data-client-debt") || ""
                ).toLowerCase();

            const mostrar =
                !filtro ||
                nombre.includes(filtro) ||
                telefono.includes(filtro) ||
                estado.includes(filtro) ||
                deuda.includes(filtro);

            card.style.display =
                mostrar ? "" : "none";
        });
}

function filtrarEstadoClientesPro(tipo) {
    const cards =
        document.querySelectorAll(
            ".v27-client-pro-card"
        );

    cards.forEach(function(card) {
        const estado =
            card.getAttribute("data-client-state");

        const deuda =
            Number(
                card.getAttribute("data-client-debt") || 0
            );

        let mostrar = true;

        if (tipo === "activos") {
            mostrar = estado === "on";
        } else if (tipo === "deuda") {
            mostrar = deuda > 0;
        } else if (tipo === "oro") {
            mostrar =
                card.getAttribute("data-client-level") === "Oro";
        }

        card.style.display =
            mostrar ? "" : "none";
    });

    const input =
        document.getElementById("v27-client-search");

    if (input) {
        input.value = "";
    }
}

function limpiarFiltroClientesPro() {
    const input =
        document.getElementById("v27-client-search");

    if (input) {
        input.value = "";
    }

    document
        .querySelectorAll(".v27-client-pro-card")
        .forEach(function(card) {
            card.style.display = "";
        });
}

function nivelMembresia(puntos) {
    const p = Number(puntos) || 0;

    if (p >= 500) {
        return { nombre: "Oro", icono: "🥇" };
    }

    if (p >= 250) {
        return { nombre: "Plata", icono: "🥈" };
    }

    return { nombre: "Bronce", icono: "🥉" };
}


function progresoNivelMembresia(puntos) {
    const p = Math.max(0, Number(puntos) || 0);

    if (p >= 500) {
        return { inicio: 500, siguiente: 500, porcentaje: 100, restante: 0, proximo: "Nivel máximo" };
    }

    if (p >= 250) {
        return { inicio: 250, siguiente: 500, porcentaje: Math.min(100, Math.round(((p - 250) / 250) * 100)), restante: 500 - p, proximo: "Oro" };
    }

    return { inicio: 0, siguiente: 250, porcentaje: Math.min(100, Math.round((p / 250) * 100)), restante: 250 - p, proximo: "Plata" };
}

function registrarMovimientoMembresia(
    cliente,
    puntos,
    motivo,
    gasto
) {
    if (
        !cliente ||
        !membresiaClienteActiva(cliente)
    ) {
        return;
    }

    const p =
        Math.floor(Number(puntos) || 0);

    cliente.puntos += p;

    cliente.movimientos.push({
        fecha: obtenerFecha(),
        hora: obtenerHora(),
        puntos: p,
        motivo: motivo || "Movimiento",
        gasto: Number(gasto) || 0
    });
}

function puntosMembresiaActivos() {
    return configuracionMembresia.puntosActivos !== false;
}

function alternarPuntosMembresia() {
    const estabanActivos =
        puntosMembresiaActivos();

    if (estabanActivos) {
        const confirmar =
            confirm(
                "¿Desactivar el sistema de puntos?\n\n" +
                "Los puntos que ya tienen los clientes NO se borrarán.\n" +
                "Solo se pausará la ganancia y el canje de puntos."
            );

        if (!confirmar) {
            return;
        }
    }

    configuracionMembresia.puntosActivos =
        !estabanActivos;

    guardarDatos();
    mostrarConfiguracionMembresia();
}

function mostrarConfiguracionMembresia() {
    vistaActual = "membresias";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    const c =
        configuracionMembresia;

    const estadoPuntos =
        puntosMembresiaActivos();

    div.innerHTML =
        "<h1>⚙️ Configuración de puntos</h1>" +
        "<p>Estos valores controlan cuánto gana el cliente y cuánto cuestan las recompensas.</p>" +

        "<div style='padding:14px;margin:12px 0;border-radius:16px;" +
        "background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);'>" +
        "<h2>" +
        (estadoPuntos
            ? "🟢 Puntos ACTIVADOS"
            : "🔴 Puntos DESACTIVADOS") +
        "</h2>" +
        "<p>" +
        (estadoPuntos
            ? "Los clientes pueden ganar y canjear puntos."
            : "Los puntos quedan pausados. Los puntos existentes se conservan.") +
        "</p>" +
        "<button onclick='alternarPuntosMembresia()'>" +
        (estadoPuntos
            ? "🔴 Desactivar puntos"
            : "🟢 Activar puntos") +
        "</button>" +
        "</div>" +

        "<h2>⭐ Cómo gana puntos</h2>" +

        "<label>🛒 Puntos por cada $1 gastado</label>" +
        "<input id='cfgPuntosPeso' type='number' min='0' step='1' value='" +
        Number(c.puntosPorPeso) +
        "'>" +

        "<label>🎮 Puntos por cada hora jugada</label>" +
        "<input id='cfgPuntosHora' type='number' min='0' step='1' value='" +
        Number(c.puntosPorHora) +
        "'>" +

        "<hr><h2>🎁 Recompensas</h2>" +

        "<label>⭐ Puntos necesarios para descuento</label>" +
        "<input id='cfgDescuentoPuntos' type='number' min='1' step='1' value='" +
        Number(c.descuentoPuntos) +
        "'>" +

        "<label>💰 Valor del descuento ($)</label>" +
        "<input id='cfgDescuentoPesos' type='number' min='0' step='1' value='" +
        Number(c.descuentoPesos) +
        "'>" +

        "<label>⭐ Puntos para 30 minutos gratis</label>" +
        "<input id='cfgMediaHoraPuntos' type='number' min='1' step='1' value='" +
        Number(c.mediaHoraPuntos) +
        "'>" +

        "<label>⭐ Puntos para 1 hora gratis</label>" +
        "<input id='cfgUnaHoraPuntos' type='number' min='1' step='1' value='" +
        Number(c.unaHoraPuntos) +
        "'>" +

        "<br>" +
        "<button onclick='guardarConfiguracionMembresia()'>" +
        "💾 Guardar configuración" +
        "</button>" +

        "<button onclick='restaurarConfiguracionMembresia()'>" +
        "↩️ Valores iniciales" +
        "</button>" +

        "<button onclick='mostrarMembresias()'>" +
        "⬅️ Volver" +
        "</button>";

    contenedor.appendChild(div);
}

function guardarConfiguracionMembresia() {
    const valores = {
        puntosPorPeso:
            Number(document.getElementById("cfgPuntosPeso").value),
        puntosPorHora:
            Number(document.getElementById("cfgPuntosHora").value),
        descuentoPuntos:
            Number(document.getElementById("cfgDescuentoPuntos").value),
        descuentoPesos:
            Number(document.getElementById("cfgDescuentoPesos").value),
        mediaHoraPuntos:
            Number(document.getElementById("cfgMediaHoraPuntos").value),
        unaHoraPuntos:
            Number(document.getElementById("cfgUnaHoraPuntos").value)
    };

    if (
        !Object.values(valores).every(function(valor) {
            return Number.isFinite(valor) && valor >= 0;
        })
    ) {
        alert("❌ Los valores no pueden ser negativos.");
        return;
    }

    if (
        valores.descuentoPuntos <= 0 ||
        valores.mediaHoraPuntos <= 0 ||
        valores.unaHoraPuntos <= 0
    ) {
        alert(
            "❌ Los puntos necesarios para las recompensas deben ser mayores que 0."
        );
        return;
    }

    configuracionMembresia = {
        puntosPorPeso: Math.floor(valores.puntosPorPeso),
        puntosPorHora: Math.floor(valores.puntosPorHora),
        descuentoPuntos: Math.floor(valores.descuentoPuntos),
        descuentoPesos: valores.descuentoPesos,
        mediaHoraPuntos: Math.floor(valores.mediaHoraPuntos),
        unaHoraPuntos: Math.floor(valores.unaHoraPuntos)
    };

    guardarDatos();
    mostrarMembresias();

    alert("✅ Configuración guardada.");
}

function restaurarConfiguracionMembresia() {
    if (
        !confirm(
            "¿Restaurar los valores iniciales?\n\n" +
            "🛒 $1 = 1 punto\n" +
            "🎮 1 hora = 10 puntos\n" +
            "🎁 100 puntos = $20\n" +
            "🎁 250 puntos = 30 min\n" +
            "🎁 500 puntos = 1 hora"
        )
    ) {
        return;
    }

    configuracionMembresia = {
        puntosActivos: true,
        puntosPorPeso: 1,
        puntosPorHora: 10,
        descuentoPuntos: 100,
        descuentoPesos: 20,
        mediaHoraPuntos: 250,
        unaHoraPuntos: 500
    };

    guardarDatos();
    mostrarConfiguracionMembresia();
}

function mostrarMembresias() {
    if (!exigirPermisoPro("clientes")) {
        return;
    }

    vistaActual = "membresias";

    const contenedor = document.getElementById("estaciones");
    contenedor.innerHTML = "";

    const div = document.createElement("div");
    div.className = "v27-memberships-page";

    const lista = clientesMembresia.slice().sort(function(a, b) {
        return Number(b.puntos) - Number(a.puntos);
    });

    const totalPuntos = lista.reduce(function(total, cliente) {
        return total + (Number(cliente.puntos) || 0);
    }, 0);

    const totalGasto = lista.reduce(function(total, cliente) {
        return total + (Number(cliente.gasto) || 0);
    }, 0);

    const activos = lista.filter(function(cliente) {
        return Number(cliente.puntos) > 0;
    }).length;

    let html =
        "<div class='v27-page-hero v27-membership-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>⭐ PROGRAMA DE LEALTAD</div>" +
                "<h1>Clientes y membresías</h1>" +
                "<p>Administra clientes frecuentes, puntos y recompensas desde un solo lugar.</p>" +
            "</div>" +
            "<div class='v27-membership-status " +
                (puntosMembresiaActivos() ? "v27-status-on" : "v27-status-off") +
            "'>" +
                (puntosMembresiaActivos() ? "🟢 PUNTOS ACTIVOS" : "🔴 PUNTOS DESACTIVADOS") +
            "</div>" +
        "</div>" +

        "<div class='v27-page-actions'>" +
            "<button class='v27-action-primary' onclick='crearClienteMembresiaManual()'>➕ Nuevo cliente</button>" +
            "<button onclick='mostrarConfiguracionMembresia()'>⚙️ Configurar puntos</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>" +

        "<div class='v27-membership-stats'>" +
            "<div class='v27-summary-card'><span>👥 CLIENTES</span><strong>" + lista.length + "</strong><small>registrados</small></div>" +
            "<div class='v27-summary-card'><span>⭐ PUNTOS</span><strong>" + totalPuntos + "</strong><small>acumulados</small></div>" +
            "<div class='v27-summary-card'><span>🔥 ACTIVOS</span><strong>" + activos + "</strong><small>con puntos</small></div>" +
            "<div class='v27-summary-card'><span>💰 GASTO</span><strong>$" + totalGasto.toFixed(2) + "</strong><small>acumulado</small></div>" +
        "</div>";

    if (lista.length === 0) {
        html +=
            "<div class='v27-empty-state'>" +
                "<div class='v27-empty-icon'>👥</div>" +
                "<h2>Aún no hay clientes</h2>" +
                "<p>Registra tu primer cliente para comenzar a acumular puntos y recompensas.</p>" +
                "<button onclick='crearClienteMembresiaManual()'>➕ Registrar cliente</button>" +
            "</div>";
    } else {
        html +=
            "<div class='v27-section-heading'>" +
                "<div><span>CLIENTES</span><h2>⭐ Tus miembros</h2></div>" +
                "<small>" + lista.length + " registrados</small>" +
            "</div>" +
            "<div class='v27-member-grid'>";

        lista.forEach(function(cliente) {
            const nivel = nivelMembresia(cliente.puntos);
            const progreso = progresoNivelMembresia(cliente.puntos);

            html +=
                "<div class='v27-member-card'>" +
                    "<div class='v27-member-card-top'>" +
                        "<div class='v27-member-avatar'>" + nivel.icono + "</div>" +
                        "<div class='v27-member-identity'>" +
                            "<h3>" + escaparHTML(cliente.nombre) + "</h3>" +
                            "<span>" +
                                escaparHTML(nivel.nombre) + " · " +
                                (cliente.telefono ? "📱 " + escaparHTML(cliente.telefono) : "Sin teléfono") +
                            "</span>" +
                        "</div>" +
                        "<div class='v27-level-pill'>" + nivel.icono + " " + nivel.nombre + "</div>" +
                    "</div>" +

                    "<div class='v27-points-box'>" +
                        "<div><span>⭐ PUNTOS</span><strong>" + Number(cliente.puntos) + "</strong></div>" +
                        "<div class='v27-points-next'>" +
                            (progreso.restante > 0 ? progreso.restante + " para " + progreso.proximo : "🏆 Nivel máximo") +
                        "</div>" +
                    "</div>" +

                    "<div class='v27-progress'>" +
                        "<div class='v27-progress-bar'><i style='width:" + progreso.porcentaje + "%'></i></div>" +
                        "<div class='v27-progress-labels'><span>" + progreso.inicio + "</span><span>" + progreso.siguiente + "</span></div>" +
                    "</div>" +

                    "<div class='v27-member-mini-stats'>" +
                        "<div><span>🎮 SESIONES</span><strong>" + Number(cliente.sesiones) + "</strong></div>" +
                        "<div><span>⏱️ TIEMPO</span><strong>" +
                            Math.floor((Number(cliente.minutos) || 0) / 60) + "h " +
                            ((Number(cliente.minutos) || 0) % 60) + "m" +
                        "</strong></div>" +
                        "<div><span>💰 GASTO</span><strong>$" + Number(cliente.gasto || 0).toFixed(2) + "</strong></div>" +
                    "</div>" +

                    "<button class='v27-member-open' onclick='mostrarPerfilMembresia(" + cliente.id + ")'>⭐ Ver perfil y recompensas</button>" +
                "</div>";
        });

        html += "</div>";
    }

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function crearClienteMembresiaManual() {
    const nombre =
        prompt("👤 Nombre del cliente:");

    if (nombre === null) {
        return;
    }

    const cliente =
        crearClienteMembresia(nombre);

    if (!cliente) {
        alert("❌ Nombre no válido.");
        return;
    }

    const telefono =
        prompt(
            "📱 Teléfono opcional:",
            cliente.telefono || ""
        );

    if (telefono !== null) {
        cliente.telefono =
            telefono.trim();
    }

    guardarDatos();
    mostrarMembresias();
}

function mostrarPerfilMembresia(id) {
    const cliente = clientesMembresia.find(function(item) {
        return Number(item.id) === Number(id);
    });

    if (!cliente) return;

    vistaActual = "membresias";

    const nivel = nivelMembresia(cliente.puntos);
    const progreso = progresoNivelMembresia(cliente.puntos);

    const contenedor = document.getElementById("estaciones");
    contenedor.innerHTML = "";

    const div = document.createElement("div");
    div.className = "v27-profile-page";

    let html =
        "<button class='v27-back-button' onclick='mostrarMembresias()'>← Volver a membresías</button>" +

        "<div class='v27-profile-hero'>" +
            "<div class='v27-profile-avatar'>" + nivel.icono + "</div>" +
            "<div class='v27-profile-identity'>" +
                "<div class='v27-eyebrow'>PERFIL DE CLIENTE</div>" +
                "<h1>" + escaparHTML(cliente.nombre) + "</h1>" +
                "<p>" +
                    (cliente.telefono ? "📱 " + escaparHTML(cliente.telefono) : "Sin teléfono registrado") +
                "</p>" +
            "</div>" +
            "<div class='v27-profile-level'><span>NIVEL</span><strong>" + nivel.icono + " " + nivel.nombre + "</strong></div>" +
        "</div>" +

        "<div class='v27-profile-grid'>" +
            "<div class='v27-profile-stat'><span>⭐ PUNTOS</span><strong>" + Number(cliente.puntos) + "</strong><small>" +
                (puntosMembresiaActivos() ? "Sistema activo" : "Sistema desactivado") +
            "</small></div>" +
            "<div class='v27-profile-stat'><span>🎮 SESIONES</span><strong>" + Number(cliente.sesiones) + "</strong><small>sesiones acumuladas</small></div>" +
            "<div class='v27-profile-stat'><span>⏱️ TIEMPO</span><strong>" +
                Math.floor((Number(cliente.minutos) || 0) / 60) + "h " +
                ((Number(cliente.minutos) || 0) % 60) + "m" +
            "</strong><small>tiempo jugado</small></div>" +
            "<div class='v27-profile-stat'><span>💰 GASTO</span><strong>$" +
                Number(cliente.gasto || 0).toFixed(2) +
            "</strong><small>consumo acumulado</small></div>" +
        "</div>" +

        "<div class='v27-profile-section'>" +
            "<div class='v27-section-heading'>" +
                "<div><span>PROGRESO</span><h2>🏆 Siguiente nivel</h2></div>" +
                "<strong>" + (progreso.restante > 0 ? progreso.restante + " puntos" : "Máximo") + "</strong>" +
            "</div>" +
            "<div class='v27-big-progress'>" +
                "<div class='v27-big-progress-head'><span>" + progreso.inicio + " puntos</span><span>" + progreso.siguiente + " puntos</span></div>" +
                "<div class='v27-progress-bar v27-progress-large'><i style='width:" + progreso.porcentaje + "%'></i></div>" +
                "<p>" +
                    (progreso.restante > 0
                        ? "Faltan " + progreso.restante + " puntos para llegar a " + progreso.proximo + "."
                        : "🎉 Este cliente ya alcanzó el nivel máximo.") +
                "</p>" +
            "</div>" +
        "</div>" +

        "<div class='v27-profile-section'>" +
            "<div class='v27-section-heading'>" +
                "<div><span>RECOMPENSAS</span><h2>🎁 Canjes disponibles</h2></div>" +
                "<small>" + (puntosMembresiaActivos() ? "Usa los puntos disponibles" : "Puntos desactivados") + "</small>" +
            "</div>" +
            "<div class='v27-rewards-grid'>" +

                "<div class='v27-reward-card'>" +
                    "<div class='v27-reward-icon'>💰</div>" +
                    "<div><h3>$" + configuracionMembresia.descuentoPesos + " de descuento</h3><p>" +
                        configuracionMembresia.descuentoPuntos + " puntos</p></div>" +
                    (
                        puntosMembresiaActivos() && Number(cliente.puntos) >= Number(configuracionMembresia.descuentoPuntos)
                            ? "<button onclick='usarDescuentoMembresia(" + cliente.id + ")'>Canjear</button>"
                            : "<span class='v27-reward-locked'>🔒 Bloqueado</span>"
                    ) +
                "</div>" +

                "<div class='v27-reward-card'>" +
                    "<div class='v27-reward-icon'>⏱️</div>" +
                    "<div><h3>30 minutos gratis</h3><p>" +
                        configuracionMembresia.mediaHoraPuntos + " puntos</p></div>" +
                    (
                        puntosMembresiaActivos() && Number(cliente.puntos) >= Number(configuracionMembresia.mediaHoraPuntos)
                            ? "<button onclick='usarTiempoMembresia(" + cliente.id + ",30)'>Canjear</button>"
                            : "<span class='v27-reward-locked'>🔒 Bloqueado</span>"
                    ) +
                "</div>" +

                "<div class='v27-reward-card'>" +
                    "<div class='v27-reward-icon'>🕐</div>" +
                    "<div><h3>1 hora gratis</h3><p>" +
                        configuracionMembresia.unaHoraPuntos + " puntos</p></div>" +
                    (
                        puntosMembresiaActivos() && Number(cliente.puntos) >= Number(configuracionMembresia.unaHoraPuntos)
                            ? "<button onclick='usarTiempoMembresia(" + cliente.id + ",60)'>Canjear</button>"
                            : "<span class='v27-reward-locked'>🔒 Bloqueado</span>"
                    ) +
                "</div>" +

            "</div>" +
        "</div>" +

        "<div class='v27-profile-section'>" +
            "<div class='v27-section-heading'><div><span>ACTIVIDAD</span><h2>📜 Movimientos</h2></div><small>Últimos 30</small></div>" +
            "<div class='v27-movement-list'>";

    const movimientos = Array.isArray(cliente.movimientos)
        ? cliente.movimientos.slice().reverse().slice(0, 30)
        : [];

    if (movimientos.length === 0) {
        html += "<div class='v27-empty-inline'>📭 Todavía no hay movimientos registrados.</div>";
    } else {
        movimientos.forEach(function(movimiento) {
            const positivo = Number(movimiento.puntos) >= 0;
            html +=
                "<div class='v27-movement'>" +
                    "<div class='v27-movement-dot " + (positivo ? "positive" : "negative") + "'></div>" +
                    "<div class='v27-movement-content'>" +
                        "<strong>" + escaparHTML(movimiento.motivo) + "</strong>" +
                        "<span>" + escaparHTML(movimiento.fecha + " " + movimiento.hora) + "</span>" +
                    "</div>" +
                    "<div class='v27-movement-points " + (positivo ? "positive" : "negative") + "'>" +
                        (positivo ? "+" : "") + Number(movimiento.puntos) +
                    "</div>" +
                "</div>";
        });
    }

    html +=
            "</div>" +
        "</div>" +
        "<button class='v27-back-button' onclick='mostrarMembresias()'>← Volver a membresías</button>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function usarDescuentoMembresia(id) {
    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (
        !cliente ||
        !membresiaClienteActiva(cliente) ||
        Number(cliente.puntos) <
        configuracionMembresia.descuentoPuntos
    ) {
        return;
    }

    cliente.puntos -=
        configuracionMembresia.descuentoPuntos;

    cliente.descuentoPendiente +=
        configuracionMembresia.descuentoPesos;

    registrarMovimientoMembresia(
        cliente,
        -configuracionMembresia.descuentoPuntos,
        "🎁 Canje de $20 de descuento",
        0
    );

    guardarDatos();
    mostrarPerfilMembresia(id);
}

function usarTiempoMembresia(id, minutos) {
    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    const puntosNecesarios =
        Number(minutos) === 60
            ? configuracionMembresia.unaHoraPuntos
            : configuracionMembresia.mediaHoraPuntos;

    if (
        !cliente ||
        !membresiaClienteActiva(cliente) ||
        Number(cliente.puntos) <
        puntosNecesarios
    ) {
        return;
    }

    cliente.puntos -=
        puntosNecesarios;

    cliente.tiempoGratisPendiente +=
        Number(minutos);

    registrarMovimientoMembresia(
        cliente,
        -puntosNecesarios,
        "🎁 Canje de " +
        minutos +
        " minutos gratis",
        0
    );

    guardarDatos();
    mostrarPerfilMembresia(id);
}

// ========================================
// CUENTA DEL JUGADOR
// ========================================

function siguienteIdCuentaJugador() {
    if (cuentasJugadores.length === 0) {
        return 1;
    }

    return Math.max.apply(
        null,
        cuentasJugadores.map(function(cuenta) {
            return Number(cuenta.id) || 0;
        })
    ) + 1;
}

function obtenerCuentaPorEstacion(id) {
    return cuentasJugadores.find(function(cuenta) {
        return (
            Number(cuenta.estacionId) ===
            Number(id)
        ) &&
        cuenta.estado === "abierta";
    });
}

function obtenerCuentaPorId(id) {
    return cuentasJugadores.find(function(cuenta) {
        return (
            Number(cuenta.id) ===
            Number(id)
        );
    });
}

function obtenerTotalCuenta(cuenta) {
    if (!cuenta) {
        return 0;
    }

    const juego =
        Number(
            cuenta.game &&
            cuenta.game.precio
        ) || 0;

    const productosCuenta =
        (cuenta.productos || []).reduce(
            function(total, item) {
                return total +
                    (Number(item.precio) || 0);
            },
            0
        );

    const subtotal =
        juego +
        productosCuenta;

    const anticipo =
        cuenta.reservaId
            ? Math.max(
                0,
                Number(
                    cuenta.reservaAnticipo
                ) || 0
            )
            : 0;

    return Math.max(
        0,
        subtotal - anticipo
    );
}


function obtenerTotalCuentasAbiertas() {
    return cuentasJugadores.reduce(
        function(total, cuenta) {
            return total +
                obtenerTotalCuenta(cuenta);
        },
        0
    );
}

function crearCuentaJugador(
    estacion,
    minutos,
    precioBase,
    cliente,
    resumen
) {
    const cuenta = {
        id: siguienteIdCuentaJugador(),
        estado: "abierta",
        pagada: false,
        importePagado: 0,
        fechaPago: "",
        estacionId: Number(estacion.id),
        estacion: estacion.nombre,
        tipoEstacion: estacion.tipo,
        cliente: cliente || "Sin nombre",
        inicioSesion: obtenerHora(),
        creadaEn: new Date().toISOString(),
        game: {
            minutos: minutos,
            precioOriginal:
                Number(resumen.precioOriginal) || 0,
            descuento:
                Number(resumen.descuento) || 0,
            precio:
                Number(resumen.precioFinal) || 0,
            promociones:
                resumen.motivo
                    ? [resumen.motivo]
                    : []
        },
        productos: [],
        nota: "",
        cambiosEstacion: []
    };

    cuentasJugadores.push(cuenta);

    return cuenta;
}

function mostrarCuentaJugador(id) {
    const cuenta =
        obtenerCuentaPorId(id);

    if (!cuenta) {
        alert("❌ La cuenta ya no está abierta.");
        mostrarEstaciones();
        return;
    }

    vistaActual = "cuenta";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    const total =
        obtenerTotalCuenta(cuenta);

    const clienteMembresia =
        obtenerClienteMembresia(
            cuenta.cliente
        );

    let html =
        "<h1>🧾 Cuenta del jugador</h1>" +

        "<h2>👤 " +
        escaparHTML(cuenta.cliente) +
        "</h2>" +

        "<p>" +
        iconoTipoEstacion(cuenta.tipoEstacion) +
        " " +
        escaparHTML(cuenta.estacion) +
        "</p>" +

        "<p>🕐 Inicio: " +
        escaparHTML(cuenta.inicioSesion) +
        "</p>" +

        (
            cuenta.nota
                ? "<p>📝 <strong>Nota:</strong> " +
                  escaparHTML(cuenta.nota) +
                  "</p>"
                : "<p style='opacity:.65;'>📝 Sin nota</p>"
        ) +

        (
            clienteMembresia
                ? "<p>⭐ " +
                  nivelMembresia(
                      clienteMembresia.puntos
                  ).icono +
                  " " +
                  nivelMembresia(
                      clienteMembresia.puntos
                  ).nombre +
                  " · " +
                  clienteMembresia.puntos +
                  " puntos</p>"
                : ""
        ) +

        "<hr>" +

        "<h2>🎮 Juego</h2>" +

        "<p>" +
        cuenta.game.minutos +
        " minutos · $" +
        Number(cuenta.game.precio || 0).toFixed(2) +
        "</p>" +

        (
            cuenta.reservaId &&
            Number(cuenta.reservaAnticipo) > 0
                ? "<p style='color:#22c55e;font-weight:bold;'>" +
                  "📅 Anticipo de reserva: $" +
                  Number(cuenta.reservaAnticipo).toFixed(2) +
                  " · Pendiente: $" +
                  Number(obtenerTotalCuenta(cuenta)).toFixed(2) +
                  "</p>"
                : ""
        );

    if (Number(cuenta.game.descuento) > 0) {
        html +=
            "<p style='color:#22c55e;font-weight:bold;'>" +
            "🎟️ " +
            escaparHTML(
                cuenta.game.promociones.join(" · ")
            ) +
            " · Ahorro $" +
            cuenta.game.descuento +
            "</p>";
    }

    const estacionCuenta =
        obtenerEstacionPorId(
            cuenta.estacionId
        );

    html +=
        "<hr>" +
        "<h2>🎮 Control de sesión</h2>" +

        "<button onclick='agregarTiempoMinutos(" +
        cuenta.estacionId +
        ",30)'>➕ 30 min</button>" +

        "<button onclick='agregarTiempo(" +
        cuenta.estacionId +
        ")'>➕ 1 hora</button>" +

        "<button onclick='cambiarEstacionCuenta(" +
        cuenta.id +
        ")'>🔄 Cambiar estación</button>" +

        "<button onclick='editarNotaCuenta(" +
        cuenta.id +
        ")'>📝 Editar nota</button>" +

        (
            estacionCuenta &&
            estacionCuenta.activo
                ? "<button onclick='pausarSesion(" +
                  estacionCuenta.id +
                  ")'>⏸️ Pausar</button>"
                : (
                    estacionCuenta &&
                    estacionCuenta.pausada &&
                    estacionCuenta.segundos > 0
                        ? "<button onclick='reanudarSesion(" +
                          estacionCuenta.id +
                          ")'>▶️ Reanudar</button>"
                        : ""
                  )
        ) +

        "<hr>" +
        "<h2>🛒 Consumos</h2>";

    if (cuenta.productos.length === 0) {
        html +=
            "<p style='opacity:.7;'>" +
            "Todavía no hay consumos." +
            "</p>";
    } else {
        cuenta.productos.forEach(function(item, indice) {
            html +=
                "<div style='display:flex;" +
                "justify-content:space-between;" +
                "gap:10px;align-items:center;" +
                "padding:10px 0;" +
                "border-bottom:1px solid rgba(255,255,255,.08);'>" +

                "<div>" +
                "<strong>" +
                escaparHTML(item.producto) +
                "</strong><br>" +
                "x" + item.cantidad +
                " · $" + item.precio +
                "</div>" +

                "<button onclick='quitarProductoCuenta(" +
                cuenta.id +
                "," +
                item.productoId +
                ")'>" +
                "❌ Quitar" +
                "</button>" +

                "</div>";
        });
    }

    html +=
        "<hr>" +

        "<h1>💰 TOTAL: $" +
        total +
        "</h1>" +

        "<button onclick='mostrarProductosCuenta(" +
        cuenta.id +
        ")'>" +
        "🛒 Agregar consumo" +
        "</button>" +

        "<button onclick='cobrarCuenta(" +
        cuenta.id +
        ")'>" +
        "💰 Cobrar cuenta" +
        "</button>" +

        "<button onclick='cancelarCuentaJugador(" +
        cuenta.id +
        ")'>" +
        "❌ Cancelar cuenta" +
        "</button>" +

        "<button onclick='mostrarEstaciones()'>" +
        "⬅ Volver" +
        "</button>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function mostrarCuentasAbiertas() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    vistaActual = "cuentas";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    let html =
        "<h1>🧾 Cuentas abiertas</h1>" +
        "<p>Sesiones y consumos pendientes de cobro.</p>" +

        "<h2>💰 Pendiente por cobrar: $" +
        obtenerTotalCuentasAbiertas() +
        "</h2>" +

        "<button onclick='mostrarEstaciones()'>" +
        "🏠 Inicio" +
        "</button>" +

        "<hr>";

    if (cuentasJugadores.length === 0) {
        html +=
            "<p>🟢 No hay cuentas abiertas.</p>";
    }

    cuentasJugadores.forEach(function(cuenta) {
        html +=
            "<div style='" +
            "margin-bottom:12px;" +
            "padding:16px;" +
            "border-radius:16px;" +
            "background:rgba(255,255,255,.05);" +
            "border:1px solid rgba(255,255,255,.1);" +
            "'>" +

            "<h2 style='margin-top:0;'>" +
            "👤 " +
            escaparHTML(cuenta.cliente) +
            "</h2>" +

            "<p>" +
            iconoTipoEstacion(cuenta.tipoEstacion) +
            " " +
            escaparHTML(cuenta.estacion) +
            " · 🎮 " +
            cuenta.game.minutos +
            " min" +
            "</p>" +

            "<p>🛒 Consumos: " +
            cuenta.productos.reduce(
                function(total, item) {
                    return total +
                        Number(item.cantidad || 0);
                },
                0
            ) +
            " piezas</p>" +

            "<h2>💰 $" +
            obtenerTotalCuenta(cuenta) +
            "</h2>" +

            "<button onclick='mostrarCuentaJugador(" +
            cuenta.id +
            ")'>" +
            "🧾 Ver cuenta" +
            "</button>" +

            "<button onclick='cobrarCuenta(" +
            cuenta.id +
            ")'>" +
            "💰 Cobrar" +
            "</button>" +

            "</div>";
    });

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function seleccionarMetodoPagoCuenta(
    cuenta,
    alSeleccionar,
    alCancelar
) {
    const anterior =
        document.getElementById(
            "modalMetodoPagoCuenta"
        );

    if (anterior) {
        anterior.remove();
    }

    const fondo =
        document.createElement("div");

    fondo.id =
        "modalMetodoPagoCuenta";

    fondo.style.position = "fixed";
    fondo.style.inset = "0";
    fondo.style.background =
        "rgba(0,0,0,.72)";
    fondo.style.display = "flex";
    fondo.style.alignItems = "center";
    fondo.style.justifyContent = "center";
    fondo.style.zIndex = "9999";
    fondo.style.padding = "20px";

    const caja =
        document.createElement("div");

    caja.style.width =
        "min(430px,100%)";
    caja.style.background = "#1c2028";
    caja.style.color = "white";
    caja.style.borderRadius = "20px";
    caja.style.padding = "25px";
    caja.style.textAlign = "center";

    const total =
        Number(obtenerTotalCuenta(cuenta)) || 0;

    caja.innerHTML =
        "<h1>💰 Cobrar cuenta</h1>" +
        "<h2>👤 " +
        escaparHTML(cuenta.cliente) +
        "</h2>" +
        "<p>" +
        iconoTipoEstacion(cuenta.tipoEstacion) +
        " " +
        escaparHTML(cuenta.estacion) +
        "</p>" +
        "<h1>$" + total.toFixed(2) + "</h1>" +
        "<p>Selecciona cómo pagó el cliente.</p>";

    const montoCaja =
        document.createElement("div");

    montoCaja.style.display = "none";
    montoCaja.style.margin = "12px 0";

    const montoLabel =
        document.createElement("label");

    montoLabel.textContent =
        "💵 ¿Cuánto recibió la caja?";

    montoLabel.style.display = "block";
    montoLabel.style.marginBottom = "6px";
    montoLabel.style.fontWeight = "bold";

    const montoInput =
        document.createElement("input");

    montoInput.type = "number";
    montoInput.min = String(total);
    montoInput.step = "0.01";
    montoInput.placeholder = total.toFixed(2);
    montoInput.style.width = "100%";
    montoInput.style.boxSizing = "border-box";
    montoInput.style.padding = "12px";
    montoInput.style.borderRadius = "10px";
    montoInput.style.border =
        "1px solid #555b66";
    montoInput.style.background = "#0b0d11";
    montoInput.style.color = "white";
    montoInput.style.fontSize = "18px";
    montoInput.style.textAlign = "center";

    const cambio =
        document.createElement("div");

    cambio.style.marginTop = "8px";
    cambio.style.fontSize = "16px";
    cambio.style.fontWeight = "bold";

    function actualizarCambio() {
        const recibido =
            Number(montoInput.value);

        if (!Number.isFinite(recibido)) {
            cambio.textContent =
                "Cambio: $0.00";
            cambio.style.color = "#9ca3af";
            return;
        }

        if (recibido < total) {
            cambio.textContent =
                "⚠️ Faltan $" +
                (total - recibido).toFixed(2);
            cambio.style.color = "#f59e0b";
            return;
        }

        cambio.textContent =
            "💵 Cambio: $" +
            (recibido - total).toFixed(2);
        cambio.style.color = "#22c55e";
    }

    montoInput.addEventListener(
        "input",
        actualizarCambio
    );

    montoCaja.appendChild(montoLabel);
    montoCaja.appendChild(montoInput);
    montoCaja.appendChild(cambio);
    caja.appendChild(montoCaja);

    [
        {
            id: "efectivo",
            texto: "💵 Efectivo"
        },
        {
            id: "tarjeta",
            texto: "💳 Tarjeta"
        },
        {
            id: "transferencia",
            texto: "📱 Transferencia"
        }
    ].forEach(function(metodo) {
        const boton =
            document.createElement("button");

        boton.textContent =
            metodo.texto;

        boton.style.display = "block";
        boton.style.width = "100%";
        boton.style.margin = "10px 0";
        boton.style.padding = "14px";
        boton.style.fontSize = "17px";
        boton.style.fontWeight = "bold";

        boton.onclick = function() {
            if (metodo.id === "efectivo") {
                montoCaja.style.display = "block";

                if (!montoInput.value) {
                    montoInput.value =
                        total.toFixed(2);
                }

                actualizarCambio();
                montoInput.focus();

                const confirmarEfectivo =
                    confirm(
                        "💵 PAGO EN EFECTIVO\n\n" +
                        "Total: $" +
                        total.toFixed(2) +
                        "\nRecibido: $" +
                        Number(montoInput.value || 0).toFixed(2) +
                        "\n\n¿Confirmar el cobro?"
                    );

                if (!confirmarEfectivo) {
                    return;
                }

                const recibido =
                    Number(montoInput.value);

                if (
                    !Number.isFinite(recibido) ||
                    recibido < total
                ) {
                    alert(
                        "❌ El efectivo recibido no alcanza el total.\n\n" +
                        "Total: $" +
                        total.toFixed(2)
                    );
                    montoInput.focus();
                    return;
                }

                fondo.remove();

                alSeleccionar(
                    metodo.id,
                    {
                        recibido: recibido,
                        cambio: recibido - total
                    }
                );

                return;
            }

            const confirmar =
                confirm(
                    metodo.texto +
                    "\n\nTotal: $" +
                    total.toFixed(2) +
                    "\n\n¿Confirmar el cobro?"
                );

            if (!confirmar) {
                return;
            }

            fondo.remove();

            alSeleccionar(
                metodo.id,
                {
                    recibido: total,
                    cambio: 0
                }
            );
        };
        caja.appendChild(boton);
    });

    const cancelar =
        document.createElement("button");

    cancelar.textContent =
        "❌ Cancelar";

    cancelar.onclick =
        function() {
            fondo.remove();

            if (typeof alCancelar === "function") {
                alCancelar();
            }
        };

    caja.appendChild(cancelar);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
}


function abrirCuentaDesdeSesion(
    estacion,
    minutos,
    precioBase
) {
    if (obtenerCuentaPorEstacion(estacion.id)) {
        alert(
            "⚠️ Esta estación ya tiene una cuenta abierta."
        );
        return;
    }

    const cliente =
        prompt(
            "👤 Nombre del cliente (opcional):"
        );

    if (cliente === null) {
        return;
    }

    const nombreCliente =
        cliente.trim() || "Sin nombre";

    crearClienteMembresia(nombreCliente);

    const resumen =
        calcularPrecioPromocional(
            precioBase,
            nombreCliente
        );

    const confirmar =
        confirm(
            "🧾 ABRIR CUENTA\n\n" +
            "👤 " + nombreCliente +
            "\n" +
            iconoTipoEstacion(estacion.tipo) +
            " " + estacion.nombre +
            "\n⏱️ " + minutos + " minutos" +
            "\n💰 Juego: $" +
            resumen.precioFinal +
            (
                resumen.descuento > 0
                    ? "\n🎟️ " +
                      resumen.motivo +
                      "\n💚 Ahorro: $" +
                      resumen.descuento
                    : ""
            ) +
            "\n\nNo se cobrará todavía." +
            "\nEl total se pagará al cerrar la cuenta." +
            "\n\n¿Abrir cuenta?"
        );

    if (!confirmar) {
        return;
    }

    const cuenta =
        crearCuentaJugador(
            estacion,
            minutos,
            precioBase,
            nombreCliente,
            resumen
        );

    const duracion =
        minutos * 60;

    estacion.segundos =
        duracion;

    estacion.duracionTotalSegundos =
        duracion;

    estacion.terminado = false;
    estacion.pausada = false;
    estacion.activo = true;

    estacion.finalizaEn =
        Date.now() +
        duracion * 1000;

    estacion.cliente =
        nombreCliente;

    estacion.precioSesion =
        resumen.precioFinal;

    estacion.metodoPagoSesion =
        "";

    estacion.inicioSesion =
        cuenta.inicioSesion;

    estacion.avisoMostrado =
        false;

    guardarDatos();
    mostrarEstaciones();

    alert(
        "🧾 Cuenta abierta.\n\n" +
        "💰 Pendiente: $" +
        obtenerTotalCuenta(cuenta) +
        "\n\nPuedes agregar consumos desde la estación."
    );
}

function agregarProductoACuenta(
    cuentaId,
    productoId,
    cantidad
) {
    const cuenta =
        obtenerCuentaPorId(cuentaId);

    const producto =
        obtenerProducto(productoId);

    if (!cuenta || !producto) {
        return;
    }

    if (!producto.activo) {
        alert("❌ El producto está oculto.");
        return;
    }

    const cantidadNumero =
        Number(cantidad);

    if (
        !Number.isInteger(cantidadNumero) ||
        cantidadNumero <= 0
    ) {
        alert("❌ Cantidad inválida.");
        return;
    }

    if (
        cantidadNumero >
        Number(producto.stock)
    ) {
        alert(
            "❌ No hay suficiente stock.\n\n" +
            "Disponible: " +
            producto.stock
        );
        return;
    }

    const total =
        cantidadNumero *
        Number(producto.precio);

    const costoTotal =
        cantidadNumero *
        Number(producto.costo);

    let item =
        cuenta.productos.find(
            function(actual) {
                return Number(
                    actual.productoId
                ) === Number(producto.id);
            }
        );

    if (item) {
        item.cantidad +=
            cantidadNumero;

        item.precio +=
            total;

        item.utilidad +=
            total - costoTotal;
    } else {
        cuenta.productos.push({
            productoId: producto.id,
            producto: producto.nombre,
            cantidad: cantidadNumero,
            precioUnitario:
                Number(producto.precio),
            costoUnitario:
                Number(producto.costo),
            precio: total,
            utilidad:
                total - costoTotal
        });
    }

    producto.stock -=
        cantidadNumero;

    guardarDatos();
    mostrarCuentaJugador(cuenta.id);

    if (
        Number(producto.stock) <=
        Number(producto.stockMinimo)
    ) {
        alert(
            "⚠️ Stock bajo de " +
            producto.nombre +
            ".\n\nQuedan: " +
            producto.stock
        );
    }
}

function mostrarProductosCuenta(cuentaId) {
    const cuenta =
        obtenerCuentaPorId(cuentaId);

    if (!cuenta) {
        return;
    }

    const anterior =
        document.getElementById(
            "modalProductosCuenta"
        );

    if (anterior) {
        anterior.remove();
    }

    const fondo =
        document.createElement("div");

    fondo.id =
        "modalProductosCuenta";

    fondo.style.position = "fixed";
    fondo.style.inset = "0";
    fondo.style.background =
        "rgba(0,0,0,.72)";
    fondo.style.display = "flex";
    fondo.style.alignItems = "center";
    fondo.style.justifyContent = "center";
    fondo.style.zIndex = "9999";
    fondo.style.padding = "20px";

    const caja =
        document.createElement("div");

    caja.style.width =
        "min(520px,100%)";
    caja.style.maxHeight = "85vh";
    caja.style.overflow = "auto";
    caja.style.background = "#1c2028";
    caja.style.color = "white";
    caja.style.borderRadius = "20px";
    caja.style.padding = "22px";

    let html =
        "<h1>🛒 Agregar consumo</h1>" +
        "<p>Selecciona un producto.</p>";

    const activos =
        productos.filter(function(producto) {
            return (
                producto.activo &&
                Number(producto.stock) > 0
            );
        });

    if (activos.length === 0) {
        html +=
            "<p>❌ No hay productos disponibles.</p>";
    }

    activos.forEach(function(producto) {
        html +=
            "<button style='display:block;" +
            "width:100%;text-align:left;" +
            "margin:8px 0;padding:14px;' " +
            "onclick='agregarProductoCuentaDesdeModal(" +
            cuenta.id +
            "," +
            producto.id +
            ")'>" +

            "🛒 " +
            escaparHTML(producto.nombre) +
            " · $" +
            producto.precio +
            " · Stock " +
            producto.stock +

            "</button>";
    });

    html +=
        "<button onclick='cerrarModalProductosCuenta()'>" +
        "⬅ Volver a la cuenta" +
        "</button>";

    caja.innerHTML = html;
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
}

function agregarProductoCuentaDesdeModal(
    cuentaId,
    productoId
) {
    const producto =
        obtenerProducto(productoId);

    if (!producto) {
        return;
    }

    const cantidadTexto =
        prompt(
            producto.nombre +
            "\n\nStock: " +
            producto.stock +
            "\nPrecio: $" +
            producto.precio +
            "\n\n¿Cuántas piezas?"
        );

    if (cantidadTexto === null) {
        return;
    }

    const cantidad =
        Number(cantidadTexto);

    if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {
        alert("❌ Cantidad inválida.");
        return;
    }

    const modal =
        document.getElementById(
            "modalProductosCuenta"
        );

    if (modal) {
        modal.remove();
    }

    agregarProductoACuenta(
        cuentaId,
        productoId,
        cantidad
    );
}

function cerrarModalProductosCuenta() {
    const modal =
        document.getElementById(
            "modalProductosCuenta"
        );

    if (modal) {
        modal.remove();
    }
}

function quitarProductoCuenta(
    cuentaId,
    productoId
) {
    const cuenta =
        obtenerCuentaPorId(cuentaId);

    if (!cuenta) {
        return;
    }

    const indice =
        cuenta.productos.findIndex(
            function(item) {
                return Number(
                    item.productoId
                ) === Number(productoId);
            }
        );

    if (indice < 0) {
        return;
    }

    const item =
        cuenta.productos[indice];

    const producto =
        obtenerProducto(productoId);

    const confirmar =
        confirm(
            "❌ Quitar consumo\n\n" +
            item.producto +
            " x" +
            item.cantidad +
            "\n\n" +
            "El producto regresará al inventario." +
            "\n\n¿Continuar?"
        );

    if (!confirmar) {
        return;
    }

    if (producto) {
        producto.stock +=
            Number(item.cantidad) || 0;
    }

    cuenta.productos.splice(
        indice,
        1
    );

    guardarDatos();
    mostrarCuentaJugador(cuenta.id);
}

function imprimirTicketSeguro(
    cuenta,
    metodoPago,
    total,
    folio,
    usuario
) {
    try {
        const copia =
            JSON.parse(
                JSON.stringify(cuenta)
            );

        imprimirTicketCuenta(
            copia,
            metodoPago,
            Number(total) || 0,
            folio,
            usuario || "Usuario actual"
        );

        return true;
    } catch (error) {
        console.error(
            "No se pudo imprimir el ticket:",
            error
        );

        alert(
            "❌ No se pudo abrir la impresión del ticket.\n\n" +
            "Revisa que el navegador permita ventanas emergentes."
        );

        return false;
    }
}

function cobrarCuenta(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    if (
        cobroCuentaEnProcesoId !== null &&
        String(cobroCuentaEnProcesoId) === String(id)
    ) {
        alert(
            "⏳ Este cobro ya está en proceso.\n\n" +
            "Espera a que termine antes de volver a presionar Cobrar."
        );
        return;
    }

    const cuenta =
        obtenerCuentaPorId(id);

    if (!cuenta) {
        alert("❌ La cuenta no existe o ya fue cobrada.");
        mostrarEstaciones();
        return;
    }

    if (
        cuenta.estado &&
        cuenta.estado !== "abierta"
    ) {
        alert(
            "⚠️ Esta cuenta ya no está abierta.\n\n" +
            "No se registrará otro cobro."
        );
        mostrarEstaciones();
        return;
    }

    if (cuenta.pagada === true) {
        alert(
            "⚠️ Esta cuenta ya fue cobrada."
        );
        mostrarEstaciones();
        return;
    }

    const estacion =
        obtenerEstacionPorId(
            cuenta.estacionId
        );

    const total =
        Number(obtenerTotalCuenta(cuenta)) || 0;

    if (total < 0) {
        alert("❌ El total de la cuenta es inválido.");
        return;
    }

    const confirmar =
        confirm(
            "💰 COBRAR CUENTA\n\n" +
            "👤 " + cuenta.cliente +
            "\n" +
            iconoTipoEstacion(cuenta.tipoEstacion) +
            " " + cuenta.estacion +
            "\n" +
            "💰 Total: $" + total.toFixed(2) +
            "\n\n" +
            (
                estacion &&
                estacion.activo
                    ? "La sesión sigue activa y se detendrá al cobrar."
                    : "La sesión ya está detenida."
            ) +
            "\n\n¿Continuar?"
        );

    if (!confirmar) {
        return;
    }

    cobroCuentaEnProcesoId = id;

    seleccionarMetodoPagoCuenta(
        cuenta,
        function(metodoPago, datosPago) {
            try {
                if (estadoCaja !== "abierta") {
                    alert("🔒 La caja ya no está abierta.");
                    return;
                }

                const cuentaActual =
                    obtenerCuentaPorId(id);

                if (!cuentaActual) {
                    alert(
                        "⚠️ La cuenta ya fue procesada.\n\n" +
                        "No se registrará otro cobro."
                    );
                    mostrarEstaciones();
                    return;
                }

                if (
                    cuentaActual.pagada === true ||
                    cuentaActual.estado !== "abierta"
                ) {
                    alert(
                        "⚠️ Esta cuenta ya fue cobrada.\n\n" +
                        "No se registrará otro cobro."
                    );
                    mostrarEstaciones();
                    return;
                }

                const totalActual =
                    Number(
                        obtenerTotalCuenta(
                            cuentaActual
                        )
                    ) || 0;

                const productosTotalActual =
                    Array.isArray(
                        cuentaActual.productos
                    )
                        ? cuentaActual.productos.reduce(
                            function(total, item) {
                                return total +
                                    (
                                        Number(
                                            item.precio
                                        ) || 0
                                    );
                            },
                            0
                        )
                        : 0;

                const juegoCobradoActual =
                    Math.max(
                        0,
                        totalActual -
                        productosTotalActual
                    );

                const anticipoAplicado =
                    cuentaActual.reservaId
                        ? Math.max(
                            0,
                            Number(
                                cuentaActual.reservaAnticipo
                            ) || 0
                        )
                        : 0;

                const gastoTotalSesionCliente =
                    totalActual +
                    anticipoAplicado;

                const estacionActual =
                    obtenerEstacionPorId(
                        cuentaActual.estacionId
                    );

                const recibido =
                    Number(
                        datosPago &&
                        datosPago.recibido
                    ) || totalActual;

                const cambio =
                    Math.max(
                        0,
                        Number(
                            datosPago &&
                            datosPago.cambio
                        ) || 0
                    );

                if (
                    metodoPago === "efectivo" &&
                    recibido < totalActual
                ) {
                    alert(
                        "❌ El efectivo recibido es menor al total."
                    );
                    return;
                }

                // Congelamos el importe antes de registrar la venta.
                cuentaActual.pagada = true;
                cuentaActual.importePagado = totalActual;
                cuentaActual.fechaPago =
                    new Date().toISOString();
                cuentaActual.estado = "cerrada";
                cuentaActual.metodoPago =
                    metodoPago;
                cuentaActual.importeRecibido =
                    recibido;
                cuentaActual.cambio =
                    cambio;

                const ticketFolio =
                    obtenerSiguienteFolioTicketPro();

                const ventaSesion = {
                    tipo: "sesion",
                    fecha: obtenerFecha(),
                    hora: cuentaActual.inicioSesion,
                    xbox: cuentaActual.estacion,
                    estacion: cuentaActual.estacion,
                    tipoEstacion:
                        cuentaActual.tipoEstacion,
                    cliente: cuentaActual.cliente,
                    tiempo:
                        cuentaActual.game.minutos +
                        " minutos",
                    precio:
                        juegoCobradoActual,
                    precioOriginal:
                        cuentaActual.game.precioOriginal,
                    descuento:
                        cuentaActual.game.descuento,
                    promocion:
                        cuentaActual.game.promociones.join(
                            " · "
                        ),
                    metodoPago: metodoPago,
                    importeRecibido: recibido,
                    cambio: cambio,
                    ticketFolio: ticketFolio,
                    usuario:
                        usuarioActualPro
                            ? usuarioActualPro.nombre
                            : "Usuario actual",
                    cuentaId: cuentaActual.id
                };

                historial.push(ventaSesion);

                cuentaActual.productos.forEach(
                    function(item) {
                        historial.push({
                            tipo: "producto",
                            fecha: obtenerFecha(),
                            hora: obtenerHora(),
                            productoId:
                                item.productoId,
                            producto:
                                item.producto,
                            cantidad:
                                item.cantidad,
                            precioUnitario:
                                item.precioUnitario,
                            costoUnitario:
                                item.costoUnitario,
                            precio:
                                item.precio,
                            utilidad:
                                item.utilidad,
                            metodoPago:
                                metodoPago,
                            ticketFolio:
                                ticketFolio,
                            usuario:
                                usuarioActualPro
                                    ? usuarioActualPro.nombre
                                    : "Usuario actual",
                            cliente:
                                cuentaActual.cliente,
                            cuentaId:
                                cuentaActual.id,
                            estacion:
                                cuentaActual.estacion
                        });
                    }
                );

                if (cuentaActual.reservaId) {
                    const reservaCuenta =
                        obtenerReservaPorId(
                            cuentaActual.reservaId
                        );

                    if (reservaCuenta) {
                        reservaCuenta.estado =
                            "completada";

                        reservaCuenta.cobradaEn =
                            new Date().toISOString();

                        reservaCuenta.completadaEn =
                            reservaCuenta.cobradaEn;
                    }
                }

                const clienteMembresia =
                    obtenerClienteMembresia(
                        cuentaActual.cliente
                    );

                if (clienteMembresia) {
                    const minutos =
                        Number(
                            cuentaActual.game.minutos
                        ) || 0;

                    const gasto =
                        gastoTotalSesionCliente;

                    clienteMembresia.sesiones += 1;
                    clienteMembresia.minutos += minutos;
                    clienteMembresia.gasto += gasto;

                    clienteMembresia.productosUnidades +=
                        Array.isArray(
                            cuentaActual.productos
                        )
                            ? cuentaActual.productos.reduce(
                                function(total, item) {
                                    return total +
                                        (
                                            Number(
                                                item.cantidad
                                            ) || 0
                                        );
                                },
                                0
                            )
                            : 0;

                    clienteMembresia.ultimaVisita =
                        obtenerFecha() +
                        " · " +
                        obtenerHora();

                    if (
                        membresiaClienteActiva(
                            clienteMembresia
                        )
                    ) {
                        const puntosJuego =
                            Math.floor(
                                minutos / 60 *
                                configuracionMembresia.puntosPorHora
                            );

                        const puntosCompra =
                            Math.floor(
                                gasto *
                                configuracionMembresia.puntosPorPeso
                            );

                        registrarMovimientoMembresia(
                            clienteMembresia,
                            puntosJuego,
                            "🎮 Puntos por tiempo de juego",
                            0
                        );

                        registrarMovimientoMembresia(
                            clienteMembresia,
                            puntosCompra,
                            "🛒 Puntos por compra",
                            gasto
                        );
                    }
                }

                registrarVentaDia({
                    total: totalActual,
                    juegos:
                        juegoCobradoActual,
                    productos:
                        productosTotalActual,
                    metodo:
                        metodoPago,
                    clienteContado: 1,
                    minutos:
                        Number(
                            cuentaActual.game.minutos
                        ) || 0,
                    cantidadProductos:
                        Array.isArray(
                            cuentaActual.productos
                        )
                            ? cuentaActual.productos.reduce(
                                function(total, item) {
                                    return total +
                                        (
                                            Number(
                                                item.cantidad
                                            ) || 0
                                        );
                                },
                                0
                            )
                            : 0,
                    puntos:
                        clienteMembresia &&
                        puntosMembresiaActivos()
                            ? Math.max(
                                0,
                                Math.floor(
                                    (
                                        Number(
                                            cuentaActual.game.minutos
                                        ) || 0
                                    ) / 60 *
                                    Number(
                                        configuracionMembresia.puntosPorHora
                                    )
                                )
                            ) +
                            Math.max(
                                0,
                                Math.floor(
                                    totalActual *
                                    Number(
                                        configuracionMembresia.puntosPorPeso
                                    )
                                )
                            )
                            : 0
                });

                // Liberar estación por completo.
                if (estacionActual) {
                    estacionActual.segundos = 0;
                    estacionActual.activo = false;
                    estacionActual.finalizaEn = null;
                    estacionActual.terminado = false;
                    estacionActual.pausada = false;
                    estacionActual.cliente = "";
                    estacionActual.precioSesion = 0;
                    estacionActual.metodoPagoSesion = "";
                    estacionActual.duracionTotalSegundos = 0;
                    estacionActual.inicioSesion = null;
                    estacionActual.avisoMostrado = false;
                }

                ventasDelDia += totalActual;
                sesionesDelDia += 1;
                ventasPorMetodo[metodoPago] =
                    (
                        Number(
                            ventasPorMetodo[metodoPago]
                        ) || 0
                    ) + totalActual;

                const cuentaCobradaId =
                    cuentaActual.id;

                const estacionCobradaId =
                    cuentaActual.estacionId;

                // Eliminar únicamente la cuenta cobrada.
                cuentasJugadores =
                    cuentasJugadores.filter(
                        function(item) {
                            return !(
                                item &&
                                String(item.id) ===
                                String(cuentaCobradaId)
                            );
                        }
                    );

                // Limpiar cualquier cuenta abierta duplicada
                // de esa misma estación.
                cuentasJugadores =
                    cuentasJugadores.filter(
                        function(item) {
                            return !(
                                item &&
                                Number(item.estacionId) ===
                                Number(estacionCobradaId) &&
                                item.estado === "abierta"
                            );
                        }
                    );

                guardarDatos();

                // Verificación defensiva.
                const sobrante =
                    obtenerCuentaPorEstacion(
                        estacionCobradaId
                    );

                if (sobrante) {
                    cuentasJugadores =
                        cuentasJugadores.filter(
                            function(item) {
                                return !(
                                    item &&
                                    Number(
                                        item.estacionId
                                    ) ===
                                    Number(
                                        estacionCobradaId
                                    ) &&
                                    item.estado === "abierta"
                                );
                            }
                        );

                    guardarDatos();
                }

                mostrarEstaciones();

                alert(
                    "✅ CUENTA COBRADA\n\n" +
                    "👤 " +
                    cuentaActual.cliente +
                    "\n💰 Total: $" +
                    totalActual.toFixed(2) +
                    "\n" +
                    nombreMetodoPago(metodoPago) +
                    (
                        metodoPago === "efectivo"
                            ? "\n💵 Recibido: $" +
                              recibido.toFixed(2) +
                              "\n💵 Cambio: $" +
                              cambio.toFixed(2)
                            : ""
                    ) +
                    "\n\n🎮 La estación ya está disponible."
                );

                const imprimir =
                    confirm(
                        "¿Quieres imprimir el ticket?"
                    );

                if (imprimir) {
                    // Usamos una copia independiente de la cuenta para que
                    // la impresión no dependa del objeto que ya fue cerrado.
                    const datosTicket =
                        JSON.parse(
                            JSON.stringify(cuentaActual)
                        );

                    try {
                        imprimirTicketCuenta(
                            datosTicket,
                            metodoPago,
                            totalActual,
                            ticketFolio,
                            usuarioActualPro
                                ? usuarioActualPro.nombre
                                : "Usuario actual"
                        );
                    } catch (errorTicket) {
                        console.error(
                            "Error al imprimir ticket:",
                            errorTicket
                        );

                        alert(
                            "⚠️ El cobro se registró correctamente, " +
                            "pero no se pudo abrir/imprimir el ticket.\n\n" +
                            "Puedes volver a intentar desde Historial."
                        );
                    }
                }
            } finally {
                cobroCuentaEnProcesoId = null;
            }
        },
        function() {
            cobroCuentaEnProcesoId = null;
        }
    );
}


function cancelarCuentaJugador(id) {
    const cuenta =
        obtenerCuentaPorId(id);

    if (!cuenta) {
        return;
    }

    const confirmar =
        confirm(
            "❌ CANCELAR CUENTA\n\n" +
            "👤 " + cuenta.cliente +
            "\n" +
            "💰 $" +
            obtenerTotalCuenta(cuenta) +
            "\n\n" +
            "Los productos consumidos volverán al inventario." +
            "\nNo se registrará ninguna venta." +
            "\n\n¿Continuar?"
        );

    if (!confirmar) {
        return;
    }

    cuenta.productos.forEach(
        function(item) {
            const producto =
                obtenerProducto(
                    item.productoId
                );

            if (producto) {
                producto.stock +=
                    Number(item.cantidad) || 0;
            }
        }
    );

    if (cuenta.reservaId) {
        const reservaCuenta =
            obtenerReservaPorId(
                cuenta.reservaId
            );

        if (reservaCuenta) {
            reservaCuenta.estado =
                "pendiente";

            delete reservaCuenta.iniciadaEn;
        }
    }

    const estacion =
        obtenerEstacionPorId(
            cuenta.estacionId
        );

    if (estacion) {
        estacion.segundos = 0;
        estacion.activo = false;
        estacion.finalizaEn = null;
        estacion.terminado = false;
        estacion.pausada = false;
        estacion.cliente = "";
        estacion.precioSesion = 0;
        estacion.metodoPagoSesion = "";
        estacion.duracionTotalSegundos = 0;
        estacion.inicioSesion = null;
        estacion.avisoMostrado = false;
    }

    cuentasJugadores =
        cuentasJugadores.filter(
            function(item) {
                return Number(item.id) !==
                    Number(cuenta.id);
            }
        );

    guardarDatos();
    mostrarEstaciones();

    alert("🗑️ Cuenta cancelada.");
}


// ========================================
// PROMOCIONES Y DESCUENTOS
// ========================================

function obtenerDatosCliente(nombre) {
    const buscado =
        String(nombre || "")
            .trim()
            .toLowerCase();

    if (
        !buscado ||
        buscado === "sin nombre"
    ) {
        return {
            sesiones: 0,
            gasto: 0
        };
    }

    let sesiones = 0;
    let gasto = 0;

    historial.forEach(function(venta) {
        const cliente =
            String(venta.cliente || "")
                .trim()
                .toLowerCase();

        if (cliente !== buscado) {
            return;
        }

        gasto +=
            Number(venta.precio) || 0;

        if (
            venta.tipo !== "producto"
        ) {
            sesiones += 1;
        }
    });

    return {
        sesiones: sesiones,
        gasto: gasto
    };
}

function calcularPrecioPromocional(precioBase, cliente) {
    const promo =
        configuracion.promociones || {};

    const sesionesNecesarias =
        Number(promo.sesionesParaDescuento) || 5;

    const porcentaje =
        Number(promo.descuentoClienteFrecuente) || 0;

    const datosCliente =
        obtenerDatosCliente(cliente);

    if (
        datosCliente.sesiones >= sesionesNecesarias &&
        porcentaje > 0
    ) {
        const descuento =
            Math.round(
                precioBase * porcentaje / 100
            );

        return {
            precioOriginal: precioBase,
            descuento: descuento,
            precioFinal: Math.max(
                0,
                precioBase - descuento
            ),
            motivo:
                "👑 Cliente frecuente -" +
                porcentaje +
                "%"
        };
    }

    return {
        precioOriginal: precioBase,
        descuento: 0,
        precioFinal: precioBase,
        motivo: ""
    };
}


// ========================================
// METODOS DE PAGO
// ========================================

function seleccionarMetodoPago(precio, alSeleccionar) {
    const anterior =
        document.getElementById("modalMetodoPago");

    if (anterior) {
        anterior.remove();
    }

    const fondo = document.createElement("div");

    fondo.id = "modalMetodoPago";
    fondo.style.position = "fixed";
    fondo.style.inset = "0";
    fondo.style.background = "rgba(0,0,0,.72)";
    fondo.style.display = "flex";
    fondo.style.alignItems = "center";
    fondo.style.justifyContent = "center";
    fondo.style.zIndex = "9999";
    fondo.style.padding = "20px";

    const caja = document.createElement("div");

    caja.style.width = "min(430px,100%)";
    caja.style.background = "#1c2028";
    caja.style.color = "white";
    caja.style.borderRadius = "20px";
    caja.style.padding = "25px";
    caja.style.textAlign = "center";
    caja.style.boxShadow =
        "0 15px 45px rgba(0,0,0,.55)";

    const titulo = document.createElement("h1");
    titulo.textContent = "🎮 Nueva sesión";
    titulo.style.marginTop = "0";

    const importe = document.createElement("h2");
    importe.textContent =
        "Total: $" + precio;

    const etiqueta = document.createElement("p");
    etiqueta.textContent =
        "Nombre del cliente (opcional):";

    const clienteInput =
        document.createElement("input");

    clienteInput.type = "text";
    clienteInput.placeholder = "Ej. Juan";
    clienteInput.maxLength = 40;
    clienteInput.style.width = "100%";
    clienteInput.style.boxSizing = "border-box";
    clienteInput.style.padding = "12px";
    clienteInput.style.margin = "6px 0 10px";
    clienteInput.style.borderRadius = "10px";
    clienteInput.style.border =
        "1px solid #555b66";
    clienteInput.style.background = "#0b0d11";
    clienteInput.style.color = "white";
    clienteInput.style.fontSize = "16px";

    const promocion =
        document.createElement("div");

    promocion.style.minHeight = "25px";
    promocion.style.marginBottom = "10px";

    function actualizarPrecio() {
        const cliente =
            clienteInput.value.trim();

        const resumen =
            calcularPrecioPromocional(
                precio,
                cliente
            );

        importe.textContent =
            "Total: $" + resumen.precioFinal;

        if (resumen.descuento > 0) {
            promocion.innerHTML =
                "<strong style='color:#22c55e;'>" +
                resumen.motivo +
                "</strong><br>" +
                "<span style='font-size:13px;'>" +
                "Ahorro: $" +
                resumen.descuento +
                "</span>";
        } else {
            promocion.textContent = "";
        }
    }

    clienteInput.addEventListener(
        "input",
        actualizarPrecio
    );

    const texto = document.createElement("p");
    texto.textContent =
        "Selecciona cómo pagó el cliente.";

    caja.appendChild(titulo);
    caja.appendChild(importe);
    caja.appendChild(etiqueta);
    caja.appendChild(clienteInput);
    caja.appendChild(promocion);
    caja.appendChild(texto);

    const metodos = [
        {
            id: "efectivo",
            texto: "💵 Efectivo"
        },
        {
            id: "tarjeta",
            texto: "💳 Tarjeta"
        },
        {
            id: "transferencia",
            texto: "📱 Transferencia"
        }
    ];

    metodos.forEach(function(metodo) {
        const boton =
            document.createElement("button");

        boton.textContent = metodo.texto;
        boton.style.display = "block";
        boton.style.width = "100%";
        boton.style.margin = "10px 0";
        boton.style.padding = "14px";
        boton.style.fontSize = "17px";
        boton.style.fontWeight = "bold";

        boton.onclick = function() {
            const cliente =
                clienteInput.value.trim() ||
                "Sin nombre";

            const resumen =
                calcularPrecioPromocional(
                    precio,
                    cliente
                );

            fondo.remove();

            alSeleccionar(
                metodo.id,
                cliente,
                resumen
            );
        };

        caja.appendChild(boton);
    });

    const cancelar =
        document.createElement("button");

    cancelar.textContent = "❌ Cancelar";

    cancelar.onclick = function() {
        fondo.remove();
    };

    caja.appendChild(cancelar);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    setTimeout(function() {
        clienteInput.focus();
    }, 50);
}

function nombreMetodoPago(metodo) {
    if (metodo === "efectivo") {
        return "💵 Efectivo";
    }

    if (metodo === "tarjeta") {
        return "💳 Tarjeta";
    }

    if (metodo === "transferencia") {
        return "📱 Transferencia";
    }

    return "Sin especificar";
}


// ========================================
// VENDER TIEMPO
// ========================================

function venderTiempo(
    id,
    minutos,
    precio
) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const estacion =
        obtenerEstacionPorId(id);

    if (!estacion) {
        return;
    }

    if (estacion.habilitada === false) {
        alert(
            "⚠️ Esta estación está deshabilitada."
        );
        return;
    }

    let cuenta =
        obtenerCuentaPorEstacion(id);

    // Si quedó una cuenta pagada/huérfana de una versión
    // anterior, no debe bloquear una nueva sesión.
    if (
        cuenta &&
        (
            cuenta.pagada === true ||
            Number(cuenta.importePagado) > 0 ||
            (
                !estacion.cliente &&
                Number(
                    cuenta.game &&
                    cuenta.game.precio
                ) > 0
            )
        )
    ) {
        cuentasJugadores =
            cuentasJugadores.filter(
                function(item) {
                    return Number(item.id) !==
                        Number(cuenta.id);
                }
            );

        cuenta = null;
        guardarDatos();
    }

    if (cuenta) {
        const tiempoRestante =
            Number(
                estacion.segundos
            ) || 0;

        if (
            tiempoRestante <= 0 &&
            !estacion.activo
        ) {
            const confirmar =
                confirm(
                    "🧾 ESTA ESTACIÓN TIENE UNA CUENTA ABIERTA\n\n" +
                    "👤 " +
                    cuenta.cliente +
                    "\n" +
                    "💰 Pendiente actual: $" +
                    obtenerTotalCuenta(cuenta) +
                    "\n\n" +
                    "El tiempo ya terminó.\n" +
                    "¿Quieres agregar " +
                    minutos +
                    " minutos a la cuenta actual?\n\n" +
                    "💰 Precio: $" +
                    precio +
                    "\n\n" +
                    "La nueva sesión comenzará automáticamente."
                );

            if (!confirmar) {
                return;
            }

            agregarTiempoMinutos(
                id,
                minutos,
                precio
            );

            return;
        }

        alert(
            "🧾 Esta estación ya tiene una cuenta abierta.\n\n" +
            "👤 " +
            cuenta.cliente +
            "\n" +
            "💰 Pendiente: $" +
            obtenerTotalCuenta(cuenta) +
            "\n\n" +
            "Usa +30 min, +1 hora o la cuenta actual " +
            "para agregar tiempo o consumos.\n\n" +
            "Para iniciar una cuenta completamente nueva, " +
            "primero cobra la cuenta actual."
        );

        return;
    }

    const reservaBloqueo =
        reservaBloqueaNuevaSesion(
            id,
            minutos
        );

    if (reservaBloqueo) {
        alert(
            "📅 Esta estación está reservada.\n\n" +
            "👤 " +
            reservaBloqueo.cliente +
            "\n🕐 " +
            reservaBloqueo.hora +
            "\n⏱️ " +
            reservaBloqueo.duracion +
            " minutos\n\n" +
            "No puedes iniciar una sesión que invada ese horario."
        );
        return;
    }

    if (estacion.segundos > 0) {
        alert(
            "Esta estación todavía tiene tiempo disponible."
        );
        return;
    }

    abrirCuentaDesdeSesion(
        estacion,
        minutos,
        precio
    );
}



// ========================================
// CONTROL AVANZADO DE SESION
// ========================================

function editarNotaCuenta(cuentaId) {
    const cuenta = obtenerCuentaPorId(cuentaId);

    if (!cuenta) {
        alert("❌ La cuenta ya no está abierta.");
        return;
    }

    const nota = prompt(
        "📝 Nota de la cuenta:",
        cuenta.nota || ""
    );

    if (nota === null) {
        return;
    }

    cuenta.nota = nota.trim();
    cuenta.notaActualizadaEn = new Date().toISOString();

    guardarDatos();
    mostrarCuentaJugador(cuenta.id);
}

function pausarSesion(id) {
    if (estadoCaja !== "abierta") {
        alert("🔒 La caja debe estar abierta.");
        return;
    }

    const estacion = obtenerEstacionPorId(id);
    const cuenta = obtenerCuentaPorEstacion(id);

    if (!estacion || !cuenta) {
        alert("❌ No hay una cuenta abierta en esta estación.");
        return;
    }

    if (!estacion.activo || !estacion.finalizaEn) {
        alert("⏸️ La sesión no está corriendo.");
        return;
    }

    const restante = estacion.finalizaEn - Date.now();

    if (restante <= 0) {
        actualizarTiempos();
        return;
    }

    estacion.segundos = Math.ceil(restante / 1000);
    estacion.activo = false;
    estacion.pausada = true;
    estacion.finalizaEn = null;
    estacion.avisoMostrado = false;

    guardarDatos();
    mostrarEstaciones();

    alert(
        "⏸️ Sesión pausada.\n\n" +
        "⏳ Quedan " +
        formatearTiempo(estacion.segundos) +
        "."
    );
}

function reanudarSesion(id) {
    if (estadoCaja !== "abierta") {
        alert("🔒 La caja debe estar abierta.");
        return;
    }

    const estacion = obtenerEstacionPorId(id);
    const cuenta = obtenerCuentaPorEstacion(id);

    if (!estacion || !cuenta) {
        alert("❌ No hay una cuenta abierta en esta estación.");
        return;
    }

    if (Number(estacion.segundos) <= 0) {
        alert("⏰ Esta sesión ya no tiene tiempo.");
        return;
    }

    const bloqueo = reservaBloqueaNuevaSesion(
        estacion.id,
        Math.ceil(Number(estacion.segundos) / 60)
    );

    if (bloqueo) {
        alert(
            "📅 No puedes reanudar porque hay una reserva que se cruza.\n\n" +
            "👤 " + bloqueo.cliente +
            "\n🕐 " + bloqueo.hora
        );
        return;
    }

    estacion.activo = true;
    estacion.pausada = false;
    estacion.terminado = false;
    estacion.finalizaEn =
        Date.now() + Number(estacion.segundos) * 1000;
    estacion.avisoMostrado = false;

    guardarDatos();
    mostrarEstaciones();

    alert(
        "▶️ Sesión reanudada.\n\n" +
        "⏳ Restan " +
        formatearTiempo(estacion.segundos) +
        "."
    );
}

function cambiarEstacionCuenta(cuentaId) {
    if (estadoCaja !== "abierta") {
        alert("🔒 La caja debe estar abierta.");
        return;
    }

    const cuenta = obtenerCuentaPorId(cuentaId);

    if (!cuenta) {
        alert("❌ La cuenta ya no está abierta.");
        return;
    }

    const actual = obtenerEstacionPorId(cuenta.estacionId);

    if (!actual) {
        alert("❌ No se encontró la estación actual.");
        return;
    }

    const disponibles = estaciones.filter(function(estacion) {
        return (
            estacion.habilitada !== false &&
            Number(estacion.id) !== Number(actual.id) &&
            !obtenerCuentaPorEstacion(estacion.id) &&
            !estacion.activo &&
            Number(estacion.segundos || 0) <= 0
        );
    });

    if (!disponibles.length) {
        alert("❌ No hay otra estación disponible.");
        return;
    }

    let opciones =
        "🔄 CAMBIAR ESTACIÓN\n\n" +
        "👤 " + cuenta.cliente +
        "\n📍 Actual: " + actual.nombre +
        "\n\n";

    disponibles.forEach(function(estacion, indice) {
        opciones +=
            (indice + 1) + ". " +
            iconoTipoEstacion(estacion.tipo) +
            " " + estacion.nombre + "\n";
    });

    const respuesta = prompt(opciones);

    if (respuesta === null) {
        return;
    }

    const indice = Number(respuesta) - 1;

    if (!Number.isInteger(indice) || !disponibles[indice]) {
        alert("❌ Selección inválida.");
        return;
    }

    const nueva = disponibles[indice];

    const restanteActual = Number(actual.segundos) || 0;

    if (restanteActual > 0) {
        const bloqueo = reservaBloqueaNuevaSesion(
            nueva.id,
            Math.ceil(restanteActual / 60)
        );

        if (bloqueo) {
            alert(
                "📅 " + nueva.nombre +
                " tiene una reserva que se cruza con el tiempo restante.\n\n" +
                "👤 " + bloqueo.cliente +
                "\n🕐 " + bloqueo.hora
            );
            return;
        }
    }

    if (!confirm(
        "🔄 " + actual.nombre +
        " → " + nueva.nombre +
        "\n\nEl tiempo, consumos y cuenta se conservarán.\n\n¿Continuar?"
    )) {
        return;
    }

    // Actualizar el tiempo real antes de moverlo.
    if (actual.activo && actual.finalizaEn) {
        actual.segundos = Math.max(
            0,
            Math.ceil((actual.finalizaEn - Date.now()) / 1000)
        );
    }

    const segundos = Number(actual.segundos) || 0;
    const duracionTotal =
        Number(actual.duracionTotalSegundos) ||
        Number(cuenta.game.minutos || 0) * 60 ||
        segundos;

    const estabaActiva = actual.activo === true;
    const estabaTerminada = actual.terminado === true;

    const nombreAnterior = actual.nombre;
    const tipoAnterior = actual.tipo;

    // Si viene de una reserva, la reserva sigue a la cuenta.
    if (cuenta.reservaId) {
        const reserva = obtenerReservaPorId(cuenta.reservaId);
        if (reserva) {
            reserva.estacionId = Number(nueva.id);
        }
    }

    // Limpiar estación anterior.
    actual.segundos = 0;
    actual.activo = false;
    actual.finalizaEn = null;
    actual.terminado = false;
    actual.pausada = false;
    actual.cliente = "";
    actual.precioSesion = 0;
    actual.metodoPagoSesion = "";
    actual.duracionTotalSegundos = 0;
    actual.inicioSesion = null;
    actual.avisoMostrado = false;

    // Colocar la cuenta en la nueva estación.
    nueva.segundos = segundos;
    nueva.duracionTotalSegundos = duracionTotal;
    nueva.cliente = cuenta.cliente;
    nueva.precioSesion = cuenta.game.precio;
    nueva.metodoPagoSesion = "";
    nueva.inicioSesion = cuenta.inicioSesion;
    nueva.avisoMostrado = false;
    nueva.terminado = estabaTerminada && segundos <= 0;
    nueva.pausada = !estabaActiva && segundos > 0;
    nueva.activo = false;
    nueva.finalizaEn = null;

    if (estabaActiva && segundos > 0) {
        nueva.activo = true;
        nueva.pausada = false;
        nueva.terminado = false;
        nueva.finalizaEn =
            Date.now() + segundos * 1000;
    }

    cuenta.estacionId = Number(nueva.id);
    cuenta.estacion = nueva.nombre;
    cuenta.tipoEstacion = nueva.tipo;

    if (!Array.isArray(cuenta.cambiosEstacion)) {
        cuenta.cambiosEstacion = [];
    }

    cuenta.cambiosEstacion.push({
        fecha: obtenerFecha(),
        hora: obtenerHora(),
        anterior: nombreAnterior,
        anteriorTipo: tipoAnterior,
        nueva: nueva.nombre,
        nuevaTipo: nueva.tipo
    });

    guardarDatos();
    mostrarEstaciones();

    alert(
        "✅ Cuenta movida correctamente.\n\n" +
        "🔄 " + nombreAnterior +
        " → " + nueva.nombre
    );
}

// ========================================
// AGREGAR TIEMPO RAPIDO
// ========================================

function agregarTiempoMinutos(
    id,
    minutos,
    precioBase
) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const minutosNumero =
        Math.floor(Number(minutos) || 0);

    if (minutosNumero <= 0) {
        alert("❌ El tiempo agregado no es válido.");
        return;
    }

    const estacion =
        obtenerEstacionPorId(id);

    if (!estacion) {
        return;
    }

    const precios =
        obtenerPreciosEstacion(estacion);

    let precioExtra =
        Number(precioBase);

    if (
        !Number.isFinite(precioExtra) ||
        precioExtra < 0
    ) {
        precioExtra =
            tarifaPorMinutosPro(
                precios,
                minutosNumero
            );
    }

    let cuenta =
        obtenerCuentaPorEstacion(id);

    const cuentaPagada =
        cuenta &&
        (
            cuenta.pagada === true ||
            Number(cuenta.importePagado) > 0
        );

    const cuentaHuérfana =
        cuenta &&
        !estacion.cliente &&
        Number(
            cuenta.game &&
            cuenta.game.precio
        ) > 0;

    if (cuentaPagada || cuentaHuérfana) {
        cuentasJugadores =
            cuentasJugadores.filter(
                function(item) {
                    return (
                        Number(item.id) !==
                        Number(cuenta.id)
                    );
                }
            );

        cuenta = null;
        guardarDatos();
    }

    // Si ya no existe una cuenta, este botón significa
    // "abrir un nuevo ciclo". Nunca reutilizamos el importe
    // anterior ni el cliente anterior automáticamente.
    if (!cuenta) {
        if (
            estacion.activo ||
            Number(estacion.segundos) > 0
        ) {
            alert(
                "⚠️ Esta estación tiene tiempo activo pero no tiene una cuenta abierta.\n\n" +
                "No crearé un cobro nuevo para evitar duplicar la sesión.\n" +
                "Revisa la cuenta de la estación."
            );
            return;
        }

        const reservaBloqueo =
            reservaBloqueaNuevaSesion(
                id,
                minutosNumero
            );

        if (reservaBloqueo) {
            alert(
                "📅 Esta estación está reservada.\n\n" +
                "👤 " +
                reservaBloqueo.cliente +
                "\n🕐 " +
                reservaBloqueo.hora +
                "\n⏱️ " +
                reservaBloqueo.duracion +
                " minutos\n\n" +
                "No puedes agregar tiempo que invada esa reserva."
            );
            return;
        }

        abrirCuentaDesdeSesion(
            estacion,
            minutosNumero,
            precioExtra
        );

        return;
    }

    const resumen =
        calcularPrecioPromocional(
            precioExtra,
            cuenta.cliente
        );

    const estabaActiva =
        estacion.activo === true;

    const estabaPausada =
        estacion.pausada === true &&
        !estacion.activo;

    // Si la sesión está activa, congelamos el restante real
    // antes de sumar el nuevo tiempo.
    if (
        estabaActiva &&
        estacion.finalizaEn
    ) {
        estacion.segundos =
            Math.max(
                0,
                Math.ceil(
                    (
                        Number(estacion.finalizaEn) -
                        Date.now()
                    ) / 1000
                )
            );
    }

    const estabaAgotada =
        Number(estacion.segundos) <= 0;

    cuenta.game.minutos +=
        minutosNumero;

    cuenta.game.precioOriginal +=
        Number(resumen.precioOriginal) || 0;

    cuenta.game.descuento +=
        Number(resumen.descuento) || 0;

    cuenta.game.precio +=
        Number(resumen.precioFinal) || 0;

    if (
        resumen.motivo &&
        !cuenta.game.promociones.includes(
            resumen.motivo
        )
    ) {
        cuenta.game.promociones.push(
            resumen.motivo
        );
    }

    const segundosExtra =
        minutosNumero * 60;

    estacion.segundos =
        Math.max(
            0,
            Number(estacion.segundos) || 0
        ) +
        segundosExtra;

    estacion.duracionTotalSegundos =
        Math.max(
            0,
            Number(
                estacion.duracionTotalSegundos
            ) || 0
        ) +
        segundosExtra;

    estacion.terminado = false;
    estacion.avisoMostrado = false;
    estacion.cliente =
        cuenta.cliente;
    estacion.precioSesion =
        cuenta.game.precio;

    if (estabaActiva) {
        estacion.activo = true;
        estacion.pausada = false;
        estacion.finalizaEn =
            Date.now() +
            Number(estacion.segundos) * 1000;
    } else if (estabaPausada) {
        // Agregar tiempo a una sesión pausada NO la reanuda
        // silenciosamente.
        estacion.activo = false;
        estacion.pausada = true;
        estacion.finalizaEn = null;
    } else {
        // Tiempo agotado o sesión detenida: vuelve a correr.
        estacion.activo = true;
        estacion.pausada = false;
        estacion.finalizaEn =
            Date.now() +
            Number(estacion.segundos) * 1000;
    }

    if (!estacion.inicioSesion) {
        estacion.inicioSesion =
            cuenta.inicioSesion ||
            obtenerHora();
    }

    guardarDatos();
    mostrarEstaciones();

    alert(
        "➕ Tiempo agregado a la cuenta.\n\n" +
        "+" +
        minutosNumero +
        " minutos · $" +
        Number(resumen.precioFinal).toFixed(2) +
        "\n🧾 Pendiente actual: $" +
        obtenerTotalCuenta(cuenta) +
        (
            estabaAgotada
                ? "\n\n▶️ La sesión volvió a iniciar automáticamente."
                : (
                    estabaPausada
                        ? "\n\n⏸️ La sesión sigue pausada."
                        : ""
                )
        )
    );
}


function agregarTiempo(id) {
    const estacion =
        obtenerEstacionPorId(id);

    if (!estacion) {
        return;
    }

    const precios =
        obtenerPreciosEstacion(
            estacion
        );

    const tarifa =
        precios.lista.length > 1
            ? precios.lista[1]
            : precios.lista[0];

    if (!tarifa) {
        alert(
            "❌ No hay tarifas configuradas."
        );
        return;
    }

    agregarTiempoMinutos(
        id,
        Number(tarifa.minutos),
        Number(tarifa.precio)
    );
}


// ========================================
// INICIAR / DETENER / REINICIAR
// ========================================

function iniciar(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const estacion =
        estaciones.find(function(e) {
            return e.id === id;
        });

    if (!estacion || estacion.segundos <= 0) {
        return;
    }

    estacion.activo = true;
    estacion.terminado = false;

    if (!estacion.inicioSesion) {
        estacion.inicioSesion = obtenerHora();
    }

    if (!estacion.duracionTotalSegundos) {
        estacion.duracionTotalSegundos =
            estacion.segundos;
    }

    estacion.finalizaEn =
        Date.now() + estacion.segundos * 1000;

    guardarDatos();
    mostrarEstaciones();
}

function detener(id) {
    const estacion =
        estaciones.find(function(e) {
            return e.id === id;
        });

    if (!estacion) {
        return;
    }

    if (estacion.activo && estacion.finalizaEn) {
        const restante =
            estacion.finalizaEn - Date.now();

        estacion.segundos =
            Math.max(
                0,
                Math.ceil(restante / 1000)
            );
    }

    estacion.activo = false;
    estacion.finalizaEn = null;
    estacion.pausada = false;

    guardarDatos();
    mostrarEstaciones();
}

function reiniciar(id) {
    const cuenta =
        obtenerCuentaPorEstacion(id);

    if (cuenta) {
        cancelarCuentaJugador(
            cuenta.id
        );
        return;
    }

    const estacion =
        estaciones.find(function(e) {
            return e.id === id;
        });

    if (!estacion) {
        return;
    }

    estacion.segundos = 0;
    estacion.activo = false;
    estacion.finalizaEn = null;
    estacion.terminado = false;

    estacion.cliente = "";
    estacion.precioSesion = 0;
    estacion.metodoPagoSesion = "";
    estacion.duracionTotalSegundos = 0;
    estacion.inicioSesion = null;
    estacion.avisoMostrado = false;

    guardarDatos();
    mostrarEstaciones();
}


// ========================================
// ARQUEO DE CAJA
// ========================================

function obtenerGastosEnEfectivo() {
    return gastos.reduce(function(total, gasto) {
        const metodo = gasto.metodoPago || "efectivo";

        if (metodo === "efectivo") {
            return total + (Number(gasto.monto) || 0);
        }

        return total;
    }, 0);
}

function obtenerEntradasCaja() {
    return movimientosCaja.reduce(function(total, movimiento) {
        if (movimiento.tipo === "entrada") {
            return total + (Number(movimiento.monto) || 0);
        }

        return total;
    }, 0);
}

function obtenerSalidasCaja() {
    return movimientosCaja.reduce(function(total, movimiento) {
        if (movimiento.tipo === "salida") {
            return total + (Number(movimiento.monto) || 0);
        }

        return total;
    }, 0);
}

function obtenerMovimientoNetoCaja() {
    return obtenerEntradasCaja() -
        obtenerSalidasCaja();
}

function obtenerEfectivoEsperado() {
    return Math.max(
        0,
        (Number(fondoCajaInicial) || 0) +
        (Number(ventasPorMetodo.efectivo) || 0) -
        obtenerGastosEnEfectivo() +
        obtenerMovimientoNetoCaja()
    );
}


// ========================================
// GASTOS
// ========================================

function agregarGasto() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const concepto = prompt(
        "¿Qué gasto quieres registrar?\n\n" +
        "Ejemplo: Luz, Internet, Renta, Otros"
    );

    if (!concepto) {
        return;
    }

    const monto = Number(
        prompt("¿Cuánto pagaste?")
    );

    if (isNaN(monto) || monto <= 0) {
        alert("Escribe una cantidad válida.");
        return;
    }

    const metodoTexto = prompt(
        "¿Cómo pagaste este gasto?\n\n" +
        "1 = 💵 Efectivo\n" +
        "2 = 💳 Tarjeta\n" +
        "3 = 📱 Transferencia"
    );

    if (metodoTexto === null) {
        return;
    }

    const metodos = {
        "1": "efectivo",
        "2": "tarjeta",
        "3": "transferencia"
    };

    const metodoPago =
        metodos[String(metodoTexto).trim()];

    if (!metodoPago) {
        alert("Selecciona 1, 2 o 3.");
        return;
    }

    gastos.push({
        hora: obtenerHora(),
        concepto: concepto,
        monto: monto,
        metodoPago: metodoPago
    });

    gastosDelDia += monto;

    guardarDatos();
    mostrarEstaciones();
}


// ========================================
// CLIENTES FRECUENTES
// ========================================

function obtenerResumenClientes() {
    const mapa = {};

    historial.forEach(function(venta) {
        const nombre =
            String(venta.cliente || "")
                .trim();

        if (
            !nombre ||
            nombre.toLowerCase() === "sin nombre"
        ) {
            return;
        }

        const clave =
            nombre.toLowerCase();

        if (!mapa[clave]) {
            mapa[clave] = {
                nombre: nombre,
                sesiones: 0,
                gasto: 0,
                minutos: 0,
                ultimaHora: ""
            };
        }

        mapa[clave].gasto +=
            Number(venta.precio) || 0;

        mapa[clave].ultimaHora =
            venta.hora || "";

        if (venta.tipo !== "producto") {
            mapa[clave].sesiones += 1;

            mapa[clave].minutos +=
                obtenerMinutosVenta(
                    venta.tiempo
                );
        }
    });

    return Object.values(mapa).sort(
        function(a, b) {
            return (
                b.gasto - a.gasto ||
                b.sesiones - a.sesiones
            );
        }
    );
}

function editarClientePro(id) {
    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (!cliente) {
        return;
    }

    const telefono =
        prompt(
            "📱 Teléfono del cliente:",
            cliente.telefono || ""
        );

    if (telefono === null) {
        return;
    }

    const notas =
        prompt(
            "📝 Notas del cliente:",
            cliente.notas || ""
        );

    if (notas === null) {
        return;
    }

    const fin =
        prompt(
            "📅 Vencimiento de membresía (YYYY-MM-DD)\n\n" +
            "Déjalo vacío si no quieres fecha de vencimiento.",
            cliente.membresiaFin || ""
        );

    if (fin === null) {
        return;
    }

    const finLimpio =
        String(fin).trim();

    if (
        finLimpio &&
        !/^\\d{4}-\\d{2}-\\d{2}$/.test(finLimpio)
    ) {
        alert(
            "❌ La fecha debe tener el formato YYYY-MM-DD."
        );
        return;
    }

    cliente.telefono =
        telefono.trim();

    cliente.notas =
        notas.trim();

    cliente.membresiaFin =
        finLimpio;

    const activar =
        confirm(
            "⭐ ¿Mantener la membresía activa?\n\n" +
            "Aceptar = activa\n" +
            "Cancelar = inactiva\n\n" +
            "Los puntos existentes se conservan."
        );

    cliente.membresiaActiva =
        activar;

    guardarDatos();
    mostrarPerfilClientePro(id);
}

function registrarCargoClientePro(id) {
    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (!cliente) {
        return;
    }

    const concepto =
        prompt(
            "💳 ¿Qué deuda quieres registrar?\n\n" +
            "Ejemplo: consumo pendiente, sesión pendiente..."
        );

    if (!concepto) {
        return;
    }

    const monto =
        Number(
            prompt("💰 Monto de la deuda:")
        );

    if (
        !isFinite(monto) ||
        monto <= 0
    ) {
        alert("❌ Escribe una cantidad válida.");
        return;
    }

    cliente.saldo += monto;

    cliente.movimientosCuenta.push({
        tipo: "cargo",
        monto: monto,
        concepto: concepto.trim(),
        fecha: obtenerFecha(),
        hora: obtenerHora()
    });

    guardarDatos();
    mostrarPerfilClientePro(id);
}

function registrarAbonoClientePro(id) {
    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (
        !cliente ||
        Number(cliente.saldo) <= 0
    ) {
        return;
    }

    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja para registrar un abono."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const monto =
        Number(
            prompt(
                "💵 Abono de deuda\n\n" +
                "Deuda actual: " +
                dinero(cliente.saldo) +
                "\n\n¿Cuánto va a abonar?"
            )
        );

    if (
        !isFinite(monto) ||
        monto <= 0 ||
        monto > Number(cliente.saldo)
    ) {
        alert(
            "❌ El abono debe ser mayor a 0 y no superar la deuda."
        );
        return;
    }

    const metodoTexto =
        prompt(
            "¿Cómo pagó el abono?\n\n" +
            "1 = 💵 Efectivo\n" +
            "2 = 💳 Tarjeta\n" +
            "3 = 📱 Transferencia"
        );

    if (metodoTexto === null) {
        return;
    }

    const metodos = {
        "1": "efectivo",
        "2": "tarjeta",
        "3": "transferencia"
    };

    const metodo =
        metodos[
            String(metodoTexto).trim()
        ];

    if (!metodo) {
        alert("❌ Selecciona 1, 2 o 3.");
        return;
    }

    const concepto =
        prompt(
            "📝 Concepto del abono:",
            "Abono de deuda"
        );

    if (!concepto) {
        return;
    }

    cliente.saldo -= monto;

    cliente.movimientosCuenta.push({
        tipo: "abono",
        monto: monto,
        concepto: concepto.trim(),
        metodoPago: metodo,
        fecha: obtenerFecha(),
        hora: obtenerHora()
    });

    if (metodo === "efectivo") {
        movimientosCaja.push({
            fecha: obtenerFecha(),
            hora: obtenerHora(),
            tipo: "entrada",
            concepto:
                "Cobro de deuda · " +
                cliente.nombre,
            monto: monto
        });
    }

    guardarDatos();
    mostrarPerfilClientePro(id);
}

function cambiarMembresiaClientePro(id) {
    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (!cliente) {
        return;
    }

    cliente.membresiaActiva =
        cliente.membresiaActiva === false;

    if (
        cliente.membresiaActiva &&
        !cliente.membresiaInicio
    ) {
        cliente.membresiaInicio =
            obtenerFecha();
    }

    guardarDatos();
    mostrarPerfilClientePro(id);
}

function exportarClientesProCSV() {
    sincronizarDatosClientePro();

    const filas = [
        [
            "Cliente",
            "Telefono",
            "Membresia",
            "Vencimiento",
            "Nivel",
            "Puntos",
            "Sesiones",
            "Minutos",
            "Productos",
            "Consumo",
            "Deuda",
            "Ultima visita"
        ]
    ];

    clientesMembresia.forEach(function(cliente) {
        const resumen =
            obtenerResumenClientePro(cliente);

        const estado =
            estadoMembresiaClientePro(cliente);

        const nivel =
            nivelClientePro(cliente);

        filas.push([
            cliente.nombre || "",
            cliente.telefono || "",
            estado.texto.replace(/[🟢🔴🟠]/g, "").trim(),
            cliente.membresiaFin || "",
            nivel.nombre,
            Number(cliente.puntos) || 0,
            resumen.sesiones,
            resumen.minutos,
            resumen.productos,
            resumen.gasto,
            Number(cliente.saldo) || 0,
            cliente.ultimaVisita || ""
        ]);
    });

    const csv =
        filas.map(function(fila) {
            return fila.map(function(valor) {
                return '"' +
                    String(
                        valor == null ? "" : valor
                    ).replace(/"/g, '""') +
                    '"';
            }).join(",");
        }).join("\\n");

    descargarArchivo(
        "Clientes_PRO_" +
        obtenerFecha() +
        ".csv",
        "\\ufeff" + csv,
        "text/csv;charset=utf-8"
    );
}

function mostrarPerfilClientePro(id) {
    sincronizarDatosClientePro();

    const cliente =
        clientesMembresia.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (!cliente) {
        return;
    }

    normalizarClientePro(cliente);

    vistaActual = "clientes";

    const resumen =
        obtenerResumenClientePro(cliente);

    const nivel =
        nivelClientePro(cliente);

    const estado =
        estadoMembresiaClientePro(cliente);

    const progreso =
        progresoNivelMembresia(cliente.puntos);

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    div.className =
        "v27-client-profile-page";

    const movimientos =
        Array.isArray(cliente.movimientosCuenta)
            ? cliente.movimientosCuenta
                .slice()
                .reverse()
                .slice(0, 20)
            : [];

    const actividad =
        resumen.ventas
            .slice()
            .reverse()
            .slice(0, 30);

    let html =
        "<div class='v27-client-profile-top'>" +
            "<button class='v27-back-button' onclick='mostrarClientes()'>← Clientes PRO</button>" +
            "<div class='v27-client-profile-actions'>" +
                "<button onclick='editarClientePro(" + cliente.id + ")'>✏️ Editar</button>" +
                "<button onclick='exportarClientesProCSV()'>📄 CSV</button>" +
            "</div>" +
        "</div>" +

        "<div class='v27-client-profile-hero'>" +
            "<div class='v27-client-profile-avatar'>" +
                nivel.icono +
            "</div>" +
            "<div class='v27-client-profile-identity'>" +
                "<div class='v27-eyebrow'>PERFIL DE CLIENTE</div>" +
                "<h1>" +
                    escaparHTML(cliente.nombre) +
                "</h1>" +
                "<p>" +
                    (
                        cliente.telefono
                            ? "📱 " + escaparHTML(cliente.telefono)
                            : "Sin teléfono registrado"
                    ) +
                "</p>" +
                "<div class='v27-client-badges'>" +
                    "<span class='v27-client-level-badge'>" +
                        nivel.icono + " " + nivel.nombre +
                    "</span>" +
                    "<span class='v27-client-status-badge " +
                        estado.clase +
                    "'>" +
                        estado.texto +
                    "</span>" +
                "</div>" +
            "</div>" +
            "<div class='v27-client-profile-main-stat'>" +
                "<span>💰 CONSUMO TOTAL</span>" +
                "<strong>" +
                    dinero(resumen.gasto) +
                "</strong>" +
                "<small>" +
                    resumen.ventas.length +
                    " movimientos de consumo" +
                "</small>" +
            "</div>" +
        "</div>" +

        "<div class='v27-client-profile-kpis'>" +
            "<div><span>⭐ PUNTOS</span><strong>" + Number(cliente.puntos) + "</strong><small>" +
                (membresiaClienteActiva(cliente) ? "Puede ganar/canjear" : "Puntos pausados") +
            "</small></div>" +
            "<div><span>🎮 SESIONES</span><strong>" + resumen.sesiones + "</strong><small>registradas</small></div>" +
            "<div><span>⏱️ TIEMPO</span><strong>" +
                Math.floor(resumen.minutos / 60) +
                "h " +
                (resumen.minutos % 60) +
                "m</strong><small>jugado</small></div>" +
            "<div><span>🛒 PRODUCTOS</span><strong>" + resumen.productos + "</strong><small>unidades</small></div>" +
            "<div><span>💳 DEUDA</span><strong>" + dinero(cliente.saldo) + "</strong><small>" +
                (Number(cliente.saldo) > 0 ? "pendiente" : "sin deuda") +
            "</small></div>" +
        "</div>" +

        "<div class='v27-client-profile-grid'>" +

            "<section class='v27-client-pro-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>MEMBRESÍA</span><h2>⭐ Estado y nivel</h2></div>" +
                    "<button onclick='cambiarMembresiaClientePro(" + cliente.id + ")'>" +
                        (
                            cliente.membresiaActiva
                                ? "🔴 Desactivar"
                                : "🟢 Activar"
                        ) +
                    "</button>" +
                "</div>" +

                "<div class='v27-client-membership-info'>" +
                    "<div><span>ESTADO</span><strong>" + estado.texto + "</strong></div>" +
                    "<div><span>NIVEL</span><strong>" + nivel.icono + " " + nivel.nombre + "</strong></div>" +
                    "<div><span>INICIO</span><strong>" + escaparHTML(cliente.membresiaInicio || "—") + "</strong></div>" +
                    "<div><span>VENCIMIENTO</span><strong>" + escaparHTML(cliente.membresiaFin || "Sin vencimiento") + "</strong></div>" +
                "</div>" +

                "<div class='v27-client-progress'>" +
                    "<div class='v27-client-progress-head'>" +
                        "<span>Progreso a " + escaparHTML(progreso.proximo) + "</span>" +
                        "<strong>" +
                            (
                                progreso.restante > 0
                                    ? progreso.restante + " puntos"
                                    : "Máximo"
                            ) +
                        "</strong>" +
                    "</div>" +
                    "<div class='v27-progress-bar'>" +
                        "<i style='width:" +
                            progreso.porcentaje +
                        "%'></i>" +
                    "</div>" +
                "</div>" +

                "<button class='v27-client-wide' onclick='mostrarPerfilMembresia(" + cliente.id + ")'>🎁 Ver recompensas</button>" +
            "</section>" +

            "<section class='v27-client-pro-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>CUENTA</span><h2>💳 Saldo y deuda</h2></div>" +
                    "<strong>" + dinero(cliente.saldo) + "</strong>" +
                "</div>" +

                "<div class='v27-client-debt-actions'>" +
                    "<button onclick='registrarCargoClientePro(" + cliente.id + ")'>➕ Agregar deuda</button>" +
                    (
                        Number(cliente.saldo) > 0
                            ? "<button onclick='registrarAbonoClientePro(" + cliente.id + ")'>💵 Registrar abono</button>"
                            : ""
                    ) +
                "</div>" +

                "<div class='v27-client-account-list'>";

    if (movimientos.length === 0) {
        html +=
            "<div class='v27-empty-inline'>📭 No hay movimientos de cuenta.</div>";
    } else {
        movimientos.forEach(function(mov) {
            const esCargo =
                mov.tipo === "cargo";

            html +=
                "<div class='v27-client-account-row'>" +
                    "<div class='v27-client-account-icon " +
                        (esCargo ? "charge" : "payment") +
                    "'>" +
                        (esCargo ? "➕" : "💵") +
                    "</div>" +
                    "<div>" +
                        "<strong>" +
                            escaparHTML(mov.concepto || "Movimiento") +
                        "</strong>" +
                        "<span>" +
                            escaparHTML(
                                (mov.fecha || "") +
                                " · " +
                                (mov.hora || "") +
                                (
                                    mov.metodoPago
                                        ? " · " +
                                          nombreMetodoPago(
                                              mov.metodoPago
                                          )
                                        : ""
                                )
                            ) +
                        "</span>" +
                    "</div>" +
                    "<strong class='" +
                        (esCargo ? "charge" : "payment") +
                    "'>" +
                        (esCargo ? "+" : "−") +
                        dinero(mov.monto) +
                    "</strong>" +
                "</div>";
        });
    }

    html +=
                "</div>" +
            "</section>" +

        "</div>" +

        "<section class='v27-client-pro-panel'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>ACTIVIDAD</span><h2>📜 Historial de consumo</h2></div>" +
                "<small>" +
                    resumen.ventas.length +
                    " movimientos" +
                "</small>" +
            "</div>" +

            "<div class='v27-client-activity-list'>";

    if (actividad.length === 0) {
        html +=
            "<div class='v27-empty-inline'>📭 Este cliente todavía no tiene consumo registrado.</div>";
    } else {
        actividad.forEach(function(venta) {
            const producto =
                venta.tipo === "producto";

            html +=
                "<div class='v27-client-activity-row'>" +
                    "<div class='v27-client-activity-icon'>" +
                        (producto ? "🛒" : iconoTipoEstacion(venta.tipoEstacion || "Xbox")) +
                    "</div>" +
                    "<div class='v27-client-activity-info'>" +
                        "<strong>" +
                            (
                                producto
                                    ? escaparHTML(venta.producto || "Producto")
                                    : escaparHTML(
                                        venta.estacion ||
                                        venta.xbox ||
                                        "Estación"
                                    )
                            ) +
                        "</strong>" +
                        "<span>" +
                            (
                                producto
                                    ? "x" +
                                      Number(venta.cantidad || 0) +
                                      " · " +
                                      (venta.fecha || "") +
                                      " · " +
                                      (venta.hora || "")
                                    : (venta.fecha || "") +
                                      " · " +
                                      (venta.hora || "") +
                                      " · " +
                                      escaparHTML(venta.tiempo || "")
                            ) +
                        "</span>" +
                    "</div>" +
                    "<strong class='v27-client-activity-money'>" +
                        dinero(venta.precio) +
                    "</strong>" +
                "</div>";
        });
    }

    html +=
            "</div>" +
        "</section>" +

        "<section class='v27-client-pro-panel'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>DATOS</span><h2>📝 Notas</h2></div>" +
                "<button onclick='editarClientePro(" + cliente.id + ")'>✏️ Editar</button>" +
            "</div>" +
            "<div class='v27-client-notes'>" +
                (
                    cliente.notas
                        ? escaparHTML(cliente.notas)
                        : "Sin notas. Puedes guardar aquí preferencias o información útil del cliente."
                ) +
            "</div>" +
            "<div class='v27-client-last-visit'>" +
                "<span>ÚLTIMA VISITA</span>" +
                "<strong>" +
                    escaparHTML(cliente.ultimaVisita || "Sin registro") +
                "</strong>" +
            "</div>" +
        "</section>" +

        "<div class='v27-client-profile-bottom'>" +
            "<button onclick='mostrarClientes()'>⬅️ Todos los clientes</button>" +
            "<button onclick='mostrarMembresias()'>⭐ Membresías</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function mostrarHistorialCliente(nombre) {
    const cliente =
        obtenerClienteMembresia(nombre);

    if (cliente) {
        mostrarPerfilClientePro(cliente.id);
        return;
    }

    mostrarClientes();
}

function mostrarClientes() {
    if (!exigirPermisoPro("clientes")) {
        return;
    }

    sincronizarDatosClientePro();

    vistaActual = "clientes";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const lista =
        obtenerClientesProOrdenados();

    const totalGastado =
        lista.reduce(function(total, cliente) {
            return total +
                obtenerResumenClientePro(cliente).gasto;
        }, 0);

    const totalSesiones =
        lista.reduce(function(total, cliente) {
            return total +
                obtenerResumenClientePro(cliente).sesiones;
        }, 0);

    const totalDeuda =
        lista.reduce(function(total, cliente) {
            return total +
                Number(cliente.saldo || 0);
        }, 0);

    const activos =
        lista.filter(function(cliente) {
            return estadoMembresiaClientePro(cliente).clase === "on";
        }).length;

    const esteMes =
        obtenerFecha().slice(0, 7);

    const nuevosEsteMes =
        lista.filter(function(cliente) {
            return String(cliente.creadoEn || "")
                .slice(0, 7) === esteMes;
        }).length;

    const div =
        document.createElement("div");

    div.className =
        "v27-clients-pro-page";

    let html =
        "<div class='v27-client-pro-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>👥 CRM DEL NEGOCIO</div>" +
                "<h1>Clientes PRO</h1>" +
                "<p>Perfiles, consumo, sesiones, puntos, membresías y saldos en un solo lugar.</p>" +
            "</div>" +
            "<div class='v27-client-pro-hero-icon'>👥</div>" +
        "</div>" +

        "<div class='v27-page-actions'>" +
            "<button class='v27-action-primary' onclick='crearClienteMembresiaManual()'>➕ Nuevo cliente</button>" +
            "<button onclick='exportarClientesProCSV()'>📄 Exportar CSV</button>" +
            "<button onclick='mostrarMembresias()'>⭐ Membresías</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>" +

        "<div class='v27-client-pro-summary'>" +
            "<div><span>👥 CLIENTES</span><strong>" + lista.length + "</strong><small>registrados</small></div>" +
            "<div><span>🟢 ACTIVOS</span><strong>" + activos + "</strong><small>membresías activas</small></div>" +
            "<div><span>💰 CONSUMO</span><strong>" + dinero(totalGastado) + "</strong><small>acumulado</small></div>" +
            "<div><span>💳 DEUDA</span><strong>" + dinero(totalDeuda) + "</strong><small>pendiente</small></div>" +
            "<div><span>🎮 SESIONES</span><strong>" + totalSesiones + "</strong><small>registradas</small></div>" +
            "<div><span>🆕 NUEVOS</span><strong>" + nuevosEsteMes + "</strong><small>este mes</small></div>" +
        "</div>" +

        "<div class='v27-client-pro-toolbar'>" +
            "<div class='v27-client-pro-search'>" +
                "<span>🔎</span>" +
                "<input id='v27-client-search' type='search' " +
                    "placeholder='Buscar por nombre o teléfono...' " +
                    "oninput='filtrarClientesPro()'>" +
            "</div>" +
            "<div class='v27-client-pro-filters'>" +
                "<button onclick='limpiarFiltroClientesPro()'>Todos</button>" +
                "<button onclick='filtrarEstadoClientesPro(\"activos\")'>🟢 Activos</button>" +
                "<button onclick='filtrarEstadoClientesPro(\"deuda\")'>💳 Con deuda</button>" +
                "<button onclick='filtrarEstadoClientesPro(\"oro\")'>🥇 Oro</button>" +
            "</div>" +
        "</div>";

    if (lista.length === 0) {
        html +=
            "<div class='v27-empty-state'>" +
                "<div class='v27-empty-icon'>👥</div>" +
                "<h2>Aún no hay clientes</h2>" +
                "<p>Registra clientes desde aquí o desde una sesión.</p>" +
                "<button onclick='crearClienteMembresiaManual()'>➕ Registrar cliente</button>" +
            "</div>";
    } else {
        const top =
            lista[0];

        const topResumen =
            obtenerResumenClientePro(top);

        html +=
            "<div class='v27-client-pro-highlight'>" +
                "<div class='v27-client-highlight-icon'>🏆</div>" +
                "<div>" +
                    "<span>CLIENTE LÍDER POR CONSUMO</span>" +
                    "<strong>" +
                        escaparHTML(top.nombre) +
                    "</strong>" +
                    "<small>" +
                        dinero(topResumen.gasto) +
                        " · " +
                        topResumen.sesiones +
                        " sesiones · " +
                        Number(top.puntos) +
                        " puntos" +
                    "</small>" +
                "</div>" +
            "</div>" +

            "<div class='v27-section-heading'>" +
                "<div><span>DIRECTORIO</span><h2>👥 Clientes</h2></div>" +
                "<small>" + lista.length + " registrados</small>" +
            "</div>" +

            "<div class='v27-client-pro-grid'>";

        lista.forEach(function(cliente) {
            const resumen =
                obtenerResumenClientePro(cliente);

            const nivel =
                nivelClientePro(cliente);

            const estado =
                estadoMembresiaClientePro(cliente);

            const deuda =
                Number(cliente.saldo) || 0;

            html +=
                "<div class='v27-client-pro-card' " +
                    "data-client-name='" +
                        escaparHTML(cliente.nombre) +
                    "' " +
                    "data-client-phone='" +
                        escaparHTML(cliente.telefono || "") +
                    "' " +
                    "data-client-state='" +
                        estado.clase +
                    "' " +
                    "data-client-debt='" +
                        deuda +
                    "' " +
                    "data-client-level='" +
                        nivel.nombre +
                    "'>" +

                    "<div class='v27-client-pro-card-head'>" +
                        "<div class='v27-client-pro-avatar'>" +
                            nivel.icono +
                        "</div>" +
                        "<div class='v27-client-pro-name'>" +
                            "<h3>" +
                                escaparHTML(cliente.nombre) +
                            "</h3>" +
                            "<span>" +
                                (
                                    cliente.telefono
                                        ? "📱 " +
                                          escaparHTML(cliente.telefono)
                                        : "Sin teléfono"
                                ) +
                            "</span>" +
                        "</div>" +
                        "<span class='v27-client-status-badge " +
                            estado.clase +
                        "'>" +
                            estado.texto +
                        "</span>" +
                    "</div>" +

                    "<div class='v27-client-pro-level'>" +
                        "<span>" +
                            nivel.icono +
                            " " +
                            nivel.nombre +
                        "</span>" +
                        "<strong>" +
                            Number(cliente.puntos) +
                            " pts" +
                        "</strong>" +
                    "</div>" +

                    "<div class='v27-client-pro-stats'>" +
                        "<div><span>🎮 SESIONES</span><strong>" + resumen.sesiones + "</strong></div>" +
                        "<div><span>💰 CONSUMO</span><strong>" + dinero(resumen.gasto) + "</strong></div>" +
                        "<div><span>🛒 PRODUCTOS</span><strong>" + resumen.productos + "</strong></div>" +
                        "<div><span>💳 DEUDA</span><strong>" + dinero(deuda) + "</strong></div>" +
                    "</div>" +

                    "<div class='v27-client-pro-last'>" +
                        "<span>ÚLTIMA VISITA</span>" +
                        "<strong>" +
                            escaparHTML(cliente.ultimaVisita || "Sin registro") +
                        "</strong>" +
                    "</div>" +

                    "<button class='v27-client-pro-open' onclick='mostrarPerfilClientePro(" +
                        cliente.id +
                    ")'>👤 Abrir perfil</button>" +
                "</div>";
        });

        html += "</div>";
    }

    html +=
        "<div class='v27-client-pro-footer'>" +
            "💡 Las compras de mostrador pueden asociarse a un cliente cuando las registras desde Inventario." +
        "</div>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

// ========================================
// REPORTES AVANZADOS
// ========================================

// ========================================
// REPORTES AVANZADOS
// ========================================

function obtenerDatosReporte() {
    const xbox = {};
    const metodos = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0
    };

    const productosVendidos = {};
    const clientes = {};
    const horas = {};

    let ventasConsolas = 0;
    let ventasProductos = 0;
    let utilidadProductos = 0;
    let minutosConsolas = 0;
    let unidadesProductos = 0;
    let descuentos = 0;

    historial.forEach(function(venta) {
        const monto = Number(venta.precio) || 0;

        if (venta.metodoPago) {
            if (typeof metodos[venta.metodoPago] === "undefined") {
                metodos[venta.metodoPago] = 0;
            }

            metodos[venta.metodoPago] += monto;
        }

        if (Number(venta.descuento) > 0) {
            descuentos += Number(venta.descuento);
        }

        if (venta.tipo === "producto") {
            ventasProductos += monto;
            unidadesProductos +=
                Number(venta.cantidad) || 0;

            utilidadProductos +=
                Number(venta.utilidad) || 0;

            const producto =
                venta.producto || "Sin nombre";

            const clienteProducto =
                String(venta.cliente || "").trim();

            if (
                clienteProducto &&
                clienteProducto.toLowerCase() !== "sin nombre"
            ) {
                const claveCliente =
                    clienteProducto.toLowerCase();

                if (!clientes[claveCliente]) {
                    clientes[claveCliente] = {
                        nombre: clienteProducto,
                        sesiones: 0,
                        gasto: 0
                    };
                }

                clientes[claveCliente].gasto +=
                    monto;
            }

            if (!productosVendidos[producto]) {
                productosVendidos[producto] = {
                    unidades: 0,
                    ventas: 0,
                    utilidad: 0
                };
            }

            productosVendidos[producto].unidades +=
                Number(venta.cantidad) || 0;

            productosVendidos[producto].ventas +=
                monto;

            productosVendidos[producto].utilidad +=
                Number(venta.utilidad) || 0;
        } else {
            ventasConsolas += monto;

            minutosConsolas +=
                obtenerMinutosVenta(venta.tiempo);

            const nombreXbox =
                venta.xbox || "Xbox";

            if (!xbox[nombreXbox]) {
                xbox[nombreXbox] = {
                    sesiones: 0,
                    ventas: 0,
                    minutos: 0
                };
            }

            xbox[nombreXbox].sesiones += 1;
            xbox[nombreXbox].ventas += monto;
            xbox[nombreXbox].minutos +=
                obtenerMinutosVenta(venta.tiempo);

            const cliente =
                String(
                    venta.cliente || ""
                ).trim();

            if (
                cliente &&
                cliente.toLowerCase() !== "sin nombre"
            ) {
                const clave =
                    cliente.toLowerCase();

                if (!clientes[clave]) {
                    clientes[clave] = {
                        nombre: cliente,
                        sesiones: 0,
                        gasto: 0
                    };
                }

                clientes[clave].sesiones += 1;
                clientes[clave].gasto += monto;
            }
        }

        const hora =
            String(venta.hora || "")
                .slice(0, 2);

        if (/^\d{1,2}$/.test(hora)) {
            const numeroHora =
                Number(hora);

            if (!horas[numeroHora]) {
                horas[numeroHora] = 0;
            }

            horas[numeroHora] += monto;
        }
    });

    const topXbox =
        Object.entries(xbox).sort(function(a, b) {
            return b[1].ventas - a[1].ventas;
        });

    const topProductos =
        Object.entries(productosVendidos).sort(
            function(a, b) {
                return b[1].ventas - a[1].ventas;
            }
        );

    const topClientes =
        Object.values(clientes).sort(
            function(a, b) {
                return b.gasto - a.gasto;
            }
        );

    const horasOrdenadas =
        Object.entries(horas).sort(
            function(a, b) {
                return b[1] - a[1];
            }
        );

    return {
        xbox: topXbox,
        productos: topProductos,
        clientes: topClientes,
        horas: horasOrdenadas,
        metodos: metodos,
        ventasConsolas: ventasConsolas,
        ventasProductos: ventasProductos,
        utilidadProductos: utilidadProductos,
        minutosConsolas: minutosConsolas,
        unidadesProductos: unidadesProductos,
        descuentos: descuentos
    };
}


function obtenerReporteDiarioActualizado() {
    return {
        fecha: obtenerFecha(),
        ingresos: Number(ventasDelDia) || 0,
        gastos: Number(gastosDelDia) || 0,
        ganancia: calcularGanancia(),
        sesiones: Number(sesionesDelDia) || 0
    };
}

function obtenerHistorialDiasReportePro() {
    const mapa = {};

    reportes.forEach(function(reporte) {
        if (!reporte || !reporte.fecha) {
            return;
        }

        mapa[reporte.fecha] = {
            fecha: reporte.fecha,
            ingresos: Number(reporte.ingresos) || 0,
            gastos: Number(reporte.gastos) || 0,
            ganancia: Number(reporte.ganancia) || 0,
            sesiones: Number(reporte.sesiones) || 0
        };
    });

    const actual =
        obtenerReporteDiarioActualizado();

    mapa[actual.fecha] = actual;

    return Object.keys(mapa)
        .map(function(fecha) {
            return mapa[fecha];
        })
        .sort(function(a, b) {
            return convertirFecha(a.fecha) -
                convertirFecha(b.fecha);
        });
}

function obtenerMejorDiaReportePro(dias) {
    if (!dias.length) {
        return null;
    }

    return dias.slice().sort(function(a, b) {
        return b.ingresos - a.ingresos;
    })[0];
}

function obtenerPromedioDiarioReportePro(dias) {
    if (!dias.length) {
        return {
            ingresos: 0,
            gastos: 0,
            ganancia: 0
        };
    }

    const totales = dias.reduce(function(acum, dia) {
        acum.ingresos += Number(dia.ingresos) || 0;
        acum.gastos += Number(dia.gastos) || 0;
        acum.ganancia += Number(dia.ganancia) || 0;
        return acum;
    }, {
        ingresos: 0,
        gastos: 0,
        ganancia: 0
    });

    return {
        ingresos: totales.ingresos / dias.length,
        gastos: totales.gastos / dias.length,
        ganancia: totales.ganancia / dias.length
    };
}

function construirGraficaDiasReportePro(dias) {
    const ultimos =
        dias.slice(-14);

    if (!ultimos.length) {
        return (
            "<div class='v27-report-empty'>" +
                "Todavía no hay suficientes días registrados." +
            "</div>"
        );
    }

    const maximo =
        Math.max.apply(
            null,
            ultimos.map(function(dia) {
                return Number(dia.ingresos) || 0;
            }).concat([1])
        );

    let html =
        "<div class='v27-report-days-chart'>";

    ultimos.forEach(function(dia) {
        const valor =
            Number(dia.ingresos) || 0;

        const alto =
            valor > 0
                ? Math.max(
                    7,
                    Math.round((valor / maximo) * 100)
                )
                : 3;

        const partes =
            String(dia.fecha).split("-");

        const etiqueta =
            partes.length === 3
                ? partes[2] + "/" + partes[1]
                : dia.fecha;

        html +=
            "<div class='v27-report-day-bar' title='" +
                etiqueta +
                " · " +
                dinero(valor) +
            "'>" +
                "<div class='v27-report-day-value'>" +
                    (valor > 0 ? dinero(valor) : "") +
                "</div>" +
                "<div class='v27-report-day-track'>" +
                    "<i style='height:" +
                        alto +
                    "%'></i>" +
                "</div>" +
                "<span>" +
                    escaparHTML(etiqueta) +
                "</span>" +
            "</div>";
    });

    html += "</div>";

    return html;
}

function construirRankingReportePro(lista, tipo, limite) {
    const elementos =
        lista.slice(0, limite || 5);

    if (!elementos.length) {
        return (
            "<div class='v27-report-empty'>" +
                (
                    tipo === "producto"
                        ? "Todavía no hay ventas de productos."
                        : tipo === "cliente"
                            ? "Todavía no hay clientes identificados."
                            : "Todavía no hay sesiones."
                ) +
            "</div>"
        );
    }

    let html =
        "<div class='v27-report-ranking'>";

    elementos.forEach(function(item, indice) {
        let nombre = "";
        let valorPrincipal = "";
        let detalle = "";

        if (tipo === "producto") {
            nombre = item[0];
            valorPrincipal =
                dinero(item[1].ventas);
            detalle =
                "x" +
                item[1].unidades +
                " unidades · utilidad " +
                dinero(item[1].utilidad);
        } else if (tipo === "cliente") {
            nombre = item.nombre;
            valorPrincipal =
                dinero(item.gasto);
            detalle =
                item.sesiones +
                " sesiones";
        } else {
            nombre = item[0];
            valorPrincipal =
                dinero(item[1].ventas);
            detalle =
                item[1].sesiones +
                " sesiones · " +
                (item[1].minutos / 60).toFixed(1) +
                " h";
        }

        html +=
            "<div class='v27-report-ranking-row'>" +
                "<div class='v27-report-rank'>" +
                    (indice + 1) +
                "</div>" +
                "<div class='v27-report-rank-info'>" +
                    "<strong>" +
                        escaparHTML(nombre) +
                    "</strong>" +
                    "<span>" +
                        detalle +
                    "</span>" +
                "</div>" +
                "<strong class='v27-report-rank-money'>" +
                    valorPrincipal +
                "</strong>" +
            "</div>";
    });

    html += "</div>";

    return html;
}

function construirBarrasMetodoReportePro(metodos, total) {
    const opciones = [
        {
            nombre: "Efectivo",
            icono: "💵",
            clave: "efectivo"
        },
        {
            nombre: "Tarjeta",
            icono: "💳",
            clave: "tarjeta"
        },
        {
            nombre: "Transferencia",
            icono: "📱",
            clave: "transferencia"
        }
    ];

    let html =
        "<div class='v27-report-payment-bars'>";

    opciones.forEach(function(opcion) {
        const valor =
            Number(metodos[opcion.clave]) || 0;

        const porcentaje =
            total > 0
                ? Math.round((valor / total) * 100)
                : 0;

        html +=
            "<div class='v27-report-payment-item'>" +
                "<div class='v27-report-payment-top'>" +
                    "<span>" +
                        opcion.icono +
                        " " +
                        opcion.nombre +
                    "</span>" +
                    "<strong>" +
                        dinero(valor) +
                    "</strong>" +
                "</div>" +
                "<div class='v27-report-payment-track'>" +
                    "<i style='width:" +
                        porcentaje +
                    "%'></i>" +
                "</div>" +
                "<small>" +
                    porcentaje +
                    "% de las ventas registradas" +
                "</small>" +
            "</div>";
    });

    html += "</div>";

    return html;
}

function exportarReportesProCSV() {
    const datos =
        obtenerDatosReporte();

    const hoy =
        calcularPeriodo("hoy");

    const semana =
        calcularPeriodo("semana");

    const mes =
        calcularPeriodo("mes");

    const filas = [
        ["REPORTE PRO", obtenerFecha()],
        [],
        ["PERIODO", "INGRESOS", "GASTOS", "GANANCIA", "SESIONES"],
        ["Hoy", hoy.ingresos, hoy.gastos, hoy.ganancia, hoy.sesiones],
        ["Semana", semana.ingresos, semana.gastos, semana.ganancia, semana.sesiones],
        ["Mes", mes.ingresos, mes.gastos, mes.ganancia, mes.sesiones],
        [],
        ["ESTACION", "SESIONES", "INGRESOS", "MINUTOS"],
    ];

    datos.xbox.forEach(function(item) {
        filas.push([
            item[0],
            item[1].sesiones,
            item[1].ventas,
            item[1].minutos
        ]);
    });

    filas.push([]);
    filas.push([
        "PRODUCTO",
        "UNIDADES",
        "VENTAS",
        "UTILIDAD"
    ]);

    datos.productos.forEach(function(item) {
        filas.push([
            item[0],
            item[1].unidades,
            item[1].ventas,
            item[1].utilidad
        ]);
    });

    filas.push([]);
    filas.push([
        "CLIENTE",
        "SESIONES",
        "GASTO"
    ]);

    datos.clientes.forEach(function(cliente) {
        filas.push([
            cliente.nombre,
            cliente.sesiones,
            cliente.gasto
        ]);
    });

    filas.push([]);
    filas.push([
        "METODO",
        "VENTAS"
    ]);
    filas.push(["Efectivo", datos.metodos.efectivo || 0]);
    filas.push(["Tarjeta", datos.metodos.tarjeta || 0]);
    filas.push(["Transferencia", datos.metodos.transferencia || 0]);

    const csv =
        filas.map(function(fila) {
            return fila.map(function(celda) {
                const valor =
                    String(celda == null ? "" : celda);

                return '"' +
                    valor.replace(/"/g, '""') +
                    '"';
            }).join(",");
        }).join("\n");

    const blob =
        new Blob(
            ["\ufeff" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;
    enlace.download =
        "Reporte_PRO_" +
        obtenerFecha() +
        ".csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 500);
}

function mostrarReportesAvanzados() {
    if (!exigirPermisoPro("reportes")) {
        return;
    }

    vistaActual = "reportes_avanzados";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const datos =
        obtenerDatosReporte();

    const hoy =
        calcularPeriodo("hoy");

    const semana =
        calcularPeriodo("semana");

    const mes =
        calcularPeriodo("mes");

    const dias =
        obtenerHistorialDiasReportePro();

    const mejorDia =
        obtenerMejorDiaReportePro(
            dias.slice(-30)
        );

    const promedio =
        obtenerPromedioDiarioReportePro(
            dias.slice(-30)
        );

    const totalVentas =
        datos.ventasConsolas +
        datos.ventasProductos;

    const totalPagos =
        (datos.metodos.efectivo || 0) +
        (datos.metodos.tarjeta || 0) +
        (datos.metodos.transferencia || 0);

    const horaPico =
        datos.horas.length
            ? Number(datos.horas[0][0])
            : null;

    const inventario =
        obtenerResumenInventarioPro();

    const div =
        document.createElement("div");

    div.className =
        "v27-report-page";

    let html =
        "<div class='v27-report-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>📈 INTELIGENCIA DEL NEGOCIO</div>" +
                "<h1>Reportes PRO</h1>" +
                "<p>Entiende qué vende más, qué estación genera más y cómo se está comportando tu negocio.</p>" +
            "</div>" +
            "<div class='v27-report-hero-icon'>📈</div>" +
        "</div>" +

        "<div class='v27-report-actions'>" +
            "<button class='v27-action-primary' onclick='exportarReportesProCSV()'>📄 Exportar reporte</button>" +
            "<button onclick='mostrarDashboard()'>📊 Dashboard</button>" +
            "<button onclick='mostrarCaja()'>💵 Caja</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>" +

        "<div class='v27-report-periods'>" +

            "<div class='v27-report-period v27-report-today'>" +
                "<span>📅 HOY</span>" +
                "<strong>" + dinero(hoy.ingresos) + "</strong>" +
                "<small>" +
                    dinero(hoy.gastos) +
                    " gastos · " +
                    dinero(hoy.ganancia) +
                    " ganancia" +
                "</small>" +
                "<b>" + hoy.sesiones + " sesiones</b>" +
            "</div>" +

            "<div class='v27-report-period'>" +
                "<span>📆 ESTA SEMANA</span>" +
                "<strong>" + dinero(semana.ingresos) + "</strong>" +
                "<small>" +
                    dinero(semana.gastos) +
                    " gastos · " +
                    dinero(semana.ganancia) +
                    " ganancia" +
                "</small>" +
                "<b>" + semana.sesiones + " sesiones</b>" +
            "</div>" +

            "<div class='v27-report-period'>" +
                "<span>🗓️ ESTE MES</span>" +
                "<strong>" + dinero(mes.ingresos) + "</strong>" +
                "<small>" +
                    dinero(mes.gastos) +
                    " gastos · " +
                    dinero(mes.ganancia) +
                    " ganancia" +
                "</small>" +
                "<b>" + mes.sesiones + " sesiones</b>" +
            "</div>" +

        "</div>" +

        "<div class='v27-report-kpis'>" +

            "<div>" +
                "<span>💰 VENTAS DE HOY</span>" +
                "<strong>" + dinero(totalVentas) + "</strong>" +
                "<small>" +
                    datos.xbox.reduce(function(t, item) {
                        return t + item[1].sesiones;
                    }, 0) +
                    " sesiones + " +
                    datos.unidadesProductos +
                    " productos" +
                "</small>" +
            "</div>" +

            "<div>" +
                "<span>📊 TICKET PROMEDIO</span>" +
                "<strong>" +
                    dinero(
                        estadisticasDia.tickets > 0
                            ? totalVentas /
                              estadisticasDia.tickets
                            : 0
                    ) +
                "</strong>" +
                "<small>por ticket registrado</small>" +
            "</div>" +

            "<div>" +
                "<span>🔥 HORA MÁS FUERTE</span>" +
                "<strong>" +
                    (
                        horaPico !== null
                            ? String(horaPico).padStart(2, "0") + ":00"
                            : "--"
                    ) +
                "</strong>" +
                "<small>" +
                    (
                        horaPico !== null
                            ? dinero(datos.horas[0][1]) +
                              " vendidos"
                            : "Sin ventas todavía"
                    ) +
                "</small>" +
            "</div>" +

            "<div>" +
                "<span>📦 INVENTARIO A COSTO</span>" +
                "<strong>" + dinero(inventario.valorCosto) + "</strong>" +
                "<small>" +
                    inventario.unidades +
                    " unidades · " +
                    inventario.bajos +
                    " bajos" +
                "</small>" +
            "</div>" +

        "</div>" +

        "<div class='v27-report-grid'>" +

            "<section class='v27-report-panel v27-report-chart-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>EVOLUCIÓN</span><h2>📊 Ventas por día</h2></div>" +
                    "<small>Últimos 14 días</small>" +
                "</div>" +
                construirGraficaDiasReportePro(dias) +
                "<div class='v27-report-chart-note'>" +
                    "<span>Promedio diario</span>" +
                    "<strong>" + dinero(promedio.ingresos) + "</strong>" +
                    "<span>Mejor día</span>" +
                    "<strong>" +
                        (
                            mejorDia
                                ? dinero(mejorDia.ingresos)
                                : "--"
                        ) +
                    "</strong>" +
                "</div>" +
            "</section>" +

            "<section class='v27-report-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>PAGOS</span><h2>💳 Cómo te pagan</h2></div>" +
                    "<small>" + dinero(totalPagos) + "</small>" +
                "</div>" +
                construirBarrasMetodoReportePro(
                    datos.metodos,
                    totalPagos
                ) +
            "</section>" +

        "</div>" +

        "<div class='v27-report-grid'>" +

            "<section class='v27-report-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>ESTACIONES</span><h2>🎮 Las que más generan</h2></div>" +
                    "<small>Hoy</small>" +
                "</div>" +
                construirRankingReportePro(
                    datos.xbox,
                    "estacion",
                    6
                ) +
            "</section>" +

            "<section class='v27-report-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>PRODUCTOS</span><h2>🛒 Los que más se venden</h2></div>" +
                    "<small>Hoy</small>" +
                "</div>" +
                construirRankingReportePro(
                    datos.productos,
                    "producto",
                    6
                ) +
            "</section>" +

            "<section class='v27-report-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>CLIENTES</span><h2>👑 Los que más consumen</h2></div>" +
                    "<small>Hoy</small>" +
                "</div>" +
                construirRankingReportePro(
                    datos.clientes,
                    "cliente",
                    6
                ) +
            "</section>" +

            "<section class='v27-report-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>INVENTARIO</span><h2>📦 Salud del stock</h2></div>" +
                    "<small>Actual</small>" +
                "</div>" +

                "<div class='v27-report-stock-grid'>" +
                    "<div><span>🟢 En stock</span><strong>" +
                        Math.max(
                            0,
                            inventario.activos -
                            inventario.bajos -
                            inventario.agotados
                        ) +
                    "</strong></div>" +
                    "<div><span>🟠 Bajo</span><strong>" +
                        inventario.bajos +
                    "</strong></div>" +
                    "<div><span>🔴 Agotado</span><strong>" +
                        inventario.agotados +
                    "</strong></div>" +
                    "<div><span>💰 Utilidad potencial</span><strong>" +
                        dinero(inventario.utilidadPotencial) +
                    "</strong></div>" +
                "</div>" +

                "<button class='v27-report-wide-button' onclick='mostrarInventario()'>📦 Abrir inventario</button>" +
            "</section>" +

        "</div>" +

        "<section class='v27-report-panel v27-report-insights'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>LECTURA RÁPIDA</span><h2>🧠 Lo que está pasando</h2></div>" +
            "</div>" +

            "<div class='v27-report-insight-grid'>" +

                "<div>" +
                    "<div>🏆</div>" +
                    "<span>ESTACIÓN LÍDER</span>" +
                    "<strong>" +
                        (
                            datos.xbox.length
                                ? escaparHTML(datos.xbox[0][0])
                                : "Sin datos"
                        ) +
                    "</strong>" +
                    "<small>" +
                        (
                            datos.xbox.length
                                ? dinero(datos.xbox[0][1].ventas) +
                                  " generados hoy"
                                : "Registra sesiones para crear el ranking."
                        ) +
                    "</small>" +
                "</div>" +

                "<div>" +
                    "<div>🛒</div>" +
                    "<span>PRODUCTO LÍDER</span>" +
                    "<strong>" +
                        (
                            datos.productos.length
                                ? escaparHTML(datos.productos[0][0])
                                : "Sin datos"
                        ) +
                    "</strong>" +
                    "<small>" +
                        (
                            datos.productos.length
                                ? datos.productos[0][1].unidades +
                                  " unidades vendidas"
                                : "Agrega productos y registra ventas."
                        ) +
                    "</small>" +
                "</div>" +

                "<div>" +
                    "<div>👑</div>" +
                    "<span>CLIENTE LÍDER</span>" +
                    "<strong>" +
                        (
                            datos.clientes.length
                                ? escaparHTML(datos.clientes[0].nombre)
                                : "Sin datos"
                        ) +
                    "</strong>" +
                    "<small>" +
                        (
                            datos.clientes.length
                                ? dinero(datos.clientes[0].gasto) +
                                  " de consumo"
                                : "Identifica clientes durante las sesiones."
                        ) +
                    "</small>" +
                "</div>" +

                "<div>" +
                    "<div>🔥</div>" +
                    "<span>HORA PICO</span>" +
                    "<strong>" +
                        (
                            horaPico !== null
                                ? String(horaPico).padStart(2, "0") + ":00"
                                : "Sin datos"
                        ) +
                    "</strong>" +
                    "<small>" +
                        (
                            horaPico !== null
                                ? "Conviene reforzar atención en ese horario."
                                : "Aún no hay suficientes ventas."
                        ) +
                    "</small>" +
                "</div>" +

            "</div>" +
        "</section>" +

        "<div class='v27-report-footer-actions'>" +
            "" +
            "<button onclick='mostrarHistorialCierres()'>📚 Cierres</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function siguienteIdMovimientoInventario() {
    return (
        "INV-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}

function registrarMovimientoInventario(datosMovimiento) {
    const movimiento = {
        id: siguienteIdMovimientoInventario(),
        fecha:
            datosMovimiento.fecha ||
            obtenerFecha(),
        hora:
            datosMovimiento.hora ||
            obtenerHora(),
        tipo:
            datosMovimiento.tipo ||
            "ajuste",
        productoId:
            Number(datosMovimiento.productoId) || 0,
        producto:
            String(datosMovimiento.producto || ""),
        cantidad:
            Number(datosMovimiento.cantidad) || 0,
        delta:
            Number(
                typeof datosMovimiento.delta !== "undefined"
                    ? datosMovimiento.delta
                    : datosMovimiento.cantidad
            ) || 0,
        stockAnterior:
            Math.max(
                0,
                Number(datosMovimiento.stockAnterior) || 0
            ),
        stockNuevo:
            Math.max(
                0,
                Number(datosMovimiento.stockNuevo) || 0
            ),
        costoUnitario:
            Math.max(
                0,
                Number(datosMovimiento.costoUnitario) || 0
            ),
        importe:
            Math.max(
                0,
                Number(datosMovimiento.importe) || 0
            ),
        motivo:
            String(datosMovimiento.motivo || ""),
        metodoPago:
            String(datosMovimiento.metodoPago || ""),
        ticketFolio:
            String(datosMovimiento.ticketFolio || ""),
        usuario:
            String(
                datosMovimiento.usuario ||
                (
                    usuarioActualPro
                        ? usuarioActualPro.nombre
                        : "Usuario actual"
                )
            )
    };

    movimientosInventario.push(movimiento);

    return movimiento;
}

function obtenerMovimientosInventarioHoy() {
    return movimientosInventario.filter(function(movimiento) {
        return String(movimiento.fecha || "") ===
            String(obtenerFecha());
    });
}

function obtenerResumenInventarioHoy() {
    let ingresos = 0;
    let utilidad = 0;
    let unidades = 0;

    historial.forEach(function(venta) {
        if (
            venta.tipo !== "producto" ||
            String(venta.fecha || "") !==
                String(obtenerFecha())
        ) {
            return;
        }

        ingresos += Number(venta.precio) || 0;
        utilidad += Number(venta.utilidad) || 0;
        unidades += Number(venta.cantidad) || 0;
    });

    const bajos = productos.filter(function(producto) {
        return producto.activo &&
            Number(producto.stock) <=
            Number(producto.stockMinimo);
    }).length;

    return {
        ingresos: ingresos,
        utilidad: utilidad,
        unidades: unidades,
        bajos: bajos
    };
}

function ajustarStockProducto(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const producto = obtenerProducto(id);

    if (!producto) {
        alert("❌ Producto no encontrado.");
        return;
    }

    const stockActual =
        Math.max(0, Number(producto.stock) || 0);

    const deltaTexto =
        prompt(
            "📦 Ajustar stock de " +
            producto.nombre +
            "\n\n" +
            "Stock actual: " + stockActual +
            "\n\n" +
            "Escribe una cantidad:\n" +
            "• Positiva = agregar piezas\n" +
            "• Negativa = retirar piezas"
        );

    if (deltaTexto === null) {
        return;
    }

    const delta =
        Number(deltaTexto);

    if (
        !Number.isInteger(delta) ||
        delta === 0
    ) {
        alert(
            "❌ Escribe un número entero distinto de 0."
        );
        return;
    }

    const stockNuevo =
        stockActual + delta;

    if (stockNuevo < 0) {
        alert(
            "❌ No puedes retirar más piezas de las existentes.\n\n" +
            "Stock disponible: " + stockActual
        );
        return;
    }

    const motivo =
        prompt(
            "Motivo del ajuste:",
            delta > 0
                ? "Entrada manual"
                : "Salida / merma"
        );

    if (motivo === null) {
        return;
    }

    const motivoLimpio =
        String(motivo || "").trim();

    if (!motivoLimpio) {
        alert("❌ Escribe un motivo para el ajuste.");
        return;
    }

    producto.stock = stockNuevo;

    registrarMovimientoInventario({
        tipo:
            delta > 0
                ? "entrada"
                : "ajuste_salida",
        productoId: producto.id,
        producto: producto.nombre,
        cantidad: Math.abs(delta),
        delta: delta,
        stockAnterior: stockActual,
        stockNuevo: stockNuevo,
        costoUnitario:
            Number(producto.costo) || 0,
        motivo: motivoLimpio
    });

    guardarDatos();
    mostrarInventario();

    alert(
        "✅ Stock actualizado.\n\n" +
        producto.nombre +
        "\nAntes: " + stockActual +
        "\nAhora: " + stockNuevo
    );
}

function mostrarMovimientosInventario() {
    if (!exigirPermisoPro("inventario")) {
        return;
    }

    const movimientos =
        movimientosInventario
            .filter(function(movimiento) {
                return String(movimiento.fecha || "") ===
                    String(obtenerFecha());
            })
            .slice()
            .reverse();

    const fondo =
        document.createElement("div");

    fondo.style.position = "fixed";
    fondo.style.inset = "0";
    fondo.style.zIndex = "9999";
    fondo.style.background = "rgba(0,0,0,.72)";
    fondo.style.display = "flex";
    fondo.style.alignItems = "center";
    fondo.style.justifyContent = "center";
    fondo.style.padding = "20px";

    const caja =
        document.createElement("div");

    caja.style.width = "min(820px,100%)";
    caja.style.maxHeight = "85vh";
    caja.style.overflow = "auto";
    caja.style.background = "#151a23";
    caja.style.color = "#eef3fb";
    caja.style.border = "1px solid rgba(124,92,255,.28)";
    caja.style.borderRadius = "18px";
    caja.style.padding = "20px";
    caja.style.boxShadow =
        "0 20px 70px rgba(0,0,0,.5)";

    let html =
        "<div style='display:flex;justify-content:space-between;align-items:center;gap:12px'>" +
            "<div>" +
                "<div style='font-size:10px;color:#766cff;font-weight:900;letter-spacing:.12em'>INVENTARIO PRO</div>" +
                "<h2 style='margin:4px 0'>📋 Movimientos de hoy</h2>" +
            "</div>" +
            "<button id='cerrarMovInv' style='padding:8px 12px'>✕</button>" +
        "</div>" +
        "<p style='color:#8b99ad'>Entradas, ventas y ajustes registrados durante " +
            escaparHTML(obtenerFecha()) +
        ".</p>";

    if (!movimientos.length) {
        html +=
            "<div style='padding:28px;text-align:center;color:#8b99ad'>" +
                "No hay movimientos de inventario hoy." +
            "</div>";
    } else {
        html +=
            "<div style='display:grid;gap:7px'>";

        movimientos.forEach(function(movimiento) {
            const esEntrada =
                movimiento.delta > 0;

            const signo =
                esEntrada ? "+" : "-";

            const color =
                esEntrada ? "#22c55e" : "#f97316";

            html +=
                "<div style='padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.025)'>" +
                    "<div style='display:flex;justify-content:space-between;gap:12px'>" +
                        "<strong>" +
                            (esEntrada ? "📥 " : "📤 ") +
                            escaparHTML(movimiento.producto) +
                        "</strong>" +
                        "<strong style='color:" +
                            color +
                        "'>" +
                            signo +
                            movimiento.cantidad +
                        "</strong>" +
                    "</div>" +
                    "<div style='font-size:12px;color:#8b99ad;margin-top:4px'>" +
                        escaparHTML(movimiento.hora) +
                        " · " +
                        escaparHTML(movimiento.motivo || movimiento.tipo) +
                        " · Stock: " +
                        movimiento.stockAnterior +
                        " → " +
                        movimiento.stockNuevo +
                    "</div>" +
                "</div>";
        });

        html += "</div>";
    }

    html +=
        "<div style='margin-top:14px;text-align:right'>" +
            "<button id='cerrarMovInv2' style='padding:10px 14px'>Cerrar</button>" +
        "</div>";

    caja.innerHTML = html;
    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    function cerrar() {
        fondo.remove();
    }

    const cerrar1 =
        caja.querySelector("#cerrarMovInv");

    const cerrar2 =
        caja.querySelector("#cerrarMovInv2");

    if (cerrar1) cerrar1.onclick = cerrar;
    if (cerrar2) cerrar2.onclick = cerrar;
}

// ========================================
// INVENTARIO
// ========================================

function siguienteIdProducto() {
    if (productos.length === 0) {
        return 1;
    }

    return Math.max.apply(
        null,
        productos.map(function(producto) {
            return Number(producto.id) || 0;
        })
    ) + 1;
}

function obtenerProducto(id) {
    return productos.find(function(producto) {
        return Number(producto.id) === Number(id);
    });
}


function seleccionarMetodoPagoProducto(precio, alSeleccionar) {
    const anterior =
        document.getElementById(
            "modalMetodoPagoProducto"
        );

    if (anterior) {
        anterior.remove();
    }

    const fondo = document.createElement("div");

    fondo.id = "modalMetodoPagoProducto";
    fondo.style.position = "fixed";
    fondo.style.inset = "0";
    fondo.style.background = "rgba(0,0,0,.72)";
    fondo.style.display = "flex";
    fondo.style.alignItems = "center";
    fondo.style.justifyContent = "center";
    fondo.style.zIndex = "9999";
    fondo.style.padding = "20px";

    const caja = document.createElement("div");

    caja.style.width = "min(420px,100%)";
    caja.style.background = "#1c2028";
    caja.style.color = "white";
    caja.style.borderRadius = "20px";
    caja.style.padding = "25px";
    caja.style.textAlign = "center";
    caja.style.boxShadow =
        "0 15px 45px rgba(0,0,0,.55)";

    caja.innerHTML =
        "<h1>🛒 Venta de producto</h1>" +
        "<h2>Total: $" + precio + "</h2>" +
        "<p>Selecciona cómo pagó el cliente.</p>";

    [
        {
            id: "efectivo",
            texto: "💵 Efectivo"
        },
        {
            id: "tarjeta",
            texto: "💳 Tarjeta"
        },
        {
            id: "transferencia",
            texto: "📱 Transferencia"
        }
    ].forEach(function(metodo) {
        const boton =
            document.createElement("button");

        boton.textContent = metodo.texto;
        boton.style.display = "block";
        boton.style.width = "100%";
        boton.style.margin = "10px 0";
        boton.style.padding = "14px";
        boton.style.fontSize = "17px";
        boton.style.fontWeight = "bold";

        boton.onclick = function() {
            fondo.remove();
            alSeleccionar(metodo.id);
        };

        caja.appendChild(boton);
    });

    const cancelar =
        document.createElement("button");

    cancelar.textContent = "❌ Cancelar";

    cancelar.onclick = function() {
        fondo.remove();
    };

    caja.appendChild(cancelar);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
}

function venderProducto(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const productoInicial =
        obtenerProducto(id);

    if (!productoInicial || !productoInicial.activo) {
        return;
    }

    const stockInicial =
        Math.max(
            0,
            Number(productoInicial.stock) || 0
        );

    if (stockInicial <= 0) {
        alert("❌ Este producto está agotado.");
        return;
    }

    const cantidadTexto =
        prompt(
            "🛒 " + productoInicial.nombre +
            "\n\nStock disponible: " +
            stockInicial +
            "\nPrecio unitario: $" +
            Number(productoInicial.precio).toFixed(2) +
            "\n\n¿Cuántas piezas quieres vender?"
        );

    if (cantidadTexto === null) {
        return;
    }

    const cantidad =
        Number(cantidadTexto);

    if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {
        alert("Escribe una cantidad entera válida.");
        return;
    }

    if (cantidad > stockInicial) {
        alert(
            "❌ No hay suficiente stock.\n\n" +
            "Disponible: " + stockInicial
        );
        return;
    }

    const total =
        cantidad *
        Number(productoInicial.precio);

    if (!Number.isFinite(total) || total <= 0) {
        alert("❌ El precio del producto no es válido.");
        return;
    }

    const nombreClienteProducto =
        prompt(
            "👤 Cliente (opcional)\n\n" +
            "Escribe el nombre para asociar esta compra " +
            "a su perfil.\n\n" +
            "Aceptar vacío = venta de mostrador.\n" +
            "Cancelar = cancelar la venta."
        );

    if (nombreClienteProducto === null) {
        return;
    }

    const clienteNombreLimpio =
        String(nombreClienteProducto || "")
            .trim()
            .replace(/\s+/g, " ");

    seleccionarMetodoPagoProducto(
        total,
        function(metodoPago) {
            try {
                if (estadoCaja !== "abierta") {
                    alert("🔒 La caja ya no está abierta.");
                    return;
                }

                // Releer el producto justo antes de confirmar:
                // evita vender con stock/precio obsoletos.
                const producto =
                    obtenerProducto(id);

                if (
                    !producto ||
                    !producto.activo
                ) {
                    alert(
                        "❌ El producto ya no está disponible."
                    );
                    return;
                }

                const stockActual =
                    Math.max(
                        0,
                        Number(producto.stock) || 0
                    );

                if (cantidad > stockActual) {
                    alert(
                        "❌ El stock cambió y ya no alcanza.\n\n" +
                        "Disponible ahora: " +
                        stockActual
                    );
                    return;
                }

                const precioUnitario =
                    Number(producto.precio);

                const costoUnitario =
                    Number(producto.costo);

                const totalFinal =
                    cantidad *
                    precioUnitario;

                const costoTotal =
                    cantidad *
                    costoUnitario;

                const utilidad =
                    totalFinal -
                    costoTotal;

                let clienteProducto = null;

                if (
                    clienteNombreLimpio &&
                    clienteNombreLimpio.toLowerCase() !==
                        "sin nombre"
                ) {
                    clienteProducto =
                        crearClienteMembresia(
                            clienteNombreLimpio
                        );

                    if (clienteProducto) {
                        normalizarClientePro(
                            clienteProducto
                        );
                    }
                }

                const ticketFolio =
                    obtenerSiguienteFolioTicketPro();

                const venta = {
                    tipo: "producto",
                    fecha: obtenerFecha(),
                    hora: obtenerHora(),
                    productoId: producto.id,
                    producto: producto.nombre,
                    cantidad: cantidad,
                    precioUnitario:
                        precioUnitario,
                    costoUnitario:
                        costoUnitario,
                    precio: totalFinal,
                    utilidad: utilidad,
                    metodoPago: metodoPago,
                    ticketFolio: ticketFolio,
                    usuario:
                        usuarioActualPro
                            ? usuarioActualPro.nombre
                            : "Usuario actual",
                    cliente: clienteProducto
                        ? clienteProducto.nombre
                        : ""
                };

                const stockAnterior =
                    stockActual;

                const stockNuevo =
                    stockActual - cantidad;

                // Commit de inventario.
                producto.stock = stockNuevo;

                registrarMovimientoInventario({
                    tipo: "venta",
                    productoId: producto.id,
                    producto: producto.nombre,
                    cantidad: cantidad,
                    delta: -cantidad,
                    stockAnterior: stockAnterior,
                    stockNuevo: stockNuevo,
                    costoUnitario: costoUnitario,
                    importe: totalFinal,
                    motivo: "Venta",
                    metodoPago: metodoPago,
                    ticketFolio: ticketFolio
                });

                ventasDelDia += totalFinal;
                ventasPorMetodo[metodoPago] =
                    (
                        Number(
                            ventasPorMetodo[metodoPago]
                        ) || 0
                    ) + totalFinal;

                historial.push(venta);

                if (clienteProducto) {
                    clienteProducto.gasto += totalFinal;
                    clienteProducto.productosUnidades += cantidad;
                    clienteProducto.ultimaVisita =
                        obtenerFecha() +
                        " · " +
                        obtenerHora();

                    if (
                        membresiaClienteActiva(
                            clienteProducto
                        )
                    ) {
                        const puntosProducto =
                            Math.floor(
                                totalFinal *
                                configuracionMembresia.puntosPorPeso
                            );

                        registrarMovimientoMembresia(
                            clienteProducto,
                            puntosProducto,
                            "🛒 Puntos por compra",
                            totalFinal
                        );
                    }
                }

                registrarVentaDia({
                    total: totalFinal,
                    juegos: 0,
                    productos: totalFinal,
                    metodo: metodoPago,
                    clienteContado: 1,
                    minutos: 0,
                    cantidadProductos: cantidad,
                    puntos: 0
                });

                guardarDatos();
                mostrarInventario();

                if (
                    Number(producto.stock) === 0
                ) {
                    alert(
                        "🔴 " +
                        producto.nombre +
                        " quedó AGOTADO."
                    );
                } else if (
                    Number(producto.stock) <=
                    Number(producto.stockMinimo)
                ) {
                    alert(
                        "⚠️ Stock bajo de " +
                        producto.nombre +
                        ".\n\nQuedan: " +
                        producto.stock
                    );
                }

                const imprimir =
                    confirm(
                        "✅ Venta registrada.\n\n" +
                        producto.nombre +
                        " x" + cantidad +
                        "\nTotal: $" +
                        totalFinal.toFixed(2) +
                        "\nStock restante: " +
                        producto.stock +
                        "\n\n¿Quieres imprimir el ticket?"
                    );

                if (imprimir) {
                    try {
                        imprimirTicketProducto(
                            JSON.parse(
                                JSON.stringify(venta)
                            )
                        );
                    } catch (errorTicket) {
                        console.error(
                            "Error al imprimir ticket de producto:",
                            errorTicket
                        );

                        alert(
                            "⚠️ La venta se registró correctamente, " +
                            "pero no se pudo abrir el ticket."
                        );
                    }
                }
            } catch (errorVenta) {
                console.error(
                    "Error al registrar venta de producto:",
                    errorVenta
                );

                alert(
                    "❌ No se pudo completar la venta.\n\n" +
                    "No se aplicaron cambios adicionales."
                );
            }
        }
    );
}


function reponerProducto(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const producto =
        obtenerProducto(id);

    if (!producto) {
        return;
    }

    const stockAnterior =
        Math.max(
            0,
            Number(producto.stock) || 0
        );

    const costoAnterior =
        Math.max(
            0,
            Number(producto.costo) || 0
        );

    const cantidadTexto =
        prompt(
            "➕ Reponer " + producto.nombre +
            "\n\nStock actual: " +
            stockAnterior +
            "\n\n¿Cuántas piezas llegaron?"
        );

    if (cantidadTexto === null) {
        return;
    }

    const cantidad =
        Number(cantidadTexto);

    if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {
        alert("Escribe una cantidad entera válida.");
        return;
    }

    const costoTexto =
        prompt(
            "¿Cuánto pagaste por toda la reposición?\n\n" +
            "Escribe 0 si fue gratuita o si el gasto se registró aparte."
        );

    if (costoTexto === null) {
        return;
    }

    const costoTotal =
        Number(costoTexto);

    if (
        !Number.isFinite(costoTotal) ||
        costoTotal < 0
    ) {
        alert("Escribe un costo válido.");
        return;
    }

    let metodoPago = "";

    if (costoTotal > 0) {
        const metodoTexto =
            prompt(
                "¿Cómo pagaste la reposición?\n\n" +
                "1 = 💵 Efectivo\n" +
                "2 = 💳 Tarjeta\n" +
                "3 = 📱 Transferencia"
            );

        if (metodoTexto === null) {
            return;
        }

        const metodos = {
            "1": "efectivo",
            "2": "tarjeta",
            "3": "transferencia"
        };

        metodoPago =
            metodos[
                String(metodoTexto).trim()
            ];

        if (!metodoPago) {
            alert("Selecciona 1, 2 o 3.");
            return;
        }
    }

    const costoNuevoUnitario =
        cantidad > 0
            ? costoTotal / cantidad
            : 0;

    // Costo promedio ponderado: refleja el costo real
    // de la existencia después de la nueva compra.
    let costoPromedio =
        costoAnterior;

    if (costoTotal > 0) {
        const valorAnterior =
            stockAnterior * costoAnterior;

        const valorNuevo =
            valorAnterior + costoTotal;

        costoPromedio =
            (stockAnterior + cantidad) > 0
                ? valorNuevo /
                    (stockAnterior + cantidad)
                : costoNuevoUnitario;
    }

    const stockNuevo =
        stockAnterior + cantidad;

    producto.stock = stockNuevo;

    if (costoTotal > 0) {
        producto.costo =
            Number(costoPromedio.toFixed(4));
    }

    registrarMovimientoInventario({
        tipo: "entrada",
        productoId: producto.id,
        producto: producto.nombre,
        cantidad: cantidad,
        delta: cantidad,
        stockAnterior: stockAnterior,
        stockNuevo: stockNuevo,
        costoUnitario: costoNuevoUnitario,
        importe: costoTotal,
        motivo: "Reposición",
        metodoPago: metodoPago
    });

    if (costoTotal > 0) {
        gastos.push({
            fecha: obtenerFecha(),
            hora: obtenerHora(),
            concepto:
                "Compra de inventario: " +
                producto.nombre +
                " x" + cantidad,
            monto: costoTotal,
            tipo: "inventario",
            metodoPago: metodoPago,
            usuario:
                usuarioActualPro
                    ? usuarioActualPro.nombre
                    : "Usuario actual"
        });

        gastosDelDia += costoTotal;

        if (metodoPago === "efectivo") {
            movimientosCaja.push({
                fecha: obtenerFecha(),
                hora: obtenerHora(),
                tipo: "salida",
                concepto:
                    "Compra de inventario: " +
                    producto.nombre +
                    " x" + cantidad,
                monto: costoTotal,
                usuario:
                    usuarioActualPro
                        ? usuarioActualPro.nombre
                        : "Usuario actual"
            });
        }
    }

    guardarDatos();
    mostrarInventario();

    alert(
        "✅ Stock actualizado.\n\n" +
        producto.nombre +
        ": " + producto.stock +
        " piezas" +
        (
            costoTotal > 0
                ? "\n💸 Compra: $" +
                  costoTotal.toFixed(2) +
                  "\n🏷️ Costo promedio: $" +
                  Number(producto.costo).toFixed(2)
                : ""
        )
    );
}


function editarProducto(id) {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const producto = obtenerProducto(id);

    if (!producto) {
        return;
    }

    const nombre =
        prompt(
            "Nombre del producto:",
            producto.nombre
        );

    if (nombre === null || !nombre.trim()) {
        return;
    }

    const precio =
        Number(
            prompt(
                "Precio de venta:",
                producto.precio
            )
        );

    const costo =
        Number(
            prompt(
                "Costo por pieza:",
                producto.costo
            )
        );

    const stockMinimo =
        Number(
            prompt(
                "Avisar cuando queden esta cantidad:",
                producto.stockMinimo
            )
        );

    if (
        !isFinite(precio) ||
        precio < 0 ||
        !isFinite(costo) ||
        costo < 0 ||
        !isFinite(stockMinimo) ||
        stockMinimo < 0
    ) {
        alert("❌ Revisa los datos.");
        return;
    }

    producto.nombre = nombre.trim();
    producto.precio = precio;
    producto.costo = costo;
    producto.stockMinimo = Math.floor(stockMinimo);

    guardarDatos();
    mostrarInventario();
}

function agregarProducto() {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const nombre =
        prompt("Nombre del nuevo producto:");

    if (!nombre || !nombre.trim()) {
        return;
    }

    const precio =
        Number(
            prompt("Precio de venta:")
        );

    const costo =
        Number(
            prompt("Costo por pieza:")
        );

    const stock =
        Number(
            prompt("Stock inicial:")
        );

    const stockMinimo =
        Number(
            prompt("Avisar cuando queden esta cantidad:", "5")
        );

    if (
        !isFinite(precio) ||
        precio < 0 ||
        !isFinite(costo) ||
        costo < 0 ||
        !Number.isInteger(stock) ||
        stock < 0 ||
        !Number.isInteger(stockMinimo) ||
        stockMinimo < 0
    ) {
        alert("❌ Revisa los datos del producto.");
        return;
    }

    productos.push({
        id: siguienteIdProducto(),
        nombre: nombre.trim(),
        precio: precio,
        costo: costo,
        stock: stock,
        stockMinimo: stockMinimo,
        activo: true
    });

    guardarDatos();
    mostrarInventario();
}

function cambiarEstadoProducto(id) {
    const producto = obtenerProducto(id);

    if (!producto) {
        return;
    }

    producto.activo = !producto.activo;

    guardarDatos();
    mostrarInventario();
}


function obtenerResumenInventarioPro() {
    const activos = productos.filter(function(producto) {
        return producto.activo;
    });

    const ocultos = productos.filter(function(producto) {
        return !producto.activo;
    });

    let unidades = 0;
    let valorCosto = 0;
    let valorVenta = 0;
    let bajos = 0;
    let agotados = 0;

    activos.forEach(function(producto) {
        const stock = Math.max(0, Number(producto.stock) || 0);
        const costo = Math.max(0, Number(producto.costo) || 0);
        const precio = Math.max(0, Number(producto.precio) || 0);
        const minimo = Math.max(0, Number(producto.stockMinimo) || 0);

        unidades += stock;
        valorCosto += stock * costo;
        valorVenta += stock * precio;

        if (stock === 0) {
            agotados += 1;
        } else if (stock <= minimo) {
            bajos += 1;
        }
    });

    return {
        activos: activos.length,
        ocultos: ocultos.length,
        unidades: unidades,
        valorCosto: valorCosto,
        valorVenta: valorVenta,
        utilidadPotencial: valorVenta - valorCosto,
        bajos: bajos,
        agotados: agotados
    };
}

function estadoStockInventarioPro(producto) {
    const stock =
        Math.max(0, Number(producto.stock) || 0);

    const minimo =
        Math.max(0, Number(producto.stockMinimo) || 0);

    if (stock === 0) {
        return {
            clase: "out",
            etiqueta: "🔴 AGOTADO"
        };
    }

    if (stock <= minimo) {
        return {
            clase: "low",
            etiqueta: "🟠 STOCK BAJO"
        };
    }

    return {
        clase: "ok",
        etiqueta: "🟢 EN STOCK"
    };
}

function filtrarInventarioPro() {
    const input =
        document.getElementById("v27-inventory-search");

    const filtro =
        String(input ? input.value : "")
            .trim()
            .toLowerCase();

    const tarjetas =
        document.querySelectorAll(
            ".v27-inventory-product"
        );

    tarjetas.forEach(function(tarjeta) {
        const nombre =
            String(
                tarjeta.getAttribute("data-product-name") || ""
            ).toLowerCase();

        const estado =
            String(
                tarjeta.getAttribute("data-stock-state") || ""
            ).toLowerCase();

        const coincide =
            !filtro ||
            nombre.includes(filtro) ||
            estado.includes(filtro);

        tarjeta.style.display =
            coincide ? "" : "none";
    });
}

function mostrarSoloStockInventario(tipo) {
    const tarjetas =
        document.querySelectorAll(
            ".v27-inventory-product"
        );

    tarjetas.forEach(function(tarjeta) {
        const estado =
            tarjeta.getAttribute("data-stock-state");

        let mostrar = true;

        if (tipo === "bajo") {
            mostrar =
                estado === "low" ||
                estado === "out";
        } else if (tipo === "agotado") {
            mostrar =
                estado === "out";
        } else if (tipo === "ok") {
            mostrar =
                estado === "ok";
        }

        tarjeta.style.display =
            mostrar ? "" : "none";
    });

    const input =
        document.getElementById("v27-inventory-search");

    if (input) {
        input.value = "";
    }
}

function limpiarFiltroInventarioPro() {
    const input =
        document.getElementById("v27-inventory-search");

    if (input) {
        input.value = "";
    }

    const tarjetas =
        document.querySelectorAll(
            ".v27-inventory-product"
        );

    tarjetas.forEach(function(tarjeta) {
        tarjeta.style.display = "";
    });
}

function mostrarInventario() {
    if (!exigirPermisoPro("inventario")) {
        return;
    }

    vistaActual = "inventario";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const resumen =
        obtenerResumenInventarioPro();

    const resumenVentas =
        obtenerResumenInventarioHoy();

    const div =
        document.createElement("div");

    div.className =
        "v27-inventory-page";

    const activosOrdenados =
        productos
            .filter(function(producto) {
                return producto.activo;
            })
            .slice()
            .sort(function(a, b) {
                const estadoA =
                    estadoStockInventarioPro(a);

                const estadoB =
                    estadoStockInventarioPro(b);

                const peso = {
                    out: 0,
                    low: 1,
                    ok: 2
                };

                if (peso[estadoA.clase] !== peso[estadoB.clase]) {
                    return peso[estadoA.clase] -
                        peso[estadoB.clase];
                }

                return String(a.nombre)
                    .localeCompare(String(b.nombre));
            });

    let html =
        "<div class='v27-inventory-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>📦 CONTROL DE INVENTARIO</div>" +
                "<h1>Inventario PRO</h1>" +
                "<p>Controla existencias, costos, precios y reposiciones sin perder de vista lo que necesitas comprar.</p>" +
            "</div>" +
            "<div class='v27-inventory-hero-icon'>📦</div>" +
        "</div>" +

        "<div class='v27-page-actions'>" +
            "<button class='v27-action-primary' onclick='agregarProducto()'>➕ Nuevo producto</button>" +
            "<button onclick='mostrarMovimientosInventario()'>📋 Movimientos</button>" +
            "<button onclick='exportarInventarioCSV()'>📄 Exportar CSV</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>" +

        "<div class='v27-inventory-stats'>" +

            "<div class='v27-inventory-stat'>" +
                "<span>📦 UNIDADES</span>" +
                "<strong>" + resumen.unidades + "</strong>" +
                "<small>en existencia</small>" +
            "</div>" +

            "<div class='v27-inventory-stat'>" +
                "<span>💰 VALOR DE COSTO</span>" +
                "<strong>" + dinero(resumen.valorCosto) + "</strong>" +
                "<small>inventario actual</small>" +
            "</div>" +

            "<div class='v27-inventory-stat'>" +
                "<span>🏷️ VALOR DE VENTA</span>" +
                "<strong>" + dinero(resumen.valorVenta) + "</strong>" +
                "<small>si se vende todo</small>" +
            "</div>" +

            "<div class='v27-inventory-stat " +
                (resumen.utilidadPotencial > 0
                    ? "v27-stat-positive"
                    : "") +
            "'>" +
                "<span>📈 UTILIDAD POTENCIAL</span>" +
                "<strong>" + dinero(resumen.utilidadPotencial) + "</strong>" +
                "<small>margen del stock</small>" +
            "</div>" +

        "</div>" +

        "<div class='v27-inventory-alerts'>" +
            "<div class='v27-inventory-alert " +
                (resumen.agotados > 0 ? "danger" : "normal") +
            "'>" +
                "<strong>🔴 " + resumen.agotados + "</strong>" +
                "<span>agotados</span>" +
            "</div>" +

            "<div class='v27-inventory-alert " +
                (resumen.bajos > 0 ? "warning" : "normal") +
            "'>" +
                "<strong>🟠 " + resumen.bajos + "</strong>" +
                "<span>stock bajo</span>" +
            "</div>" +

            "<div class='v27-inventory-alert normal'>" +
                "<strong>🟢 " + resumen.activos + "</strong>" +
                "<span>productos activos</span>" +
            "</div>" +

            "<div class='v27-inventory-alert normal'>" +
                "<strong>🗃️ " + resumen.ocultos + "</strong>" +
                "<span>ocultos</span>" +
            "</div>" +
        "</div>" +

        "<div class='v27-inventory-sales-strip'>" +
            "<div>" +
                "<span>VENTAS DE PRODUCTOS HOY</span>" +
                "<strong>" + dinero(resumenVentas.ingresos) + "</strong>" +
            "</div>" +
            "<div>" +
                "<span>UNIDADES VENDIDAS</span>" +
                "<strong>" + resumenVentas.unidades + "</strong>" +
            "</div>" +
            "<div>" +
                "<span>UTILIDAD ESTIMADA HOY</span>" +
                "<strong>" + dinero(resumenVentas.utilidad) + "</strong>" +
            "</div>" +
        "</div>" +

        "<div class='v27-inventory-toolbar'>" +
            "<div class='v27-inventory-search'>" +
                "<span>🔎</span>" +
                "<input id='v27-inventory-search' " +
                    "type='search' " +
                    "placeholder='Buscar producto...' " +
                    "oninput='filtrarInventarioPro()'>" +
            "</div>" +

            "<div class='v27-inventory-filters'>" +
                "<button onclick='limpiarFiltroInventarioPro()'>Todos</button>" +
                "<button onclick='mostrarSoloStockInventario(\"bajo\")'>🟠 Bajo</button>" +
                "<button onclick='mostrarSoloStockInventario(\"agotado\")'>🔴 Agotados</button>" +
                "<button onclick='mostrarSoloStockInventario(\"ok\")'>🟢 En stock</button>" +
            "</div>" +
        "</div>" +

        "<div class='v27-section-heading'>" +
            "<div>" +
                "<span>CATÁLOGO</span>" +
                "<h2>🛒 Productos</h2>" +
            "</div>" +
            "<small>" + activosOrdenados.length + " activos</small>" +
        "</div>" +

        "<div class='v27-inventory-grid'>";

    if (activosOrdenados.length === 0) {
        html +=
            "<div class='v27-empty-state'>" +
                "<div class='v27-empty-icon'>📦</div>" +
                "<h2>No hay productos activos</h2>" +
                "<p>Agrega tu primer producto para comenzar a controlar existencias.</p>" +
                "<button onclick='agregarProducto()'>➕ Agregar producto</button>" +
            "</div>";
    } else {
        activosOrdenados.forEach(function(producto) {
            const estado =
                estadoStockInventarioPro(producto);

            const stock =
                Math.max(0, Number(producto.stock) || 0);

            const costo =
                Math.max(0, Number(producto.costo) || 0);

            const precio =
                Math.max(0, Number(producto.precio) || 0);

            const minimo =
                Math.max(0, Number(producto.stockMinimo) || 0);

            const margen =
                precio - costo;

            const margenPorcentaje =
                precio > 0
                    ? Math.round(
                        (margen / precio) * 100
                    )
                    : 0;

            const valorStock =
                stock * costo;

            const nivelStock =
                minimo > 0
                    ? Math.min(
                        100,
                        Math.round(
                            (stock / (minimo * 4)) * 100
                        )
                    )
                    : (stock > 0 ? 100 : 0);

            html +=
                "<div class='v27-inventory-product v27-stock-" +
                    estado.clase +
                    "' " +
                    "data-product-name='" +
                    escaparHTML(producto.nombre) +
                    "' " +
                    "data-stock-state='" +
                    estado.clase +
                "'>" +

                    "<div class='v27-inventory-product-head'>" +
                        "<div class='v27-product-icon'>🥤</div>" +
                        "<div class='v27-product-title'>" +
                            "<h3>" +
                                escaparHTML(producto.nombre) +
                            "</h3>" +
                            "<span>" +
                                estado.etiqueta +
                            "</span>" +
                        "</div>" +
                        "<div class='v27-stock-number'>" +
                            "<strong>" + stock + "</strong>" +
                            "<small>pzas</small>" +
                        "</div>" +
                    "</div>" +

                    "<div class='v27-stock-progress'>" +
                        "<div class='v27-stock-progress-track'>" +
                            "<i style='width:" +
                                nivelStock +
                            "%'></i>" +
                        "</div>" +
                        "<div class='v27-stock-labels'>" +
                            "<span>Mínimo " + minimo + "</span>" +
                            "<span>" +
                                (stock > minimo
                                    ? "Buen nivel"
                                    : "Necesita atención") +
                            "</span>" +
                        "</div>" +
                    "</div>" +

                    "<div class='v27-product-prices'>" +
                        "<div>" +
                            "<span>VENTA</span>" +
                            "<strong>" + dinero(precio) + "</strong>" +
                        "</div>" +
                        "<div>" +
                            "<span>COSTO</span>" +
                            "<strong>" + dinero(costo) + "</strong>" +
                        "</div>" +
                        "<div>" +
                            "<span>MARGEN</span>" +
                            "<strong>" + dinero(margen) + "</strong>" +
                            "<small>" + margenPorcentaje + "%</small>" +
                        "</div>" +
                    "</div>" +

                    "<div class='v27-product-footer'>" +
                        "<span>📦 Valor en costo: <strong>" +
                            dinero(valorStock) +
                        "</strong></span>" +
                        "<span>📊 x" +
                            margen.toFixed(2) +
                        " por pieza</span>" +
                    "</div>" +

                    "<div class='v27-product-actions'>" +
                        "<button class='v27-product-sell' onclick='venderProducto(" +
                            producto.id +
                        ")'>🛒 Vender</button>" +
                        "<button onclick='reponerProducto(" +
                            producto.id +
                        ")'>➕ Reponer</button>" +
                        "<button onclick='ajustarStockProducto(" +
                            producto.id +
                        ")'>⚙️ Ajustar</button>" +
                        "<button onclick='editarProducto(" +
                            producto.id +
                        ")'>✏️ Editar</button>" +
                        "<button onclick='cambiarEstadoProducto(" +
                            producto.id +
                        ")'>🗃️ Ocultar</button>" +
                    "</div>" +

                "</div>";
        });
    }

    html += "</div>";

    const ocultos =
        productos.filter(function(producto) {
            return !producto.activo;
        });

    if (ocultos.length > 0) {
        html +=
            "<div class='v27-section-heading v27-hidden-heading'>" +
                "<div><span>CATÁLOGO OCULTO</span><h2>🗃️ Productos ocultos</h2></div>" +
                "<small>" + ocultos.length + "</small>" +
            "</div>" +
            "<div class='v27-hidden-products'>";

        ocultos.forEach(function(producto) {
            html +=
                "<div class='v27-hidden-product'>" +
                    "<div>" +
                        "<strong>📦 " +
                            escaparHTML(producto.nombre) +
                        "</strong>" +
                        "<span>Stock: " +
                            Number(producto.stock) +
                        "</span>" +
                    "</div>" +
                    "<button onclick='cambiarEstadoProducto(" +
                        producto.id +
                    ")'>↩️ Mostrar</button>" +
                "</div>";
        });

        html += "</div>";
    }

    div.innerHTML = html;
    contenedor.appendChild(div);
}

// ========================================
// TICKETS / RECIBOS
// ========================================

function escaparTextoTicket(valor) {
    return String(valor || "")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escaparTextoTicketCuenta(texto) {
    return String(
        texto === null || typeof texto === "undefined"
            ? ""
            : texto
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function nombreMetodoPagoTicket(metodo) {
    if (metodo === "efectivo") return "Efectivo";
    if (metodo === "tarjeta") return "Tarjeta";
    if (metodo === "transferencia") return "Transferencia";
    return String(metodo || "");
}


function obtenerSiguienteFolioTicketPro() {
    const hoy = obtenerFecha();

    if (fechaContadorTicketPro !== hoy) {
        fechaContadorTicketPro = hoy;
        contadorTicketPro = 0;
    }

    contadorTicketPro += 1;

    return (
        "TKT-" +
        hoy.replace(/-/g, "") +
        "-" +
        String(contadorTicketPro).padStart(4, "0")
    );
}

function actualizarContadorDesdeFolioTicketPro(folio) {
    const texto = String(folio || "");
    const partes = texto.split("-");

    if (partes.length < 3) {
        return;
    }

    const fechaFolio =
        partes[1] || "";

    const numero =
        Number(partes[2]);

    if (
        fechaFolio ===
        obtenerFecha().replace(/-/g, "") &&
        Number.isFinite(numero)
    ) {
        contadorTicketPro =
            Math.max(
                contadorTicketPro,
                numero
            );

        fechaContadorTicketPro =
            obtenerFecha();
    }
}

function normalizarFoliosTicketsPro() {
    if (!Array.isArray(historial)) {
        historial = [];
        return;
    }

    const folioPorCuenta = {};

    historial.forEach(function(venta) {
        if (venta.ticketFolio) {
            actualizarContadorDesdeFolioTicketPro(
                venta.ticketFolio
            );

            if (venta.cuentaId !== null &&
                typeof venta.cuentaId !== "undefined") {
                folioPorCuenta[
                    String(venta.cuentaId)
                ] = venta.ticketFolio;
            }
        }
    });

    historial.forEach(function(venta) {
        if (!venta.ticketFolio) {
            let folio = "";

            if (
                venta.cuentaId !== null &&
                typeof venta.cuentaId !== "undefined" &&
                folioPorCuenta[
                    String(venta.cuentaId)
                ]
            ) {
                folio =
                    folioPorCuenta[
                        String(venta.cuentaId)
                    ];
            } else {
                folio =
                    obtenerSiguienteFolioTicketPro();

                if (
                    venta.cuentaId !== null &&
                    typeof venta.cuentaId !== "undefined"
                ) {
                    folioPorCuenta[
                        String(venta.cuentaId)
                    ] = folio;
                }
            }

            venta.ticketFolio =
                folio;
        }

        if (!venta.usuario) {
            venta.usuario =
                "Histórico";
        }
    });

    guardarDatos();
}

function obtenerTicketsPro() {
    const grupos = {};

    (Array.isArray(historial)
        ? historial
        : []
    ).forEach(function(venta) {
        const folio =
            venta.ticketFolio ||
            "SIN-FOLIO-" +
            String(
                venta.cuentaId ||
                venta.hora ||
                Math.random()
            );

        if (!grupos[folio]) {
            grupos[folio] = {
                folio: folio,
                fecha:
                    venta.fecha ||
                    obtenerFecha(),
                hora:
                    venta.hora ||
                    "",
                usuario:
                    venta.usuario ||
                    "Histórico",
                cliente:
                    venta.cliente ||
                    "",
                estacion:
                    venta.estacion ||
                    venta.xbox ||
                    "",
                tipoEstacion:
                    venta.tipoEstacion ||
                    "",
                metodoPago:
                    venta.metodoPago ||
                    "",
                sesion: null,
                productos: [],
                total: 0
            };
        }

        const ticket =
            grupos[folio];

        if (venta.tipo === "sesion") {
            ticket.sesion =
                venta;

            ticket.total +=
                Number(
                    venta.precio
                ) || 0;

            ticket.cliente =
                venta.cliente ||
                ticket.cliente;

            ticket.estacion =
                venta.estacion ||
                venta.xbox ||
                ticket.estacion;

            ticket.tipoEstacion =
                venta.tipoEstacion ||
                ticket.tipoEstacion;
        }

        if (venta.tipo === "producto") {
            ticket.productos.push(
                venta
            );

            ticket.total +=
                Number(
                    venta.precio
                ) || 0;

            if (!ticket.cliente) {
                ticket.cliente =
                    venta.cliente ||
                    "";
            }

            if (!ticket.estacion) {
                ticket.estacion =
                    venta.estacion ||
                    "";
            }
        }

        if (!ticket.metodoPago) {
            ticket.metodoPago =
                venta.metodoPago ||
                "";
        }

        if (
            venta.usuario &&
            ticket.usuario === "Histórico"
        ) {
            ticket.usuario =
                venta.usuario;
        }
    });

    return Object.values(
        grupos
    ).sort(function(a, b) {
        return String(
            b.folio
        ).localeCompare(
            String(a.folio)
        );
    });
}

function buscarTicketPro(folio) {
    const buscado =
        String(
            folio || ""
        ).trim().toUpperCase();

    return obtenerTicketsPro().find(
        function(ticket) {
            return (
                String(
                    ticket.folio
                ).toUpperCase() ===
                buscado
            );
        }
    ) || null;
}

function crearTicketFolioHTML(ticket) {
    if (!ticket) {
        return (
            "<!doctype html>" +
            "<html><body>" +
            "<h2>No se encontró el ticket.</h2>" +
            "</body></html>"
        );
    }

    const sesion =
        ticket.sesion;

    let lineas =
        "";

    if (sesion) {
        lineas +=
            "<div class='fila'>" +
                "<span>🎮 " +
                    escaparTextoTicket(
                        sesion.xbox ||
                        sesion.estacion ||
                        "Estación"
                    ) +
                    (
                        sesion.tiempo
                            ? " · " +
                              escaparTextoTicket(
                                  sesion.tiempo
                              )
                            : ""
                    ) +
                "</span>" +
                "<span>$" +
                    Number(
                        sesion.precio ||
                        0
                    ).toFixed(2) +
                "</span>" +
            "</div>";

        if (
            Number(
                sesion.descuento ||
                0
            ) > 0
        ) {
            lineas +=
                "<div class='fila descuento'>" +
                    "<strong>Descuento</strong>" +
                    "<span>-$" +
                        Number(
                            sesion.descuento
                        ).toFixed(2) +
                    "</span>" +
                "</div>";
        }
    }

    ticket.productos.forEach(
        function(producto) {
            lineas +=
                "<div class='fila'>" +
                    "<span>🛒 " +
                        escaparTextoTicket(
                            producto.producto ||
                            "Producto"
                        ) +
                        " x" +
                        Number(
                            producto.cantidad ||
                            0
                        ) +
                    "</span>" +
                    "<span>$" +
                        Number(
                            producto.precio ||
                            0
                        ).toFixed(2) +
                    "</span>" +
                "</div>";
        }
    );

    const fecha =
        ticket.fecha ||
        obtenerFecha();

    return (
        "<!doctype html>" +
        "<html lang='es'>" +
        "<head>" +
            "<meta charset='utf-8'>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<title>Ticket " +
                escaparTextoTicket(
                    ticket.folio
                ) +
            "</title>" +
            "<style>" +
                "body{font-family:Arial,sans-serif;width:300px;margin:20px auto;color:#111;background:#fff;}" +
                "h1{text-align:center;font-size:21px;margin:0 0 5px;}" +
                ".center{text-align:center;}" +
                ".folio{text-align:center;font-weight:bold;font-size:13px;margin-top:5px;}" +
                ".line{border-top:1px dashed #555;margin:13px 0;}" +
                ".fila{display:flex;justify-content:space-between;gap:12px;margin:7px 0;}" +
                ".fila span:first-child{max-width:205px;word-break:break-word;}" +
                ".total{font-size:21px;font-weight:bold;}" +
                ".descuento{color:#16803b;}" +
                ".footer{text-align:center;margin-top:18px;font-size:12px;}" +
                ".print{text-align:center;margin-top:18px;}" +
                "@media print{.print{display:none;}body{margin:0 auto;}}" +
            "</style>" +
        "</head>" +
        "<body>" +

            "<h1>🎮 CONTROL DE VIDEOJUEGOS</h1>" +
            "<div class='center'>🧾 COMPROBANTE DE PAGO</div>" +
            "<div class='folio'>" +
                escaparTextoTicket(
                    ticket.folio
                ) +
            "</div>" +

            "<div class='line'></div>" +

            "<div class='fila'>" +
                "<strong>Fecha</strong>" +
                "<span>" +
                    escaparTextoTicket(
                        obtenerFechaBonita(
                            fecha
                        )
                    ) +
                "</span>" +
            "</div>" +

            "<div class='fila'>" +
                "<strong>Hora</strong>" +
                "<span>" +
                    escaparTextoTicket(
                        ticket.hora
                    ) +
                "</span>" +
            "</div>" +

            "<div class='fila'>" +
                "<strong>Usuario</strong>" +
                "<span>" +
                    escaparTextoTicket(
                        ticket.usuario
                    ) +
                "</span>" +
            "</div>" +

            (
                ticket.cliente
                    ? "<div class='fila'>" +
                        "<strong>Cliente</strong>" +
                        "<span>" +
                            escaparTextoTicket(
                                ticket.cliente
                            ) +
                        "</span>" +
                      "</div>"
                    : ""
            ) +

            (
                ticket.estacion
                    ? "<div class='fila'>" +
                        "<strong>Estación</strong>" +
                        "<span>" +
                            escaparTextoTicket(
                                ticket.estacion
                            ) +
                        "</span>" +
                      "</div>"
                    : ""
            ) +

            "<div class='line'></div>" +

            lineas +

            "<div class='line'></div>" +

            "<div class='fila'>" +
                "<strong>Pago</strong>" +
                "<span>" +
                    escaparTextoTicket(
                        nombreMetodoPagoTicket(
                            ticket.metodoPago
                        )
                    ) +
                "</span>" +
            "</div>" +

            "<div class='fila total'>" +
                "<span>TOTAL</span>" +
                "<span>$" +
                    Number(
                        ticket.total ||
                        0
                    ).toFixed(2) +
                "</span>" +
            "</div>" +

            "<div class='footer'>" +
                "Gracias por tu visita 🎮" +
            "</div>" +

            "<div class='print'>" +
                "<button onclick='window.print()'>" +
                    "🖨️ Imprimir" +
                "</button>" +
            "</div>" +

        "</body></html>"
    );
}

function imprimirTicketPorFolio(folio) {
    const ticket =
        buscarTicketPro(
            folio
        );

    if (!ticket) {
        alert(
            "❌ No se encontró el ticket " +
            folio
        );
        return;
    }

    const html =
        crearTicketFolioHTML(
            ticket
        );

    const ventana =
        window.open(
            "",
            "_blank",
            "width=430,height=760,resizable=yes,scrollbars=yes"
        );

    if (!ventana) {
        alert(
            "⚠️ El navegador bloqueó la ventana del ticket.\n\n" +
            "Permite ventanas emergentes para esta aplicación."
        );
        return;
    }

    try {
        ventana.document.open();
        ventana.document.write(
            html
        );
        ventana.document.close();
        ventana.focus();
    } catch (error) {
        try {
            const blob =
                new Blob(
                    [html],
                    {
                        type:
                            "text/html;charset=utf-8"
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            ventana.location.href =
                url;

            setTimeout(
                function() {
                    URL.revokeObjectURL(
                        url
                    );
                },
                60000
            );
        } catch (error2) {
            ventana.close();

            alert(
                "❌ No se pudo abrir el ticket."
            );
        }
    }

    registrarActividadPro(
        "Ticket reimpreso",
        String(folio),
        "tickets"
    );
}

function filtrarTicketsPro() {
    const campo =
        document.getElementById(
            "v283-ticket-search"
        );

    const lista =
        document.getElementById(
            "v283-ticket-list"
        );

    if (!lista) {
        return;
    }

    const consulta =
        String(
            campo
                ? campo.value
                : ""
        )
        .trim()
        .toLowerCase();

    const tickets =
        obtenerTicketsPro().filter(
            function(ticket) {
                if (!consulta) {
                    return true;
                }

                const texto =
                    [
                        ticket.folio,
                        ticket.fecha,
                        ticket.hora,
                        ticket.usuario,
                        ticket.cliente,
                        ticket.estacion,
                        ticket.metodoPago,
                        ticket.sesion &&
                            ticket.sesion.tiempo,
                        ticket.productos
                            .map(
                                function(item) {
                                    return item.producto;
                                }
                            )
                            .join(" ")
                    ]
                    .join(" ")
                    .toLowerCase();

                return texto.includes(
                    consulta
                );
            }
        );

    if (!tickets.length) {
        lista.innerHTML =
            "<div class='v283-ticket-empty'>" +
                "<div>🧾</div>" +
                "<h2>No encontramos tickets</h2>" +
                "<p>Prueba con otro folio, cliente, estación o producto.</p>" +
            "</div>";

        return;
    }

    lista.innerHTML =
        tickets.map(
            function(ticket) {
                const detalle =
                    [];

                if (ticket.sesion) {
                    detalle.push(
                        "🎮 " +
                        (
                            ticket.sesion.xbox ||
                            ticket.sesion.estacion ||
                            "Sesión"
                        )
                    );
                }

                if (
                    ticket.productos.length
                ) {
                    detalle.push(
                        "🛒 " +
                        ticket.productos.length +
                        " concepto" +
                        (
                            ticket.productos.length === 1
                                ? ""
                                : "s"
                        )
                    );
                }

                return (
                    "<article class='v283-ticket-card'>" +
                        "<div class='v283-ticket-icon'>🧾</div>" +
                        "<div class='v283-ticket-main'>" +
                            "<div class='v283-ticket-title'>" +
                                "<strong>" +
                                    escaparHTML(
                                        ticket.folio
                                    ) +
                                "</strong>" +
                                "<span>" +
                                    escaparHTML(
                                        ticket.fecha
                                    ) +
                                    " · " +
                                    escaparHTML(
                                        ticket.hora
                                    ) +
                                "</span>" +
                            "</div>" +
                            "<p>" +
                                escaparHTML(
                                    detalle.join(" · ")
                                ) +
                            "</p>" +
                            "<small>" +
                                (
                                    ticket.cliente
                                        ? "👤 " +
                                          escaparHTML(
                                              ticket.cliente
                                          ) +
                                          " · "
                                        : ""
                                ) +
                                (
                                    ticket.usuario
                                        ? "🛡️ " +
                                          escaparHTML(
                                              ticket.usuario
                                          ) +
                                          " · "
                                        : ""
                                ) +
                                escaparHTML(
                                    nombreMetodoPagoTicket(
                                        ticket.metodoPago
                                    )
                                ) +
                            "</small>" +
                        "</div>" +
                        "<div class='v283-ticket-total'>" +
                            "<strong>$" +
                                Number(
                                    ticket.total ||
                                    0
                                ).toFixed(2) +
                            "</strong>" +
                            "<button onclick='imprimirTicketPorFolio(\"" +
                                String(
                                    ticket.folio
                                ).replace(
                                    /"/g,
                                    "&quot;"
                                ) +
                            "\")'>" +
                                "🖨️ Reimprimir" +
                            "</button>" +
                        "</div>" +
                    "</article>"
                );
            }
        )
        .join("");
}

function mostrarTicketsPro() {
    if (!exigirPermisoPro("reportes")) {
        return;
    }

    vistaActual =
        "tickets_pro";

    normalizarFoliosTicketsPro();

    const contenedor =
        document.getElementById(
            "estaciones"
        );

    contenedor.innerHTML = "";

    const div =
        document.createElement(
            "div"
        );

    div.innerHTML =
        "<div class='v283-ticket-page'>" +

            "<div class='v283-ticket-hero'>" +
                "<div>" +
                    "<div class='v27-eyebrow'>🧾 CONTROL DE VENTAS</div>" +
                    "<h1>Tickets PRO</h1>" +
                    "<p>Consulta, busca y vuelve a imprimir cualquier comprobante de la jornada.</p>" +
                "</div>" +
                "<div class='v283-ticket-hero-icon'>🧾</div>" +
            "</div>" +

            "<div class='v283-ticket-toolbar'>" +
                "<div class='v283-ticket-search'>" +
                    "<span>🔎</span>" +
                    "<input id='v283-ticket-search' " +
                        "type='search' " +
                        "autocomplete='off' " +
                        "placeholder='Folio, cliente, estación, producto...'" +
                        " oninput='filtrarTicketsPro()'>" +
                "</div>" +
                "<button onclick='mostrarHistorial()'>📋 Historial</button>" +
                "<button onclick='volverInicio()'>🏠 Inicio</button>" +
            "</div>" +

            "<div class='v283-ticket-summary'>" +
                "<div><span>TICKETS DE HOY</span><strong>" +
                    obtenerTicketsPro().length +
                "</strong></div>" +
                "<div><span>VENTAS</span><strong>$" +
                    Number(
                        ventasDelDia ||
                        0
                    ).toFixed(2) +
                "</strong></div>" +
                "<div><span>SESIONES</span><strong>" +
                    sesionesDelDia +
                "</strong></div>" +
                "<div><span>ESTADO CAJA</span><strong>" +
                    (
                        estadoCaja === "abierta"
                            ? "🟢 Abierta"
                            : estadoCaja === "cerrada"
                                ? "🔴 Cerrada"
                                : "🟡 Pendiente"
                    ) +
                "</strong></div>" +
            "</div>" +

            "<div id='v283-ticket-list'></div>" +

        "</div>";

    contenedor.appendChild(
        div
    );

    filtrarTicketsPro();
}

function crearTicketCuentaHTML(cuenta, metodoPago, total, folio, usuario) {
    if (!cuenta) {
        return "<!doctype html><html><body>" +
            "<h2>No se encontró la cuenta.</h2>" +
            "</body></html>";
    }

    let productosHTML = "";

    (cuenta.productos || []).forEach(function(item) {
        productosHTML +=
            "<div class='fila'>" +
                "<span>" +
                    escaparTextoTicketCuenta(item.producto) +
                    " x" +
                    Number(item.cantidad || 0) +
                "</span>" +
                "<span>$" +
                    Number(item.precio || 0).toFixed(2) +
                "</span>" +
            "</div>";
    });

    const juego =
        Number(cuenta.game && cuenta.game.precio) || 0;

    const minutos =
        Number(cuenta.game && cuenta.game.minutos) || 0;

    const descuento =
        Number(cuenta.game && cuenta.game.descuento) || 0;

    return "<!doctype html>" +
        "<html lang='es'>" +
        "<head>" +
        "<meta charset='utf-8'>" +
        "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
        "<title>Ticket de cuenta</title>" +
        "<style>" +
        "body{font-family:Arial,sans-serif;width:300px;margin:20px auto;color:#111;background:#fff;}" +
        "h1{text-align:center;font-size:21px;margin:0 0 5px;}" +
        ".center{text-align:center;}" +
        ".line{border-top:1px dashed #555;margin:13px 0;}" +
        ".row{display:flex;justify-content:space-between;gap:12px;margin:7px 0;}" +
        ".row span:first-child{max-width:205px;word-break:break-word;}" +
        ".total{font-size:21px;font-weight:bold;}" +
        ".folio-ticket{text-align:center;font-weight:bold;font-size:13px;margin-top:5px;}" +
        ".footer{text-align:center;margin-top:18px;font-size:12px;}" +
        ".print{text-align:center;margin-top:18px;}" +
        "@media print{.print{display:none;}body{margin:0 auto;}}" +
        "</style>" +
        "</head>" +
        "<body>" +

        "<h1>🎮 CONTROL DE VIDEOJUEGOS</h1>" +
        "<div class='center'>🧾 Cuenta del jugador</div>" +
        (
            folio
                ? "<div class='folio-ticket'>" +
                    escaparTextoTicketCuenta(folio) +
                  "</div>"
                : ""
        ) +

        "<div class='line'></div>" +

        "<div class='row'><strong>Cliente</strong><span>" +
            escaparTextoTicketCuenta(cuenta.cliente) +
        "</span></div>" +

        "<div class='row'><strong>Estación</strong><span>" +
            escaparTextoTicketCuenta(cuenta.estacion) +
        "</span></div>" +

        "<div class='row'><strong>Inicio</strong><span>" +
            escaparTextoTicketCuenta(cuenta.inicioSesion) +
        "</span></div>" +

        (
            usuario
                ? "<div class='row'><strong>Usuario</strong><span>" +
                    escaparTextoTicketCuenta(usuario) +
                  "</span></div>"
                : ""
        ) +

        "<div class='line'></div>" +

        "<div class='row'>" +
            "<span>🎮 Juego (" + minutos + " min)</span>" +
            "<span>$" + juego.toFixed(2) + "</span>" +
        "</div>" +

        (
            descuento > 0
                ? "<div class='row'>" +
                    "<strong>Descuento</strong>" +
                    "<span>-$" + descuento.toFixed(2) + "</span>" +
                  "</div>"
                : ""
        ) +

        productosHTML +

        (
            cuenta.reservaId &&
            Number(cuenta.reservaAnticipo) > 0
                ? "<div class='row'>" +
                    "<strong>Anticipo de reserva</strong>" +
                    "<span>-$" +
                    Number(cuenta.reservaAnticipo).toFixed(2) +
                    "</span>" +
                  "</div>"
                : ""
        ) +

        "<div class='line'></div>" +

        "<div class='row'>" +
            "<strong>Pago</strong>" +
            "<span>" +
                escaparTextoTicketCuenta(
                    nombreMetodoPagoTicket(metodoPago)
                ) +
            "</span>" +
        "</div>" +

        "<div class='row total'>" +
            "<span>TOTAL</span>" +
            "<span>$" + Number(total || 0).toFixed(2) + "</span>" +
        "</div>" +

        "<div class='footer'>Gracias por tu visita 🎮</div>" +

        "<div class='print'>" +
            "<button onclick='window.print()' " +
            "style='padding:12px 20px;font-size:16px;'>" +
            "🖨️ Imprimir</button>" +
        "</div>" +

        "</body></html>";
}

function imprimirTicketCuenta(cuenta, metodoPago, total, folio, usuario) {
    if (!cuenta) {
        alert("❌ No se pudo generar el ticket.");
        return;
    }

    const html = crearTicketCuentaHTML(
        cuenta,
        metodoPago,
        total,
        folio,
        usuario
    );

    // Abrimos una ventana y escribimos cuando ya existe el documento.
    // Esto evita que Brave deje about:blank completamente vacío.
    const ventana = window.open(
        "",
        "_blank",
        "width=430,height=760,resizable=yes,scrollbars=yes"
    );

    if (!ventana) {
        alert(
            "⚠️ Brave bloqueó la ventana del ticket.\n\n" +
            "Permite ventanas emergentes para esta aplicación."
        );
        return;
    }

    try {
        ventana.document.open();
        ventana.document.write(html);
        ventana.document.close();
        ventana.focus();
    } catch (error) {
        // Respaldo: cargar el ticket como Blob en la misma ventana.
        try {
            const blob = new Blob(
                [html],
                { type: "text/html;charset=utf-8" }
            );

            const url = URL.createObjectURL(blob);

            ventana.location.href = url;

            setTimeout(function() {
                URL.revokeObjectURL(url);
            }, 60000);
        } catch (error2) {
            ventana.close();
            alert(
                "❌ No se pudo abrir el ticket.\n\n" +
                "Intenta permitir ventanas emergentes en Brave."
            );
        }
    }
}

function imprimirTicketProducto(venta) {
    const ventana = window.open(
        "",
        "_blank",
        "width=420,height=700"
    );

    if (!ventana) {
        alert(
            "⚠️ El navegador bloqueó la ventana del ticket."
        );
        return;
    }

    const producto =
        escaparTextoTicket(
            venta.producto || "Producto"
        );

    const cantidad =
        Number(venta.cantidad) || 0;

    const total =
        Number(venta.precio) || 0;

    ventana.document.open();

    ventana.document.write(
        "<!doctype html>" +
        "<html><head><meta charset='utf-8'>" +
        "<title>Ticket de producto</title>" +
        "<style>" +
        "body{font-family:Arial,sans-serif;width:300px;margin:25px auto;color:#111;}" +
        "h1{text-align:center;font-size:22px;margin:0 0 6px;}" +
        ".centro{text-align:center;}" +
        ".linea{border-top:1px dashed #555;margin:14px 0;}" +
        ".fila{display:flex;justify-content:space-between;margin:8px 0;gap:12px;}" +
        ".total{font-size:20px;font-weight:bold;}" +
        ".pie{text-align:center;margin-top:20px;font-size:12px;}" +
        "@media print{button{display:none;}}" +
        "</style></head><body>" +

        "<h1>🛒 CONTROL DE VIDEOJUEGOS</h1>" +
        "<div class='centro'>Comprobante de producto</div>" +

        "<div class='linea'></div>" +

        "<div class='fila'><strong>Fecha</strong><span>" +
        obtenerFechaBonita(obtenerFecha()) +
        "</span></div>" +

        "<div class='fila'><strong>Hora</strong><span>" +
        escaparTextoTicket(venta.hora) +
        "</span></div>" +

        (
            venta.ticketFolio
                ? "<div class='fila'><strong>Folio</strong><span>" +
                    escaparTextoTicket(venta.ticketFolio) +
                  "</span></div>"
                : ""
        ) +

        (
            venta.usuario
                ? "<div class='fila'><strong>Usuario</strong><span>" +
                    escaparTextoTicket(venta.usuario) +
                  "</span></div>"
                : ""
        ) +

        "<div class='fila'><strong>Producto</strong><span>" +
        producto +
        "</span></div>" +

        "<div class='fila'><strong>Cantidad</strong><span>" +
        cantidad +
        "</span></div>" +

        "<div class='fila'><strong>Precio unitario</strong><span>$" +
        Number(venta.precioUnitario || 0) +
        "</span></div>" +

        "<div class='fila'><strong>Pago</strong><span>" +
        nombreMetodoPagoTextoPlano(venta.metodoPago) +
        "</span></div>" +

        "<div class='linea'></div>" +

        "<div class='fila total'><span>TOTAL</span><span>$" +
        total +
        "</span></div>" +

        "<div class='pie'>Gracias por tu compra 🎮</div>" +

        "<div class='centro' style='margin-top:18px;'>" +
        "<button onclick='window.print()'>🖨️ Imprimir</button>" +
        "</div>" +

        "</body></html>"
    );

    ventana.document.close();

    setTimeout(function() {
        ventana.focus();
    }, 300);
}

function crearTicketHTML(venta) {
    const cliente =
        venta.cliente || "Sin nombre";

    return (
        "<!doctype html>" +
        "<html><head><meta charset='utf-8'>" +
        "<title>Ticket - " +
        escaparTextoTicket(venta.xbox) +
        "</title>" +
        "<style>" +
        "body{font-family:Arial,sans-serif;width:300px;margin:25px auto;color:#111;}" +
        "h1{text-align:center;font-size:22px;margin:0 0 6px;}" +
        ".centro{text-align:center;}" +
        ".linea{border-top:1px dashed #555;margin:14px 0;}" +
        ".fila{display:flex;justify-content:space-between;margin:8px 0;gap:12px;}" +
        ".total{font-size:20px;font-weight:bold;}" +
        ".pie{text-align:center;margin-top:20px;font-size:12px;}" +
        "@media print{body{margin:0 auto;}button{display:none;}}" +
        "</style></head><body>" +

        "<h1>🎮 CONTROL DE VIDEOJUEGOS</h1>" +
        "<div class='centro'>Comprobante de sesión</div>" +

        "<div class='linea'></div>" +

        "<div class='fila'><strong>Fecha</strong><span>" +
        obtenerFechaBonita(obtenerFecha()) +
        "</span></div>" +

        "<div class='fila'><strong>Hora</strong><span>" +
        escaparTextoTicket(venta.hora) +
        "</span></div>" +

        (
            venta.ticketFolio
                ? "<div class='fila'><strong>Folio</strong><span>" +
                    escaparTextoTicket(venta.ticketFolio) +
                  "</span></div>"
                : ""
        ) +

        (
            venta.usuario
                ? "<div class='fila'><strong>Usuario</strong><span>" +
                    escaparTextoTicket(venta.usuario) +
                  "</span></div>"
                : ""
        ) +

        "<div class='fila'><strong>Consola</strong><span>" +
        escaparTextoTicket(venta.xbox) +
        "</span></div>" +

        "<div class='fila'><strong>Cliente</strong><span>" +
        escaparTextoTicket(cliente) +
        "</span></div>" +

        "<div class='fila'><strong>Tiempo</strong><span>" +
        escaparTextoTicket(venta.tiempo) +
        "</span></div>" +

        "<div class='fila'><strong>Pago</strong><span>" +
        nombreMetodoPagoTextoPlano(venta.metodoPago) +
        "</span></div>" +

        (
            Number(venta.descuento || 0) > 0
                ? "<div class='fila'><strong>Descuento</strong><span>-$" +
                  Number(venta.descuento) +
                  "</span></div>"
                : ""
        ) +

        "<div class='linea'></div>" +

        "<div class='fila total'><span>TOTAL</span><span>$" +
        Number(venta.precio || 0) +
        "</span></div>" +

        "<div class='pie'>" +
        "Gracias por tu visita 🎮" +
        "</div>" +

        "<div class='centro' style='margin-top:18px;'>" +
        "<button onclick='window.print()'>🖨️ Imprimir</button>" +
        "</div>" +

        "</body></html>"
    );
}

function imprimirTicket(venta) {
    const ventana = window.open(
        "",
        "_blank",
        "width=420,height=700"
    );

    if (!ventana) {
        alert(
            "⚠️ El navegador bloqueó la ventana del ticket.\n\n" +
            "Permite ventanas emergentes para este programa."
        );
        return;
    }

    ventana.document.open();
    ventana.document.write(
        crearTicketHTML(venta)
    );
    ventana.document.close();

    setTimeout(function() {
        ventana.focus();
    }, 300);
}


// ========================================
// RESPALDO Y EXPORTACION
// ========================================

function obtenerDatosCompletos() {
    return {
        _meta: {
            producto: "ControlVideojuegos",
            version: "V29.24",
            tipo: "respaldo_completo",
            fechaRespaldo: new Date().toISOString()
        },

        estaciones: estaciones,
        configuracion: configuracion,

        ventasDelDia: ventasDelDia,
        sesionesDelDia: sesionesDelDia,
        historial: historial,

        gastos: gastos,
        gastosDelDia: gastosDelDia,

        reportes: reportes,
        cierresCaja: cierresCaja,

        cajaCerrada: cajaCerrada,
        estadoCaja: estadoCaja,
        fechaCaja: fechaCaja,
        fondoCajaInicial: fondoCajaInicial,
        movimientosCaja: movimientosCaja,
        cajaAperturaUsuario: cajaAperturaUsuario,
        cajaAperturaHora: cajaAperturaHora,
        cajaCierreUsuario: cajaCierreUsuario,
        cajaCierreHora: cajaCierreHora,
        cajaUltimaReaperturaUsuario: cajaUltimaReaperturaUsuario,
        cajaUltimaReaperturaHora: cajaUltimaReaperturaHora,
        contadorTicketPro: contadorTicketPro,
        fechaContadorTicketPro: fechaContadorTicketPro,
        ventasPorMetodo: ventasPorMetodo,

        productos: productos,
        reservas: reservas,

        cuentasJugadores: cuentasJugadores,

        clientesMembresia: clientesMembresia,
        configuracionMembresia: configuracionMembresia,
        estadisticasDia: estadisticasDia,
        historialCortes: historialCortes,

        usuariosPro: usuariosPro,
        registroActividadPro: registroActividadPro,

        fecha: obtenerFecha()
    };
}

const CLAVE_HISTORIAL_RESPALDOS_PRO =
    "controlVideojuegosBackupsPro";

function obtenerHistorialRespaldosPro() {
    try {
        const guardado =
            localStorage.getItem(
                CLAVE_HISTORIAL_RESPALDOS_PRO
            );

        if (!guardado) {
            return [];
        }

        const datos =
            JSON.parse(guardado);

        return Array.isArray(datos)
            ? datos
            : [];
    } catch (error) {
        return [];
    }
}

function guardarHistorialRespaldosPro(lista) {
    try {
        localStorage.setItem(
            CLAVE_HISTORIAL_RESPALDOS_PRO,
            JSON.stringify(lista)
        );

        return true;
    } catch (error) {
        return false;
    }
}

function validarRespaldoPro(datos) {
    if (
        !datos ||
        typeof datos !== "object"
    ) {
        return {
            valido: false,
            mensaje: "El archivo no contiene un objeto válido."
        };
    }

    if (
        datos._meta &&
        datos._meta.producto &&
        datos._meta.producto !==
            "ControlVideojuegos"
    ) {
        return {
            valido: false,
            mensaje:
                "El archivo no pertenece a ControlVideojuegos."
        };
    }

    if (
        datos._meta &&
        datos._meta.tipo &&
        datos._meta.tipo !==
            "respaldo_completo"
    ) {
        return {
            valido: false,
            mensaje:
                "El archivo no es un respaldo completo."
        };
    }

    if (
        !Array.isArray(
            datos.estaciones
        )
    ) {
        return {
            valido: false,
            mensaje: "Faltan las estaciones."
        };
    }

    if (
        !datos.configuracion ||
        typeof datos.configuracion !== "object"
    ) {
        return {
            valido: false,
            mensaje: "Falta la configuración."
        };
    }

    return {
        valido: true,
        mensaje: "Respaldo válido."
    };
}

function obtenerResumenRespaldoPro(datos) {
    return {
        estaciones:
            Array.isArray(datos.estaciones)
                ? datos.estaciones.length
                : 0,

        productos:
            Array.isArray(datos.productos)
                ? datos.productos.length
                : 0,

        clientes:
            Array.isArray(datos.clientesMembresia)
                ? datos.clientesMembresia.length
                : 0,

        reservas:
            Array.isArray(datos.reservas)
                ? datos.reservas.length
                : 0,

        ventas:
            Array.isArray(datos.historial)
                ? datos.historial.length
                : 0,

        usuarios:
            Array.isArray(datos.usuariosPro)
                ? datos.usuariosPro.length
                : 0
    };
}

function crearRespaldoAutomaticoDiarioPro() {
    try {
        const hoy =
            obtenerFecha();

        const historial =
            obtenerHistorialRespaldosPro();

        const yaExiste =
            historial.some(
                function(item) {
                    return (
                        item &&
                        item.motivo ===
                            "Copia automática diaria" &&
                        item.fecha === hoy
                    );
                }
            );

        if (yaExiste) {
            return false;
        }

        const datos =
            obtenerDatosCompletos();

        const entrada = {
            id:
                "AUTO-" +
                Date.now()
                    .toString(36)
                    .toUpperCase(),

            creadoEn:
                new Date().toISOString(),

            fecha:
                hoy,

            hora:
                obtenerHora(),

            usuario:
                "Sistema",

            motivo:
                "Copia automática diaria",

            resumen:
                obtenerResumenRespaldoPro(
                    datos
                ),

            datos:
                datos
        };

        const nuevas =
            [
                entrada
            ].concat(historial);

        // Máximo de 8 copias internas para no llenar
        // el almacenamiento local del iPad.
        const limitado =
            nuevas.slice(
                0,
                8
            );

        return guardarHistorialRespaldosPro(
            limitado
        );
    } catch (error) {
        console.warn(
            "No se pudo crear la copia automática diaria:",
            error
        );
        return false;
    }
}

function crearRespaldoInternoPro(
    motivo
) {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return false;
    }

    const datos =
        obtenerDatosCompletos();

    const historial =
        obtenerHistorialRespaldosPro();

    const entrada = {
        id:
            "BKP-" +
            Date.now().toString(36).toUpperCase(),

        creadoEn:
            new Date().toISOString(),

        fecha:
            obtenerFecha(),

        hora:
            obtenerHora(),

        usuario:
            usuarioActualPro
                ? usuarioActualPro.nombre
                : "Sistema",

        motivo:
            String(
                motivo ||
                "Copia manual"
            ),

        resumen:
            obtenerResumenRespaldoPro(
                datos
            ),

        datos:
            datos
    };

    historial.unshift(
        entrada
    );

    // Conservamos las últimas 5 copias internas.
    const limitado =
        historial.slice(
            0,
            5
        );

    if (
        !guardarHistorialRespaldosPro(
            limitado
        )
    ) {
        alert(
            "⚠️ No se pudo guardar la copia interna. " +
            "El almacenamiento del navegador puede estar lleno."
        );
        return false;
    }

    registrarActividadPro(
        "Respaldo interno creado",
        String(
            motivo ||
            "Copia manual"
        ),
        "seguridad"
    );

    guardarDatos();

    return true;
}

async function compartirRespaldoPro() {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return;
    }

    const datos =
        obtenerDatosCompletos();

    const nombre =
        "ControlVideojuegos_Respaldo_" +
        obtenerFecha() +
        "_" +
        obtenerHora()
            .replace(/:/g, "") +
        ".json";

    const contenido =
        JSON.stringify(
            datos,
            null,
            2
        );

    const archivo =
        new File(
            [contenido],
            nombre,
            {
                type:
                    "application/json"
            }
        );

    try {
        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({
                files: [
                    archivo
                ]
            })
        ) {
            await navigator.share({
                title:
                    "Respaldo de ControlVideojuegos",
                text:
                    "Copia completa de los datos de ControlVideojuegos.",
                files: [
                    archivo
                ]
            });

            registrarActividadPro(
                "Respaldo compartido",
                "Copia completa enviada mediante la hoja de compartir.",
                "seguridad"
            );

            guardarDatos();

            return;
        }
    } catch (error) {
        if (
            error &&
            error.name ===
                "AbortError"
        ) {
            return;
        }
    }

    // En navegadores que no soporten compartir archivos,
    // se usa la descarga normal como respaldo.
    descargarRespaldoPro();
}

function descargarRespaldoPro() {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return;
    }

    const datos =
        obtenerDatosCompletos();

    descargarArchivo(
        "ControlVideojuegos_Respaldo_" +
        obtenerFecha() +
        "_" +
        obtenerHora().replace(
            ":",
            ""
        ) +
        ".json",
        JSON.stringify(
            datos,
            null,
            2
        ),
        "application/json"
    );

    registrarActividadPro(
        "Respaldo descargado",
        "Copia completa exportada.",
        "seguridad"
    );

    guardarDatos();

    alert(
        "💾 Respaldo descargado correctamente.\n\n" +
        "La copia contiene los datos completos del sistema."
    );
}

function restaurarRespaldoInternoPro(
    id
) {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return;
    }

    const historial =
        obtenerHistorialRespaldosPro();

    const entrada =
        historial.find(
            function(item) {
                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );
            }
        );

    if (
        !entrada ||
        !entrada.datos
    ) {
        alert(
            "❌ No encontré esa copia."
        );
        return;
    }

    const validacion =
        validarRespaldoPro(
            entrada.datos
        );

    if (
        !validacion.valido
    ) {
        alert(
            "❌ Esa copia no es válida.\n\n" +
            validacion.mensaje
        );
        return;
    }

    const resumen =
        obtenerResumenRespaldoPro(
            entrada.datos
        );

    const confirmar =
        confirm(
            "⚠️ RESTAURAR RESPALDO\n\n" +
            "Fecha: " +
            entrada.fecha +
            " " +
            entrada.hora +
            "\n" +
            "Motivo: " +
            entrada.motivo +
            "\n\n" +
            "Estaciones: " +
            resumen.estaciones +
            "\n" +
            "Productos: " +
            resumen.productos +
            "\n" +
            "Clientes: " +
            resumen.clientes +
            "\n" +
            "Ventas: " +
            resumen.ventas +
            "\n\n" +
            "Antes de restaurar se guardará una copia " +
            "de seguridad de los datos actuales.\n\n" +
            "¿Continuar?"
        );

    if (!confirmar) {
        return;
    }

    // Copia de emergencia del estado actual.
    const datosActuales =
        obtenerDatosCompletos();

    const historialActual =
        obtenerHistorialRespaldosPro();

    historialActual.unshift({
        id:
            "BKP-" +
            Date.now().toString(36).toUpperCase(),

        creadoEn:
            new Date().toISOString(),

        fecha:
            obtenerFecha(),

        hora:
            obtenerHora(),

        usuario:
            usuarioActualPro
                ? usuarioActualPro.nombre
                : "Sistema",

        motivo:
            "Copia automática antes de restaurar",

        resumen:
            obtenerResumenRespaldoPro(
                datosActuales
            ),

        datos:
            datosActuales
    });

    guardarHistorialRespaldosPro(
        historialActual.slice(
            0,
            5
        )
    );

    localStorage.setItem(
        "controlVideojuegosV6",
        JSON.stringify(
            entrada.datos
        )
    );

    alert(
        "✅ Respaldo restaurado.\n\n" +
        "El sistema se recargará."
    );

    location.reload();
}

function borrarHistorialRespaldosPro() {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return;
    }

    const confirmar =
        confirm(
            "⚠️ Esto eliminará las copias internas guardadas.\n\n" +
            "No borrará tus datos actuales.\n\n" +
            "¿Continuar?"
        );

    if (!confirmar) {
        return;
    }

    localStorage.removeItem(
        CLAVE_HISTORIAL_RESPALDOS_PRO
    );

    registrarActividadPro(
        "Historial de respaldos eliminado",
        "Se eliminaron las copias internas.",
        "seguridad"
    );

    guardarDatos();
    mostrarRespaldo();
}


function descargarArchivo(nombre, contenido, tipo) {
    const blob = new Blob(
        [contenido],
        { type: tipo }
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}

function exportarRespaldo() {
    descargarRespaldoPro();
}


function exportarVentasCSV() {
    let csv =
        "Fecha,Hora,Tipo,Estacion,Cliente,Producto,Cantidad,Tiempo,Precio original,Descuento,Precio final,Costo,Utilidad,Metodo de pago,Promocion\n";

    historial.forEach(function(venta) {
        const fila = [
            obtenerFecha(),
            venta.hora || "",
            venta.tipo || "sesion",
            venta.xbox || "",
            venta.cliente || "",
            venta.producto || "",
            venta.cantidad || "",
            venta.tiempo || "",
            venta.precioOriginal || venta.precio || 0,
            venta.descuento || 0,
            venta.precio || 0,
            venta.costoUnitario && venta.cantidad
                ? Number(venta.costoUnitario) * Number(venta.cantidad)
                : "",
            venta.utilidad || "",
            nombreMetodoPagoTextoPlano(venta.metodoPago),
            venta.promocion || ""
        ];

        csv +=
            fila.map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    descargarArchivo(
        "Ventas_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert("📄 Ventas exportadas correctamente.");
}

function exportarGastosCSV() {
    let csv =
        "Fecha,Hora,Concepto,Monto,Metodo de pago\n";

    gastos.forEach(function(gasto) {
        const fila = [
            obtenerFecha(),
            gasto.hora || "",
            gasto.concepto || "",
            gasto.monto || 0,
            nombreMetodoPagoTextoPlano(
                gasto.metodoPago || "efectivo"
            )
        ];

        csv +=
            fila.map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    descargarArchivo(
        "Gastos_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert("📄 Gastos exportados correctamente.");
}

function exportarMembresiasCSV() {
    let csv =
        "Cliente,Telefono,Nivel,Puntos,Sesiones,Minutos,Gasto\n";

    clientesMembresia.forEach(function(cliente) {
        const nivel =
            nivelMembresia(cliente.puntos);

        const fila = [
            cliente.nombre || "",
            cliente.telefono || "",
            nivel.nombre,
            cliente.puntos || 0,
            cliente.sesiones || 0,
            cliente.minutos || 0,
            cliente.gasto || 0
        ];

        csv += fila.map(function(valor) {
            return "\"" +
                String(valor)
                    .replace(/"/g, "\"\"") +
                "\"";
        }).join(",") + "\n";
    });

    descargarArchivo(
        "Membresias_" +
        obtenerFecha() +
        ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert(
        "⭐ Membresías exportadas correctamente."
    );
}

function exportarCuentasCSV() {
    let csv =
        "Cliente,Estacion,Inicio,Minutos de juego," +
        "Juego,Consumos,Total,Estado\n";

    cuentasJugadores.forEach(function(cuenta) {
        const consumos =
            cuenta.productos.reduce(
                function(total, item) {
                    return total +
                        (Number(item.precio) || 0);
                },
                0
            );

        const fila = [
            cuenta.cliente || "",
            cuenta.estacion || "",
            cuenta.inicioSesion || "",
            cuenta.game.minutos || 0,
            cuenta.game.precio || 0,
            consumos,
            obtenerTotalCuenta(cuenta),
            cuenta.estado || "abierta"
        ];

        csv += fila.map(function(valor) {
            return "\"" +
                String(valor)
                    .replace(/"/g, "\"\"") +
                "\"";
        }).join(",") + "\n";
    });

    descargarArchivo(
        "Cuentas_Abiertas_" +
        obtenerFecha() +
        ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert(
        "🧾 Cuentas abiertas exportadas."
    );
}

function exportarTarifasEstacionesCSV() {
    let csv =
        "Estacion,Tipo,Modo,30 minutos,1 hora,2 horas,3 horas\n";

    estaciones.forEach(function(estacion) {
        const precios = obtenerPreciosEstacion(estacion);

        const fila = [
            estacion.nombre || "",
            estacion.tipo || "",
            estacion.usarPreciosPersonalizados
                ? "Personalizada"
                : "General",
            precios.treintaMin,
            precios.unaHora,
            precios.dosHoras,
            precios.tresHoras
        ];

        csv += fila.map(function(valor) {
            return "\"" +
                String(valor).replace(/"/g, "\"\"") +
                "\"";
        }).join(",") + "\n";
    });

    descargarArchivo(
        "Tarifas_Estaciones_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert("💰 Tarifas de estaciones exportadas.");
}

function exportarReservasCSV() {
    let csv =
        "Cliente,Fecha,Hora,Estacion,Tipo,Duracion,Estado,Notas\n";

    reservas.forEach(function(reserva) {
        const fila = [
            reserva.cliente || "",
            reserva.fecha || "",
            reserva.hora || "",
            reserva.estacion || reserva.xbox || "",
            reserva.tipoEstacion || "Xbox",
            reserva.duracion || 0,
            reserva.estado || "",
            reserva.notas || ""
        ];

        csv +=
            fila.map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    descargarArchivo(
        "Reservas_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert(
        "📅 Reservas exportadas correctamente."
    );
}

function exportarCierresCSV() {
    let csv =
        "Fecha,Hora,Ventas,Gastos,Ganancia,Sesiones,Efectivo," +
        "Tarjeta,Transferencia,Gastos en efectivo,Efectivo esperado," +
        "Efectivo contado,Diferencia\n";

    cierresCaja.forEach(function(cierre) {
        const fila = [
            cierre.fecha || "",
            cierre.hora || "",
            cierre.ventas || 0,
            cierre.gastos || 0,
            cierre.ganancia || 0,
            cierre.sesiones || 0,
            cierre.efectivo || 0,
            cierre.tarjeta || 0,
            cierre.transferencia || 0,
            cierre.gastosEfectivo || 0,
            cierre.efectivoEsperado || 0,
            typeof cierre.efectivoContado !== "undefined"
                ? cierre.efectivoContado
                : "",
            typeof cierre.diferenciaEfectivo !== "undefined"
                ? cierre.diferenciaEfectivo
                : ""
        ];

        csv +=
            fila.map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    descargarArchivo(
        "Cierres_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert(
        "🔒 Cierres exportados correctamente."
    );
}

function exportarReporteCSV() {
    const datos =
        obtenerDatosReporte();

    let csv =
        "Categoria,Nombre,Sesiones,Unidades,Minutos,Ventas,Utilidad\n";

    datos.xbox.forEach(function(item) {
        csv +=
            [
                "Xbox",
                item[0],
                item[1].sesiones,
                "",
                item[1].minutos,
                item[1].ventas,
                ""
            ].map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    datos.productos.forEach(function(item) {
        csv +=
            [
                "Producto",
                item[0],
                "",
                item[1].unidades,
                "",
                item[1].ventas,
                item[1].utilidad
            ].map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    datos.clientes.forEach(function(cliente) {
        csv +=
            [
                "Cliente",
                cliente.nombre,
                cliente.sesiones,
                "",
                "",
                cliente.gasto,
                ""
            ].map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    descargarArchivo(
        "Reporte_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    alert("📈 Reporte exportado correctamente.");
}

function exportarInventarioCSV() {
    let csv =
        "Producto,Precio,Costo,Margen,Stock,Stock minimo,Valor costo,Valor venta,Estado,Activo\n";

    productos.forEach(function(producto) {
        const precio =
            Number(producto.precio) || 0;

        const costo =
            Number(producto.costo) || 0;

        const stock =
            Number(producto.stock) || 0;

        const minimo =
            Number(producto.stockMinimo) || 0;

        const estado =
            estadoStockInventarioPro(producto);

        const fila = [
            producto.nombre,
            precio.toFixed(2),
            costo.toFixed(2),
            (precio - costo).toFixed(2),
            stock,
            minimo,
            (stock * costo).toFixed(2),
            (stock * precio).toFixed(2),
            estado.etiqueta,
            producto.activo ? "Sí" : "No"
        ];

        csv +=
            fila.map(function(valor) {
                return "\"" +
                    String(valor)
                        .replace(/"/g, "\"\"") +
                    "\"";
            }).join(",") +
            "\n";
    });

    descargarArchivo(
        "Inventario_" + obtenerFecha() + ".csv",
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    if (movimientosInventario.length) {
        let csvMov =
            "Fecha,Hora,Tipo,Producto,Cantidad,Delta,Stock anterior,Stock nuevo,Costo unitario,Importe,Método de pago,Motivo,Ticket,Usuario\n";

        movimientosInventario.forEach(function(movimiento) {
            const fila = [
                movimiento.fecha,
                movimiento.hora,
                movimiento.tipo,
                movimiento.producto,
                movimiento.cantidad,
                movimiento.delta,
                movimiento.stockAnterior,
                movimiento.stockNuevo,
                Number(movimiento.costoUnitario || 0).toFixed(2),
                Number(movimiento.importe || 0).toFixed(2),
                movimiento.metodoPago,
                movimiento.motivo,
                movimiento.ticketFolio,
                movimiento.usuario
            ];

            csvMov +=
                fila.map(function(valor) {
                    return "\"" +
                        String(valor)
                            .replace(/"/g, "\"\"") +
                        "\"";
                }).join(",") +
                "\n";
        });

        descargarArchivo(
            "Movimientos_Inventario_" +
                obtenerFecha() +
                ".csv",
            "\ufeff" + csvMov,
            "text/csv;charset=utf-8"
        );
    }

    alert(
        "📦 Inventario exportado correctamente." +
        (
            movimientosInventario.length
                ? "\n📋 También se exportaron los movimientos."
                : ""
        )
    );
}

function importarRespaldo() {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return;
    }

    const input =
        document.createElement(
            "input"
        );

    input.type = "file";
    input.accept =
        ".json,application/json";

    input.onchange =
        function(evento) {
            const archivo =
                evento.target.files[0];

            if (!archivo) {
                return;
            }

            const lector =
                new FileReader();

            lector.onload =
                function() {
                    try {
                        const datos =
                            JSON.parse(
                                lector.result
                            );

                        const validacion =
                            validarRespaldoPro(
                                datos
                            );

                        if (
                            !validacion.valido
                        ) {
                            throw new Error(
                                validacion.mensaje
                            );
                        }

                        const resumen =
                            obtenerResumenRespaldoPro(
                                datos
                            );

                        const confirmar =
                            confirm(
                                "⚠️ IMPORTAR RESPALDO\n\n" +
                                "Archivo: " +
                                archivo.name +
                                "\n\n" +
                                "Estaciones: " +
                                resumen.estaciones +
                                "\n" +
                                "Productos: " +
                                resumen.productos +
                                "\n" +
                                "Clientes: " +
                                resumen.clientes +
                                "\n" +
                                "Ventas: " +
                                resumen.ventas +
                                "\n" +
                                "Usuarios: " +
                                resumen.usuarios +
                                "\n\n" +
                                "Se guardará automáticamente " +
                                "una copia de seguridad de los " +
                                "datos actuales antes de reemplazarlos.\n\n" +
                                "¿Continuar?"
                            );

                        if (
                            !confirmar
                        ) {
                            return;
                        }

                        // Copia de emergencia antes de importar.
                        const actuales =
                            obtenerDatosCompletos();

                        const historialActual =
                            obtenerHistorialRespaldosPro();

                        historialActual.unshift({
                            id:
                                "BKP-" +
                                Date.now()
                                    .toString(36)
                                    .toUpperCase(),

                            creadoEn:
                                new Date().toISOString(),

                            fecha:
                                obtenerFecha(),

                            hora:
                                obtenerHora(),

                            usuario:
                                usuarioActualPro
                                    ? usuarioActualPro.nombre
                                    : "Sistema",

                            motivo:
                                "Copia automática antes de importar",

                            resumen:
                                obtenerResumenRespaldoPro(
                                    actuales
                                ),

                            datos:
                                actuales
                        });

                        guardarHistorialRespaldosPro(
                            historialActual.slice(
                                0,
                                5
                            )
                        );

                        localStorage.setItem(
                            "controlVideojuegosV6",
                            JSON.stringify(
                                datos
                            )
                        );

                        alert(
                            "✅ Respaldo importado correctamente.\n\n" +
                            "El sistema se recargará."
                        );

                        location.reload();

                    } catch (error) {
                        alert(
                            "❌ No se pudo importar el respaldo.\n\n" +
                            error.message
                        );
                    }
                };

            lector.readAsText(
                archivo
            );
        };

    input.click();
}


function mostrarRespaldo() {
    if (
        !exigirPermisoPro(
            "configuracion"
        )
    ) {
        return;
    }

    vistaActual = "respaldo";

    const contenedor =
        document.getElementById(
            "estaciones"
        );

    contenedor.innerHTML = "";

    const div =
        document.createElement(
            "div"
        );

    const datos =
        obtenerDatosCompletos();

    const resumen =
        obtenerResumenRespaldoPro(
            datos
        );

    const historial =
        obtenerHistorialRespaldosPro();

    div.innerHTML =
        "<div class='v281-backup-page'>" +

            "<div class='v281-backup-hero'>" +
                "<div>" +
                    "<div class='v27-eyebrow'>💾 PROTECCIÓN DE DATOS</div>" +
                    "<h1>Centro de respaldos PRO</h1>" +
                    "<p>Protege ventas, sesiones, productos, clientes, reservas, caja, usuarios y configuración.</p>" +
                "</div>" +
                "<div class='v281-backup-icon'>💾</div>" +
            "</div>" +

            "<div class='v281-backup-stats'>" +
                "<div><span>🎮 ESTACIONES</span><strong>" +
                    resumen.estaciones +
                "</strong></div>" +
                "<div><span>🛒 PRODUCTOS</span><strong>" +
                    resumen.productos +
                "</strong></div>" +
                "<div><span>👥 CLIENTES</span><strong>" +
                    resumen.clientes +
                "</strong></div>" +
                "<div><span>📅 RESERVAS</span><strong>" +
                    resumen.reservas +
                "</strong></div>" +
                "<div><span>🧾 VENTAS</span><strong>" +
                    resumen.ventas +
                "</strong></div>" +
                "<div><span>👤 USUARIOS</span><strong>" +
                    resumen.usuarios +
                "</strong></div>" +
            "</div>" +

            "<div class='v281-backup-actions'>" +
                "<button class='v27-action-primary' onclick='compartirRespaldoPro()'>📱 Guardar en Archivos / Compartir</button>" +
                "<button onclick='descargarRespaldoPro()'>⬇️ Descargar respaldo</button>" +
                "<button onclick='crearRespaldoInternoPro(\"Copia manual\")'>💾 Crear copia interna</button>" +
                "<button onclick='importarRespaldo()'>📥 Importar respaldo</button>" +
            "</div>" +

            "<div class='v281-backup-warning'>" +
                "🛡️ <strong>Importar o restaurar no borra a ciegas:</strong> antes de reemplazar los datos se guarda una copia automática del estado actual." +
            "</div>" +

            "<div class='v281-backup-section'>" +
                "<div class='v281-backup-section-title'>" +
                    "<div><span>HISTORIAL</span><h2>Copias internas</h2></div>" +
                    (
                        historial.length
                            ? "<button onclick='borrarHistorialRespaldosPro()'>🗑️ Limpiar historial</button>"
                            : ""
                    ) +
                "</div>" +

                (
                    historial.length
                        ? "<div class='v281-backup-list'>" +
                            historial.map(
                                function(item) {
                                    const r =
                                        item.resumen ||
                                        {};

                                    return (
                                        "<article class='v281-backup-card'>" +
                                            "<div class='v281-backup-card-icon'>🗄️</div>" +
                                            "<div class='v281-backup-card-main'>" +
                                                "<strong>" +
                                                    escaparHTML(
                                                        item.motivo ||
                                                        "Copia"
                                                    ) +
                                                "</strong>" +
                                                "<span>" +
                                                    escaparHTML(
                                                        item.fecha ||
                                                        ""
                                                    ) +
                                                    " · " +
                                                    escaparHTML(
                                                        item.hora ||
                                                        ""
                                                    ) +
                                                    " · " +
                                                    escaparHTML(
                                                        item.usuario ||
                                                        "Sistema"
                                                    ) +
                                                "</span>" +
                                                "<small>" +
                                                    "🎮 " +
                                                    Number(
                                                        r.estaciones || 0
                                                    ) +
                                                    " · 🛒 " +
                                                    Number(
                                                        r.productos || 0
                                                    ) +
                                                    " · 👥 " +
                                                    Number(
                                                        r.clientes || 0
                                                    ) +
                                                    " · 🧾 " +
                                                    Number(
                                                        r.ventas || 0
                                                    ) +
                                                "</small>" +
                                            "</div>" +
                                            "<button onclick='restaurarRespaldoInternoPro(\"" +
                                                item.id +
                                            "\")'>↩️ Restaurar</button>" +
                                        "</article>"
                                    );
                                }
                            ).join("") +
                          "</div>"
                        : "<div class='v281-backup-empty'><div>🗄️</div><h2>No hay copias internas</h2><p>Crea una copia para tener un punto de restauración rápido.</p></div>"
                ) +
            "</div>" +

            "<div class='v281-backup-section'>" +
                "<div class='v281-backup-section-title'>" +
                    "<div><span>EXPORTACIONES</span><h2>Datos para análisis</h2></div>" +
                "</div>" +

                "<div class='v281-export-grid'>" +
                    "<button onclick='exportarVentasCSV()'>📊 Ventas CSV</button>" +
                    "<button onclick='exportarGastosCSV()'>💸 Gastos CSV</button>" +
                    "<button onclick='exportarInventarioCSV()'>📦 Inventario CSV</button>" +
                    "<button onclick='exportarReporteCSV()'>📈 Reporte CSV</button>" +
                    "<button onclick='exportarCierresCSV()'>🔒 Cierres CSV</button>" +
                    "<button onclick='exportarReservasCSV()'>📅 Reservas CSV</button>" +
                    "<button onclick='exportarTarifasEstacionesCSV()'>💰 Tarifas CSV</button>" +
                    "<button onclick='exportarCuentasCSV()'>🧾 Cuentas CSV</button>" +
                    "<button onclick='exportarMembresiasCSV()'>⭐ Membresías CSV</button>" +
                "</div>" +
            "</div>" +

            "<div class='v281-backup-footer'>" +
                "💡 En iPad usa <strong>Guardar en Archivos / Compartir</strong> para conservar una copia fuera de la aplicación." +
                "<br><br>" +
                "🛡️ El sistema crea automáticamente una copia interna diaria al abrirse." +
            "</div>" +

            "<div class='v27-page-actions'>" +
                "<button onclick='volverInicio()'>🏠 Inicio</button>" +
            "</div>" +

        "</div>";

    contenedor.appendChild(
        div
    );
}


function mostrarConfiguracion() {
    if (!exigirPermisoPro("configuracion")) {
        return;
    }

    vistaActual = "configuracion";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    const habilitadas =
        obtenerEstacionesDisponibles().length;

    const tarifas =
        obtenerTarifasConfiguracion();

    let tarifasHtml =
        tarifas.map(function(tarifa, indice) {
            return (
                "<div style='" +
                    "display:grid;" +
                    "grid-template-columns:1fr 1fr auto;" +
                    "gap:10px;" +
                    "align-items:end;" +
                    "margin:10px 0;" +
                    "padding:14px;" +
                    "border-radius:14px;" +
                    "background:rgba(255,255,255,.05);" +
                "'>" +

                "<label>" +
                    "⏱️ Tiempo" +
                    "<input id='tarifaMin_" +
                    indice +
                    "' type='number' min='1' max='1440' step='1' value='" +
                    Number(tarifa.minutos) +
                    "' style='width:100%;'>" +
                "</label>" +

                "<label>" +
                    "💰 Precio" +
                    "<input id='tarifaPrecio_" +
                    indice +
                    "' type='number' min='0' step='0.01' value='" +
                    Number(tarifa.precio).toFixed(2) +
                    "' style='width:100%;'>" +
                "</label>" +

                (
                    tarifas.length > 1
                        ? "<button onclick='eliminarTarifaConfiguracion(" +
                          indice +
                          ")'>🗑️</button>"
                        : "<span></span>"
                ) +

                "<small style='grid-column:1/-1;opacity:.7;'>" +
                    "Se mostrará como " +
                    formatearDuracionTarifa(
                        tarifa.minutos
                    ) +
                "</small>" +

                "</div>"
            );
        }).join("");

    div.innerHTML =
        "<h1>⚙️ Configuración</h1>" +
        "<hr>" +

        "<h2>🎮 Estaciones</h2>" +
        "<p>Actualmente tienes <strong>" +
        estaciones.length +
        "</strong> estaciones configuradas y <strong>" +
        habilitadas +
        "</strong> habilitadas.</p>" +

        "<button onclick='mostrarAdministrarEstaciones()'>" +
        "🎮 Administrar estaciones" +
        "</button>" +

        "<p style='opacity:.75;'>" +
        "Aquí puedes agregar Xbox, PC u otros equipos." +
        "</p>" +

        "<hr>" +

        "<h2>💰 Tarifas de juego</h2>" +
        "<p style='opacity:.8;'>" +
        "Ahora puedes cambiar tanto el tiempo como el precio. " +
        "Las estaciones que usan tarifa general tomarán estos valores automáticamente." +
        "</p>" +

        "<div id='listaTarifasConfiguracion'>" +
            tarifasHtml +
        "</div>" +

        (
            tarifas.length < 8
                ? "<button onclick='agregarTarifaConfiguracion()'>" +
                  "➕ Agregar tarifa" +
                  "</button>"
                : "<p style='opacity:.7;'>Máximo de 8 tarifas.</p>"
        ) +

        "<p style='opacity:.7;font-size:13px;'>" +
        "Puedes usar desde 1 minuto hasta 24 horas. " +
        "No se permiten dos tarifas con el mismo tiempo." +
        "</p>" +

        "<hr>" +

        "<h2>🔔 Aviso de tiempo</h2>" +

        "<p><label>Avisar cuando falten (minutos): </label>" +
        "<input id='avisoMinutos' type='number' min='1' max='60' value='" +
        configuracion.avisoMinutos +
        "'></p>" +

        "<hr>" +

        "<h2>🎟️ Promoción de clientes frecuentes</h2>" +

        "<p><label>Descuento (%): </label>" +
        "<input id='descuentoFrecuente' type='number' min='0' max='100' value='" +
        configuracion.promociones.descuentoClienteFrecuente +
        "'></p>" +

        "<p><label>Sesiones necesarias: </label>" +
        "<input id='sesionesDescuento' type='number' min='1' max='100' value='" +
        configuracion.promociones.sesionesParaDescuento +
        "'></p>" +

        "<p style='opacity:.75;'>" +
        "El descuento se aplica automáticamente al cliente cuando alcanza el número de sesiones configurado." +
        "</p>" +

        "<br>" +

        "<button onclick='guardarConfiguracion()'>" +
        "💾 Guardar cambios" +
        "</button>" +

        "<button onclick='volverInicio()'>" +
        "⬅ Volver" +
        "</button>";

    contenedor.appendChild(div);
}

function agregarTarifaConfiguracion() {
    const tarifas =
        obtenerTarifasConfiguracion();

    if (tarifas.length >= 8) {
        alert("⚠️ Ya tienes el máximo de 8 tarifas.");
        return;
    }

    const ultima =
        tarifas[tarifas.length - 1];

    const siguienteMinutos =
        ultima
            ? Math.min(
                1440,
                Number(ultima.minutos) + 30
            )
            : 30;

    const siguientePrecio =
        ultima
            ? Number(ultima.precio) || 0
            : 0;

    tarifas.push({
        id:
            "T" +
            (tarifas.length + 1),
        minutos:
            siguienteMinutos,
        precio:
            siguientePrecio
    });

    tarifas.sort(function(a, b) {
        return a.minutos - b.minutos;
    });

    mostrarConfiguracion();
}

function eliminarTarifaConfiguracion(indice) {
    const tarifas =
        obtenerTarifasConfiguracion();

    if (tarifas.length <= 1) {
        alert(
            "⚠️ Debe quedar al menos una tarifa."
        );
        return;
    }

    const tarifa =
        tarifas[indice];

    if (!tarifa) {
        return;
    }

    if (
        !confirm(
            "¿Eliminar la tarifa de " +
            formatearDuracionTarifa(
                tarifa.minutos
            ) +
            "?"
        )
    ) {
        return;
    }

    tarifas.splice(indice, 1);

    configuracion.tarifas =
        normalizarListaTarifasPro(
            tarifas
        );

    mostrarConfiguracion();
}

function guardarConfiguracion() {
    const tarifas =
        obtenerTarifasConfiguracion();

    const tarifasNuevas = [];

    for (
        let indice = 0;
        indice < tarifas.length;
        indice++
    ) {
        const minutos =
            Math.floor(
                Number(
                    document.getElementById(
                        "tarifaMin_" +
                        indice
                    ).value
                )
            );

        const precio =
            Number(
                document.getElementById(
                    "tarifaPrecio_" +
                    indice
                ).value
            );

        if (
            !Number.isInteger(minutos) ||
            minutos < 1 ||
            minutos > 1440 ||
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            alert(
                "❌ Revisa las tarifas. " +
                "El tiempo debe estar entre 1 y 1440 minutos y el precio no puede ser negativo."
            );
            return;
        }

        if (
            tarifasNuevas.some(function(item) {
                return item.minutos === minutos;
            })
        ) {
            alert(
                "❌ No puede haber dos tarifas con el mismo tiempo."
            );
            return;
        }

        tarifasNuevas.push({
            id:
                "T" +
                (indice + 1),
            minutos: minutos,
            precio:
                Math.round(
                    precio * 100
                ) / 100
        });
    }

    const avisoMinutos =
        Number(
            document.getElementById(
                "avisoMinutos"
            ).value
        );

    const descuentoFrecuente =
        Number(
            document.getElementById(
                "descuentoFrecuente"
            ).value
        );

    const sesionesDescuento =
        Number(
            document.getElementById(
                "sesionesDescuento"
            ).value
        );

    if (
        !Number.isInteger(avisoMinutos) ||
        avisoMinutos < 1 ||
        avisoMinutos > 60 ||
        !Number.isFinite(
            descuentoFrecuente
        ) ||
        descuentoFrecuente < 0 ||
        descuentoFrecuente > 100 ||
        !Number.isInteger(
            sesionesDescuento
        ) ||
        sesionesDescuento < 1 ||
        sesionesDescuento > 100
    ) {
        alert(
            "❌ Revisa aviso y promoción."
        );
        return;
    }

    tarifasNuevas.sort(function(a, b) {
        return a.minutos - b.minutos;
    });

    configuracion.tarifas =
        normalizarListaTarifasPro(
            tarifasNuevas
        );

    sincronizarPreciosCompatibilidadPro();

    configuracion.avisoMinutos =
        avisoMinutos;

    configuracion.promociones = {
        descuentoClienteFrecuente:
            descuentoFrecuente,
        sesionesParaDescuento:
            sesionesDescuento
    };

    guardarDatos();

    alert(
        "✅ Tarifas y configuración guardadas."
    );

    volverInicio();
}


// ========================================
// HISTORIAL
// ========================================

function mostrarHistorial() {
    if (!exigirPermisoPro("reportes")) {
        return;
    }

    vistaActual = "historial";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div = document.createElement("div");

    let texto =
        "<h1>📋 Historial de hoy</h1>";

    if (historial.length === 0) {
        texto += "<p>No hay ventas todavía.</p>";
    }

    historial.slice().reverse().forEach(function(venta) {
        if (venta.tipo === "producto") {
            texto +=
                "<div style='margin-bottom:12px;'>" +
                "<p style='margin:4px 0;'>" +
                "🧾 " +
                escaparHTML(
                    venta.ticketFolio ||
                    "Sin folio"
                ) +
                " | 🕐 " + venta.hora +
                " | 🛒 " +
                escaparHTML(venta.producto) +
                " x" + venta.cantidad +
                " | 💰 $" + venta.precio +
                " | " +
                nombreMetodoPago(venta.metodoPago) +
                "</p>" +

                "<button onclick='imprimirTicketProducto(" +
                JSON.stringify(venta).replace(/'/g, "\\'") +
")'>🧾 Ticket</button>" +
                (
                    venta.ticketFolio
                        ? "<button onclick='imprimirTicketPorFolio(\"" +
                          venta.ticketFolio +
                          "\")'>🖨️ Reimprimir folio</button>"
                        : ""
                ) +

                "</div>";
        } else {
            texto +=
                "<div style='margin-bottom:12px;'>" +
                "<p style='margin:4px 0;'>" +
                "🧾 " +
                escaparHTML(
                    venta.ticketFolio ||
                    "Sin folio"
                ) +
                " | 🕐 " + venta.hora +
                " | 🎮 " + venta.xbox +
                " | 👤 " +
                escaparHTML(
                    venta.cliente ||
                    "Sin nombre"
                ) +
                " | ⏱️ " + venta.tiempo +
                " | 💰 $" + venta.precio +
                " | " +
                nombreMetodoPago(venta.metodoPago) +
                "</p>" +

                (
                    Number(venta.descuento || 0) > 0
                        ? "<p style='color:#16a34a;font-weight:bold;margin:4px 0;'>" +
                          "🎟️ " +
                          escaparHTML(
                              venta.promocion ||
                              "Descuento"
                          ) +
                          " · Ahorro $" +
                          Number(venta.descuento) +
                          "</p>"
                        : ""
                ) +

                "<button onclick='imprimirTicket(" +
                JSON.stringify(venta).replace(/'/g, "\\'") +
")'>🧾 Ticket</button>" +
                (
                    venta.ticketFolio
                        ? "<button onclick='imprimirTicketPorFolio(\"" +
                          venta.ticketFolio +
                          "\")'>🖨️ Reimprimir folio</button>"
                        : ""
                ) +

                "</div>";
        }
    });

    const inventarioHoy =
        obtenerResumenInventarioHoy();

    texto +=
        "<hr>" +
        "<h3>Total de ventas: $" +
        ventasDelDia +
        "</h3>" +

        "<p>🛒 Productos vendidos: " +
        inventarioHoy.unidades +
        " unidades · $" +
        inventarioHoy.ingresos +
        "</p>" +

        "<button onclick='volverInicio()'>⬅ Volver</button>";

    div.innerHTML = texto;

    contenedor.appendChild(div);
}


// ========================================
// GASTOS / REPORTES
// ========================================

function mostrarGastos() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    vistaActual = "gastos";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    div.className =
        "v27-cash-page";

    let html =
        "<div class='v27-cash-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>💸 CONTROL DE EGRESOS</div>" +
                "<h1>Gastos de hoy</h1>" +
                "<p>Registra y revisa todo lo que salió durante la jornada.</p>" +
            "</div>" +
            "<div class='v27-cash-hero-icon'>💸</div>" +
        "</div>" +

        "<div class='v27-cash-actions'>" +
            "<button class='v27-action-primary' onclick='agregarGasto()'>➕ Registrar gasto</button>" +
            "<button onclick='mostrarCaja()'>💵 Caja</button>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
        "</div>" +

        "<section class='v282-cash-pro'>" +
            "<div class='v282-cash-pro-head'>" +
                "<div>" +
                    "<span>CAJA PRO</span>" +
                    "<h2>🛡️ Control de jornada</h2>" +
                "</div>" +
                "<div class='v282-cash-pro-status'>" +
                    (
                        estadoCaja === "abierta"
                            ? "🟢 OPERATIVA"
                            : estadoCaja === "cerrada"
                                ? "🔴 CERRADA"
                                : "🟡 PENDIENTE"
                    ) +
                "</div>" +
            "</div>" +
            "<div class='v282-cash-pro-grid'>" +
                "<div><span>👤 APERTURA</span><strong>" +
                    escaparHTML(
                        cajaAperturaUsuario || "—"
                    ) +
                "</strong><small>" +
                    escaparHTML(
                        cajaAperturaHora || "Sin abrir"
                    ) +
                "</small></div>" +
                "<div><span>🔒 CIERRE</span><strong>" +
                    escaparHTML(
                        cajaCierreUsuario || "—"
                    ) +
                "</strong><small>" +
                    escaparHTML(
                        cajaCierreHora || "Pendiente"
                    ) +
                "</small></div>" +
                "<div><span>💳 NO EFECTIVO</span><strong>" +
                    dinero(
                        (Number(ventasPorMetodo.tarjeta) || 0) +
                        (Number(ventasPorMetodo.transferencia) || 0)
                    ) +
                "</strong><small>Tarjeta + transferencia</small></div>" +
                "<div><span>💵 EFECTIVO</span><strong>" +
                    dinero(
                        obtenerEfectivoEsperado()
                    ) +
                "</strong><small>Esperado físicamente</small></div>" +
            "</div>" +
            (
                cajaUltimaReaperturaUsuario
                    ? "<div class='v282-reopen-note'>🔓 Última reapertura: <strong>" +
                      escaparHTML(
                          cajaUltimaReaperturaUsuario
                      ) +
                      "</strong> · " +
                      escaparHTML(
                          cajaUltimaReaperturaHora
                      ) +
                      "</div>"
                    : ""
            ) +
        "</section>" +

        "<div class='v27-cash-summary'>";
            "<div class='v27-cash-total-card'>" +
                "<span>💸 TOTAL DE GASTOS</span>" +
                "<strong>" + dinero(gastosDelDia) + "</strong>" +
                "<small>" + gastos.length + " movimientos</small>" +
            "</div>" +
            "<div><span>💵 EFECTIVO</span><strong>" + dinero(obtenerGastosEnEfectivo()) + "</strong><small>salió de caja</small></div>" +
            "<div><span>💳 TARJETA</span><strong>" +
                dinero(gastos.filter(function(g) { return (g.metodoPago || "efectivo") === "tarjeta"; }).reduce(function(t,g){ return t + (Number(g.monto)||0); },0)) +
            "</strong><small>pagado con tarjeta</small></div>" +
            "<div><span>📱 TRANSFERENCIA</span><strong>" +
                dinero(gastos.filter(function(g) { return (g.metodoPago || "efectivo") === "transferencia"; }).reduce(function(t,g){ return t + (Number(g.monto)||0); },0)) +
            "</strong><small>pagado por transferencia</small></div>" +
        "</div>" +

        "<section class='v27-cash-panel'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>MOVIMIENTOS</span><h2>📋 Gastos registrados</h2></div>" +
                "<small>" + gastos.length + " hoy</small>" +
            "</div>";

    if (gastos.length === 0) {
        html +=
            "<div class='v27-empty-state'>" +
                "<div class='v27-empty-icon'>💸</div>" +
                "<h2>No hay gastos registrados</h2>" +
                "<p>Cuando registres un gasto aparecerá aquí.</p>" +
            "</div>";
    } else {
        html += "<div class='v27-cash-movements'>";

        gastos.slice().reverse().forEach(function(gasto) {
            html +=
                "<div class='v27-cash-movement'>" +
                    "<div class='v27-cash-movement-icon out'>💸</div>" +
                    "<div class='v27-cash-movement-info'>" +
                        "<strong>" + escaparHTML(gasto.concepto) + "</strong>" +
                        "<span>" + gasto.hora + " · " +
                            nombreMetodoPago(gasto.metodoPago || "efectivo") +
                        "</span>" +
                    "</div>" +
                    "<strong class='v27-cash-movement-amount out'>−" +
                        dinero(gasto.monto) +
                    "</strong>" +
                "</div>";
        });

        html += "</div>";
    }

    html +=
        "</section>" +
        "<div class='v27-cash-bottom'>" +
            "<button onclick='mostrarCaja()'>⬅ Volver a caja</button>" +
        "</div>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function mostrarReportes() {
    vistaActual = "reportes";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const hoy = calcularPeriodo("hoy");
    const semana = calcularPeriodo("semana");
    const mes = calcularPeriodo("mes");

    const div = document.createElement("div");

    let texto =
        "<h1>📊 Reportes</h1>" +

        "<hr>" +
        "<h2>📅 HOY</h2>" +
        "<p>💰 Ingresos: $" + hoy.ingresos + "</p>" +
        "<p>💸 Gastos: $" + hoy.gastos + "</p>" +
        "<p>🟢 Ganancia: $" + hoy.ganancia + "</p>" +
        "<p>🎮 Sesiones: " + hoy.sesiones + "</p>" +

        "<h3>💵 Efectivo: $" +
        ventasPorMetodo.efectivo +
        "</h3>" +

        "<h3>💳 Tarjeta: $" +
        ventasPorMetodo.tarjeta +
        "</h3>" +

        "<h3>📱 Transferencia: $" +
        ventasPorMetodo.transferencia +
        "</h3>" +

        "<hr>" +
        "<h2>📅 ESTA SEMANA</h2>" +
        "<p>💰 Ingresos: $" + semana.ingresos + "</p>" +
        "<p>💸 Gastos: $" + semana.gastos + "</p>" +
        "<p>🟢 Ganancia: $" + semana.ganancia + "</p>" +
        "<p>🎮 Sesiones: " + semana.sesiones + "</p>" +

        "<hr>" +
        "<h2>🗓️ ESTE MES</h2>" +
        "<p>💰 Ingresos: $" + mes.ingresos + "</p>" +
        "<p>💸 Gastos: $" + mes.gastos + "</p>" +
        "<p>🟢 Ganancia: $" + mes.ganancia + "</p>" +
        "<p>🎮 Sesiones: " + mes.sesiones + "</p>" +

        "<hr>" +
        "<h2>📋 DÍAS ANTERIORES</h2>";

    if (reportes.length === 0) {
        texto +=
            "<p>Todavía no hay días anteriores.</p>";
    }

    reportes.slice().reverse().forEach(function(reporte) {
        texto +=
            "<p>" +
            "📅 " + reporte.fecha +
            " | 💰 $" + reporte.ingresos +
            " | 💸 $" + reporte.gastos +
            " | 🟢 $" + reporte.ganancia +
            " | 🎮 " + reporte.sesiones +
            "</p>";
    });

    texto +=
        "<br>" +
        "<button onclick='volverInicio()'>⬅ Volver</button>";

    div.innerHTML = texto;

    contenedor.appendChild(div);
}


// ========================================
// NUEVO DIA / NUEVA JORNADA
// ========================================

function nuevoDia() {
    if (estadoCaja !== "cerrada") {
        if (estadoCaja === "pendiente") {
            abrirCaja();
        }
        return;
    }

    if (cuentasJugadores.length > 0) {
        alert(
            "⚠️ Primero debes cobrar o cancelar todas las cuentas abiertas."
        );
        return;
    }

    const hoy = obtenerFecha();

    const confirmacion = confirm(
        "🌅 Iniciar una nueva jornada\n\n" +
        "La caja anterior ya está guardada.\n" +
        "Las ventas y gastos actuales se pondrán en cero " +
        "para comenzar una nueva jornada.\n\n" +
        "¿Quieres continuar?"
    );

    if (!confirmacion) {
        return;
    }

    // Si se usa manualmente el mismo día,
    // la caja anterior ya está en cierresCaja.
    // Esto permite probar la función sin esperar a medianoche.
    ventasDelDia = 0;
    sesionesDelDia = 0;
    historial = [];
    gastos = [];
    gastosDelDia = 0;

    fondoCajaInicial = 0;
    movimientosCaja = [];

    ventasPorMetodo = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0
    };

    cajaCerrada = false;
    estadoCaja = "abierta";
    fechaCaja = hoy;

    estaciones.forEach(function(estacion) {
        estacion.segundos = 0;
        estacion.activo = false;
        estacion.finalizaEn = null;
        estacion.terminado = false;
        estacion.pausada = false;
        estacion.cliente = "";
        estacion.precioSesion = 0;
        estacion.metodoPagoSesion = "";
        estacion.duracionTotalSegundos = 0;
        estacion.inicioSesion = null;
        estacion.avisoMostrado = false;
    });

    guardarDatos();

    alert(
        "🌅 Nueva jornada iniciada.\n\n" +
        "🔓 Caja abierta.\n" +
        "Ya puedes registrar ventas."
    );

    mostrarEstaciones();
}


// ========================================
// ABRIR CAJA
// ========================================

function abrirCaja() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    if (estadoCaja === "abierta") {
        alert("🟢 La caja de hoy ya está abierta.");
        mostrarCaja();
        return;
    }

    if (estadoCaja === "cerrada") {
        alert(
            "🔒 La caja de hoy ya fue cerrada.\n\n" +
            "Si fue por error, usa 'Reabrir caja'.\n" +
            "Si quieres iniciar otra jornada, usa 'Nuevo día'."
        );
        return;
    }

    const textoFondo = prompt(
        "💵 FONDO INICIAL DE CAJA\n\n" +
        "¿Cuánto efectivo de cambio vas a dejar " +
        "al comenzar la jornada?\n\n" +
        "Puedes escribir 0 si no hay fondo inicial."
    );

    if (textoFondo === null) {
        return;
    }

    const fondo = Number(textoFondo);

    if (
        !isFinite(fondo) ||
        fondo < 0
    ) {
        alert("❌ Escribe una cantidad válida.");
        return;
    }

    fondoCajaInicial = fondo;
    movimientosCaja = [];

    cajaAperturaUsuario =
        usuarioActualPro
            ? usuarioActualPro.nombre
            : "Usuario actual";

    cajaAperturaHora =
        obtenerHora();

    cajaCierreUsuario = "";
    cajaCierreHora = "";
    cajaUltimaReaperturaUsuario = "";
    cajaUltimaReaperturaHora = "";

    cajaCerrada = false;
    estadoCaja = "abierta";
    fechaCaja = obtenerFecha();

    registrarActividadPro(
        "Caja abierta",
        "Fondo inicial: " +
        dinero(fondoCajaInicial),
        "caja"
    );

    guardarDatos();

    alert(
        "🔓 Caja abierta.\n\n" +
        "Fondo inicial: $" +
        fondoCajaInicial.toFixed(2) +
        "\n\nYa puedes comenzar a registrar ventas."
    );

    mostrarCaja();
}


// ========================================
// REABRIR CAJA
// ========================================

function reabrirCaja() {
    if (estadoCaja !== "cerrada") {
        return;
    }

    const confirmar = confirm(
        "⚠️ La caja de hoy está cerrada.\n\n" +
        "¿La cerraste por error y quieres volver a registrar ventas?"
    );

    if (!confirmar) {
        return;
    }

    cajaCerrada = false;
    estadoCaja = "abierta";
    fechaCaja = obtenerFecha();

    cajaUltimaReaperturaUsuario =
        usuarioActualPro
            ? usuarioActualPro.nombre
            : "Usuario actual";

    cajaUltimaReaperturaHora =
        obtenerHora();

    registrarActividadPro(
        "Caja reabierta",
        "La caja volvió a estar disponible.",
        "caja"
    );

    guardarDatos();

    alert(
        "🔓 Caja reabierta. Ya puedes registrar nuevas ventas."
    );

    mostrarEstaciones();
}


// ========================================
// CIERRE DE CAJA
// ========================================

function registrarMovimientoCaja() {
    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    const tipoTexto = prompt(
        "💼 MOVIMIENTO DE CAJA\n\n" +
        "1 = ➕ Entrada de efectivo\n" +
        "2 = ➖ Salida de efectivo"
    );

    if (tipoTexto === null) {
        return;
    }

    const tipo =
        String(tipoTexto).trim() === "2"
            ? "salida"
            : String(tipoTexto).trim() === "1"
                ? "entrada"
                : "";

    if (!tipo) {
        alert("Selecciona 1 o 2.");
        return;
    }

    const concepto = prompt(
        tipo === "entrada"
            ? "¿De dónde viene el efectivo?\n\nEjemplo: cambio adicional, devolución, préstamo de caja"
            : "¿Para qué salió el efectivo?\n\nEjemplo: compra de hielo, mandado, retiro"
    );

    if (!concepto) {
        return;
    }

    const monto = Number(
        prompt("¿Cuánto efectivo?") || 0
    );

    if (
        !isFinite(monto) ||
        monto <= 0
    ) {
        alert("❌ Escribe una cantidad válida.");
        return;
    }

    movimientosCaja.push({
        fecha: obtenerFecha(),
        hora: obtenerHora(),
        tipo: tipo,
        concepto: concepto.trim(),
        monto: monto,
        usuario:
            usuarioActualPro
                ? usuarioActualPro.nombre
                : "Usuario actual"
    });

    guardarDatos();
    mostrarCaja();
}

function eliminarMovimientoCaja(indice) {
    if (estadoCaja !== "abierta") {
        return;
    }

    const movimiento =
        movimientosCaja[indice];

    if (!movimiento) {
        return;
    }

    const confirmar = confirm(
        "🗑️ Eliminar movimiento\n\n" +
        movimiento.concepto +
        "\n" +
        (movimiento.tipo === "entrada"
            ? "Entrada: +$"
            : "Salida: -$") +
        Number(movimiento.monto).toFixed(2) +
        "\n\n¿Continuar?"
    );

    if (!confirmar) {
        return;
    }

    movimientosCaja.splice(indice, 1);

    registrarActividadPro(
        "Movimiento de caja eliminado",
        movimiento.concepto,
        "caja"
    );

    guardarDatos();
    mostrarCaja();
}


function obtenerDenominacionesCajaPro() {
    return [
        { valor: 1000, etiqueta: "$1,000" },
        { valor: 500, etiqueta: "$500" },
        { valor: 200, etiqueta: "$200" },
        { valor: 100, etiqueta: "$100" },
        { valor: 50, etiqueta: "$50" },
        { valor: 20, etiqueta: "$20" },
        { valor: 10, etiqueta: "$10" },
        { valor: 5, etiqueta: "$5" },
        { valor: 2, etiqueta: "$2" },
        { valor: 1, etiqueta: "$1" },
        { valor: 0.5, etiqueta: "$0.50" }
    ];
}

function calcularArqueoDenominacionesPro() {
    const denominaciones =
        obtenerDenominacionesCajaPro();

    let total = 0;
    let piezas = 0;

    denominaciones.forEach(
        function(denominacion) {
            const campo =
                document.getElementById(
                    "v282-den-" +
                    String(
                        denominacion.valor
                    ).replace(".", "_")
                );

            const cantidad =
                campo
                    ? Math.max(
                        0,
                        Number(
                            campo.value
                        ) || 0
                    )
                    : 0;

            total +=
                cantidad *
                denominacion.valor;

            piezas += cantidad;
        }
    );

    const esperado =
        obtenerEfectivoEsperado();

    const diferencia =
        total - esperado;

    const resultado =
        document.getElementById(
            "v282-arqueo-resultado"
        );

    if (!resultado) {
        return;
    }

    let estado =
        "🟢 Caja cuadrada";

    if (diferencia > 0) {
        estado =
            "🔵 Sobrante de " +
            dinero(diferencia);
    } else if (diferencia < 0) {
        estado =
            "🔴 Faltante de " +
            dinero(
                Math.abs(diferencia)
            );
    }

    resultado.innerHTML =
        "<div class='v282-count-total'>" +
            "<span>EFECTIVO CONTADO</span>" +
            "<strong>" +
                dinero(total) +
            "</strong>" +
            "<small>" +
                piezas +
                " piezas · Esperado " +
                dinero(esperado) +
            "</small>" +
        "</div>" +
        "<div class='v282-count-difference'>" +
            estado +
        "</div>";
}

function limpiarArqueoDenominacionesPro() {
    obtenerDenominacionesCajaPro()
        .forEach(
            function(denominacion) {
                const campo =
                    document.getElementById(
                        "v282-den-" +
                        String(
                            denominacion.valor
                        ).replace(".", "_")
                    );

                if (campo) {
                    campo.value = "";
                }
            }
        );

    const resultado =
        document.getElementById(
            "v282-arqueo-resultado"
        );

    if (resultado) {
        resultado.innerHTML =
            "<div class='v282-count-empty'>" +
                "Escribe las cantidades y pulsa calcular." +
            "</div>";
    }
}

function mostrarCaja() {
    vistaActual = "caja";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    div.className =
        "v27-cash-page";

    const efectivoEsperado =
        obtenerEfectivoEsperado();

    const entradas =
        obtenerEntradasCaja();

    const salidas =
        obtenerSalidasCaja();

    const gastosEfectivo =
        obtenerGastosEnEfectivo();

    const estadoTexto =
        estadoCaja === "abierta"
            ? "🟢 CAJA ABIERTA"
            : estadoCaja === "cerrada"
                ? "🔴 CAJA CERRADA"
                : "🟡 CAJA PENDIENTE";

    let html =
        "<div class='v27-cash-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>💵 CONTROL FINANCIERO</div>" +
                "<h1>Caja y cortes</h1>" +
                "<p>" +
                    obtenerFechaBonita(obtenerFecha()) +
                    " · Controla efectivo, gastos y cierre diario." +
                "</p>" +
            "</div>" +
            "<div class='v27-cash-state'>" +
                estadoTexto +
            "</div>" +
        "</div>" +

        "<div class='v27-cash-actions'>";

    if (estadoCaja === "pendiente") {
        html +=
            "<button class='v27-action-primary' onclick='abrirCaja()'>🔓 Abrir caja</button>";
    }

    if (estadoCaja === "abierta") {
        html +=
            "<button class='v27-action-primary' onclick='registrarMovimientoCaja()'>💼 Movimiento de caja</button>" +
            "<button onclick='mostrarCierreCaja()'>🔒 Preparar cierre</button>";
    }

    if (estadoCaja === "cerrada") {
        html +=
            "<button onclick='reabrirCaja()'>🔓 Reabrir caja</button>";
    }

    html +=
            "<button onclick='agregarGasto()'>💸 Registrar gasto</button>" +
            "<button onclick='mostrarGastos()'>📋 Ver gastos</button>" +
            "<button onclick='mostrarHistorialCierres()'>📚 Historial de cierres</button>" +
            "<button onclick='mostrarDashboard()'>📊 Dashboard</button>" +
        "</div>" +

        "<div class='v27-cash-summary'>" +
            "<div class='v27-cash-total-card'>" +
                "<span>💵 EFECTIVO ESPERADO</span>" +
                "<strong>" + dinero(efectivoEsperado) + "</strong>" +
                "<small>Lo que debería haber físicamente en caja</small>" +
            "</div>" +
            "<div><span>💰 VENTAS</span><strong>" + dinero(ventasDelDia) + "</strong><small>hoy</small></div>" +
            "<div><span>💸 GASTOS</span><strong>" + dinero(gastosDelDia) + "</strong><small>registrados</small></div>" +
            "<div><span>🟢 GANANCIA</span><strong>" + dinero(calcularGanancia()) + "</strong><small>ventas − gastos</small></div>" +
        "</div>" +

        "<div class='v27-cash-grid'>" +

            "<section class='v27-cash-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>EFECTIVO</span><h2>🧮 Composición de caja</h2></div>" +
                "</div>" +
                "<div class='v27-cash-line'><span>Fondo inicial</span><strong>" + dinero(fondoCajaInicial) + "</strong></div>" +
                "<div class='v27-cash-line'><span>Ventas en efectivo</span><strong>+" + dinero(ventasPorMetodo.efectivo) + "</strong></div>" +
                "<div class='v27-cash-line'><span>Gastos en efectivo</span><strong>−" + dinero(gastosEfectivo) + "</strong></div>" +
                "<div class='v27-cash-line'><span>Entradas manuales</span><strong>+" + dinero(entradas) + "</strong></div>" +
                "<div class='v27-cash-line'><span>Salidas manuales</span><strong>−" + dinero(salidas) + "</strong></div>" +
                "<div class='v27-cash-total-line'><span>EFECTIVO ESPERADO</span><strong>" + dinero(efectivoEsperado) + "</strong></div>" +
            "</section>" +

            "<section class='v27-cash-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>VENTAS</span><h2>💳 Métodos de pago</h2></div>" +
                "</div>" +
                "<div class='v27-payment-big'><span>💵 Efectivo</span><strong>" + dinero(ventasPorMetodo.efectivo) + "</strong></div>" +
                "<div class='v27-payment-big'><span>💳 Tarjeta</span><strong>" + dinero(ventasPorMetodo.tarjeta) + "</strong></div>" +
                "<div class='v27-payment-big'><span>📱 Transferencia</span><strong>" + dinero(ventasPorMetodo.transferencia) + "</strong></div>" +
                "<div class='v27-payment-big v27-payment-total'><span>💰 Total</span><strong>" + dinero(ventasDelDia) + "</strong></div>" +
            "</section>" +

        "</div>" +

        "<section class='v27-cash-panel'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>ACTIVIDAD</span><h2>💼 Movimientos manuales</h2></div>" +
                "<small>" + movimientosCaja.length + " movimientos</small>" +
            "</div>";

    if (movimientosCaja.length === 0) {
        html +=
            "<div class='v27-empty-inline'>No hay movimientos manuales registrados hoy.</div>";
    } else {
        html += "<div class='v27-cash-movements'>";

        movimientosCaja.slice().reverse().forEach(function(movimiento, reverseIndex) {
            const indiceReal =
                movimientosCaja.length - 1 - reverseIndex;

            const entrada =
                movimiento.tipo === "entrada";

            html +=
                "<div class='v27-cash-movement'>" +
                    "<div class='v27-cash-movement-icon " +
                        (entrada ? "in" : "out") +
                    "'>" +
                        (entrada ? "➕" : "➖") +
                    "</div>" +
                    "<div class='v27-cash-movement-info'>" +
                        "<strong>" +
                            escaparHTML(movimiento.concepto) +
                        "</strong>" +
                        "<span>" +
                            movimiento.hora +
                            " · " +
                            (entrada ? "Entrada" : "Salida") +
                            " · " +
                            escaparHTML(
                                movimiento.usuario ||
                                "Usuario"
                            ) +
                        "</span>" +
                    "</div>" +
                    "<strong class='v27-cash-movement-amount " +
                        (entrada ? "in" : "out") +
                    "'>" +
                        (entrada ? "+" : "−") +
                        dinero(movimiento.monto) +
                    "</strong>" +
                    (
                        estadoCaja === "abierta"
                            ? "<button onclick='eliminarMovimientoCaja(" +
                              indiceReal +
                              ")'>🗑️</button>"
                            : ""
                    ) +
                "</div>";
        });

        html += "</div>";
    }

    html +=
        "</section>" +

        "<section class='v27-cash-panel'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>JORNADA</span><h2>📊 Resumen del día</h2></div>" +
            "</div>" +
            "<div class='v27-cash-mini-grid'>" +
                "<div><span>🎮 SESIONES</span><strong>" + sesionesDelDia + "</strong></div>" +
                "<div><span>🧾 TICKETS</span><strong>" + estadisticasDia.tickets + "</strong></div>" +
                "<div><span>👥 CLIENTES</span><strong>" + estadisticasDia.clientes + "</strong></div>" +
                "<div><span>⭐ PUNTOS</span><strong>" + estadisticasDia.puntosOtorgados + "</strong></div>" +
            "</div>" +
        "</section>" +

        "<section class='v282-count-panel'>" +
            "<div class='v282-count-head'>" +
                "<div>" +
                    "<span>ARQUEO RÁPIDO</span>" +
                    "<h2>🧮 Cuenta por denominación</h2>" +
                "</div>" +
                "<small>No modifica la caja</small>" +
            "</div>" +
            "<div class='v282-den-grid'>" +
                obtenerDenominacionesCajaPro().map(
                    function(denominacion) {
                        return (
                            "<label>" +
                                "<span>" +
                                    denominacion.etiqueta +
                                "</span>" +
                                "<input " +
                                    "id='v282-den-" +
                                    String(
                                        denominacion.valor
                                    ).replace(".", "_") +
                                    "' " +
                                    "type='number' " +
                                    "min='0' " +
                                    "step='1' " +
                                    "inputmode='numeric' " +
                                    "placeholder='0'>" +
                            "</label>"
                        );
                    }
                ).join("") +
            "</div>" +
            "<div class='v282-count-actions'>" +
                "<button class='v27-action-primary' onclick='calcularArqueoDenominacionesPro()'>🧮 Calcular efectivo</button>" +
                "<button onclick='limpiarArqueoDenominacionesPro()'>↺ Limpiar</button>" +
            "</div>" +
            "<div id='v282-arqueo-resultado'>" +
                "<div class='v282-count-empty'>Escribe las cantidades y pulsa calcular.</div>" +
            "</div>" +
        "</section>" +

        "<div class='v27-cash-bottom'>" +
            "<button onclick='volverInicio()'>🏠 Inicio</button>" +
            "<button onclick='mostrarDashboard()'>📊 Dashboard</button>" +
        "</div>";

    div.innerHTML = html;
    contenedor.appendChild(div);
}

function mostrarCierreCaja() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    vistaActual = "cierre";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div =
        document.createElement("div");

    div.className =
        "v27-cash-page v27-close-page";

    const efectivoEsperado =
        obtenerEfectivoEsperado();

    const entradas =
        obtenerEntradasCaja();

    const salidas =
        obtenerSalidasCaja();

    div.innerHTML =
        "<div class='v27-cash-hero'>" +
            "<div>" +
                "<div class='v27-eyebrow'>🔒 ARQUEO Y CIERRE</div>" +
                "<h1>Cierre de caja</h1>" +
                "<p>" +
                    obtenerFechaBonita(obtenerFecha()) +
                    " · Revisa todo antes de cerrar la jornada." +
                "</p>" +
            "</div>" +
            "<div class='v27-cash-hero-icon'>🔒</div>" +
        "</div>" +

        "<div class='v27-cash-summary'>" +
            "<div><span>💰 VENTAS</span><strong>" + dinero(ventasDelDia) + "</strong></div>" +
            "<div><span>💸 GASTOS</span><strong>" + dinero(gastosDelDia) + "</strong></div>" +
            "<div><span>💵 EFECTIVO ESPERADO</span><strong>" + dinero(efectivoEsperado) + "</strong></div>" +
            "<div><span>🟢 GANANCIA</span><strong>" + dinero(calcularGanancia()) + "</strong></div>" +
        "</div>" +

        "<div class='v27-cash-grid'>" +

            "<section class='v27-cash-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>DESGLOSE</span><h2>💳 Métodos de pago</h2></div>" +
                "</div>" +
                "<div class='v27-cash-line'><span>💵 Efectivo vendido</span><strong>" + dinero(ventasPorMetodo.efectivo) + "</strong></div>" +
                "<div class='v27-cash-line'><span>💳 Tarjeta</span><strong>" + dinero(ventasPorMetodo.tarjeta) + "</strong></div>" +
                "<div class='v27-cash-line'><span>📱 Transferencia</span><strong>" + dinero(ventasPorMetodo.transferencia) + "</strong></div>" +
            "</section>" +

            "<section class='v27-cash-panel'>" +
                "<div class='v27-panel-head'>" +
                    "<div><span>EFECTIVO FÍSICO</span><h2>🧮 Fórmula de caja</h2></div>" +
                "</div>" +
                "<div class='v27-cash-formula'>" +
                    "<div><span>Fondo inicial</span><strong>+" + dinero(fondoCajaInicial) + "</strong></div>" +
                    "<div><span>Ventas en efectivo</span><strong>+" + dinero(ventasPorMetodo.efectivo) + "</strong></div>" +
                    "<div><span>Gastos en efectivo</span><strong>−" + dinero(obtenerGastosEnEfectivo()) + "</strong></div>" +
                    "<div><span>Movimientos netos</span><strong>" +
                        (obtenerMovimientoNetoCaja() >= 0 ? "+" : "−") +
                        dinero(Math.abs(obtenerMovimientoNetoCaja())) +
                    "</strong></div>" +
                    "<div class='v27-cash-formula-total'><span>ESPERADO</span><strong>" + dinero(efectivoEsperado) + "</strong></div>" +
                "</div>" +
            "</section>" +

        "</div>" +

        "<div class='v27-cash-panel v27-count-panel'>" +
            "<div class='v27-panel-head'>" +
                "<div><span>ARQUEO</span><h2>💵 Cuenta el efectivo</h2></div>" +
                "<small>Se pedirá al confirmar</small>" +
            "</div>" +
            "<p>Cuenta físicamente el dinero que tienes en la caja. El sistema calculará automáticamente si hubo sobrante, faltante o si la caja quedó cuadrada.</p>" +
            "<button class='v27-close-action' onclick='cerrarCaja()'>🔒 Confirmar cierre y hacer arqueo</button>" +
            "<button onclick='mostrarCaja()'>⬅ Volver a caja</button>" +
        "</div>";

    contenedor.appendChild(div);
}

function cerrarCaja() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    if (estadoCaja !== "abierta") {
        alert(
            estadoCaja === "pendiente"
                ? "🔒 Primero debes abrir la caja."
                : "🔒 La caja de hoy ya está cerrada."
        );
        return;
    }

    actualizarTiempos();

    if (cuentasJugadores.length > 0) {
        alert(
            "⚠️ No puedes cerrar la caja mientras haya cuentas abiertas.\n\n" +
            "Cobra o cancela todas las cuentas primero."
        );
        return;
    }

    const xboxJugando =
        estaciones.some(function(estacion) {
            return estacion.activo;
        });

    if (xboxJugando) {
        alert(
            "⚠️ No puedes cerrar la caja mientras una estación esté jugando.\n\n" +
            "Detén todas las sesiones primero."
        );
        return;
    }

    const efectivoEsperado =
        obtenerEfectivoEsperado();

    const textoEfectivo = prompt(
        "🧮 ARQUEO DE CAJA\n\n" +
        "Efectivo esperado: $" +
        efectivoEsperado +
        "\n\n" +
        "Cuenta físicamente el dinero de la caja " +
        "y escribe cuánto efectivo tienes:"
    );

    if (textoEfectivo === null) {
        return;
    }

    const efectivoContado =
        Number(textoEfectivo);

    if (
        !isFinite(efectivoContado) ||
        efectivoContado < 0
    ) {
        alert("❌ Escribe una cantidad válida.");
        return;
    }

    const diferencia =
        efectivoContado -
        efectivoEsperado;

    let estadoDiferencia =
        "🟢 Caja cuadrada";

    if (diferencia > 0) {
        estadoDiferencia =
            "🔵 Sobrante de $" +
            diferencia.toFixed(2);
    } else if (diferencia < 0) {
        estadoDiferencia =
            "🔴 Faltante de $" +
            Math.abs(diferencia).toFixed(2);
    }

    const confirmar = confirm(
        "🔒 CONFIRMAR CIERRE\n\n" +
        "Ventas: $" + ventasDelDia +
        "\nGastos: $" + gastosDelDia +
        "\nGanancia: $" + calcularGanancia() +
        "\nSesiones: " + sesionesDelDia +
        "\n\n" +
        "🧮 Efectivo esperado: $" +
        efectivoEsperado +
        "\n💵 Efectivo contado: $" +
        efectivoContado.toFixed(2) +
        "\n\n" +
        estadoDiferencia +
        "\n\n" +
        "¿Cerrar la caja?"
    );

    if (!confirmar) {
        return;
    }

    const cierre = {
        fecha: obtenerFecha(),
        hora: obtenerHora(),
        ventas: ventasDelDia,
        gastos: gastosDelDia,
        ganancia: calcularGanancia(),
        sesiones: sesionesDelDia,
        efectivo: ventasPorMetodo.efectivo,
        tarjeta: ventasPorMetodo.tarjeta,
        transferencia: ventasPorMetodo.transferencia,
        gastosEfectivo: obtenerGastosEnEfectivo(),
        fondoCajaInicial: fondoCajaInicial,
        entradasCaja: obtenerEntradasCaja(),
        salidasCaja: obtenerSalidasCaja(),
        movimientosCaja: movimientosCaja.slice(),
        efectivoEsperado: efectivoEsperado,
        efectivoContado: efectivoContado,
        diferenciaEfectivo: diferencia,
        aperturaUsuario:
            cajaAperturaUsuario,
        aperturaHora:
            cajaAperturaHora,
        cierreUsuario:
            usuarioActualPro
                ? usuarioActualPro.nombre
                : "Usuario actual",
        cierreHora:
            obtenerHora(),
        reaperturaUsuario:
            cajaUltimaReaperturaUsuario,
        reaperturaHora:
            cajaUltimaReaperturaHora
    };

    cierresCaja.push(cierre);

    guardarReporteAnterior(
        obtenerFecha(),
        ventasDelDia,
        gastosDelDia,
        sesionesDelDia
    );

    cajaCierreUsuario =
        usuarioActualPro
            ? usuarioActualPro.nombre
            : "Usuario actual";

    cajaCierreHora =
        obtenerHora();

    registrarActividadPro(
        "Caja cerrada",
        "Efectivo esperado: " +
        dinero(efectivoEsperado) +
        " · Contado: " +
        dinero(efectivoContado),
        "caja"
    );

    cajaCerrada = true;
    estadoCaja = "cerrada";
    fechaCaja = obtenerFecha();

    guardarDatos();

    alert(
        "🔒 Caja cerrada correctamente.\n\n" +
        "Ventas: $" + cierre.ventas +
        "\nGastos: $" + cierre.gastos +
        "\nGanancia: $" + cierre.ganancia +
        "\nSesiones: " + cierre.sesiones +
        "\n\n" +
        "🧮 Esperado: $" +
        cierre.efectivoEsperado +
        "\n💵 Contado: $" +
        cierre.efectivoContado.toFixed(2) +
        "\n" +
        estadoDiferencia
    );

    mostrarEstaciones();
}

function mostrarHistorialCierres() {
    if (!exigirPermisoPro("caja")) {
        return;
    }

    vistaActual = "cierres";

    const contenedor =
        document.getElementById("estaciones");

    contenedor.innerHTML = "";

    const div = document.createElement("div");

    let texto =
        "<h1>📚 Historial de cierres</h1>";

    if (cierresCaja.length === 0) {
        texto +=
            "<p>Todavía no hay cierres registrados.</p>";
    }

    cierresCaja.slice().reverse().forEach(function(cierre) {
        texto +=
            "<div>" +

            "<h2>📅 " +
            obtenerFechaBonita(cierre.fecha) +
            "</h2>" +

            "<p>🕐 Hora: " + cierre.hora + "</p>" +
            "<p>👤 Apertura: " +
            escaparHTML(
                cierre.aperturaUsuario ||
                "—"
            ) +
            " · " +
            escaparHTML(
                cierre.aperturaHora ||
                "—"
            ) +
            "</p>" +
            "<p>🔒 Cerró: " +
            escaparHTML(
                cierre.cierreUsuario ||
                "—"
            ) +
            " · " +
            escaparHTML(
                cierre.cierreHora ||
                cierre.hora ||
                "—"
            ) +
            "</p>" +
            "<p>💰 Ventas: $" + cierre.ventas + "</p>" +
            "<p>💵 Efectivo: $" + (cierre.efectivo || 0) + "</p>" +
            "<p>💳 Tarjeta: $" + (cierre.tarjeta || 0) + "</p>" +
            "<p>📱 Transferencia: $" + (cierre.transferencia || 0) + "</p>" +
            "<p>💸 Gastos: $" + cierre.gastos + "</p>" +
            "<p>🟢 Ganancia: $" + cierre.ganancia + "</p>" +
            "<p>🎮 Sesiones: " + cierre.sesiones + "</p>" +

            "<hr>" +

            "<p>🧮 Efectivo esperado: $" +
            (cierre.efectivoEsperado || 0) +
            "</p>" +

            "<p>💵 Efectivo contado: $" +
            (
                typeof cierre.efectivoContado !== "undefined"
                    ? Number(cierre.efectivoContado).toFixed(2)
                    : "Sin registro"
            ) +
            "</p>" +

            "<p>" +
            (
                typeof cierre.diferenciaEfectivo === "undefined"
                    ? "ℹ️ Arqueo no registrado"
                    : (
                        Number(cierre.diferenciaEfectivo) === 0
                            ? "🟢 Caja cuadrada"
                            : (
                                Number(cierre.diferenciaEfectivo) > 0
                                    ? "🔵 Sobrante: $" +
                                      Number(cierre.diferenciaEfectivo).toFixed(2)
                                    : "🔴 Faltante: $" +
                                      Math.abs(Number(cierre.diferenciaEfectivo)).toFixed(2)
                            )
                    )
            ) +
            "</p>" +

            "</div><hr>";
    });

    texto +=
        "<button onclick='volverInicio()'>⬅ Volver</button>";

    div.innerHTML = texto;

    contenedor.appendChild(div);
}


// ========================================
// VOLVER
// ========================================

function volverInicio() {
    vistaActual = "inicio";
    mostrarEstaciones();
}


// ========================================
// DETECTAR CAMBIO DE DIA
// ========================================

function verificarCambioDeDia() {
    const hoy = obtenerFecha();

    if (!fechaCaja || fechaCaja === hoy) {
        return;
    }

    const xboxJugando =
        estaciones.some(function(estacion) {
            return estacion.activo;
        });

    if (cuentasJugadores.length > 0) {
        return;
    }

    // Si hay una sesión activa a medianoche,
    // esperamos a que termine/detenga antes de
    // preparar la nueva jornada.
    if (xboxJugando) {
        return;
    }

    guardarReporteAnterior(
        fechaCaja,
        ventasDelDia,
        gastosDelDia,
        sesionesDelDia
    );

    ventasDelDia = 0;
    sesionesDelDia = 0;
    historial = [];
    gastos = [];
    gastosDelDia = 0;

    fondoCajaInicial = 0;
    movimientosCaja = [];

    ventasPorMetodo = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0
    };

    cajaCerrada = true;
    estadoCaja = "pendiente";
    fechaCaja = hoy;

    estaciones.forEach(function(estacion) {
        estacion.segundos = 0;
        estacion.activo = false;
        estacion.finalizaEn = null;
        estacion.terminado = false;
        estacion.pausada = false;
        estacion.cliente = "";
        estacion.precioSesion = 0;
        estacion.metodoPagoSesion = "";
        estacion.duracionTotalSegundos = 0;
        estacion.inicioSesion = null;
        estacion.avisoMostrado = false;
    });

    guardarDatos();

    if (
        vistaActual === "inicio" &&
        sesionUsuarioIniciadaPro
    ) {
        mostrarEstaciones();
    }
}


// ========================================
// RELOJ
// ========================================

let ultimoRefreshDashboard = 0;

setInterval(function() {
    verificarCambioDeDia();
    actualizarTiempos();
    comprobarBloqueoAutomaticoPro();

    if (vistaActual === "inicio") {
        mostrarEstaciones();
    }

    if (vistaActual === "dashboard") {
        const ahora = Date.now();

        if (ahora - ultimoRefreshDashboard >= 5000) {
            ultimoRefreshDashboard = ahora;
            mostrarDashboard();
        }
    }
}, 1000);



// ========================================
// V27 - TEMA VISUAL
// ========================================


function aplicarTemaV27() {
    if (document.getElementById("temaVisualV27")) {
        return;
    }

    document.documentElement.classList.add("v27-theme");

    if (document.body) {
        document.body.classList.add("v27-theme");
    }

    const style = document.createElement("style");
    style.id = "temaVisualV27";

    style.textContent = `
:root {
    --v27-bg: #070b14;
    --v27-panel: rgba(17, 24, 39, .78);
    --v27-panel-2: rgba(24, 32, 48, .86);
    --v27-border: rgba(148, 163, 184, .14);
    --v27-text: #edf4ff;
    --v27-muted: #8fa0b7;
    --v27-accent: #7c5cff;
    --v27-accent-2: #00d4ff;
    --v27-green: #22c55e;
    --v27-yellow: #f59e0b;
    --v27-red: #ef4444;
    --v27-blue: #3b82f6;
}

html.v27-theme {
    background: var(--v27-bg);
}

body.v27-theme {
    margin: 0;
    min-height: 100vh;
    background:
        radial-gradient(circle at 8% 0%, rgba(124,92,255,.18), transparent 28%),
        radial-gradient(circle at 92% 4%, rgba(0,212,255,.12), transparent 25%),
        linear-gradient(145deg, #070b14 0%, #0b1120 48%, #080d17 100%);
    color: var(--v27-text);
    font-family:
        Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont,
        "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif;
    letter-spacing: .01em;
}

body.v27-theme #estaciones {
    width: min(1500px, calc(100% - 28px));
    margin: 0 auto;
    padding: 22px 0 50px;
    box-sizing: border-box;
}

body.v27-theme #estaciones::before {
    content: "🎮  CONTROL DE VIDEOJUEGOS";
    display: block;
    margin: 0 0 18px;
    padding: 13px 17px;
    border: 1px solid var(--v27-border);
    border-radius: 16px;
    background: rgba(10, 15, 28, .72);
    box-shadow: 0 14px 35px rgba(0,0,0,.20);
    color: #dfe8ff;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: .12em;
    backdrop-filter: blur(18px);
}

body.v27-theme h1,
body.v27-theme h2,
body.v27-theme h3 {
    color: var(--v27-text);
}

body.v27-theme p,
body.v27-theme label {
    color: var(--v27-muted);
}

body.v27-theme hr {
    border: 0;
    border-top: 1px solid var(--v27-border);
    margin: 22px 0;
}

body.v27-theme button {
    appearance: none;
    border: 1px solid rgba(148,163,184,.17);
    border-radius: 13px;
    padding: 11px 15px;
    margin: 5px 5px 5px 0;
    background:
        linear-gradient(135deg, rgba(124,92,255,.92), rgba(73,58,180,.92));
    color: #fff;
    font: inherit;
    font-weight: 750;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(0,0,0,.18);
    transition:
        transform .16s ease,
        filter .16s ease,
        box-shadow .16s ease,
        border-color .16s ease;
}

body.v27-theme button:hover {
    filter: brightness(1.10);
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(0,0,0,.25);
}

body.v27-theme button:active {
    transform: translateY(1px) scale(.985);
}

body.v27-theme input,
body.v27-theme select,
body.v27-theme textarea {
    width: 100%;
    max-width: 520px;
    box-sizing: border-box;
    margin: 7px 0 14px;
    padding: 12px 14px;
    border: 1px solid rgba(148,163,184,.20);
    border-radius: 12px;
    outline: none;
    background: rgba(7,11,20,.72);
    color: var(--v27-text);
    font: inherit;
}

body.v27-theme input:focus,
body.v27-theme select:focus,
body.v27-theme textarea:focus {
    border-color: rgba(124,92,255,.75);
    box-shadow: 0 0 0 3px rgba(124,92,255,.13);
}

.v27-home {
    position: relative;
}

.v27-main-menu {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
    gap: 9px;
    margin: 18px 0 25px;
    padding: 12px;
    border: 1px solid var(--v27-border);
    border-radius: 20px;
    background: rgba(10,15,28,.62);
    box-shadow: 0 18px 45px rgba(0,0,0,.16);
    backdrop-filter: blur(18px);
}

.v27-main-menu button {
    width: 100%;
    min-height: 48px;
    margin: 0;
    background: rgba(255,255,255,.045);
    border-color: rgba(148,163,184,.12);
    box-shadow: none;
}

.v27-main-menu button:hover {
    background: rgba(124,92,255,.18);
    border-color: rgba(124,92,255,.42);
}

.v27-dashboard-hero {
    margin: 0 0 18px;
    padding: 23px;
    border: 1px solid rgba(124,92,255,.22);
    border-radius: 24px;
    color: white;
    background:
        radial-gradient(circle at 90% 0%, rgba(0,212,255,.16), transparent 32%),
        radial-gradient(circle at 0% 0%, rgba(124,92,255,.24), transparent 35%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
    box-shadow: 0 24px 60px rgba(0,0,0,.28);
}

.v27-hero-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}

.v27-hero-top h1 {
    margin: 0;
    font-size: clamp(25px, 4vw, 38px);
    letter-spacing: -.03em;
}

.v27-hero-top p {
    margin: 5px 0 0;
    color: #93a4bd;
}

.v27-metric-card {
    min-height: 112px;
    box-sizing: border-box;
    padding: 22px;
    border: 1px solid rgba(148,163,184,.12);
    border-radius: 18px;
    background:
        linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025));
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,.035),
        0 12px 25px rgba(0,0,0,.12);
    transition: transform .18s ease, border-color .18s ease;
}

.v27-metric-card:hover {
    transform: translateY(-2px);
    border-color: rgba(124,92,255,.30);
}

.v27-metric-title {
    color: #a8b7cb;
    font-size: 16px;
    font-weight: 700;
}

.v27-metric-value {
    margin-top: 8px;
    color: #f7faff;
    font-size: clamp(24px, 3vw, 31px);
    font-weight: 900;
    letter-spacing: -.03em;
}

.v27-metric-detail {
    margin-top: 5px;
    color: #74849a;
    font-size: 12px;
}

.v27-mini-station {
    padding: 15px;
    border: 1px solid rgba(148,163,184,.12);
    border-radius: 22px;
    box-sizing: border-box;
    box-shadow: 0 12px 25px rgba(0,0,0,.14);
}

.v27-mini-playing {
    background: linear-gradient(145deg, rgba(22,163,74,.28), rgba(6,78,59,.18));
    border-color: rgba(34,197,94,.30);
}

.v27-mini-paused {
    background: linear-gradient(145deg, rgba(245,158,11,.24), rgba(120,53,15,.15));
    border-color: rgba(245,158,11,.34);
}

.v27-mini-ended {
    background: linear-gradient(145deg, rgba(239,68,68,.24), rgba(127,29,29,.15));
    border-color: rgba(239,68,68,.30);
}

.v27-mini-available {
    background: linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025));
}

.v27-mini-name {
    font-size: 16px;
    font-weight: 850;
}

.v27-mini-state {
    margin-top: 7px;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: .04em;
}

.v27-mini-detail {
    margin-top: 5px;
    color: #a6b4c7;
    font-size: 12px;
}

.v27-reservations-card {
    margin-top: 18px;
    padding: 15px;
    border: 1px solid rgba(59,130,246,.18);
    border-radius: 22px;
    background: rgba(59,130,246,.07);
}

.v27-reservations-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.v27-reservations-head strong {
    color: #eaf2ff;
}

.v27-reservations-card p {
    margin-bottom: 0;
}

.estacion {
    position: relative;
    overflow: hidden;
    margin: 14px 0;
    padding: 19px;
    border: 1px solid rgba(148,163,184,.13);
    border-radius: 23px;
    background:
        linear-gradient(145deg, rgba(17,24,39,.91), rgba(10,15,27,.88));
    box-shadow:
        0 18px 42px rgba(0,0,0,.24),
        inset 0 1px 0 rgba(255,255,255,.035);
    transition:
        transform .18s ease,
        border-color .18s ease,
        box-shadow .18s ease;
}

.estacion::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: rgba(124,92,255,.7);
}

.estacion:hover {
    transform: translateY(-2px);
    border-color: rgba(124,92,255,.30);
    box-shadow:
        0 23px 48px rgba(0,0,0,.29),
        inset 0 1px 0 rgba(255,255,255,.04);
}

.estacion.jugando {
    border-color: rgba(34,197,94,.30);
}

.estacion.jugando::before {
    background: linear-gradient(90deg, #22c55e, #00d4ff);
}

.estacion.por-terminar {
    border-color: rgba(245,158,11,.42);
}

.estacion.por-terminar::before {
    background: linear-gradient(90deg, #f59e0b, #f97316);
}

.estacion.pausada {
    border-color: rgba(245,158,11,.34);
}

.estacion.pausada::before {
    background: #f59e0b;
}

.estacion.terminada {
    border-color: rgba(239,68,68,.30);
}

.estacion.terminada::before {
    background: #ef4444;
}

.estacion.disponible::before {
    background: linear-gradient(90deg, #7c5cff, #00d4ff);
}

.v27-station-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.v27-station-head h2 {
    margin: 0;
    font-size: clamp(20px, 3vw, 27px);
    letter-spacing: -.025em;
}









.v27-reservas-pro-page { max-width:1180px; margin:0 auto; }
.v27-reservas-hero {
    display:flex;align-items:center;justify-content:space-between;gap:18px;
    margin-bottom:15px;padding:23px;border:1px solid rgba(0,212,255,.18);
    border-radius:24px;background:linear-gradient(145deg,rgba(18,25,43,.96),rgba(10,16,29,.94));
    box-shadow:0 22px 55px rgba(0,0,0,.24);
}
.v27-reservas-hero h1 {margin:3px 0 5px;font-size:clamp(27px,4vw,39px);letter-spacing:-.04em;}
.v27-reservas-hero p {margin:0;color:#8fa0b7;font-size:11px;}
.v27-reservas-hero-icon {display:grid;place-items:center;width:76px;height:76px;border-radius:24px;background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.16);font-size:34px;}
.v27-reservas-summary {display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:10px;}
.v27-reservas-summary>div {min-height:86px;padding:13px;border:1px solid rgba(148,163,184,.10);border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.018));}
.v27-reservas-summary span {display:block;color:#71839a;font-size:8px;font-weight:900;letter-spacing:.09em;}
.v27-reservas-summary strong {display:block;margin-top:6px;color:#edf4fd;font-size:20px;}
.v27-reservas-summary small {display:block;margin-top:3px;color:#65768c;font-size:8px;}
.v27-reservas-datebar {display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;margin-bottom:12px;padding:10px;border:1px solid rgba(148,163,184,.10);border-radius:16px;background:rgba(255,255,255,.025);}
.v27-reservas-datebar button {margin:0;}
.v27-reservas-datebar span {display:block;color:#64768d;font-size:7px;font-weight:900;letter-spacing:.09em;}
.v27-reservas-datebar strong {display:block;margin-top:3px;color:#dfe8f5;font-size:12px;}
.v27-reservas-list {display:grid;gap:8px;}
.v27-reserva-card {display:grid;grid-template-columns:88px 1fr;gap:13px;padding:14px;border:1px solid rgba(148,163,184,.11);border-radius:18px;background:linear-gradient(145deg,rgba(17,24,39,.92),rgba(10,15,27,.88));box-shadow:0 12px 27px rgba(0,0,0,.12);}
.v27-reserva-time {display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:90px;border-radius:14px;background:rgba(124,92,255,.06);border:1px solid rgba(124,92,255,.12);}
.v27-reserva-time strong {color:#e7e0ff;font-size:20px;}
.v27-reserva-time span {margin-top:4px;color:#6f8097;font-size:8px;}
.v27-reserva-main {min-width:0;}
.v27-reserva-title {display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.v27-reserva-estacion {display:block;color:#7e8fa5;font-size:8px;font-weight:900;}
.v27-reserva-title h3 {overflow:hidden;margin:4px 0 0;color:#e8eff8;font-size:14px;text-overflow:ellipsis;white-space:nowrap;}
.v27-reserva-status {display:inline-flex;padding:5px 7px;border-radius:999px;font-size:7px;font-weight:900;white-space:nowrap;}
.v27-reserva-status.pendiente {color:#fcd34d;background:rgba(245,158,11,.07);}
.v27-reserva-status.confirmada {color:#93c5fd;background:rgba(59,130,246,.07);}
.v27-reserva-status.curso {color:#86efac;background:rgba(34,197,94,.07);}
.v27-reserva-status.cancelada {color:#fca5a5;background:rgba(239,68,68,.07);}
.v27-reserva-status.completada {color:#a5b4fc;background:rgba(99,102,241,.07);}
.v27-reserva-meta {display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
.v27-reserva-meta span {padding:6px 8px;border-radius:9px;color:#8192a8;background:rgba(255,255,255,.025);font-size:8px;}
.v27-reserva-notes {margin-top:8px;padding:8px 9px;border-radius:10px;color:#75879e;background:rgba(255,255,255,.018);font-size:8px;}
.v27-reserva-actions {display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
.v27-reserva-actions button {margin:0;padding:7px 9px;font-size:8px;}
.v27-danger-button {color:#fca5a5 !important;border-color:rgba(239,68,68,.18) !important;}
.v27-reservas-empty {display:grid;place-items:center;min-height:280px;padding:30px;border:1px dashed rgba(148,163,184,.14);border-radius:20px;background:rgba(255,255,255,.018);text-align:center;}
.v27-reservas-empty>div {font-size:35px;}
.v27-reservas-empty h2 {margin:10px 0 4px;color:#dfe8f5;font-size:17px;}
.v27-reservas-empty p {margin:0 0 12px;color:#687a91;font-size:9px;}
.v27-reservas-footer {margin-top:12px;color:#61738a;font-size:9px;text-align:center;}
@media(max-width:900px){.v27-reservas-summary{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media(max-width:650px){.v27-reservas-hero{padding:18px;border-radius:20px}.v27-reservas-hero-icon{display:none}.v27-reservas-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.v27-reservas-datebar{grid-template-columns:auto 1fr auto}.v27-reservas-datebar button:last-child{grid-column:1/-1;width:100%}.v27-reserva-card{grid-template-columns:1fr}.v27-reserva-time{min-height:64px}}

.v27-clients-pro-page {
    max-width: 1180px;
    margin: 0 auto;
}

.v27-client-pro-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 15px;
    padding: 23px;
    border: 1px solid rgba(0,212,255,.17);
    border-radius: 24px;
    background:
        radial-gradient(circle at 95% 0%, rgba(0,212,255,.13), transparent 30%),
        radial-gradient(circle at 0% 0%, rgba(124,92,255,.16), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
    box-shadow: 0 22px 55px rgba(0,0,0,.24);
}

.v27-client-pro-hero h1 {
    margin: 3px 0 5px;
    font-size: clamp(27px, 4vw, 39px);
    letter-spacing: -.04em;
}

.v27-client-pro-hero p {
    margin: 0;
    color: #8fa0b7;
    font-size: 14px;
}

.v27-client-pro-hero-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 24px;
    background: rgba(0,212,255,.07);
    border: 1px solid rgba(0,212,255,.17);
    font-size: 42px;
}

.v27-client-pro-summary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0,1fr));
    gap: 8px;
    margin-bottom: 10px;
}

.v27-client-pro-summary > div {
    min-height: 91px;
    padding: 22px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.018));
}

.v27-client-pro-summary span {
    display: block;
    color: #71839a;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v27-client-pro-summary strong {
    display: block;
    margin-top: 6px;
    color: #edf4fd;
    font-size: 19px;
}

.v27-client-pro-summary small {
    display: block;
    margin-top: 3px;
    color: #65768c;
    font-size: 14px;
}

.v27-client-pro-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    margin-bottom: 13px;
}

.v27-client-pro-search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 220px;
    height: 42px;
    padding: 0 11px;
    border: 1px solid rgba(148,163,184,.13);
    border-radius: 13px;
    background: rgba(255,255,255,.035);
}

.v27-client-pro-search input {
    width: 100%;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #e8eff9;
    font-size: 14px;
}

.v27-client-pro-search input::placeholder {
    color: #617289;
}

.v27-client-pro-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.v27-client-pro-filters button {
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
}

.v27-client-pro-highlight {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px 18px;
    border: 1px solid rgba(245,158,11,.15);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(245,158,11,.08), rgba(124,92,255,.04));
}

.v27-client-highlight-icon {
    display: grid;
    place-items: center;
    width: 45px;
    height: 45px;
    border-radius: 14px;
    background: rgba(245,158,11,.08);
    font-size: 22px;
}

.v27-client-pro-highlight span {
    display: block;
    color: #887f6b;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v27-client-pro-highlight strong {
    display: block;
    margin-top: 3px;
    color: #f2e8d0;
    font-size: 16px;
}

.v27-client-pro-highlight small {
    display: block;
    margin-top: 3px;
    color: #817965;
    font-size: 14px;
}

.v27-client-pro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(285px, 1fr));
    gap: 16px;
}

.v27-client-pro-card {
    min-width: 0;
    padding: 15px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(17,24,39,.92), rgba(10,15,27,.88));
    box-shadow: 0 14px 32px rgba(0,0,0,.15);
    transition: transform .18s ease, border-color .18s ease;
}

.v27-client-pro-card:hover {
    transform: translateY(-2px);
    border-color: rgba(0,212,255,.20);
}

.v27-client-pro-card-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 9px;
}

.v27-client-pro-avatar {
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    border-radius: 14px;
    background: rgba(124,92,255,.08);
    border: 1px solid rgba(124,92,255,.14);
    font-size: 26px;
}

.v27-client-pro-name {
    min-width: 0;
}

.v27-client-pro-name h3 {
    overflow: hidden;
    margin: 0;
    color: #e8eff8;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-client-pro-name span {
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: #67798f;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-client-status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
}

.v27-client-status-badge.on {
    color: #86efac;
    background: rgba(34,197,94,.08);
    border: 1px solid rgba(34,197,94,.15);
}

.v27-client-status-badge.off {
    color: #fca5a5;
    background: rgba(239,68,68,.07);
    border: 1px solid rgba(239,68,68,.14);
}

.v27-client-status-badge.expired {
    color: #fcd34d;
    background: rgba(245,158,11,.07);
    border: 1px solid rgba(245,158,11,.14);
}

.v27-client-pro-level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 12px 0 8px;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(148,163,184,.07);
}

.v27-client-pro-level span {
    color: #9aa9bc;
    font-size: 11px;
    font-weight: 800;
}

.v27-client-pro-level strong {
    color: #dfe8f5;
    font-size: 16px;
}

.v27-client-pro-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 6px;
}

.v27-client-pro-stats > div {
    padding: 8px;
    border-radius: 11px;
    background: rgba(255,255,255,.022);
}

.v27-client-pro-stats span {
    display: block;
    color: #64768d;
    font-size: 11px;
    font-weight: 900;
}

.v27-client-pro-stats strong {
    display: block;
    margin-top: 4px;
    color: #dfe8f5;
    font-size: 14px;
}

.v27-client-pro-last {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 10px 0;
    color: #65768c;
    font-size: 14px;
}

.v27-client-pro-last strong {
    color: #9aa9bc;
    font-size: 14px;
}

.v27-client-pro-open,
.v27-client-wide {
    width: 100%;
}

.v27-client-pro-footer {
    margin-top: 13px;
    color: #61738a;
    font-size: 11px;
    text-align: center;
}

.v27-client-profile-page {
    max-width: 1120px;
    margin: 0 auto;
}

.v27-client-profile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
}

.v27-client-profile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.v27-client-profile-actions button,
.v27-client-profile-top button {
    margin: 0;
}

.v27-client-profile-hero {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 15px;
    padding: 22px;
    margin-bottom: 10px;
    border: 1px solid rgba(124,92,255,.17);
    border-radius: 23px;
    background:
        radial-gradient(circle at 90% 0%, rgba(124,92,255,.15), transparent 30%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
}

.v27-client-profile-avatar {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 23px;
    background: rgba(124,92,255,.09);
    border: 1px solid rgba(124,92,255,.18);
    font-size: 42px;
}

.v27-client-profile-identity {
    min-width: 0;
}

.v27-client-profile-identity h1 {
    overflow: hidden;
    margin: 2px 0 4px;
    color: #f0f5fc;
    font-size: clamp(24px, 4vw, 35px);
    letter-spacing: -.04em;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-client-profile-identity p {
    margin: 0;
    color: #7b8da4;
    font-size: 16px;
}

.v27-client-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 9px;
}

.v27-client-level-badge {
    padding: 5px 8px;
    border-radius: 999px;
    color: #d9d2ff;
    background: rgba(124,92,255,.08);
    border: 1px solid rgba(124,92,255,.15);
    font-size: 8px;
    font-weight: 900;
}

.v27-client-profile-main-stat {
    min-width: 170px;
    padding: 22px;
    border-radius: 16px;
    background: rgba(34,197,94,.06);
    border: 1px solid rgba(34,197,94,.13);
}

.v27-client-profile-main-stat span {
    display: block;
    color: #6c8c76;
    font-size: 8px;
    font-weight: 900;
}

.v27-client-profile-main-stat strong {
    display: block;
    margin-top: 5px;
    color: #86efac;
    font-size: 25px;
}

.v27-client-profile-main-stat small {
    display: block;
    margin-top: 3px;
    color: #667d6e;
    font-size: 14px;
}

.v27-client-profile-kpis {
    display: grid;
    grid-template-columns: repeat(5, minmax(0,1fr));
    gap: 8px;
    margin-bottom: 10px;
}

.v27-client-profile-kpis > div {
    min-height: 85px;
    padding: 12px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 15px;
    background: rgba(255,255,255,.025);
}

.v27-client-profile-kpis span {
    display: block;
    color: #6f8198;
    font-size: 8px;
    font-weight: 900;
}

.v27-client-profile-kpis strong {
    display: block;
    margin-top: 6px;
    color: #e8eff8;
    font-size: 18px;
}

.v27-client-profile-kpis small {
    display: block;
    margin-top: 3px;
    color: #64768c;
    font-size: 14px;
}

.v27-client-profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 10px;
}

.v27-client-pro-panel {
    min-width: 0;
    margin-bottom: 10px;
    padding: 15px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
    box-shadow: 0 13px 28px rgba(0,0,0,.12);
}

.v27-client-profile-grid .v27-client-pro-panel {
    margin-bottom: 0;
}

.v27-client-pro-panel .v27-panel-head button {
    margin: 0;
    padding: 7px 9px;
    font-size: 14px;
}

.v27-client-membership-info {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 7px;
}

.v27-client-membership-info > div {
    padding: 9px;
    border-radius: 12px;
    background: rgba(255,255,255,.025);
}

.v27-client-membership-info span {
    display: block;
    color: #65778d;
    font-size: 11px;
    font-weight: 900;
}

.v27-client-membership-info strong {
    display: block;
    margin-top: 4px;
    color: #dfe8f5;
    font-size: 16px;
}

.v27-client-progress {
    margin-top: 10px;
}

.v27-client-progress-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    color: #687a91;
    font-size: 14px;
}

.v27-client-progress-head strong {
    color: #9aa9bc;
}

.v27-client-wide {
    margin-top: 8px;
}

.v27-client-debt-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 9px;
}

.v27-client-debt-actions button {
    margin: 0;
    flex: 1;
}

.v27-client-account-list,
.v27-client-activity-list {
    overflow: hidden;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 13px;
}

.v27-client-account-row,
.v27-client-activity-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 9px;
    padding: 10px;
    border-bottom: 1px solid rgba(148,163,184,.07);
}

.v27-client-account-row:last-child,
.v27-client-activity-row:last-child {
    border-bottom: 0;
}

.v27-client-account-icon,
.v27-client-activity-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 16px;
}

.v27-client-account-icon.charge {
    background: rgba(239,68,68,.07);
    border: 1px solid rgba(239,68,68,.12);
}

.v27-client-account-icon.payment {
    background: rgba(34,197,94,.07);
    border: 1px solid rgba(34,197,94,.12);
}

.v27-client-account-row > div:nth-child(2),
.v27-client-activity-info {
    min-width: 0;
}

.v27-client-account-row strong,
.v27-client-activity-info strong {
    display: block;
    overflow: hidden;
    color: #dfe8f5;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-client-account-row span,
.v27-client-activity-info span {
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: #687a91;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-client-account-row > strong.charge {
    color: #fca5a5;
    font-size: 16px;
}

.v27-client-account-row > strong.payment {
    color: #86efac;
    font-size: 16px;
}

.v27-client-activity-money {
    color: #e6edf7;
    font-size: 16px;
}

.v27-client-notes {
    min-height: 65px;
    padding: 12px;
    border-radius: 13px;
    color: #9aa9bc;
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(148,163,184,.07);
    font-size: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
}

.v27-client-last-visit {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    padding: 16px 18px;
    border-radius: 12px;
    background: rgba(124,92,255,.05);
    border: 1px solid rgba(124,92,255,.10);
}

.v27-client-last-visit span {
    color: #687a91;
    font-size: 8px;
    font-weight: 900;
}

.v27-client-last-visit strong {
    color: #a9a0e9;
    font-size: 11px;
}

.v27-client-profile-bottom {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.v27-client-profile-bottom button {
    margin: 0;
}

@media (max-width: 1000px) {
    .v27-client-pro-summary {
        grid-template-columns: repeat(3, minmax(0,1fr));
    }

    .v27-client-profile-kpis {
        grid-template-columns: repeat(3, minmax(0,1fr));
    }

    .v27-client-profile-hero {
        grid-template-columns: auto 1fr;
    }

    .v27-client-profile-main-stat {
        grid-column: 1 / -1;
    }
}

@media (max-width: 780px) {
    .v27-client-pro-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .v27-client-pro-search {
        min-width: 0;
    }

    .v27-client-profile-grid {
        grid-template-columns: 1fr;
    }

    .v27-client-profile-kpis {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }
}

@media (max-width: 620px) {
    .v27-client-pro-hero {
        padding: 18px;
        border-radius: 20px;
    }

    .v27-client-pro-hero-icon {
        display: none;
    }

    .v27-client-pro-summary {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v27-client-pro-filters {
        width: 100%;
    }

    .v27-client-pro-filters button {
        flex: 1;
    }

    .v27-client-profile-hero {
        grid-template-columns: auto 1fr;
        padding: 22px;
    }

    .v27-client-profile-avatar {
        width: 55px;
        height: 55px;
        border-radius: 22px;
        font-size: 26px;
    }

    .v27-client-profile-identity h1 {
        font-size: 23px;
    }

    .v27-client-profile-main-stat {
        grid-column: 1 / -1;
    }

    .v27-client-profile-kpis {
        grid-template-columns: 1fr 1fr;
    }

    .v27-client-profile-kpis > div:last-child {
        grid-column: 1 / -1;
    }
}

.v27-report-page {
    max-width: 1180px;
    margin: 0 auto;
}

.v27-report-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 15px;
    padding: 23px;
    border: 1px solid rgba(124,92,255,.20);
    border-radius: 24px;
    background:
        radial-gradient(circle at 95% 0%, rgba(124,92,255,.16), transparent 30%),
        radial-gradient(circle at 0% 0%, rgba(0,212,255,.10), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
    box-shadow: 0 22px 55px rgba(0,0,0,.24);
}

.v27-report-hero h1 {
    margin: 3px 0 5px;
    font-size: clamp(27px, 4vw, 39px);
    letter-spacing: -.04em;
}

.v27-report-hero p {
    margin: 0;
    color: #8fa0b7;
    font-size: 14px;
}

.v27-report-hero-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 24px;
    background: rgba(124,92,255,.08);
    border: 1px solid rgba(124,92,255,.18);
    font-size: 35px;
}

.v27-report-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 13px;
}

.v27-report-actions button,
.v27-report-footer-actions button {
    margin: 0;
}

.v27-report-periods {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 9px;
    margin-bottom: 10px;
}

.v27-report-period {
    min-height: 116px;
    padding: 15px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.018));
}

.v27-report-period span,
.v27-report-kpis span {
    display: block;
    color: #71839a;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .10em;
}

.v27-report-period strong {
    display: block;
    margin-top: 6px;
    color: #edf4fd;
    font-size: 42px;
    letter-spacing: -.04em;
}

.v27-report-period small {
    display: block;
    margin-top: 3px;
    color: #687a90;
    font-size: 11px;
}

.v27-report-period b {
    display: block;
    margin-top: 7px;
    color: #9aa9bc;
    font-size: 11px;
}

.v27-report-today {
    border-color: rgba(124,92,255,.22);
    background:
        linear-gradient(145deg, rgba(124,92,255,.12), rgba(0,212,255,.035));
}

.v27-report-today strong {
    color: #fff;
}

.v27-report-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 9px;
    margin-bottom: 10px;
}

.v27-report-kpis > div {
    min-height: 91px;
    padding: 14px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 16px;
    background: rgba(255,255,255,.025);
}

.v27-report-kpis strong {
    display: block;
    margin-top: 6px;
    color: #eaf1fb;
    font-size: 20px;
}

.v27-report-kpis small {
    display: block;
    margin-top: 4px;
    color: #65768c;
    font-size: 11px;
}

.v27-report-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 16px;
    margin-bottom: 10px;
}

.v27-report-panel {
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
    box-shadow: 0 14px 30px rgba(0,0,0,.13);
}

.v27-report-chart-panel {
    min-height: 287px;
}

.v27-report-days-chart {
    display: grid;
    grid-template-columns: repeat(14, minmax(8px,1fr));
    align-items: end;
    gap: 5px;
    height: 190px;
    padding-top: 10px;
}

.v27-report-day-bar {
    display: grid;
    grid-template-rows: 24px 1fr 15px;
    align-items: end;
    height: 100%;
    min-width: 0;
}

.v27-report-day-value {
    overflow: hidden;
    color: #71839a;
    font-size: 11px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-report-day-track {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
}

.v27-report-day-track::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 1px;
    margin: auto;
    background: rgba(148,163,184,.045);
}

.v27-report-day-track i {
    position: relative;
    z-index: 1;
    display: block;
    width: min(15px, 74%);
    min-height: 3px;
    border-radius: 7px 7px 3px 3px;
    background: linear-gradient(180deg, #7c5cff, #00d4ff);
}

.v27-report-day-bar > span {
    overflow: hidden;
    color: #5f7188;
    font-size: 11px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-report-chart-note {
    display: grid;
    grid-template-columns: auto auto auto auto;
    justify-content: start;
    align-items: center;
    gap: 7px;
    margin-top: 10px;
    color: #687a91;
    font-size: 11px;
}

.v27-report-chart-note strong {
    margin-right: 10px;
    color: #dfe8f5;
    font-size: 14px;
}

.v27-report-payment-item {
    margin-bottom: 14px;
}

.v27-report-payment-item:last-child {
    margin-bottom: 0;
}

.v27-report-payment-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
}

.v27-report-payment-top span {
    color: #9aa9bc;
    font-size: 16px;
}

.v27-report-payment-top strong {
    color: #e7eef8;
    font-size: 14px;
}

.v27-report-payment-track {
    height: 8px;
    overflow: hidden;
    margin-top: 7px;
    border-radius: 999px;
    background: rgba(255,255,255,.055);
}

.v27-report-payment-track i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #7c5cff, #00d4ff);
}

.v27-report-payment-item small {
    display: block;
    margin-top: 4px;
    color: #65768c;
    font-size: 14px;
}

.v27-report-ranking {
    overflow: hidden;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 14px;
}

.v27-report-ranking-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 10px;
    border-bottom: 1px solid rgba(148,163,184,.07);
}

.v27-report-ranking-row:last-child {
    border-bottom: 0;
}

.v27-report-rank {
    display: grid;
    place-items: center;
    width: 27px;
    height: 27px;
    border-radius: 9px;
    color: #a99fff;
    background: rgba(124,92,255,.08);
    border: 1px solid rgba(124,92,255,.14);
    font-size: 16px;
    font-weight: 900;
}

.v27-report-rank-info {
    min-width: 0;
}

.v27-report-rank-info strong {
    display: block;
    overflow: hidden;
    color: #dfe8f5;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-report-rank-info span {
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: #66788f;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-report-rank-money {
    color: #eaf1fb;
    font-size: 16px;
}

.v27-report-stock-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 7px;
}

.v27-report-stock-grid > div {
    padding: 11px;
    border-radius: 12px;
    background: rgba(255,255,255,.028);
    border: 1px solid rgba(148,163,184,.07);
}

.v27-report-stock-grid span {
    display: block;
    color: #71839a;
    font-size: 8px;
    font-weight: 900;
}

.v27-report-stock-grid strong {
    display: block;
    margin-top: 5px;
    color: #e5edf8;
    font-size: 26px;
}

.v27-report-wide-button {
    width: 100%;
    margin-top: 8px;
}

.v27-report-insights {
    margin-bottom: 10px;
}

.v27-report-insight-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 8px;
}

.v27-report-insight-grid > div {
    min-width: 0;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(148,163,184,.07);
}

.v27-report-insight-grid > div > div {
    font-size: 19px;
}

.v27-report-insight-grid span {
    display: block;
    margin-top: 7px;
    color: #65778d;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .08em;
}

.v27-report-insight-grid strong {
    display: block;
    overflow: hidden;
    margin-top: 4px;
    color: #e5edf8;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-report-insight-grid small {
    display: block;
    margin-top: 4px;
    color: #6c7e94;
    font-size: 8px;
    line-height: 1.4;
}

.v27-report-empty {
    display: grid;
    place-items: center;
    min-height: 115px;
    color: #64768d;
    font-size: 16px;
    text-align: center;
}

.v27-report-footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

@media (max-width: 950px) {
    .v27-report-kpis {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v27-report-grid {
        grid-template-columns: 1fr;
    }

    .v27-report-insight-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }
}

@media (max-width: 620px) {
    .v27-report-hero {
        padding: 18px;
        border-radius: 20px;
    }

    .v27-report-hero-icon {
        display: none;
    }

    .v27-report-periods {
        grid-template-columns: 1fr;
    }

    .v27-report-kpis {
        grid-template-columns: 1fr 1fr;
    }

    .v27-report-days-chart {
        gap: 2px;
    }

    .v27-report-chart-note {
        grid-template-columns: auto auto;
    }

    .v27-report-insight-grid {
        grid-template-columns: 1fr 1fr;
    }
}

.v27-cash-page {
    max-width: 1120px;
    margin: 0 auto;
}

.v27-cash-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 15px;
    padding: 23px;
    border: 1px solid rgba(34,197,94,.15);
    border-radius: 24px;
    background:
        radial-gradient(circle at 95% 0%, rgba(34,197,94,.12), transparent 30%),
        radial-gradient(circle at 0% 0%, rgba(124,92,255,.15), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
    box-shadow: 0 22px 55px rgba(0,0,0,.24);
}

.v27-cash-hero h1 {
    margin: 3px 0 5px;
    font-size: clamp(27px, 4vw, 39px);
    letter-spacing: -.04em;
}

.v27-cash-hero p {
    margin: 0;
    color: #8fa0b7;
    font-size: 14px;
}

.v27-cash-hero-icon,
.v27-cash-state {
    display: grid;
    place-items: center;
    min-width: 74px;
    min-height: 74px;
    padding: 0 14px;
    box-sizing: border-box;
    border-radius: 22px;
    background: rgba(34,197,94,.07);
    border: 1px solid rgba(34,197,94,.16);
    color: #9be8b0;
    font-size: 30px;
    font-weight: 900;
    text-align: center;
}

.v27-cash-state {
    min-width: 150px;
    min-height: 46px;
    border-radius: 999px;
    font-size: 16px;
    letter-spacing: .08em;
}

.v27-cash-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 14px;
}

.v27-cash-actions button {
    margin: 0;
}

.v27-cash-summary {
    display: grid;
    grid-template-columns: 1.3fr repeat(3, 1fr);
    gap: 9px;
    margin-bottom: 10px;
}

.v27-cash-summary > div {
    min-height: 92px;
    padding: 14px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018));
}

.v27-cash-summary span {
    display: block;
    color: #71839a;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .10em;
}

.v27-cash-summary strong {
    display: block;
    margin-top: 6px;
    color: #edf4fd;
    font-size: 23px;
    letter-spacing: -.03em;
}

.v27-cash-summary small {
    color: #65768c;
    font-size: 11px;
}

.v27-cash-total-card {
    border-color: rgba(34,197,94,.20) !important;
    background:
        linear-gradient(145deg, rgba(34,197,94,.11), rgba(0,212,255,.035)) !important;
}

.v27-cash-total-card strong {
    color: #86efac;
    font-size: 29px;
}

.v27-cash-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 10px;
}

.v27-cash-panel {
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
    box-shadow: 0 14px 30px rgba(0,0,0,.13);
    margin-bottom: 10px;
}

.v27-cash-grid .v27-cash-panel {
    margin-bottom: 0;
}

.v27-cash-line,
.v27-payment-big {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(148,163,184,.08);
}

.v27-cash-line span,
.v27-payment-big span {
    color: #9aa9bc;
    font-size: 16px;
}

.v27-cash-line strong,
.v27-payment-big strong {
    color: #e7eef8;
    font-size: 12px;
}

.v27-cash-total-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding: 12px;
    border-radius: 13px;
    background: rgba(34,197,94,.07);
    border: 1px solid rgba(34,197,94,.15);
}

.v27-cash-total-line span {
    color: #79c98f;
    font-size: 11px;
    font-weight: 900;
}

.v27-cash-total-line strong {
    color: #86efac;
    font-size: 15px;
}

.v27-payment-big {
    padding: 12px 0;
}

.v27-payment-big.v27-payment-total {
    margin-top: 8px;
    padding: 12px;
    border: 1px solid rgba(124,92,255,.15);
    border-radius: 13px;
    background: rgba(124,92,255,.07);
}

.v27-payment-big.v27-payment-total span {
    color: #9183ff;
}

.v27-payment-big.v27-payment-total strong {
    color: #fff;
    font-size: 15px;
}

.v27-cash-movements {
    overflow: hidden;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 14px;
}

.v27-cash-movement {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 16px;
    padding: 11px 12px;
    border-bottom: 1px solid rgba(148,163,184,.07);
}

.v27-cash-movement:last-child {
    border-bottom: 0;
}

.v27-cash-movement-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 11px;
    font-size: 14px;
}

.v27-cash-movement-icon.in {
    background: rgba(34,197,94,.08);
    border: 1px solid rgba(34,197,94,.14);
}

.v27-cash-movement-icon.out {
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.14);
}

.v27-cash-movement-info {
    min-width: 0;
}

.v27-cash-movement-info strong {
    display: block;
    overflow: hidden;
    color: #dfe8f5;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-cash-movement-info span {
    display: block;
    margin-top: 3px;
    color: #68798f;
    font-size: 14px;
}

.v27-cash-movement-amount {
    font-size: 11px;
    font-weight: 900;
}

.v27-cash-movement-amount.in {
    color: #86efac;
}

.v27-cash-movement-amount.out {
    color: #fca5a5;
}

.v27-cash-movement button {
    margin: 0;
    padding: 6px 7px;
    font-size: 11px;
}

.v27-cash-mini-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 7px;
}

.v27-cash-mini-grid > div {
    padding: 10px;
    border-radius: 12px;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(148,163,184,.07);
}

.v27-cash-mini-grid span {
    display: block;
    color: #68798f;
    font-size: 8px;
    font-weight: 900;
}

.v27-cash-mini-grid strong {
    display: block;
    margin-top: 5px;
    color: #dfe8f5;
    font-size: 16px;
}

.v27-cash-bottom {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 2px;
}

.v27-cash-bottom button {
    margin: 0;
}

.v27-close-action {
    width: 100%;
    margin-bottom: 7px !important;
    background: linear-gradient(135deg, rgba(239,68,68,.22), rgba(124,92,255,.09)) !important;
    border-color: rgba(239,68,68,.23) !important;
}

.v27-count-panel > p {
    color: #7b8da4;
    font-size: 16px;
    line-height: 1.55;
}

.v27-cash-formula {
    padding: 11px;
    border-radius: 14px;
    background: rgba(255,255,255,.025);
}

.v27-cash-formula > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(148,163,184,.07);
}

.v27-cash-formula span {
    color: #71839a;
    font-size: 11px;
}

.v27-cash-formula strong {
    color: #dfe8f5;
    font-size: 16px;
}

.v27-cash-formula-total {
    margin-top: 5px;
    padding: 10px !important;
    border: 0 !important;
    border-radius: 11px;
    background: rgba(34,197,94,.07);
}

.v27-cash-formula-total span {
    color: #79c98f;
    font-weight: 900;
}

.v27-cash-formula-total strong {
    color: #86efac;
    font-size: 14px;
}

@media (max-width: 900px) {
    .v27-cash-summary {
        grid-template-columns: 1fr 1fr;
    }

    .v27-cash-summary .v27-cash-total-card {
        grid-column: 1 / -1;
    }

    .v27-cash-grid {
        grid-template-columns: 1fr;
    }

    .v27-cash-mini-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }
}

@media (max-width: 620px) {
    .v27-cash-hero {
        padding: 18px;
        border-radius: 20px;
    }

    .v27-cash-hero-icon {
        display: none;
    }

    .v27-cash-state {
        min-width: 130px;
        min-height: 64px;
        font-size: 8px;
    }

    .v27-cash-summary {
        grid-template-columns: 1fr 1fr;
    }

    .v27-cash-summary strong {
        font-size: 18px;
    }

    .v27-cash-summary .v27-cash-total-card strong {
        font-size: 25px;
    }

    .v27-cash-movement {
        grid-template-columns: auto 1fr auto;
    }

    .v27-cash-movement button {
        grid-column: 1 / -1;
        justify-self: end;
    }
}

.v27-inventory-page {
    max-width: 1180px;
    margin: 0 auto;
}

.v27-inventory-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
    padding: 23px;
    border: 1px solid rgba(0,212,255,.16);
    border-radius: 24px;
    background:
        radial-gradient(circle at 95% 0%, rgba(0,212,255,.13), transparent 30%),
        radial-gradient(circle at 0% 0%, rgba(124,92,255,.15), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
    box-shadow: 0 22px 55px rgba(0,0,0,.25);
}

.v27-inventory-hero h1 {
    margin: 3px 0 5px;
    font-size: clamp(27px, 4vw, 39px);
    letter-spacing: -.04em;
}

.v27-inventory-hero p {
    margin: 0;
    max-width: 730px;
    color: #8fa0b7;
    font-size: 14px;
}

.v27-inventory-hero-icon {
    display: grid;
    place-items: center;
    width: 74px;
    height: 74px;
    flex: 0 0 74px;
    border-radius: 23px;
    background: rgba(0,212,255,.07);
    border: 1px solid rgba(0,212,255,.17);
    font-size: 42px;
}

.v27-inventory-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 9px;
    margin-bottom: 10px;
}

.v27-inventory-stat {
    min-height: 99px;
    padding: 14px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 18px;
    background:
        linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018));
}

.v27-inventory-stat span {
    display: block;
    color: #71839a;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .10em;
}

.v27-inventory-stat strong {
    display: block;
    margin-top: 6px;
    color: #f2f7ff;
    font-size: 23px;
    letter-spacing: -.03em;
}

.v27-inventory-stat small {
    color: #65768c;
    font-size: 16px;
}

.v27-stat-positive strong {
    color: #86efac;
}

.v27-inventory-alerts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 8px;
    margin-bottom: 10px;
}

.v27-inventory-alert {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 18px;
    border-radius: 14px;
    border: 1px solid rgba(148,163,184,.10);
    background: rgba(255,255,255,.025);
}

.v27-inventory-alert strong {
    color: #dfe8f5;
    font-size: 12px;
}

.v27-inventory-alert span {
    color: #6d7e94;
    font-size: 11px;
    font-weight: 800;
}

.v27-inventory-alert.warning {
    border-color: rgba(245,158,11,.20);
    background: rgba(245,158,11,.06);
}

.v27-inventory-alert.warning strong {
    color: #fcd34d;
}

.v27-inventory-alert.danger {
    border-color: rgba(239,68,68,.20);
    background: rgba(239,68,68,.06);
}

.v27-inventory-alert.danger strong {
    color: #fca5a5;
}

.v27-inventory-sales-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 8px;
    margin-bottom: 15px;
    padding: 11px;
    border: 1px solid rgba(124,92,255,.13);
    border-radius: 22px;
    background: rgba(124,92,255,.045);
}

.v27-inventory-sales-strip > div {
    padding: 5px 9px;
    border-right: 1px solid rgba(148,163,184,.08);
}

.v27-inventory-sales-strip > div:last-child {
    border-right: 0;
}

.v27-inventory-sales-strip span {
    display: block;
    color: #697b91;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v27-inventory-sales-strip strong {
    display: block;
    margin-top: 4px;
    color: #e9f0fa;
    font-size: 15px;
}

.v27-inventory-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
}

.v27-inventory-search {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 230px;
    flex: 1;
    padding: 0 11px;
    height: 42px;
    border: 1px solid rgba(148,163,184,.13);
    border-radius: 13px;
    background: rgba(255,255,255,.035);
}

.v27-inventory-search span {
    font-size: 14px;
}

.v27-inventory-search input {
    width: 100%;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #e8eff9;
    font-size: 14px;
}

.v27-inventory-search input::placeholder {
    color: #617289;
}

.v27-inventory-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.v27-inventory-filters button {
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
}

.v27-inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(285px,1fr));
    gap: 11px;
}

.v27-inventory-product {
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 20px;
    background:
        linear-gradient(145deg, rgba(17,24,39,.92), rgba(10,15,27,.88));
    box-shadow: 0 15px 35px rgba(0,0,0,.18);
    transition: transform .18s ease, border-color .18s ease;
}

.v27-inventory-product:hover {
    transform: translateY(-2px);
    border-color: rgba(124,92,255,.25);
}

.v27-stock-low {
    border-color: rgba(245,158,11,.18);
}

.v27-stock-out {
    border-color: rgba(239,68,68,.22);
}

.v27-inventory-product-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
}

.v27-product-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 15px;
    background:
        linear-gradient(145deg, rgba(0,212,255,.08), rgba(124,92,255,.10));
    border: 1px solid rgba(124,92,255,.15);
    font-size: 26px;
}

.v27-product-title {
    min-width: 0;
}

.v27-product-title h3 {
    overflow: hidden;
    margin: 0;
    color: #eaf1fb;
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-product-title span {
    display: block;
    margin-top: 4px;
    color: #7a8ca3;
    font-size: 11px;
    font-weight: 900;
}

.v27-stock-number {
    min-width: 48px;
    text-align: right;
}

.v27-stock-number strong {
    display: block;
    color: #f4f8ff;
    font-size: 25px;
    line-height: .95;
}

.v27-stock-number small {
    color: #66788e;
    font-size: 14px;
}

.v27-stock-progress {
    margin: 13px 0 11px;
}

.v27-stock-progress-track {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,.06);
}

.v27-stock-progress-track i {
    display: block;
    height: 100%;
    min-width: 0;
    border-radius: inherit;
    background: linear-gradient(90deg, #7c5cff, #00d4ff);
}

.v27-stock-low .v27-stock-progress-track i {
    background: linear-gradient(90deg, #f59e0b, #facc15);
}

.v27-stock-out .v27-stock-progress-track i {
    background: #ef4444;
}

.v27-stock-labels {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 5px;
    color: #61738a;
    font-size: 14px;
}

.v27-product-prices {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 6px;
}

.v27-product-prices > div {
    padding: 9px;
    border-radius: 12px;
    background: rgba(255,255,255,.028);
    border: 1px solid rgba(148,163,184,.07);
}

.v27-product-prices span {
    display: block;
    color: #66788f;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .08em;
}

.v27-product-prices strong {
    display: block;
    margin-top: 4px;
    color: #dfe8f5;
    font-size: 12px;
}

.v27-product-prices small {
    display: block;
    margin-top: 2px;
    color: #7c8da3;
    font-size: 14px;
}

.v27-product-footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 10px 0;
    color: #64758c;
    font-size: 14px;
}

.v27-product-footer strong {
    color: #9aabc0;
}

.v27-product-actions {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1fr;
    gap: 5px;
}

.v27-product-actions button {
    margin: 0;
    padding: 8px 5px;
    font-size: 11px;
}

.v27-product-actions button:last-child {
    grid-column: 1 / -1;
}

.v27-product-actions .v27-product-sell {
    background:
        linear-gradient(135deg, rgba(124,92,255,.24), rgba(0,212,255,.10));
    border-color: rgba(124,92,255,.27);
}

.v27-hidden-heading {
    margin-top: 25px;
}

.v27-hidden-products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px,1fr));
    gap: 8px;
    margin-bottom: 18px;
}

.v27-hidden-product {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 11px 12px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 13px;
    background: rgba(255,255,255,.025);
}

.v27-hidden-product strong {
    display: block;
    color: #aebbd0;
    font-size: 16px;
}

.v27-hidden-product span {
    display: block;
    margin-top: 3px;
    color: #65768c;
    font-size: 14px;
}

.v27-hidden-product button {
    margin: 0;
    padding: 7px 9px;
    font-size: 11px;
}

@media (max-width: 950px) {
    .v27-inventory-stats,
    .v27-inventory-alerts {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v27-inventory-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .v27-inventory-search {
        min-width: 0;
    }
}

@media (max-width: 620px) {
    .v27-inventory-hero {
        padding: 18px;
        border-radius: 20px;
    }

    .v27-inventory-hero-icon {
        display: none;
    }

    .v27-inventory-stats,
    .v27-inventory-alerts {
        grid-template-columns: 1fr 1fr;
    }

    .v27-inventory-sales-strip {
        grid-template-columns: 1fr;
    }

    .v27-inventory-sales-strip > div {
        border-right: 0;
        border-bottom: 1px solid rgba(148,163,184,.08);
    }

    .v27-inventory-sales-strip > div:last-child {
        border-bottom: 0;
    }

    .v27-inventory-filters {
        width: 100%;
    }

    .v27-inventory-filters button {
        flex: 1;
    }

    .v27-product-actions {
        grid-template-columns: 1fr 1fr;
    }

    .v27-product-actions .v27-product-sell {
        grid-column: 1 / -1;
    }

    .v27-product-actions button:last-child {
        grid-column: auto;
    }
}

.v27-dashboard-pro {
    padding: 22px;
}

.v27-dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}

.v27-dashboard-header h1 {
    margin: 2px 0 3px;
    font-size: clamp(29px, 5vw, 43px);
    letter-spacing: -.045em;
}

.v27-dashboard-header p {
    margin: 0;
    color: #8394ab;
    font-size: 12px;
}

.v27-dashboard-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 12px;
    border: 1px solid rgba(34,197,94,.20);
    border-radius: 999px;
    background: rgba(34,197,94,.07);
    color: #9be8b0;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: .08em;
}

.v27-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 12px rgba(34,197,94,.55);
}

.v27-live-dot-off {
    background: #ef4444;
    box-shadow: 0 0 12px rgba(239,68,68,.45);
}

.v27-dashboard-main-money {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-top: 18px;
    padding: 19px 21px;
    border: 1px solid rgba(124,92,255,.22);
    border-radius: 20px;
    background:
        linear-gradient(135deg, rgba(124,92,255,.17), rgba(0,212,255,.06)),
        rgba(255,255,255,.025);
}

.v27-dashboard-main-money span {
    display: block;
    color: #8b7dff;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .15em;
}

.v27-dashboard-main-money strong {
    display: block;
    margin-top: 3px;
    color: #fff;
    font-size: clamp(31px, 6vw, 48px);
    line-height: 1;
    letter-spacing: -.05em;
}

.v27-dashboard-main-money small {
    display: block;
    margin-top: 7px;
    color: #788aa2;
    font-size: 16px;
}

.v27-money-icon {
    display: grid;
    place-items: center;
    width: 62px;
    height: 62px;
    flex: 0 0 62px;
    border-radius: 22px;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.08);
    font-size: 29px;
}

.v27-dashboard-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 9px;
    margin-top: 10px;
}

.v27-dashboard-metrics .v27-metric-card {
    min-height: 100px;
}

.v27-dashboard-grid {
    display: grid;
    grid-template-columns: 1.25fr .9fr;
    gap: 16px;
    margin-top: 10px;
}

.v27-dashboard-panel {
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background:
        linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
    box-shadow: 0 14px 32px rgba(0,0,0,.14);
}

.v27-hour-panel {
    min-height: 260px;
}

.v27-panel-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
}

.v27-panel-head > div > span {
    color: #72839a;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .13em;
}

.v27-panel-head h2 {
    margin: 3px 0 0;
    color: #eaf1fb;
    font-size: 26px;
}

.v27-panel-head > strong,
.v27-panel-head > small {
    color: #74869d;
    font-size: 16px;
}

.v27-panel-head button {
    margin: 0;
    padding: 7px 9px;
    font-size: 16px;
}

.v27-hour-chart {
    display: grid;
    grid-template-columns: repeat(24, minmax(7px,1fr));
    align-items: end;
    gap: 4px;
    height: 174px;
    padding-top: 12px;
}

.v27-hour-column {
    display: grid;
    grid-template-rows: 22px 1fr 14px;
    align-items: end;
    height: 100%;
    min-width: 0;
}

.v27-hour-value {
    overflow: hidden;
    color: #71839a;
    font-size: 11px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-hour-track {
    position: relative;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.v27-hour-track::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 1px;
    margin: auto;
    background: rgba(148,163,184,.045);
}

.v27-hour-track i {
    position: relative;
    z-index: 1;
    display: block;
    width: min(14px, 72%);
    min-height: 3px;
    border-radius: 7px 7px 3px 3px;
    background: linear-gradient(180deg, #00d4ff, #7c5cff);
    box-shadow: 0 0 13px rgba(124,92,255,.20);
}

.v27-hour-column > span {
    color: #596a80;
    font-size: 11px;
    text-align: center;
}

.v27-panel-note {
    margin: 9px 0 0;
    color: #60728a;
    font-size: 11px;
}

.v27-payment-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 11px 0;
    border-bottom: 1px solid rgba(148,163,184,.08);
}

.v27-payment-row span {
    color: #9aa9bc;
    font-size: 14px;
}

.v27-payment-row strong {
    color: #e7eef8;
    font-size: 12px;
}

.v27-payment-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 12px;
    padding: 12px;
    border-radius: 13px;
    background: rgba(124,92,255,.08);
    border: 1px solid rgba(124,92,255,.15);
}

.v27-payment-total span {
    color: #8c7eff;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .1em;
}

.v27-payment-total strong {
    color: #fff;
    font-size: 15px;
}

.v27-highlight {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 11px;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(148,163,184,.08);
}

.v27-highlight:last-child {
    border-bottom: 0;
}

.v27-highlight-icon {
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    border-radius: 13px;
    background: rgba(124,92,255,.09);
    border: 1px solid rgba(124,92,255,.16);
    font-size: 20px;
}

.v27-highlight span {
    display: block;
    color: #68798f;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .10em;
}

.v27-highlight strong {
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: #eaf1fb;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-highlight small {
    display: block;
    margin-top: 3px;
    color: #6f8198;
    font-size: 11px;
}

.v27-reservation-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.v27-reservation-summary > div {
    padding: 12px;
    border-radius: 13px;
    background: rgba(59,130,246,.06);
    border: 1px solid rgba(59,130,246,.11);
}

.v27-reservation-summary span {
    display: block;
    color: #71839a;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .1em;
}

.v27-reservation-summary strong {
    display: block;
    margin-top: 4px;
    color: #dfe9f7;
    font-size: 26px;
}

.v27-next-reservation {
    margin: 12px 0 0;
    color: #7e90a8;
    font-size: 16px;
    line-height: 1.5;
}

.v27-live-panel {
    margin-top: 10px;
}

.v27-live-stations {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px,1fr));
    gap: 9px;
}

.v27-live-station {
    min-width: 0;
    padding: 22px;
    border-radius: 15px;
    border: 1px solid rgba(148,163,184,.10);
}

.v27-live-playing {
    background: linear-gradient(145deg, rgba(34,197,94,.13), rgba(0,212,255,.04));
    border-color: rgba(34,197,94,.20);
}

.v27-live-paused {
    background: linear-gradient(145deg, rgba(245,158,11,.12), rgba(124,92,255,.04));
    border-color: rgba(245,158,11,.20);
}

.v27-live-ended {
    background: rgba(239,68,68,.08);
    border-color: rgba(239,68,68,.18);
}

.v27-live-available {
    background: rgba(255,255,255,.025);
}

.v27-live-station-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 7px;
}

.v27-live-station-top strong {
    overflow: hidden;
    color: #e4ecf7;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-live-station-top span {
    flex: 0 0 auto;
    color: #7e91a9;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
}

.v27-live-station-detail {
    margin-top: 7px;
    overflow: hidden;
    color: #73859c;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-dashboard-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.v27-dashboard-tools button {
    margin: 0;
}

@media (max-width: 1000px) {
    .v27-dashboard-metrics {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v27-dashboard-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 620px) {
    .v27-dashboard-pro {
        padding: 16px;
    }

    .v27-dashboard-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .v27-dashboard-status {
        align-self: flex-start;
    }

    .v27-dashboard-metrics {
        grid-template-columns: 1fr 1fr;
    }

    .v27-dashboard-main-money {
        padding: 16px;
    }

    .v27-money-icon {
        width: 50px;
        height: 50px;
        flex-basis: 50px;
        font-size: 23px;
    }

    .v27-hour-chart {
        gap: 2px;
    }

    .v27-hour-track i {
        width: 70%;
    }
}

.v27-page-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
    padding: 23px;
    border: 1px solid rgba(124,92,255,.20);
    border-radius: 24px;
    background:
        radial-gradient(circle at 92% 0%, rgba(0,212,255,.14), transparent 30%),
        radial-gradient(circle at 0% 0%, rgba(124,92,255,.18), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
    box-shadow: 0 22px 55px rgba(0,0,0,.25);
}

.v27-page-hero h1 {
    margin: 3px 0 5px;
    font-size: clamp(26px, 4vw, 39px);
    letter-spacing: -.035em;
}

.v27-page-hero p {
    margin: 0;
    max-width: 720px;
    color: #8fa0b7;
}

.v27-eyebrow {
    color: #8f7dff;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: .16em;
}

.v27-hero-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 24px;
    background: rgba(124,92,255,.11);
    border: 1px solid rgba(124,92,255,.22);
    font-size: 36px;
}

.v27-membership-status {
    padding: 9px 12px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .07em;
}

.v27-status-on {
    color: #86efac;
    background: rgba(34,197,94,.09);
    border: 1px solid rgba(34,197,94,.22);
}

.v27-status-off {
    color: #fca5a5;
    background: rgba(239,68,68,.09);
    border: 1px solid rgba(239,68,68,.22);
}

.v27-page-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
}

.v27-page-actions button {
    margin: 0;
}

.v27-membership-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.v27-client-summary {
    grid-template-columns: repeat(3, minmax(0,1fr));
}

.v27-summary-card {
    min-height: 100px;
    padding: 15px;
    box-sizing: border-box;
    border: 1px solid rgba(148,163,184,.12);
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
    box-shadow: 0 13px 28px rgba(0,0,0,.14);
}

.v27-summary-card span {
    display: block;
    color: #73849a;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: .11em;
}

.v27-summary-card strong {
    display: block;
    margin-top: 7px;
    color: #f4f8ff;
    font-size: 25px;
    font-weight: 900;
    letter-spacing: -.03em;
}

.v27-summary-card small {
    color: #67788e;
    font-size: 14px;
}

.v27-section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 15px;
    margin: 6px 0 12px;
}

.v27-section-heading > div > span {
    color: #7c8da3;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .14em;
}

.v27-section-heading h2 {
    margin: 3px 0 0;
    font-size: 26px;
}

.v27-section-heading > small,
.v27-section-heading > strong {
    color: #74859a;
    font-size: 14px;
}

.v27-member-grid,
.v27-client-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(285px, 1fr));
    gap: 12px;
}

.v27-member-card,
.v27-client-card {
    padding: 22px;
    border: 1px solid rgba(148,163,184,.12);
    border-radius: 20px;
    background: linear-gradient(145deg, rgba(17,24,39,.91), rgba(10,15,27,.87));
    box-shadow: 0 17px 38px rgba(0,0,0,.20);
    transition: transform .18s ease, border-color .18s ease;
}

.v27-member-card:hover,
.v27-client-card:hover {
    transform: translateY(-2px);
    border-color: rgba(124,92,255,.28);
}

.v27-member-card-top,
.v27-client-card-head {
    display: flex;
    align-items: center;
    gap: 11px;
}

.v27-member-avatar,
.v27-client-avatar {
    display: grid;
    place-items: center;
    width: 47px;
    height: 47px;
    flex: 0 0 47px;
    border-radius: 15px;
    background: linear-gradient(145deg, rgba(124,92,255,.18), rgba(0,212,255,.06));
    border: 1px solid rgba(124,92,255,.18);
    font-size: 22px;
}

.v27-member-identity,
.v27-client-card-head > div:last-child {
    min-width: 0;
}

.v27-member-identity h3,
.v27-client-card-head h3 {
    overflow: hidden;
    margin: 0;
    color: #edf3fc;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-member-identity span,
.v27-client-card-head span {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #73849a;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-level-pill {
    margin-left: auto;
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(245,158,11,.08);
    border: 1px solid rgba(245,158,11,.18);
    color: #fcd34d;
    font-size: 16px;
    font-weight: 850;
    white-space: nowrap;
}

.v27-points-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 15px;
    padding: 12px;
    border-radius: 15px;
    background: linear-gradient(135deg, rgba(124,92,255,.12), rgba(0,212,255,.045));
    border: 1px solid rgba(124,92,255,.16);
}

.v27-points-box span,
.v27-member-mini-stats span,
.v27-client-stats span,
.v27-client-last span {
    display: block;
    color: #68788e;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v27-points-box strong {
    display: block;
    margin-top: 3px;
    color: #fff;
    font-size: 25px;
    font-weight: 950;
}

.v27-points-next {
    color: #aebbd0;
    font-size: 16px;
    text-align: right;
}

.v27-progress {
    margin: 11px 0 13px;
}

.v27-progress-bar {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.04);
}

.v27-progress-bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #7c5cff, #00d4ff);
    box-shadow: 0 0 14px rgba(124,92,255,.28);
}

.v27-progress-labels,
.v27-big-progress-head {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    color: #65758b;
    font-size: 11px;
}

.v27-member-mini-stats,
.v27-client-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 7px;
    margin: 10px 0 13px;
}

.v27-member-mini-stats > div,
.v27-client-stats > div {
    padding: 9px;
    border-radius: 12px;
    background: rgba(255,255,255,.032);
    border: 1px solid rgba(148,163,184,.08);
}

.v27-member-mini-stats strong,
.v27-client-stats strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #dfe8f5;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-member-open {
    width: 100%;
    margin: 0 !important;
    background: rgba(124,92,255,.10) !important;
    border-color: rgba(124,92,255,.20) !important;
    box-shadow: none !important;
}

.v27-empty-state {
    padding: 42px 20px;
    margin-top: 10px;
    border: 1px dashed rgba(148,163,184,.17);
    border-radius: 22px;
    background: rgba(255,255,255,.025);
    text-align: center;
}

.v27-empty-icon {
    font-size: 44px;
}

.v27-empty-state h2 {
    margin: 12px 0 5px;
}

.v27-empty-state p {
    max-width: 540px;
    margin: 0 auto 16px;
}

.v27-profile-page {
    max-width: 1050px;
    margin: 0 auto;
}

.v27-back-button {
    background: rgba(255,255,255,.045) !important;
    box-shadow: none !important;
}

.v27-profile-hero {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    margin: 13px 0;
    padding: 22px;
    border: 1px solid rgba(124,92,255,.22);
    border-radius: 23px;
    background: radial-gradient(circle at 95% 0%, rgba(0,212,255,.13), transparent 30%), linear-gradient(145deg, rgba(20,27,47,.96), rgba(10,15,27,.94));
}

.v27-profile-avatar {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(124,92,255,.23), rgba(0,212,255,.07));
    border: 1px solid rgba(124,92,255,.24);
    font-size: 42px;
}

.v27-profile-identity h1 {
    margin: 3px 0 4px;
    font-size: clamp(25px, 4vw, 37px);
}

.v27-profile-identity p {
    margin: 0;
}

.v27-profile-level {
    padding: 12px 15px;
    border-radius: 16px;
    background: rgba(245,158,11,.07);
    border: 1px solid rgba(245,158,11,.17);
    text-align: center;
}

.v27-profile-level span {
    display: block;
    color: #9b8662;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .13em;
}

.v27-profile-level strong {
    display: block;
    margin-top: 4px;
    color: #fcd34d;
}

.v27-profile-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 16px;
}

.v27-profile-stat {
    padding: 15px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background: rgba(255,255,255,.035);
}

.v27-profile-stat span {
    color: #708198;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .10em;
}

.v27-profile-stat strong {
    display: block;
    margin-top: 7px;
    color: #f4f8ff;
    font-size: 22px;
}

.v27-profile-stat small {
    display: block;
    margin-top: 3px;
    color: #68788e;
    font-size: 16px;
}

.v27-profile-section {
    margin-top: 18px;
    padding: 22px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 20px;
    background: rgba(10,15,27,.58);
}

.v27-big-progress {
    padding: 22px;
    border-radius: 15px;
    background: rgba(255,255,255,.028);
}

.v27-progress-large {
    height: 10px;
    margin-top: 8px;
}

.v27-big-progress p {
    margin: 9px 0 0;
    color: #8494a9;
    font-size: 14px;
}

.v27-rewards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 16px;
}

.v27-reward-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: center;
    padding: 22px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 16px;
    background: rgba(255,255,255,.032);
}

.v27-reward-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: rgba(245,158,11,.08);
    border: 1px solid rgba(245,158,11,.16);
    font-size: 20px;
}

.v27-reward-card h3 {
    margin: 0;
    color: #e8eef8;
    font-size: 16px;
}

.v27-reward-card p {
    margin: 3px 0 0;
    font-size: 16px;
}

.v27-reward-card button {
    grid-column: 1 / -1;
    width: 100%;
    margin: 2px 0 0;
}

.v27-reward-locked {
    grid-column: 1 / -1;
    display: block;
    padding: 9px;
    border-radius: 10px;
    background: rgba(255,255,255,.03);
    color: #64748b;
    font-size: 16px;
    text-align: center;
}

.v27-movement-list {
    overflow: hidden;
    border: 1px solid rgba(148,163,184,.09);
    border-radius: 15px;
}

.v27-movement {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 11px 13px;
    border-bottom: 1px solid rgba(148,163,184,.08);
}

.v27-movement:last-child {
    border-bottom: 0;
}

.v27-movement-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.v27-movement-dot.positive {
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34,197,94,.35);
}

.v27-movement-dot.negative {
    background: #ef4444;
    box-shadow: 0 0 10px rgba(239,68,68,.28);
}

.v27-movement-content {
    min-width: 0;
}

.v27-movement-content strong {
    display: block;
    overflow: hidden;
    color: #dbe5f2;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-movement-content span {
    display: block;
    margin-top: 3px;
    color: #66768c;
    font-size: 11px;
}

.v27-movement-points {
    font-size: 12px;
    font-weight: 900;
}

.v27-movement-points.positive { color: #86efac; }
.v27-movement-points.negative { color: #fca5a5; }

.v27-empty-inline {
    padding: 22px;
    color: #718198;
    text-align: center;
}

.v27-client-last {
    margin: 9px 0 12px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(255,255,255,.028);
}

.v27-client-last strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #aebbd0;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-bottom-note {
    margin-top: 18px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(59,130,246,.06);
    border: 1px solid rgba(59,130,246,.12);
    color: #7890ae;
    font-size: 16px;
}

@media (max-width: 900px) {
    .v27-membership-stats,
    .v27-profile-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v27-rewards-grid {
        grid-template-columns: 1fr;
    }

    .v27-profile-hero {
        grid-template-columns: auto 1fr;
    }

    .v27-profile-level {
        grid-column: 1 / -1;
        justify-self: start;
    }
}

@media (max-width: 620px) {
    .v27-page-hero {
        align-items: flex-start;
        padding: 18px;
        border-radius: 20px;
    }

    .v27-membership-status {
        font-size: 11px;
    }

    .v27-membership-stats,
    .v27-profile-grid {
        grid-template-columns: 1fr 1fr;
    }

    .v27-member-grid,
    .v27-client-grid {
        grid-template-columns: 1fr;
    }

    .v27-profile-hero {
        grid-template-columns: auto 1fr;
        padding: 22px;
    }

    .v27-profile-avatar {
        width: 56px;
        height: 56px;
        font-size: 42px;
    }

    .v27-section-heading {
        align-items: flex-start;
    }
}

.v27-station-card {
    isolation: isolate;
}

.v27-station-card::after {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    right: -90px;
    top: -90px;
    border-radius: 50%;
    background: var(--v27-station-glow, rgba(124,92,255,.07));
    filter: blur(4px);
    pointer-events: none;
    z-index: -1;
}

.v27-station-xbox {
    --v27-station-accent: #7c5cff;
    --v27-station-glow: rgba(124,92,255,.20);
}

.v27-station-pc {
    --v27-station-accent: #00d4ff;
    --v27-station-glow: rgba(0,212,255,.18);
}

.v27-station-card::before {
    background: linear-gradient(
        90deg,
        var(--v27-station-accent, #7c5cff),
        rgba(255,255,255,.10)
    );
}

.v27-pro-head {
    min-height: 58px;
}

.v27-station-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.v27-station-icon {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
    border-radius: 15px;
    background:
        linear-gradient(145deg, var(--v27-station-glow, rgba(124,92,255,.18)), rgba(255,255,255,.045));
    border: 1px solid rgba(148,163,184,.14);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
    font-size: 24px;
}

.v27-station-title-wrap h2 {
    margin: 0;
}

.v27-station-subtitle {
    margin-top: 3px;
    color: #718198;
    font-size: 11px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: .12em;
}

.v27-session-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 8px;
    margin-top: 14px;
}

.v27-session-strip > div {
    min-width: 0;
    padding: 9px 10px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 13px;
    background: rgba(255,255,255,.032);
}

.v27-session-strip span {
    display: block;
    color: #68788e;
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .10em;
}

.v27-session-strip strong {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: #dfe8f5;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-actions-title {
    margin: 17px 0 9px;
    color: #aab8cb;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .10em;
    text-transform: uppercase;
}

.v27-time-options,
.v27-control-options,
.v27-secondary-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 8px;
}

.v27-time-options button,
.v27-control-options button,
.v27-secondary-options button {
    width: 100%;
    min-height: 45px;
    margin: 0;
    box-sizing: border-box;
}

.v27-time-options {
    grid-template-columns: repeat(4, minmax(0,1fr));
}

.v27-action-primary {
    background:
        linear-gradient(145deg, rgba(124,92,255,.24), rgba(124,92,255,.09)) !important;
    border-color: rgba(124,92,255,.28) !important;
    box-shadow: none !important;
}

.v27-action-primary:hover {
    background:
        linear-gradient(145deg, rgba(124,92,255,.34), rgba(124,92,255,.14)) !important;
}

.v27-action-featured {
    background:
        linear-gradient(145deg, rgba(245,158,11,.24), rgba(124,92,255,.16)) !important;
    border-color: rgba(245,158,11,.28) !important;
}

.v27-reservation-action {
    width: 100%;
    margin-top: 9px !important;
    background:
        linear-gradient(135deg, rgba(59,130,246,.34), rgba(0,212,255,.13)) !important;
    border-color: rgba(59,130,246,.35) !important;
}

.v27-action-divider {
    height: 1px;
    margin: 16px 0 3px;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(148,163,184,.15),
        transparent
    );
}

.v27-control-options button {
    background: rgba(255,255,255,.045);
    box-shadow: none;
}

.v27-control-options button:hover {
    background: rgba(124,92,255,.13);
}

.v27-secondary-options {
    grid-template-columns: repeat(3, minmax(0,1fr));
    margin-top: 10px;
}

.v27-secondary-options button {
    background: rgba(255,255,255,.035);
    box-shadow: none;
    color: #aebbd0;
}

.v27-secondary-options .v27-start-button {
    background: rgba(34,197,94,.11);
    border-color: rgba(34,197,94,.23);
    color: #9af2b2;
}

.v27-secondary-options .v27-stop-button {
    background: rgba(239,68,68,.10);
    border-color: rgba(239,68,68,.22);
    color: #f9aaaa;
}

.estacion.jugando .tiempo {
    border-color: rgba(34,197,94,.22);
    background:
        linear-gradient(135deg, rgba(34,197,94,.07), rgba(0,212,255,.06));
}

.estacion.pausada .tiempo {
    border-color: rgba(245,158,11,.25);
    background:
        linear-gradient(135deg, rgba(245,158,11,.09), rgba(124,92,255,.06));
}

.estacion.terminada .tiempo {
    border-color: rgba(239,68,68,.22);
}

@media (max-width: 800px) {
    .v27-time-options {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v27-secondary-options {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 520px) {
    .v27-session-strip {
        grid-template-columns: 1fr 1fr;
    }

    .v27-session-strip > div:last-child {
        grid-column: 1 / -1;
    }

    .v27-station-icon {
        width: 42px;
        height: 42px;
        flex-basis: 42px;
    }
}

.v27-station-type {
    padding: 6px 9px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 999px;
    background: rgba(255,255,255,.045);
    color: #aab8cb;
    font-size: 11px;
    font-weight: 800;
}

.estado {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    margin-top: 12px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(148,163,184,.12);
    background: rgba(255,255,255,.05);
    font-size: 12px;
    font-weight: 850;
    letter-spacing: .035em;
}

.estado.jugando {
    color: #86efac;
    background: rgba(34,197,94,.10);
    border-color: rgba(34,197,94,.25);
}

.estado.por-terminar {
    color: #fcd34d;
    background: rgba(245,158,11,.10);
    border-color: rgba(245,158,11,.25);
}

.estado.pausada {
    color: #fcd34d;
    background: rgba(245,158,11,.10);
    border-color: rgba(245,158,11,.25);
}

.estado.terminada {
    color: #fca5a5;
    background: rgba(239,68,68,.10);
    border-color: rgba(239,68,68,.25);
}

.estado.disponible {
    color: #c4b5fd;
    background: rgba(124,92,255,.10);
    border-color: rgba(124,92,255,.24);
}

.tiempo {
    margin: 12px 0 14px;
    padding: 12px 15px;
    border-radius: 22px;
    background:
        linear-gradient(135deg, rgba(0,212,255,.07), rgba(124,92,255,.10));
    border: 1px solid rgba(124,92,255,.15);
    color: #f7fbff;
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: clamp(34px, 7vw, 56px);
    line-height: 1;
    font-weight: 900;
    letter-spacing: -.055em;
    text-align: center;
    text-shadow: 0 0 22px rgba(124,92,255,.20);
}

.sesion-info {
    margin: 10px 0;
    padding: 12px 14px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 15px;
    background: rgba(255,255,255,.035);
}

.sesion-info p {
    margin: 6px 0;
    color: #9eacc0;
    font-size: 16px;
}

.sesion-info strong {
    color: #e8eef8;
}

.estacion > button {
    min-height: 43px;
}

.v27-home > h3 {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: 5px 0;
    padding: 7px 11px;
    border-radius: 999px;
    background: rgba(34,197,94,.08);
    border: 1px solid rgba(34,197,94,.16);
    color: #86efac;
    font-size: 16px;
}

#modalMetodoPagoCuenta,
#modalMetodoPago {
    backdrop-filter: blur(10px);
}

@media (max-width: 720px) {
    body.v27-theme #estaciones {
        width: min(100% - 16px, 1500px);
        padding-top: 12px;
    }

    body.v27-theme #estaciones::before {
        margin-bottom: 12px;
        font-size: 11px;
    }

    .v27-dashboard-hero {
        padding: 22px;
        border-radius: 20px;
    }

    .v27-main-menu {
        grid-template-columns: repeat(2, minmax(0,1fr));
        padding: 9px;
    }

    .v27-main-menu button {
        min-height: 50px;
        padding: 9px 8px;
        font-size: 12px;
    }

    .estacion {
        padding: 15px;
        border-radius: 22px;
    }

    .tiempo {
        font-size: 39px;
    }
}

@media (min-width: 1100px) {
    .v27-home > .estacion {
        width: calc(50% - 8px);
        display: inline-block;
        vertical-align: top;
        margin: 8px 4px;
    }
}

/* ========================================
   V27.9 USUARIOS PRO
======================================== */

.v27-login-page {
    min-height: calc(100vh - 24px);
    display: grid;
    place-items: center;
    padding: 22px;
}

.v27-login-card {
    width: min(100%, 430px);
    padding: 30px;
    border: 1px solid rgba(124,92,255,.18);
    border-radius: 32px;
    background:
        radial-gradient(circle at 90% 0%, rgba(0,212,255,.11), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.97), rgba(9,14,26,.96));
    box-shadow: 0 28px 75px rgba(0,0,0,.30);
}

.v27-login-icon {
    display: grid;
    place-items: center;
    width: 70px;
    height: 70px;
    margin-bottom: 17px;
    border-radius: 22px;
    background: rgba(124,92,255,.10);
    border: 1px solid rgba(124,92,255,.18);
    font-size: 32px;
}

.v27-login-card h1 {
    margin: 4px 0 6px;
    color: #eef4fb;
    font-size: 28px;
    letter-spacing: -.04em;
}

.v27-login-card > p {
    margin: 0 0 20px;
    color: #7d8ea5;
    font-size: 14px;
}

.v27-login-card label {
    display: block;
    margin: 12px 0 6px;
    color: #9aa9bd;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
}

.v27-login-card input {
    width: 100%;
    box-sizing: border-box;
    min-height: 46px;
    padding: 11px 13px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 13px;
    outline: none;
    background: rgba(255,255,255,.035);
    color: #edf4fc;
    font-size: 16px;
}

.v27-login-card input:focus {
    border-color: rgba(124,92,255,.42);
    box-shadow: 0 0 0 3px rgba(124,92,255,.07);
}

.v27-login-button {
    width: 100%;
    margin-top: 16px;
    min-height: 48px;
    font-size: 12px;
    font-weight: 900;
}

.v27-login-error {
    display: none;
    margin-top: 10px;
    padding: 9px 11px;
    border-radius: 11px;
    color: #fca5a5;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.15);
    font-size: 11px;
}

.v27-login-help {
    display: grid;
    gap: 4px;
    margin-top: 18px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(148,163,184,.08);
    color: #73849a;
    font-size: 11px;
}

.v27-login-help strong {
    color: #aab8ca;
    font-size: 16px;
}

.v27-login-help b {
    color: #dbe6f3;
}

.v27-login-help small {
    margin-top: 4px;
    color: #61738a;
}

.v27-users-page,
.v27-activity-page {
    max-width: 1180px;
    margin: 0 auto;
}

.v27-users-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 15px;
    padding: 23px;
    border: 1px solid rgba(124,92,255,.16);
    border-radius: 24px;
    background:
        radial-gradient(circle at 95% 0%, rgba(124,92,255,.13), transparent 32%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
}

.v27-users-hero h1 {
    margin: 3px 0 5px;
    color: #eef4fb;
    font-size: clamp(26px, 4vw, 38px);
    letter-spacing: -.04em;
}

.v27-users-hero p {
    margin: 0;
    color: #8a9ab0;
    font-size: 14px;
}

.v27-users-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 24px;
    background: rgba(124,92,255,.07);
    border: 1px solid rgba(124,92,255,.16);
    font-size: 33px;
}

.v27-users-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.v27-user-card {
    padding: 15px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(17,24,39,.93), rgba(10,15,27,.89));
}

.v27-user-card-top {
    display: flex;
    align-items: center;
    gap: 16px;
}

.v27-user-avatar {
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    flex: 0 0 43px;
    border-radius: 14px;
    background: rgba(124,92,255,.10);
    border: 1px solid rgba(124,92,255,.17);
    color: #d9d0ff;
    font-size: 26px;
    font-weight: 900;
}

.v27-user-main {
    min-width: 0;
    flex: 1;
}

.v27-user-main h3 {
    overflow: hidden;
    margin: 0;
    color: #e7eef8;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v27-user-main span {
    display: block;
    margin-top: 3px;
    color: #687a91;
    font-size: 14px;
}

.v27-user-status {
    padding: 5px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
}

.v27-user-status.activo {
    color: #86efac;
    background: rgba(34,197,94,.07);
}

.v27-user-status.inactivo {
    color: #fca5a5;
    background: rgba(239,68,68,.07);
}

.v27-user-role {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 13px;
    padding: 9px;
    border-radius: 11px;
    background: rgba(255,255,255,.025);
}

.v27-user-role strong {
    color: #cbd7e6;
    font-size: 11px;
}

.v27-user-role span {
    color: #687a91;
    font-size: 8px;
    text-align: right;
}

.v27-permission-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 9px;
}

.v27-permission-chips span {
    padding: 5px 7px;
    border-radius: 8px;
    color: #8293aa;
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(148,163,184,.07);
    font-size: 11px;
}

.v27-user-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
}

.v27-user-actions button {
    margin: 0;
    padding: 7px 8px;
    font-size: 14px;
}

.v27-users-note {
    margin-top: 12px;
    color: #64768d;
    font-size: 11px;
    text-align: center;
}

.v27-current-user-button {
    border-color: rgba(124,92,255,.20) !important;
    color: #c7bcff !important;
}

.v27-activity-list {
    display: grid;
    gap: 7px;
}

.v27-activity-card {
    display: grid;
    grid-template-columns: 78px 1fr;
    gap: 12px;
    padding: 12px;
    border: 1px solid rgba(148,163,184,.09);
    border-radius: 15px;
    background: rgba(255,255,255,.025);
}

.v27-activity-time {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: 1px solid rgba(148,163,184,.08);
}

.v27-activity-time strong {
    color: #dbe5f1;
    font-size: 16px;
}

.v27-activity-time span {
    margin-top: 3px;
    color: #65768d;
    font-size: 11px;
}

.v27-activity-main strong {
    display: block;
    color: #dce7f4;
    font-size: 16px;
}

.v27-activity-main span {
    display: inline-block;
    margin-top: 4px;
    color: #a995ff;
    font-size: 8px;
    font-weight: 900;
}

.v27-activity-main p {
    margin: 5px 0 0;
    color: #718299;
    font-size: 14px;
}

@media (max-width: 760px) {
    .v27-users-grid {
        grid-template-columns: 1fr;
    }

    .v27-users-hero {
        padding: 18px;
    }

    .v27-users-icon {
        display: none;
    }
}

@media (max-width: 520px) {
    .v27-login-card {
        padding: 22px;
        border-radius: 22px;
    }

    .v27-activity-card {
        grid-template-columns: 1fr;
    }

    .v27-activity-time {
        align-items: flex-start;
        border-right: 0;
        border-bottom: 1px solid rgba(148,163,184,.08);
        padding-bottom: 7px;
    }
}

/* V28.0 SEGURIDAD PRO */
.v28-security-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    padding: 6px 8px;
    border-radius: 999px;
    color: #86efac;
    background: rgba(34,197,94,.07);
    border: 1px solid rgba(34,197,94,.12);
    font-size: 8px;
    font-weight: 900;
}

/* ========================================
   V28.1 CENTRO DE RESPALDOS PRO
======================================== */

.v281-backup-page {
    max-width: 1180px;
    margin: 0 auto;
}

.v281-backup-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 23px;
    margin-bottom: 12px;
    border: 1px solid rgba(0,212,255,.15);
    border-radius: 24px;
    background:
        radial-gradient(circle at 92% 0%, rgba(0,212,255,.11), transparent 32%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
}

.v281-backup-hero h1 {
    margin: 3px 0 5px;
    color: #eef4fb;
    font-size: clamp(26px, 4vw, 38px);
    letter-spacing: -.04em;
}

.v281-backup-hero p {
    margin: 0;
    color: #8191a8;
    font-size: 14px;
}

.v281-backup-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 24px;
    background: rgba(0,212,255,.06);
    border: 1px solid rgba(0,212,255,.15);
    font-size: 42px;
}

.v281-backup-stats {
    display: grid;
    grid-template-columns: repeat(6, minmax(0,1fr));
    gap: 7px;
    margin-bottom: 10px;
}

.v281-backup-stats > div {
    min-height: 70px;
    padding: 11px;
    border: 1px solid rgba(148,163,184,.09);
    border-radius: 15px;
    background: rgba(255,255,255,.025);
}

.v281-backup-stats span {
    display: block;
    color: #687a91;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .07em;
}

.v281-backup-stats strong {
    display: block;
    margin-top: 6px;
    color: #e9f1fa;
    font-size: 18px;
}

.v281-backup-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 10px;
}

.v281-backup-actions button {
    margin: 0;
}

.v281-backup-warning {
    margin-bottom: 12px;
    padding: 11px 13px;
    border: 1px solid rgba(34,197,94,.12);
    border-radius: 13px;
    color: #7f91a7;
    background: rgba(34,197,94,.035);
    font-size: 11px;
}

.v281-backup-warning strong {
    color: #9fe3b2;
}

.v281-backup-section {
    margin-top: 12px;
    padding: 14px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(17,24,39,.88), rgba(10,15,27,.82));
}

.v281-backup-section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
}

.v281-backup-section-title span {
    display: block;
    color: #687a91;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v281-backup-section-title h2 {
    margin: 3px 0 0;
    color: #e5edf7;
    font-size: 15px;
}

.v281-backup-section-title button {
    margin: 0;
    padding: 7px 9px;
    font-size: 14px;
}

.v281-backup-list {
    display: grid;
    gap: 7px;
}

.v281-backup-card {
    display: grid;
    grid-template-columns: 42px 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 10px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 13px;
    background: rgba(255,255,255,.018);
}

.v281-backup-card-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: rgba(124,92,255,.07);
    font-size: 19px;
}

.v281-backup-card-main {
    min-width: 0;
}

.v281-backup-card-main strong {
    display: block;
    overflow: hidden;
    color: #dce7f3;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v281-backup-card-main span {
    display: block;
    margin-top: 3px;
    color: #718299;
    font-size: 14px;
}

.v281-backup-card-main small {
    display: block;
    margin-top: 5px;
    color: #5f7188;
    font-size: 11px;
}

.v281-backup-card > button {
    margin: 0;
    padding: 7px 9px;
    font-size: 14px;
}

.v281-export-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 7px;
}

.v281-export-grid button {
    margin: 0;
}

.v281-backup-empty {
    display: grid;
    place-items: center;
    padding: 30px;
    border: 1px dashed rgba(148,163,184,.12);
    border-radius: 15px;
    text-align: center;
}

.v281-backup-empty > div {
    font-size: 30px;
}

.v281-backup-empty h2 {
    margin: 8px 0 3px;
    color: #dce6f1;
    font-size: 14px;
}

.v281-backup-empty p {
    margin: 0;
    color: #687a91;
    font-size: 14px;
}

.v281-backup-footer {
    margin: 12px 0;
    color: #63758c;
    font-size: 8px;
    text-align: center;
}

@media (max-width: 900px) {
    .v281-backup-stats {
        grid-template-columns: repeat(3, minmax(0,1fr));
    }

    .v281-export-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }
}

@media (max-width: 620px) {
    .v281-backup-hero {
        padding: 18px;
    }

    .v281-backup-icon {
        display: none;
    }

    .v281-backup-stats {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v281-backup-card {
        grid-template-columns: 38px 1fr;
    }

    .v281-backup-card > button {
        grid-column: 1 / -1;
        width: 100%;
    }

    .v281-export-grid {
        grid-template-columns: 1fr;
    }
}

/* ========================================
   V28.2 CAJA PRO
======================================== */

.v282-cash-pro {
    margin: 0 0 12px;
    padding: 14px;
    border: 1px solid rgba(0,212,255,.12);
    border-radius: 18px;
    background:
        radial-gradient(circle at 100% 0%, rgba(0,212,255,.06), transparent 34%),
        linear-gradient(145deg, rgba(16,24,40,.90), rgba(9,15,27,.84));
}

.v282-cash-pro-head,
.v282-count-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.v282-cash-pro-head span,
.v282-count-head span {
    display: block;
    color: #687a91;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v282-cash-pro-head h2,
.v282-count-head h2 {
    margin: 3px 0 0;
    color: #e7eef7;
    font-size: 15px;
}

.v282-cash-pro-status {
    padding: 7px 9px;
    border: 1px solid rgba(34,197,94,.12);
    border-radius: 999px;
    color: #9ee4af;
    background: rgba(34,197,94,.04);
    font-size: 8px;
    font-weight: 900;
}

.v282-cash-pro-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 7px;
    margin-top: 11px;
}

.v282-cash-pro-grid > div {
    padding: 10px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 13px;
    background: rgba(255,255,255,.018);
}

.v282-cash-pro-grid span {
    display: block;
    color: #64768d;
    font-size: 11px;
    font-weight: 900;
}

.v282-cash-pro-grid strong {
    display: block;
    margin-top: 5px;
    overflow: hidden;
    color: #dfe9f4;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v282-cash-pro-grid small {
    display: block;
    margin-top: 3px;
    color: #61738a;
    font-size: 11px;
}

.v282-reopen-note {
    margin-top: 8px;
    padding: 7px 9px;
    border-radius: 10px;
    color: #7789a0;
    background: rgba(124,92,255,.035);
    font-size: 14px;
}

.v282-reopen-note strong {
    color: #b7a8ff;
}

.v282-count-panel {
    margin-top: 12px;
    padding: 14px;
    border: 1px solid rgba(124,92,255,.12);
    border-radius: 18px;
    background:
        radial-gradient(circle at 0% 0%, rgba(124,92,255,.06), transparent 35%),
        linear-gradient(145deg, rgba(17,24,39,.88), rgba(10,15,27,.82));
}

.v282-count-head small {
    color: #667890;
    font-size: 11px;
}

.v282-den-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 7px;
    margin-top: 11px;
}

.v282-den-grid label {
    display: grid;
    grid-template-columns: 1fr 62px;
    align-items: center;
    gap: 6px;
    padding: 7px 8px;
    border: 1px solid rgba(148,163,184,.07);
    border-radius: 11px;
    background: rgba(255,255,255,.018);
}

.v282-den-grid label span {
    color: #9aa9bb;
    font-size: 11px;
    font-weight: 800;
}

.v282-den-grid input {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 6px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 8px;
    outline: none;
    background: rgba(255,255,255,.035);
    color: #edf4fc;
    text-align: center;
    font-size: 16px;
}

.v282-den-grid input:focus {
    border-color: rgba(124,92,255,.35);
    box-shadow: 0 0 0 2px rgba(124,92,255,.06);
}

.v282-count-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 10px;
}

.v282-count-actions button {
    margin: 0;
}

.v282-count-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    padding: 12px;
    border: 1px solid rgba(0,212,255,.10);
    border-radius: 13px;
    background: rgba(0,212,255,.025);
}

.v282-count-total span {
    display: block;
    color: #667990;
    font-size: 11px;
    font-weight: 900;
}

.v282-count-total strong {
    display: block;
    color: #eaf3fb;
    font-size: 20px;
}

.v282-count-total small {
    display: block;
    color: #61748b;
    font-size: 11px;
}

.v282-count-difference {
    margin-top: 7px;
    padding: 9px;
    border-radius: 11px;
    background: rgba(255,255,255,.025);
    color: #a8b6c8;
    font-size: 11px;
    font-weight: 900;
    text-align: center;
}

.v282-count-empty {
    margin-top: 10px;
    padding: 11px;
    border: 1px dashed rgba(148,163,184,.10);
    border-radius: 11px;
    color: #65778e;
    font-size: 8px;
    text-align: center;
}

@media (max-width: 900px) {
    .v282-cash-pro-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v282-den-grid {
        grid-template-columns: repeat(3, minmax(0,1fr));
    }
}

@media (max-width: 560px) {
    .v282-cash-pro-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v282-den-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v282-cash-pro-head {
        align-items: flex-start;
    }

    .v282-cash-pro-status {
        font-size: 11px;
    }
}

/* ========================================
   V28.3 TICKETS PRO
======================================== */

.v283-ticket-page {
    max-width: 1180px;
    margin: 0 auto;
}

.v283-ticket-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 23px;
    margin-bottom: 12px;
    border: 1px solid rgba(124,92,255,.16);
    border-radius: 24px;
    background:
        radial-gradient(circle at 90% 0%, rgba(124,92,255,.12), transparent 34%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(10,16,29,.94));
}

.v283-ticket-hero h1 {
    margin: 3px 0 5px;
    color: #eef4fb;
    font-size: clamp(26px, 4vw, 38px);
    letter-spacing: -.04em;
}

.v283-ticket-hero p {
    margin: 0;
    color: #8191a8;
    font-size: 14px;
}

.v283-ticket-hero-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 24px;
    background: rgba(124,92,255,.06);
    border: 1px solid rgba(124,92,255,.14);
    font-size: 42px;
}

.v283-ticket-toolbar {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
}

.v283-ticket-toolbar button {
    margin: 0;
    white-space: nowrap;
}

.v283-ticket-search {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 8px;
    padding: 0 12px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 13px;
    background: rgba(255,255,255,.025);
}

.v283-ticket-search span {
    font-size: 16px;
}

.v283-ticket-search input {
    width: 100%;
    min-height: 42px;
    box-sizing: border-box;
    border: 0;
    outline: none;
    background: transparent;
    color: #eaf2fa;
    font-size: 16px;
}

.v283-ticket-search input::placeholder {
    color: #5f7188;
}

.v283-ticket-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 7px;
    margin-bottom: 10px;
}

.v283-ticket-summary > div {
    min-height: 64px;
    padding: 10px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 14px;
    background: rgba(255,255,255,.02);
}

.v283-ticket-summary span {
    display: block;
    color: #65778e;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .08em;
}

.v283-ticket-summary strong {
    display: block;
    margin-top: 5px;
    color: #e8f0f8;
    font-size: 16px;
}

.v283-ticket-card {
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center;
    gap: 11px;
    margin-bottom: 7px;
    padding: 11px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 15px;
    background: linear-gradient(145deg, rgba(17,24,39,.86), rgba(10,15,27,.82));
}

.v283-ticket-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 13px;
    background: rgba(124,92,255,.07);
    font-size: 20px;
}

.v283-ticket-main {
    min-width: 0;
}

.v283-ticket-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.v283-ticket-title strong {
    color: #dcd3ff;
    font-size: 16px;
    letter-spacing: .03em;
}

.v283-ticket-title span {
    color: #65778e;
    font-size: 14px;
}

.v283-ticket-main p {
    margin: 5px 0 3px;
    color: #aab7c7;
    font-size: 14px;
}

.v283-ticket-main small {
    color: #63758c;
    font-size: 11px;
}

.v283-ticket-total {
    display: grid;
    justify-items: end;
    gap: 6px;
}

.v283-ticket-total strong {
    color: #eaf2f9;
    font-size: 16px;
}

.v283-ticket-total button {
    margin: 0;
    padding: 7px 9px;
    font-size: 14px;
}

.v283-ticket-empty {
    display: grid;
    place-items: center;
    padding: 38px 20px;
    border: 1px dashed rgba(148,163,184,.12);
    border-radius: 22px;
    text-align: center;
}

.v283-ticket-empty div {
    font-size: 32px;
}

.v283-ticket-empty h2 {
    margin: 8px 0 3px;
    color: #dce6f1;
    font-size: 14px;
}

.v283-ticket-empty p {
    margin: 0;
    color: #687a91;
    font-size: 14px;
}

@media (max-width: 800px) {
    .v283-ticket-summary {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v283-ticket-toolbar {
        flex-wrap: wrap;
    }

    .v283-ticket-search {
        flex-basis: 100%;
    }
}

@media (max-width: 560px) {
    .v283-ticket-hero {
        padding: 18px;
    }

    .v283-ticket-hero-icon {
        display: none;
    }

    .v283-ticket-card {
        grid-template-columns: 38px 1fr;
    }

    .v283-ticket-total {
        grid-column: 1 / -1;
        grid-template-columns: 1fr auto;
        align-items: center;
        justify-items: stretch;
    }

    .v283-ticket-total strong {
        justify-self: start;
    }

    .v283-ticket-total button {
        justify-self: end;
    }
}

/* ========================================
   V28.4 FLUJO DE CUENTA
======================================== */

.v28-cuenta-agotada {
    border-color: rgba(239,68,68,.20) !important;
    background: rgba(239,68,68,.035) !important;
}

/* ========================================
   V28.5 DASHBOARD PRO 2.0
======================================== */

.v285-operation {
    margin: 12px 0;
    padding: 15px;
    border: 1px solid rgba(0,212,255,.12);
    border-radius: 20px;
    background:
        radial-gradient(circle at 100% 0%, rgba(0,212,255,.055), transparent 34%),
        linear-gradient(145deg, rgba(17,24,39,.90), rgba(9,15,27,.84));
}

.v285-section-head,
.v285-subpanel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.v285-section-head > div > span,
.v285-subpanel-head > div > span {
    display: block;
    color: #64768d;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .09em;
}

.v285-section-head h2 {
    margin: 3px 0 0;
    color: #e8f0f8;
    font-size: 16px;
}

.v285-section-head small {
    color: #65778e;
    font-size: 14px;
}

.v285-operation-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 7px;
    margin-top: 11px;
}

.v285-operation-card {
    padding: 11px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 14px;
    background: rgba(255,255,255,.018);
}

.v285-operation-icon {
    font-size: 26px;
}

.v285-operation-card > span {
    display: block;
    margin-top: 5px;
    color: #66788f;
    font-size: 11px;
    font-weight: 900;
}

.v285-operation-card > strong {
    display: block;
    margin-top: 4px;
    color: #edf4fb;
    font-size: 20px;
}

.v285-operation-card > small {
    display: block;
    margin-top: 3px;
    color: #63758b;
    font-size: 11px;
}

.v285-operation-columns {
    display: grid;
    grid-template-columns: 1.15fr .85fr;
    gap: 8px;
    margin-top: 8px;
}

.v285-subpanel {
    padding: 11px;
    border: 1px solid rgba(148,163,184,.07);
    border-radius: 14px;
    background: rgba(255,255,255,.015);
}

.v285-subpanel-head h3 {
    margin: 3px 0 0;
    color: #dce7f2;
    font-size: 12px;
}

.v285-subpanel-head button {
    margin: 0;
    padding: 6px 8px;
    font-size: 11px;
}

.v285-alert-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 7px;
    margin-top: 9px;
}

.v285-alert-card {
    display: grid;
    grid-template-columns: 28px 1fr;
    align-items: center;
    column-gap: 7px;
    min-height: 58px;
    padding: 8px;
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 12px;
    color: inherit;
    text-align: left;
    background: rgba(255,255,255,.018);
}

button.v285-alert-card {
    width: 100%;
    margin: 0;
}

.v285-alert-card > div {
    grid-row: 1 / span 3;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 9px;
    background: rgba(255,255,255,.035);
    font-size: 16px;
}

.v285-alert-card > span {
    color: #66788f;
    font-size: 6px;
    font-weight: 900;
    letter-spacing: .08em;
}

.v285-alert-card > strong {
    color: #dfe8f2;
    font-size: 11px;
}

.v285-alert-card > small {
    overflow: hidden;
    color: #66798f;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v285-alert-danger {
    border-color: rgba(239,68,68,.13) !important;
    background: rgba(239,68,68,.035) !important;
}

.v285-alert-warning {
    border-color: rgba(245,158,11,.13) !important;
    background: rgba(245,158,11,.035) !important;
}

.v285-alert-ok {
    border-color: rgba(34,197,94,.10) !important;
    background: rgba(34,197,94,.028) !important;
}

.v285-next-list {
    margin-top: 8px;
}

.v285-next-row {
    display: grid;
    grid-template-columns: 54px 1fr;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(148,163,184,.06);
}

.v285-next-row:last-child {
    border-bottom: 0;
}

.v285-next-row strong {
    color: #b9a9ff;
    font-size: 16px;
}

.v285-next-row span {
    overflow: hidden;
    color: #9aa8b9;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.v285-next-empty {
    padding: 18px 6px;
    color: #64768d;
    font-size: 8px;
    text-align: center;
}

.v285-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 10px;
}

.v285-quick-actions button {
    margin: 0;
}

.v285-payment-extra {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 7px;
    margin-top: 8px;
}

.v285-payment-extra > div {
    padding: 8px;
    border: 1px solid rgba(148,163,184,.07);
    border-radius: 10px;
    background: rgba(255,255,255,.018);
}

.v285-payment-extra span {
    display: block;
    color: #64768d;
    font-size: 6px;
    font-weight: 900;
}

.v285-payment-extra strong {
    display: block;
    margin-top: 4px;
    color: #dfe9f3;
    font-size: 12px;
}

@media (max-width: 900px) {
    .v285-operation-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v285-operation-columns {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 560px) {
    .v285-operation-grid {
        grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .v285-alert-grid {
        grid-template-columns: 1fr;
    }

    .v285-quick-actions button {
        flex: 1 1 30%;
    }
}

/* ========================================
   V28.6 COBRO DIRECTO DE CUENTA
======================================== */

.v286-pay-account-button {
    border-color: rgba(34,197,94,.30) !important;
    background: linear-gradient(
        135deg,
        rgba(34,197,94,.22),
        rgba(16,185,129,.12)
    ) !important;
    color: #d9ffe7 !important;
}

/* ========================================
   V28.7 CICLOS DE COBRO SEPARADOS
======================================== */

.v287-new-charge-note {
    margin: 8px 0;
    padding: 9px 11px;
    border: 1px solid rgba(34,197,94,.12);
    border-radius: 11px;
    background: rgba(34,197,94,.025);
    color: #8eb49b;
    font-size: 14px;
}

/* ========================================
   V28.9 PANEL PRO SEPARADO
======================================== */

.v289-panel-page {
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding-bottom: 18px;
}

.v289-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 12px;
    padding: 32px;
    border: 1px solid rgba(124,92,255,.15);
    border-radius: 22px;
    background:
        radial-gradient(circle at 100% 0%, rgba(124,92,255,.10), transparent 36%),
        linear-gradient(145deg, rgba(18,25,43,.96), rgba(9,15,27,.94));
}

.v289-panel-header h1 {
    margin: 3px 0 5px;
    color: #edf4fb;
    font-size: clamp(25px, 4vw, 36px);
    letter-spacing: -.04em;
}

.v289-panel-header p {
    margin: 0;
    color: #7f90a7;
    font-size: 11px;
}

.v289-back-button {
    margin: 0;
    white-space: nowrap;
}

.v289-panel-content {
    width: 100%;
}

.v289-panel-content .v27-dashboard-grid,
.v289-panel-content .v285-operation {
    margin-top: 10px;
}

@media (max-width: 600px) {
    .v289-panel-header {
        align-items: flex-start;
        padding: 16px;
    }

    .v289-panel-header h1 {
        font-size: 25px;
    }

    .v289-back-button {
        padding: 8px 9px;
        font-size: 8px;
    }
}

/* ========================================
   V29.0 INICIO LIMPIO
======================================== */

.v290-home-clean .v27-dashboard-grid,
.v290-home-clean .v285-operation {
    display: none !important;
}

/* ========================================
   V29.1 INICIO REALMENTE LIMPIO
======================================== */

.v291-home {
    width: 100%;
}

.v291-home-toolbar {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 10px;
    min-height: 38px;
}

.v291-panel-button {
    margin: 0 !important;
    padding: 9px 13px !important;
    font-weight: 900 !important;
    box-shadow: 0 7px 20px rgba(124,92,255,.12);
}

.v291-admin-menu {
    position: relative;
    z-index: 20;
}

.v291-admin-menu summary {
    list-style: none;
    cursor: pointer;
    user-select: none;
    padding: 9px 12px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 10px;
    background: rgba(255,255,255,.045);
    color: #dce6f1;
    font-size: 11px;
    font-weight: 900;
}

.v291-admin-menu summary::-webkit-details-marker {
    display: none;
}

.v291-admin-menu[open] summary {
    border-color: rgba(124,92,255,.32);
    background: rgba(124,92,255,.10);
}

.v291-admin-menu-grid {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(150px, 1fr));
    gap: 6px;
    width: min(440px, 78vw);
    padding: 9px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 14px;
    background: rgba(10,16,28,.97);
    box-shadow: 0 20px 55px rgba(0,0,0,.38);
    backdrop-filter: blur(12px);
}

.v291-admin-menu-grid button {
    margin: 0 !important;
    text-align: left;
    font-size: 8px !important;
}

.v291-cash-status {
    margin-left: auto;
    padding: 7px 9px;
    border: 1px solid rgba(148,163,184,.10);
    border-radius: 999px;
    color: #8c9caf;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
}

.v291-live,
.v291-off {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 4px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34,197,94,.55);
}

.v291-off {
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245,158,11,.40);
}

.v291-cash-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    padding: 8px 10px;
    border: 1px solid rgba(245,158,11,.12);
    border-radius: 11px;
    background: rgba(245,158,11,.035);
    color: #8d9bad;
    font-size: 14px;
}

.v291-cash-notice strong {
    color: #f4c46b;
    font-size: 14px;
}

.v291-cash-notice > div {
    display: flex;
    gap: 6px;
    margin-left: auto;
}

.v291-cash-notice button {
    margin: 0 !important;
    padding: 6px 8px !important;
    font-size: 7px !important;
}

@media (max-width: 600px) {
    .v291-home-toolbar {
        gap: 5px;
    }

    .v291-panel-button,
    .v291-admin-menu summary {
        padding: 14px 16px !important;
        font-size: 8px !important;
    }

    .v291-cash-status {
        padding: 6px 7px;
        font-size: 6px;
    }

    .v291-admin-menu-grid {
        grid-template-columns: 1fr;
        width: min(300px, 82vw);
    }

    .v291-cash-notice {
        flex-wrap: wrap;
    }

    .v291-cash-notice > div {
        width: 100%;
        margin-left: 0;
    }
}

/* ========================================
   V29.8 MENÚ — BOTONES COMO PANEL PRO
======================================== */

.v292-menu-button {
    display: inline-flex !important;
    align-items: center;
    gap: 7px;
    margin: 0 !important;
    padding: 9px 13px !important;
    border: 1px solid rgba(124,92,255,.26) !important;
    border-radius: 11px !important;
    background:
        linear-gradient(
            135deg,
            rgba(124,92,255,.20),
            rgba(76,201,240,.08)
        ) !important;
    color: #eef3fb !important;
    font-size: 8px !important;
    font-weight: 900 !important;
    box-shadow: 0 8px 24px rgba(0,0,0,.15);
    transition: .18s ease;
}

.v292-menu-button:hover {
    border-color: rgba(124,92,255,.46) !important;
    background:
        linear-gradient(
            135deg,
            rgba(124,92,255,.27),
            rgba(76,201,240,.11)
        ) !important;
    transform: translateY(-1px);
}

.v292-menu-lines {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 7px;
    background: rgba(255,255,255,.07);
    color: #dfe7f4;
    font-size: 12px;
}

/* Dropdown */
.v292-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    pointer-events: none;
    opacity: 0;
    transition: opacity .14s ease;
}

.v292-menu-overlay.v292-menu-visible {
    pointer-events: auto;
    opacity: 1;
}

.v292-menu-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(3,7,18,.10);
}

.v292-menu-panel {
    position: absolute;
    top: 58px;
    left: max(12px, calc((100vw - 1240px) / 2));
    width: min(600px, calc(100vw - 24px));
    max-height: calc(100vh - 78px);
    overflow: auto;
    padding: 13px;
    border: 1px solid rgba(124,92,255,.20);
    border-radius: 16px;
    background:
        linear-gradient(
            145deg,
            rgba(18,25,43,.985),
            rgba(9,15,27,.985)
        );
    box-shadow:
        0 18px 55px rgba(0,0,0,.34),
        0 0 0 1px rgba(255,255,255,.02);
    transform: translateY(-5px);
    transition: transform .16s ease;
}

.v292-menu-visible .v292-menu-panel {
    transform: translateY(0);
}

.v292-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 3px 3px 10px;
    border-bottom: 1px solid rgba(148,163,184,.08);
}

.v292-menu-kicker {
    display: block;
    color: #766cff;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: .12em;
}

.v292-menu-header h2 {
    margin: 2px 0;
    color: #edf4fb;
    font-size: 18px;
    letter-spacing: -.035em;
}

.v292-menu-header p {
    margin: 0;
    color: #718196;
    font-size: 7px;
}

.v292-close {
    display: grid !important;
    place-items: center;
    width: 30px;
    height: 30px;
    margin: 0 !important;
    padding: 0 !important;
    border: 1px solid rgba(148,163,184,.12) !important;
    border-radius: 9px !important;
    background: rgba(255,255,255,.045) !important;
    color: #aab7c7 !important;
    font-size: 11px !important;
}

/* LISTA: uno tras otro, lado y lado */
.v298-menu-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin-top: 11px;
}

/* Cada opción es visualmente hermana del botón Panel PRO */
.v298-menu-list button {
    display: flex;
    align-items: center;
    min-height: 43px;
    width: 100%;
    margin: 0 !important;
    padding: 9px 12px !important;
    border: 1px solid rgba(124,92,255,.27) !important;
    border-radius: 11px !important;
    background:
        linear-gradient(
            135deg,
            rgba(124,92,255,.20),
            rgba(76,201,240,.08)
        ) !important;
    color: #eef3fb !important;
    text-align: left;
    font-size: 8px !important;
    font-weight: 900 !important;
    box-shadow: 0 7px 20px rgba(0,0,0,.10);
    transition: .16s ease;
}

.v298-menu-list button:hover {
    border-color: rgba(124,92,255,.48) !important;
    background:
        linear-gradient(
            135deg,
            rgba(124,92,255,.29),
            rgba(76,201,240,.12)
        ) !important;
    color: #ffffff !important;
    transform: translateY(-1px);
    box-shadow: 0 9px 24px rgba(0,0,0,.15);
}

/* Footer */
.v292-menu-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 9px;
    padding: 8px 9px;
    border: 1px solid rgba(124,92,255,.12);
    border-radius: 10px;
    background:
        linear-gradient(
            135deg,
            rgba(124,92,255,.07),
            rgba(76,201,240,.025)
        );
}

.v292-menu-footer span {
    color: #6f7f93;
    font-size: 6px;
}

.v292-menu-footer button {
    margin: 0 !important;
    padding: 7px 9px !important;
    border: 1px solid rgba(124,92,255,.27) !important;
    border-radius: 9px !important;
    background:
        linear-gradient(
            135deg,
            rgba(124,92,255,.20),
            rgba(76,201,240,.08)
        ) !important;
    color: #eef3fb !important;
    font-size: 7px !important;
    font-weight: 900 !important;
}

@media (max-width: 650px) {
    .v292-menu-panel {
        left: 12px;
        top: 56px;
        width: calc(100vw - 24px);
    }

    .v298-menu-list {
        grid-template-columns: 1fr;
    }
}

/* ========================================
   V29.12 — TODOS LOS ACCESOS EN EL MISMO FLUJO
======================================== */

/* Panel PRO es el primer botón de la misma fila/flujo.
   No existe una barra separada. */
.v299-home-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    width: 100%;
    margin: 0 0 12px;
}

/* Todos, incluido Panel PRO, usan exactamente la misma clase. */
.v299-home-actions .v291-panel-button {
    flex: 0 0 auto;
    align-self: center;
    margin: 0 !important;
    padding: 9px 13px !important;
    line-height: 1.2 !important;
    font-weight: 900 !important;
    box-shadow: 0 7px 20px rgba(124,92,255,.12);
}

@media (max-width: 650px) {
    .v299-home-actions {
        gap: 6px;
    }

    .v299-home-actions .v291-panel-button {
        padding: 9px 12px !important;
    }
}

`;

    document.head.appendChild(style);
}

aplicarTemaV27();

// ========================================
// INICIAR
// ========================================

cargarDatos();
normalizarEstaciones();
inicializarReservasPro();
normalizarFoliosTicketsPro();
inicializarUsuariosPro();
asegurarEstadisticasDia();
crearRespaldoAutomaticoDiarioPro();

if (!fechaCaja) {
    fechaCaja = obtenerFecha();

    if (!estadoCaja) {
        estadoCaja = cajaCerrada ? "cerrada" : "abierta";
    }

    guardarDatos();
}


document.addEventListener(
    "pointerdown",
    function() {
        if (sesionUsuarioIniciadaPro) {
            registrarActividadSeguridadPro();
        }
    },
    true
);

document.addEventListener(
    "keydown",
    function() {
        if (sesionUsuarioIniciadaPro) {
            registrarActividadSeguridadPro();
        }
    },
    true
);

document.addEventListener(
    "touchstart",
    function() {
        if (sesionUsuarioIniciadaPro) {
            registrarActividadSeguridadPro();
        }
    },
    true
);

// Si el administrador cambia de pantalla, minimiza/cierra la app
// o el navegador suspende la página, guardamos el estado de las sesiones.
document.addEventListener(
    "visibilitychange",
    function() {
        if (document.visibilityState === "hidden") {
            guardarDatos();
        }
    }
);

window.addEventListener(
    "pagehide",
    function() {
        guardarDatos();
    }
);

actualizarTiempos();
mostrarLoginPro();
