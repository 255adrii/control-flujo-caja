import { cargarDatos } from "./almacenamiento.js";
import { guardarHorizonte, leerHorizonte } from "./cookies.js";
import { desplazarFecha, fechaISO } from "./fechas.js";
import { abrirPagina, escucharCambios } from "./pagina.js";
import { calcularPrevision } from "./prevision.js";
import {
    agregarFila, formatearFecha, formatearImporte, llenarSelectorCuentas, mostrarTablaVacia
} from "./interfaz.js";

async function iniciarPrevision(usuarioId) {
    let { cuentas, movimientos } = await cargarDatos(usuarioId);
    const selectorCuenta = document.querySelector("#cuenta");
    const selectorHorizonte = document.querySelector("#horizonte");
    const saldoActual = document.querySelector("#saldo-actual");
    const aviso = document.querySelector("#aviso");
    const tabla = document.querySelector("#filas-prevision");

    function mostrarPrevision() {
        tabla.replaceChildren();
        const cuenta = cuentas.find(elemento => elemento.id === Number(selectorCuenta.value));
        if (!cuenta) {
            saldoActual.textContent = "—";
            saldoActual.classList.remove("negativo");
            aviso.classList.remove("negativo");
            aviso.textContent = "Crea una cuenta para consultar su previsión.";
            mostrarTablaVacia(tabla, 2, "No hay cuentas para mostrar.");
            return;
        }

        const ahora = new Date();
        const hoy = fechaISO(ahora);
        const limite = desplazarFecha(ahora, Number(selectorHorizonte.value));
        const saldo = cuenta.calcularSaldoActual(movimientos, hoy);
        const prevision = calcularPrevision(cuenta, movimientos, hoy, limite);
        const primerDiaNegativo = prevision.find(dia => dia.saldo < 0);

        saldoActual.textContent = formatearImporte(saldo);
        saldoActual.classList.toggle("negativo", saldo < 0);
        aviso.classList.toggle("negativo", saldo < 0 || Boolean(primerDiaNegativo));

        if (saldo < 0) {
            aviso.textContent = "El saldo actual ya está en negativo.";
        } else if (primerDiaNegativo) {
            aviso.textContent = "Saldo previsto en negativo el " + formatearFecha(primerDiaNegativo.fecha) + ".";
        } else {
            aviso.textContent = "Sin saldo negativo previsto para esta cuenta.";
        }

        if (prevision.length === 0) mostrarTablaVacia(tabla, 2, "Sin movimientos pendientes en ese plazo.");
        for (const dia of prevision) {
            const fila = agregarFila(tabla, [formatearFecha(dia.fecha), formatearImporte(dia.saldo)]);
            fila.cells[1].classList.toggle("negativo", dia.saldo < 0);
        }
    }

    function cambiarHorizonte() {
        guardarHorizonte(selectorHorizonte.value);
        mostrarPrevision();
    }

    llenarSelectorCuentas(selectorCuenta, cuentas);
    selectorCuenta.disabled = cuentas.length === 0;
    const horizonte = leerHorizonte();
    selectorHorizonte.value = [7, 15, 30].includes(horizonte) ? horizonte : 7;
    selectorCuenta.addEventListener("change", mostrarPrevision);
    selectorHorizonte.addEventListener("change", cambiarHorizonte);
    escucharCambios(usuarioId, async () => {
        const seleccionada = selectorCuenta.value;
        const datosActuales = await cargarDatos(usuarioId);
        cuentas = datosActuales.cuentas;
        movimientos = datosActuales.movimientos;
        llenarSelectorCuentas(selectorCuenta, cuentas);
        if (cuentas.some(cuenta => String(cuenta.id) === seleccionada)) selectorCuenta.value = seleccionada;
        selectorCuenta.disabled = cuentas.length === 0;
        mostrarPrevision();
    });
    let ultimaFecha = fechaISO(new Date());
    setInterval(() => {
        const hoy = fechaISO(new Date());
        if (hoy !== ultimaFecha) {
            mostrarPrevision();
            ultimaFecha = hoy;
        }
    }, 1000);
    mostrarPrevision();
}

abrirPagina(iniciarPrevision);
