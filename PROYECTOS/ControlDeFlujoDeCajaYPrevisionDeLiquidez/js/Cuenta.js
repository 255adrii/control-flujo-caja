export class Cuenta {
    constructor(id, nombre, tipo, saldoInicial, fechaAlta, descripcion) {
        this.id = id;
        this.fechaAlta = fechaAlta;
        this.actualizarDatos(nombre, tipo, saldoInicial, descripcion);
    }

    actualizarDatos(nombre, tipo, saldoInicial, descripcion) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.saldoInicial = saldoInicial;
        this.descripcion = descripcion;
    }

    obtenerMovimientos(movimientos) {
        return movimientos.filter(movimiento => movimiento.cuentaId === this.id);
    }

    calcularSaldoActual(movimientos, fechaConsulta) {
        let saldo = this.saldoInicial;

        // Los movimientos pendientes solo afectan a la previsión.
        for (const movimiento of this.obtenerMovimientos(movimientos)) {
            if (movimiento.estaRealizadoHasta(fechaConsulta)) {
                saldo += movimiento.obtenerImporteConSigno();
            }
        }

        return saldo;
    }
}
