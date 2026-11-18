export class Movimiento {
    constructor(id, cuentaId, concepto, tipo, importe, fechaPrevista, fechaReal) {
        this.id = id;
        this.actualizarDatos(cuentaId, concepto, tipo, importe, fechaPrevista, fechaReal);
    }

    actualizarDatos(cuentaId, concepto, tipo, importe, fechaPrevista, fechaReal) {
        this.cuentaId = cuentaId;
        this.concepto = concepto;
        this.tipo = tipo;
        this.importe = importe;
        this.fechaPrevista = fechaPrevista;
        this.fechaReal = fechaReal;
    }

    obtenerImporteConSigno() {
        if (this.tipo === "pago") {
            return -this.importe;
        }

        return this.importe;
    }

    estaPendiente() {
        return this.fechaReal === "";
    }

    estaRealizadoHasta(fechaConsulta) {
        return !this.estaPendiente() && this.fechaReal <= fechaConsulta;
    }
}
