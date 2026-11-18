import { Cuenta } from "./Cuenta.js";
import { Movimiento } from "./Movimiento.js";
import { cargarDatosIniciales } from "./datosIniciales.js";
import { esFechaValida } from "./fechas.js";

const CLAVE_ANTERIOR = "flujoCaja.datos";

export function leerJSON(clave, valorInicial, deSesion = false) {
    let texto;
    try {
        const almacen = deSesion ? sessionStorage : localStorage;
        texto = almacen.getItem(clave);
    } catch {
        throw new Error("No se puede leer el almacenamiento del navegador. Comprueba sus permisos.");
    }

    if (texto === null) return valorInicial;
    try {
        const valor = JSON.parse(texto);
        if (valor === null) throw new Error();
        return valor;
    } catch {
        throw new Error("Los datos guardados en «" + clave + "» no contienen un JSON válido. No se han borrado.");
    }
}

export function guardarJSON(clave, valor, deSesion = false) {
    try {
        const almacen = deSesion ? sessionStorage : localStorage;
        almacen.setItem(clave, JSON.stringify(valor));
    } catch {
        throw new Error("No se pudo guardar. Comprueba el espacio y los permisos del almacenamiento. El cambio no se ha guardado.");
    }
}

export function conBloqueo(clave, tarea) {
    if (!navigator.locks) {
        throw new Error("Para guardar con seguridad entre pestañas, abre la aplicación en localhost o HTTPS con un navegador compatible con Web Locks.");
    }
    // El navegador da turno a una sola pestaña. Al terminar la tarea, libera el turno.
    return navigator.locks.request(clave, tarea);
}

function validarDatos(datos) {
    if (!datos || !Array.isArray(datos.cuentas) || !Array.isArray(datos.movimientos)) {
        throw new Error("La estructura de las cuentas y los movimientos guardados no es válida. Los datos se conservan.");
    }

    const idsCuentas = new Set();
    const idsMovimientos = new Set();
    for (const cuenta of datos.cuentas) {
        if (!cuenta || !Number.isSafeInteger(cuenta.id) || cuenta.id <= 0 || idsCuentas.has(cuenta.id)
            || typeof cuenta.nombre !== "string" || !cuenta.nombre.trim()
            || !["Banco", "Efectivo"].includes(cuenta.tipo) || !Number.isSafeInteger(cuenta.saldoInicial)
            || !esFechaValida(cuenta.fechaAlta) || typeof cuenta.descripcion !== "string") {
            throw new Error("Hay una cuenta guardada con campos incorrectos. Los datos se conservan.");
        }
        idsCuentas.add(cuenta.id);
    }

    for (const movimiento of datos.movimientos) {
        if (!movimiento || !Number.isSafeInteger(movimiento.id) || movimiento.id <= 0 || idsMovimientos.has(movimiento.id)
            || !idsCuentas.has(movimiento.cuentaId) || typeof movimiento.concepto !== "string" || !movimiento.concepto.trim()
            || !["cobro", "pago"].includes(movimiento.tipo) || !Number.isSafeInteger(movimiento.importe) || movimiento.importe <= 0
            || !esFechaValida(movimiento.fechaPrevista)
            || (movimiento.fechaReal !== "" && !esFechaValida(movimiento.fechaReal))) {
            throw new Error("Hay un movimiento guardado con campos o cuenta incorrectos. Los datos se conservan.");
        }
        idsMovimientos.add(movimiento.id);
    }
}

function leerDatos(usuarioId, hoy = new Date()) {
    const datosGuardados = leerJSON("flujoCaja.datos." + usuarioId, null);
    // El perfil de demostración también puede recuperar los datos del ejercicio anterior.
    const datosAnteriores = datosGuardados === null && usuarioId === "demo"
        ? leerJSON(CLAVE_ANTERIOR, null)
        : null;
    const datos = datosGuardados ?? datosAnteriores ?? cargarDatosIniciales(hoy);
    validarDatos(datos);

    const cuentas = datos.cuentas.map(cuenta => new Cuenta(
        cuenta.id, cuenta.nombre, cuenta.tipo, cuenta.saldoInicial,
        cuenta.fechaAlta, cuenta.descripcion
    ));

    const movimientos = datos.movimientos.map(movimiento => new Movimiento(
        movimiento.id, movimiento.cuentaId, movimiento.concepto, movimiento.tipo,
        movimiento.importe, movimiento.fechaPrevista, movimiento.fechaReal
    ));

    if (datosGuardados === null) {
        guardarJSON("flujoCaja.datos." + usuarioId, { cuentas, movimientos });
    }

    return { cuentas, movimientos };
}

export function cargarDatos(usuarioId, hoy = new Date()) {
    // La primera carga también espera su turno para no duplicar la inicialización.
    return conBloqueo("flujoCaja.datos." + usuarioId, () => leerDatos(usuarioId, hoy));
}

export function modificarDatos(usuarioId, modificar) {
    return conBloqueo("flujoCaja.datos." + usuarioId, () => {
        // Modificamos una copia recién leída, no los objetos que muestra la página.
        const datos = leerDatos(usuarioId);
        modificar(datos);
        validarDatos(datos);
        guardarJSON("flujoCaja.datos." + usuarioId, datos);
        return datos; // La interfaz solo recibe los cambios si se han guardado.
    });
}

export function comprobarRegistro(actual, anterior) {
    if (!actual || JSON.stringify(actual) !== JSON.stringify(anterior)) {
        throw new Error("Otra pestaña ha modificado o eliminado este registro. Cancela la edición y consulta el listado actualizado.");
    }
}
