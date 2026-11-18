import { cerrarSesion, obtenerSesion } from "./sesion.js";
import { mostrarError } from "./interfaz.js";

const paginas = [
    ["index.html", "Resumen"],
    ["cuentas.html", "Cuentas"],
    ["movimientos.html", "Movimientos"],
    ["prevision.html", "Previsión"]
];

class MenuPrincipal extends HTMLElement {
    connectedCallback() {
        let usuario;
        try {
            usuario = obtenerSesion();
        } catch (error) {
            mostrarError(error);
            return;
        }
        if (!usuario) return;

        const navegacion = document.createElement("nav");
        navegacion.setAttribute("aria-label", "Menú principal");
        for (const [archivo, nombre] of paginas) {
            const enlace = document.createElement("a");
            enlace.href = archivo;
            enlace.textContent = nombre;
            if (nombre === this.getAttribute("pagina")) enlace.setAttribute("aria-current", "page");
            navegacion.append(enlace);
        }

        const perfil = document.createElement("span");
        perfil.textContent = usuario.nombre;
        const salida = document.createElement("button");
        salida.type = "button";
        salida.textContent = "Cerrar sesión";
        salida.addEventListener("click", () => {
            try {
                cerrarSesion();
            } catch (error) {
                mostrarError(error);
            }
        });
        const usuarioMenu = document.createElement("div");
        usuarioMenu.className = "perfil-menu";
        usuarioMenu.append(perfil, salida);
        this.replaceChildren(navegacion, usuarioMenu);
    }
}

customElements.define("menu-principal", MenuPrincipal);
