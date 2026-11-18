import { Cuenta } from "./Cuenta.js";
import { cargarDatos, comprobarRegistro, modificarDatos } from "./almacenamiento.js";
import { fechaISO } from "./fechas.js";
import { abrirPagina, escucharCambios } from "./pagina.js";
import {
    agregarAcciones, agregarFila, contieneTexto, crearAviso, formatearFecha, formatearImporte,
    mostrarDetalle, mostrarTablaVacia, obtenerAccion, obtenerSiguienteId, ordenarLista, pasarACentimos
} from "./interfaz.js";

async function iniciarCuentas(usuarioId) {
    let { cuentas, movimientos } = await cargarDatos(usuarioId);
    const formulario = document.querySelector("#formulario-cuenta");
    const filtros = document.querySelector("#filtros");
    const tabla = document.querySelector("#filas-cuentas");
    const dialogo = document.querySelector("#detalle");
    const titulo = document.querySelector("#titulo-formulario");
    const botonCancelar = document.querySelector("#cancelar");
    const avisar = crearAviso(document.querySelector("#mensaje"));
    const campos = formulario.elements;
    let idEnEdicion = null;
    let cuentaEnEdicion = null;
    let guardando = false;

    function saldoActual(cuenta) {
        return cuenta.calcularSaldoActual(movimientos, fechaISO(new Date()));
    }

    function mostrarCuentas() {
        const { buscar, tipo, orden } = filtros.elements;
        const filtradas = cuentas.filter(cuenta => contieneTexto(cuenta.nombre, buscar.value)
            && (!tipo.value || cuenta.tipo === tipo.value));
        const criterios = {
            nombre: cuenta => cuenta.nombre,
            saldo: saldoActual,
            fecha: cuenta => cuenta.fechaAlta
        };
        const ordenadas = ordenarLista(filtradas, criterios[orden.value], orden.value === "nombre" ? 1 : -1);

        tabla.replaceChildren();
        if (ordenadas.length === 0) {
            mostrarTablaVacia(tabla, 5, "No hay cuentas para mostrar.");
        }

        for (const cuenta of ordenadas) {
            const fila = agregarFila(tabla, [
                cuenta.nombre, cuenta.tipo, formatearFecha(cuenta.fechaAlta), formatearImporte(saldoActual(cuenta))
            ]);
            agregarAcciones(fila, cuenta.id, cuenta.nombre);
        }
    }

    function restablecerFormulario() {
        idEnEdicion = null;
        cuentaEnEdicion = null;
        formulario.reset();
        titulo.textContent = "Nueva cuenta";
        botonCancelar.hidden = true;
    }

    function editarCuenta(cuenta) {
        idEnEdicion = cuenta.id;
        cuentaEnEdicion = cuenta;
        campos.nombre.value = cuenta.nombre;
        campos.tipo.value = cuenta.tipo;
        campos.saldoInicial.value = cuenta.saldoInicial / 100;
        campos.descripcion.value = cuenta.descripcion;
        titulo.textContent = "Editar cuenta";
        botonCancelar.hidden = false;
        avisar("");
        campos.nombre.focus();
    }

    async function guardarCuenta(evento) {
        evento.preventDefault();
        if (guardando) return;
        const nombre = campos.nombre.value.trim();
        const tipo = campos.tipo.value;
        const saldoInicial = pasarACentimos(campos.saldoInicial);
        const descripcion = campos.descripcion.value.trim();

        if (!nombre || !["Banco", "Efectivo"].includes(tipo) || !Number.isFinite(saldoInicial)) {
            avisar("Revisa el nombre, el tipo y el saldo inicial.", true);
            return;
        }

        const anterior = cuentaEnEdicion;
        guardando = true;
        try {
            const datosGuardados = await modificarDatos(usuarioId, datos => {
                if (anterior) {
                    const cuenta = datos.cuentas.find(elemento => elemento.id === anterior.id);
                    comprobarRegistro(cuenta, anterior);
                    cuenta.actualizarDatos(nombre, tipo, saldoInicial, descripcion);
                } else {
                    datos.cuentas.push(new Cuenta(obtenerSiguienteId(datos.cuentas), nombre, tipo,
                        saldoInicial, fechaISO(new Date()), descripcion));
                }
            });
            cuentas = datosGuardados.cuentas;
            movimientos = datosGuardados.movimientos;
            restablecerFormulario();
            mostrarCuentas();
            avisar(anterior ? "Cuenta modificada." : "Cuenta creada.");
        } catch (error) {
            avisar(error.message, true);
        } finally {
            guardando = false;
        }
    }

    async function eliminarCuenta(cuenta) {
        if (guardando) return;
        if (!window.confirm("¿Eliminar la cuenta «" + cuenta.nombre + "»?")) return;
        guardando = true;
        try {
            const datosGuardados = await modificarDatos(usuarioId, datos => {
                const actual = datos.cuentas.find(elemento => elemento.id === cuenta.id);
                comprobarRegistro(actual, cuenta);
                // Comprobamos los movimientos actuales, incluidos los creados en otra pestaña.
                if (actual.obtenerMovimientos(datos.movimientos).length > 0) {
                    throw new Error("Esta cuenta tiene movimientos asociados. Reasígnalos o elimínalos primero.");
                }
                datos.cuentas.splice(datos.cuentas.findIndex(elemento => elemento.id === cuenta.id), 1);
            });
            cuentas = datosGuardados.cuentas;
            movimientos = datosGuardados.movimientos;
            if (idEnEdicion === cuenta.id) restablecerFormulario();
            mostrarCuentas();
            avisar("Cuenta eliminada.");
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
        const cuenta = cuentas.find(elemento => elemento.id === accion.id);
        if (!cuenta) return;

        switch (accion.nombre) {
            case "ver":
                mostrarDetalle(dialogo, [
                    ["Nombre", cuenta.nombre], ["Tipo", cuenta.tipo], ["Fecha de alta", formatearFecha(cuenta.fechaAlta)],
                    ["Saldo inicial", formatearImporte(cuenta.saldoInicial)], ["Saldo actual", formatearImporte(saldoActual(cuenta))],
                    ["Descripción", cuenta.descripcion], ["Movimientos asociados", String(cuenta.obtenerMovimientos(movimientos).length)]
                ]);
                break;
            case "editar":
                editarCuenta(cuenta);
                break;
            case "eliminar":
                await eliminarCuenta(cuenta);
                break;
        }
    }

    formulario.addEventListener("submit", guardarCuenta);
    formulario.addEventListener("keydown", evento => {
        if (!guardando && evento.key === "Escape" && idEnEdicion !== null) restablecerFormulario();
    });
    botonCancelar.addEventListener("click", () => { if (!guardando) restablecerFormulario(); });
    filtros.addEventListener("submit", evento => evento.preventDefault());
    filtros.addEventListener("input", mostrarCuentas);
    tabla.addEventListener("click", gestionarAccion);
    escucharCambios(usuarioId, async () => {
        const datosActuales = await cargarDatos(usuarioId);
        cuentas = datosActuales.cuentas;
        movimientos = datosActuales.movimientos;
        mostrarCuentas();
    });
    mostrarCuentas();
}

abrirPagina(iniciarCuentas);
