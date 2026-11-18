import { cargarDatos } from "./almacenamiento.js";
import { fechaISO } from "./fechas.js";
import { abrirPagina, escucharCambios } from "./pagina.js";
import { agregarFila, formatearFecha, formatearImporte, mostrarTablaVacia, ordenarLista } from "./interfaz.js";

async function iniciarResumen(usuarioId) {
    let { cuentas, movimientos } = await cargarDatos(usuarioId);
    const tabla = document.querySelector("#vencimientos");
    const reloj = document.querySelector("#reloj");
    let ultimaFecha;

    function mostrarResumen(hoy) {
        let saldo = 0;
        let cobros = 0;
        let pagos = 0;
        for (const cuenta of cuentas) {
            saldo += cuenta.calcularSaldoActual(movimientos, hoy);
        }

        const pendientes = movimientos.filter(movimiento => movimiento.estaPendiente());
        for (const movimiento of pendientes) {
            if (movimiento.tipo === "cobro") {
                cobros += movimiento.importe;
            } else {
                pagos += movimiento.importe;
            }
        }

        const saldoElemento = document.querySelector("#saldo-actual");
        saldoElemento.textContent = formatearImporte(saldo);
        saldoElemento.classList.toggle("negativo", saldo < 0);
        document.querySelector("#cobros-pendientes").textContent = formatearImporte(cobros);
        document.querySelector("#pagos-pendientes").textContent = formatearImporte(pagos);

        tabla.replaceChildren();
        const proximos = ordenarLista(pendientes, movimiento => movimiento.fechaPrevista).slice(0, 5);
        if (proximos.length === 0) mostrarTablaVacia(tabla, 5, "No hay vencimientos pendientes.");
        for (const movimiento of proximos) {
            const cuenta = cuentas.find(elemento => elemento.id === movimiento.cuentaId);
            agregarFila(tabla, [
                formatearFecha(movimiento.fechaPrevista), movimiento.concepto, cuenta?.nombre ?? "—",
                formatearImporte(movimiento.obtenerImporteConSigno()),
                movimiento.fechaPrevista < hoy ? "Vencido" : "Pendiente"
            ]);
        }
    }

    function actualizarFechaYHora() {
        const ahora = new Date();
        const hoy = fechaISO(ahora);
        reloj.textContent = formatearFecha(hoy) + " · " + ahora.toLocaleTimeString("es-ES");
        if (hoy !== ultimaFecha) {
            mostrarResumen(hoy);
            ultimaFecha = hoy;
        }
    }

    actualizarFechaYHora();
    setInterval(actualizarFechaYHora, 1000);
    escucharCambios(usuarioId, async () => {
        const datosActuales = await cargarDatos(usuarioId);
        cuentas = datosActuales.cuentas;
        movimientos = datosActuales.movimientos;
        mostrarResumen(fechaISO(new Date()));
    });
}

abrirPagina(iniciarResumen);
