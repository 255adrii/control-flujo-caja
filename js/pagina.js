import "./menu-principal.js";
import { obtenerSesion } from "./sesion.js";
import { mostrarError } from "./interfaz.js";

export async function abrirPagina(iniciar) {
    try {
        const usuario = obtenerSesion();

        if (usuario === null) {
            location.replace("login.html");
            return;
        }

        await iniciar(usuario.id);
        document.querySelector("main").hidden = false;
        // Al volver desde el historial, cargamos los cambios guardados en otras páginas.
        window.addEventListener("pageshow", evento => {
            if (evento.persisted) location.reload();
        });
    } catch (error) {
        mostrarError(error);
    }
}

export function escucharCambios(usuarioId, actualizar) {
    async function recargarDatos() {
        try {
            await actualizar();
            mostrarError(null);
        } catch (error) {
            mostrarError(error);
        }
    }

    // storage se dispara en las otras pestañas del mismo origen.
    window.addEventListener("storage", evento => {
        try {
            if (evento.storageArea === localStorage
                && (evento.key === "flujoCaja.datos." + usuarioId || evento.key === null)) {
                return recargarDatos();
            }
        } catch (error) {
            mostrarError(error);
        }
    });
    window.addEventListener("focus", recargarDatos);
}
