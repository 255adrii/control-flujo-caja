const formatoMoneda = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const ordenTexto = new Intl.Collator("es", { sensitivity: "base" });

export function formatearImporte(centimos) {
    return formatoMoneda.format(centimos / 100);
}

export function formatearFecha(fecha) {
    return fecha ? fecha.split("-").reverse().join("/") : "—";
}

export function pasarACentimos(campo) {
    const centimos = Math.round(campo.valueAsNumber * 100);
    return Number.isSafeInteger(centimos) ? centimos : NaN;
}

export function obtenerSiguienteId(lista) {
    let mayorId = 0;
    for (const elemento of lista) {
        mayorId = Math.max(mayorId, elemento.id);
    }
    return mayorId + 1;
}

export function ordenarLista(lista, obtenerValor, direccion = 1) {
    // El criterio indica qué campo comparar. slice() evita ordenar el array original.
    // direccion vale 1 para ascendente y -1 para descendente.
    return lista.slice().sort((primero, segundo) => {
        const valorPrimero = obtenerValor(primero);
        const valorSegundo = obtenerValor(segundo);
        const comparacion = typeof valorPrimero === "number"
            ? valorPrimero - valorSegundo
            : ordenTexto.compare(valorPrimero, valorSegundo);
        return comparacion * direccion;
    });
}

export function llenarSelectorCuentas(selector, cuentas, opcionInicial = "") {
    selector.replaceChildren();
    if (opcionInicial) selector.add(new Option(opcionInicial, ""));
    for (const cuenta of cuentas) {
        selector.add(new Option(cuenta.nombre, String(cuenta.id)));
    }
}

export function agregarFila(tabla, valores) {
    const fila = tabla.insertRow();
    for (const valor of valores) {
        fila.insertCell().textContent = valor;
    }
    return fila;
}

export function mostrarTablaVacia(tabla, columnas, texto) {
    const fila = agregarFila(tabla, [texto]);
    fila.cells[0].colSpan = columnas;
}

function crearBoton(texto, accion, nombre) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    boton.setAttribute("aria-label", texto + " " + nombre);
    boton.dataset.accion = accion;
    return boton;
}

export function agregarAcciones(fila, id, nombre) {
    fila.dataset.id = id;
    const celda = fila.insertCell();
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    acciones.append(
        crearBoton("Ver", "ver", nombre),
        crearBoton("Editar", "editar", nombre),
        crearBoton("Eliminar", "eliminar", nombre)
    );
    celda.append(acciones);
}

export function mostrarDetalle(dialogo, campos) {
    const ficha = dialogo.querySelector("dl");
    ficha.replaceChildren();
    for (const [nombre, valor] of campos) {
        const titulo = document.createElement("dt");
        const dato = document.createElement("dd");
        titulo.textContent = nombre;
        dato.textContent = valor || "—";
        ficha.append(titulo, dato);
    }
    dialogo.showModal();
}

export function crearAviso(elemento) {
    // Cada aviso conserva su propio temporizador y cancela el del mensaje anterior.
    let temporizador;
    return function mostrarAviso(texto, error = false) {
        clearTimeout(temporizador);
        elemento.textContent = texto;
        elemento.classList.toggle("negativo", error);
        // Los errores se mantienen hasta que el usuario los corrija.
        if (!error && texto) {
            temporizador = setTimeout(() => { elemento.textContent = ""; }, 4500);
        }
    };
}

export function mostrarError(error) {
    let aviso = document.querySelector("#error-almacenamiento");
    if (!aviso && error) {
        aviso = document.createElement("p");
        aviso.id = "error-almacenamiento";
        aviso.className = "negativo";
        aviso.setAttribute("role", "alert");
        document.body.prepend(aviso);
    }
    if (aviso) {
        aviso.textContent = error ? error.message : "";
        aviso.hidden = !error;
    }
}

export function obtenerAccion(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return null;
    return { id: Number(boton.closest("tr").dataset.id), nombre: boton.dataset.accion };
}

export function contieneTexto(texto, busqueda) {
    const normalizar = valor => valor.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    return normalizar(texto).includes(normalizar(busqueda.trim()));
}
