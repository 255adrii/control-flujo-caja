// Usamos la fecha local y el formato del input de tipo date: aaaa-mm-dd.
export function fechaISO(fecha) {
    const anio = String(fecha.getFullYear()).padStart(4, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

export function esFechaValida(fecha) {
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const valor = new Date(fecha + "T00:00:00");
    return !Number.isNaN(valor.getTime()) && fechaISO(valor) === fecha;
}

export function desplazarFecha(fecha, dias) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return fechaISO(nuevaFecha);
}
