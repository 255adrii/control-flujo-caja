import { Movimiento } from "./Movimiento.js";
import { cargarDatos, comprobarRegistro, modificarDatos } from "./almacenamiento.js";
import { esFechaValida, fechaISO } from "./fechas.js";
import { abrirPagina, escucharCambios } from "./pagina.js";
import {
    agregarAcciones, agregarFila, contieneTexto, crearAviso, formatearFecha, formatearImporte,
    llenarSelectorCuentas, mostrarDetalle, mostrarTablaVacia, obtenerAccion, obtenerSiguienteId,
    ordenarLista, pasarACentimos
} from "./interfaz.js";

async function iniciarMovimientos(usuarioId) {
    let { cuentas, movimientos } = await cargarDatos(usuarioId);
    const formulario = document.querySelector("#formulario-movimiento");
    const filtros = document.querySelector("#filtros");
    const tabla = document.querySelector("#filas-movimientos");
    const dialogo = document.querySelector("#detalle");
    const titulo = document.querySelector("#titulo-formulario");
    const botonCancelar = document.querySelector("#cancelar");
    const avisar = crearAviso(document.querySelector("#mensaje"));
    const campos = formulario.elements;
    let idEnEdicion = null;
    let movimientoEnEdicion = null;
    let guardando = false;

    function nombreCuenta(id) {
        return cuentas.find(cuenta => cuenta.id === id)?.nombre ?? "Cuenta eliminada";
    }

    function obtenerEstado(movimiento) {
        if (!movimiento.estaPendiente()) return "Realizado";
        return movimiento.fechaPrevista < fechaISO(new Date()) ? "Vencido" : "Pendiente";
    }

    function nombreTipo(movimiento) {
        return movimiento.tipo === "cobro" ? "Cobro" : "Pago";
    }

    function mostrarMovimientos() {
        const { buscar, cuenta, tipo, estado, orden } = filtros.elements;
        const filtrados = movimientos.filter(movimiento =>
            contieneTexto(movimiento.concepto, buscar.value)
            && (!cuenta.value || movimiento.cuentaId === Number(cuenta.value))
            && (!tipo.value || movimiento.tipo === tipo.value)
            && (!estado.value || obtenerEstado(movimiento) === estado.value));
        const criterios = {
            fecha: movimiento => movimiento.fechaPrevista,
            importe: movimiento => movimiento.importe,
            concepto: movimiento => movimiento.concepto
        };
        const ordenados = ordenarLista(filtrados, criterios[orden.value], orden.value === "concepto" ? 1 : -1);

        tabla.replaceChildren();
        if (ordenados.length === 0) mostrarTablaVacia(tabla, 7, "No hay movimientos para mostrar.");
        for (const movimiento of ordenados) {
            const fila = agregarFila(tabla, [
                movimiento.concepto, nombreCuenta(movimiento.cuentaId), nombreTipo(movimiento),
                formatearImporte(movimiento.obtenerImporteConSigno()), formatearFecha(movimiento.fechaPrevista),
                obtenerEstado(movimiento)
            ]);
            agregarAcciones(fila, movimiento.id, movimiento.concepto);
        }
    }

    function restablecerFormulario() {
        idEnEdicion = null;
        movimientoEnEdicion = null;
        formulario.reset();
        campos.fechaPrevista.value = fechaISO(new Date());
        actualizarFechaReal();
        titulo.textContent = "Nuevo movimiento";
        botonCancelar.hidden = true;
    }

    function editarMovimiento(movimiento) {
        idEnEdicion = movimiento.id;
        movimientoEnEdicion = movimiento;
        actualizarFechaReal();
        campos.cuenta.value = movimiento.cuentaId;
        campos.concepto.value = movimiento.concepto;
        campos.tipo.value = movimiento.tipo;
        campos.importe.value = movimiento.importe / 100;
        campos.fechaPrevista.value = movimiento.fechaPrevista;
        campos.fechaReal.value = movimiento.fechaReal;
        titulo.textContent = "Editar movimiento";
        botonCancelar.hidden = false;
        avisar("");
        campos.concepto.focus();
    }

    async function guardarMovimiento(evento) {
        evento.preventDefault();
        if (guardando) return;
        const cuentaId = Number(campos.cuenta.value);
        const concepto = campos.concepto.value.trim();
        const tipo = campos.tipo.value;
        const importe = pasarACentimos(campos.importe);
        const fechaPrevista = campos.fechaPrevista.value;
        const fechaReal = campos.fechaReal.value;
        const cuenta = cuentas.find(elemento => elemento.id === cuentaId);

        if (!cuenta || !concepto || !["cobro", "pago"].includes(tipo)
            || !Number.isFinite(importe) || importe <= 0 || !esFechaValida(fechaPrevista)) {
            avisar("Revisa la cuenta, el concepto, el tipo, el importe y la fecha prevista.", true);
            return;
        }

        if (fechaReal !== "" && (!esFechaValida(fechaReal) || fechaReal > fechaISO(new Date()))) {
            avisar("La fecha real debe ser hoy o anterior.", true);
            return;
        }

        const anterior = movimientoEnEdicion;
        guardando = true;
        try {
            const datosGuardados = await modificarDatos(usuarioId, datos => {
                if (!datos.cuentas.some(elemento => elemento.id === cuentaId)) {
                    throw new Error("La cuenta seleccionada ya no existe. Selecciona otra cuenta.");
                }
                if (anterior) {
                    const movimiento = datos.movimientos.find(elemento => elemento.id === anterior.id);
                    comprobarRegistro(movimiento, anterior);
                    movimiento.actualizarDatos(cuentaId, concepto, tipo, importe, fechaPrevista, fechaReal);
                } else {
                    datos.movimientos.push(new Movimiento(obtenerSiguienteId(datos.movimientos),
                        cuentaId, concepto, tipo, importe, fechaPrevista, fechaReal));
                }
            });
            cuentas = datosGuardados.cuentas;
            movimientos = datosGuardados.movimientos;
            actualizarSelectores();
            restablecerFormulario();
            mostrarMovimientos();
            avisar(anterior ? "Movimiento modificado." : "Movimiento creado.");
        } catch (error) {
            avisar(error.message, true);
        } finally {
            guardando = false;
        }
    }

    async function eliminarMovimiento(movimiento) {
        if (guardando) return;
        if (!window.confirm("¿Eliminar el movimiento «" + movimiento.concepto + "»?")) return;
        guardando = true;
        try {
            const datosGuardados = await modificarDatos(usuarioId, datos => {
                const actual = datos.movimientos.find(elemento => elemento.id === movimiento.id);
                comprobarRegistro(actual, movimiento);
                datos.movimientos.splice(datos.movimientos.findIndex(elemento => elemento.id === movimiento.id), 1);
            });
            cuentas = datosGuardados.cuentas;
            movimientos = datosGuardados.movimientos;
            actualizarSelectores();
            if (idEnEdicion === movimiento.id) restablecerFormulario();
            mostrarMovimientos();
            avisar("Movimiento eliminado.");
        } catch (error) {
            avisar(error.message, true);
        } finally {
            guardando = false;
        }
    }

    async function gestionarAccion(evento) {
        if (guardando) return;
        const accion = obtenerAccion(evento);
        if (!accion) return;
        const movimiento = movimientos.find(elemento => elemento.id === accion.id);
        if (!movimiento) return;

        switch (accion.nombre) {
            case "ver":
                mostrarDetalle(dialogo, [
                    ["Concepto", movimiento.concepto], ["Cuenta", nombreCuenta(movimiento.cuentaId)],
                    ["Tipo", nombreTipo(movimiento)], ["Importe", formatearImporte(movimiento.obtenerImporteConSigno())],
                    ["Fecha prevista", formatearFecha(movimiento.fechaPrevista)],
                    ["Fecha real", formatearFecha(movimiento.fechaReal)], ["Estado", obtenerEstado(movimiento)]
                ]);
                break;
            case "editar":
                editarMovimiento(movimiento);
                break;
            case "eliminar":
                await eliminarMovimiento(movimiento);
                break;
        }
    }

    function actualizarSelectores() {
        // Conservamos la selección mientras se actualizan las cuentas de otra pestaña.
        const cuentaSeleccionada = campos.cuenta.value;
        const cuentaFiltrada = filtros.elements.cuenta.value;
        llenarSelectorCuentas(campos.cuenta, cuentas, "Selecciona una cuenta");
        llenarSelectorCuentas(filtros.elements.cuenta, cuentas, "Todas");
        campos.cuenta.value = cuentas.some(cuenta => String(cuenta.id) === cuentaSeleccionada) ? cuentaSeleccionada : "";
        filtros.elements.cuenta.value = cuentas.some(cuenta => String(cuenta.id) === cuentaFiltrada) ? cuentaFiltrada : "";
        formulario.querySelector("button[type='submit']").disabled = cuentas.length === 0;
    }

    function actualizarFechaReal() {
        campos.fechaReal.max = fechaISO(new Date());
    }

    actualizarSelectores();
    restablecerFormulario();
    formulario.addEventListener("submit", guardarMovimiento);
    formulario.addEventListener("keydown", evento => {
        if (!guardando && evento.key === "Escape" && idEnEdicion !== null) restablecerFormulario();
    });
    botonCancelar.addEventListener("click", () => { if (!guardando) restablecerFormulario(); });
    campos.fechaReal.addEventListener("focus", actualizarFechaReal);
    formulario.addEventListener("input", actualizarFechaReal);
    window.addEventListener("focus", actualizarFechaReal);
    filtros.addEventListener("submit", evento => evento.preventDefault());
    filtros.addEventListener("input", mostrarMovimientos);
    tabla.addEventListener("click", gestionarAccion);
    escucharCambios(usuarioId, async () => {
        const datosActuales = await cargarDatos(usuarioId);
        cuentas = datosActuales.cuentas;
        movimientos = datosActuales.movimientos;
        actualizarSelectores();
        actualizarFechaReal();
        mostrarMovimientos();
    });
    // Actualizamos también el límite si la página permanece abierta al cambiar el día.
    setInterval(actualizarFechaReal, 1000);
    mostrarMovimientos();

    if (cuentas.length === 0) {
        formulario.querySelector("button[type='submit']").disabled = true;
        avisar("Crea una cuenta desde Cuentas para registrar movimientos.", true);
    }
}

abrirPagina(iniciarMovimientos);
