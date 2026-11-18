export function calcularPrevision(cuenta, movimientos, hoy, fechaLimite) {
    let saldo = cuenta.calcularSaldoActual(movimientos, hoy);

    const pendientes = cuenta.obtenerMovimientos(movimientos)
        .filter(movimiento => movimiento.estaPendiente() && movimiento.fechaPrevista <= fechaLimite)
        .sort((primero, segundo) => primero.fechaPrevista.localeCompare(segundo.fechaPrevista));

    const prevision = [];

    for (const movimiento of pendientes) {
        // Los vencidos siguen pendientes. En la previsión se incluyen en el día de hoy.
        const fecha = movimiento.fechaPrevista < hoy ? hoy : movimiento.fechaPrevista;
        const ultimoDia = prevision[prevision.length - 1];
        saldo += movimiento.obtenerImporteConSigno();

        // Mostramos el saldo al final de cada fecha, tras aplicar todos sus movimientos.
        if (ultimoDia && ultimoDia.fecha === fecha) {
            ultimoDia.saldo = saldo;
        } else {
            prevision.push({ fecha, saldo });
        }
    }

    return prevision;
}
