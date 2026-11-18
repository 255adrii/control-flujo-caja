import { Cuenta } from "./Cuenta.js";
import { Movimiento } from "./Movimiento.js";
import { desplazarFecha } from "./fechas.js";

export function cargarDatosIniciales(hoy) {
    const alta = desplazarFecha(hoy, -30);
    const ayer = desplazarFecha(hoy, -1);
    const manana = desplazarFecha(hoy, 1);
    const pasadoManana = desplazarFecha(hoy, 2);

    // Guardamos los importes en céntimos enteros para sumar sin errores de redondeo.
    const cuentas = [
        new Cuenta(1, "Cuenta principal", "Banco", 35000, alta, "Cuenta del negocio"),
        new Cuenta(2, "Caja", "Efectivo", 12000, alta, "Efectivo disponible")
    ];

    const movimientos = [
        new Movimiento(1, 1, "Cobro por un encargo", "cobro", 15000, ayer, ayer),
        new Movimiento(2, 1, "Pago a un proveedor", "pago", 65000, manana, ""),
        new Movimiento(3, 1, "Factura de un cliente", "cobro", 30000, pasadoManana, ""),
        new Movimiento(4, 2, "Material de oficina", "pago", 2500, ayer, ayer)
    ];

    return { cuentas, movimientos };
}
