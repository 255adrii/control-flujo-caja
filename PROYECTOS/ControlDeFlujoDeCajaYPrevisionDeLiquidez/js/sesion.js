import { conBloqueo, leerJSON, guardarJSON } from "./almacenamiento.js";

const CLAVE_USUARIOS = "flujoCaja.usuarios";
const CLAVE_SESION = "flujoCaja.sesion";

export const DEMO = {
    id: "demo",
    nombre: "Demostración",
    correo: "demo@ejemplo.com",
    clave: "DemoCaja2026"
};

export function obtenerUsuarios() {
    const usuarios = leerJSON(CLAVE_USUARIOS, []);
    if (!Array.isArray(usuarios)) throw new Error("La lista de perfiles guardada no es válida. No se ha borrado.");
    const ids = new Set();
    const correos = new Set();
    for (const usuario of usuarios) {
        if (!usuario || typeof usuario.id !== "string" || !usuario.id.trim() || ids.has(usuario.id)
            || typeof usuario.nombre !== "string" || !usuario.nombre.trim()
            || typeof usuario.correo !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.correo)
            || correos.has(usuario.correo) || typeof usuario.huella !== "string" || !/^[a-f0-9]{64}$/.test(usuario.huella)) {
            throw new Error("Hay un perfil guardado con campos incorrectos. Los datos se conservan.");
        }
        ids.add(usuario.id);
        correos.add(usuario.correo);
    }
    return usuarios;
}

export function guardarUsuario(usuario) {
    return conBloqueo(CLAVE_USUARIOS, () => {
        const usuarios = obtenerUsuarios();
        if (usuario.correo === DEMO.correo || usuarios.some(actual => actual.correo === usuario.correo)) {
            throw new Error("Ya existe un perfil con ese correo.");
        }
        usuarios.push(usuario);
        guardarJSON(CLAVE_USUARIOS, usuarios);
    });
}

export function iniciarSesion(usuario) {
    const { id, nombre } = usuario;
    guardarJSON(CLAVE_SESION, { id, nombre }, true);
}

export function obtenerSesion() {
    const usuario = leerJSON(CLAVE_SESION, null, true);
    if (usuario !== null && (typeof usuario.id !== "string" || !usuario.id.trim()
        || typeof usuario.nombre !== "string" || !usuario.nombre.trim())) {
        throw new Error("La sesión guardada no es válida. Vuelve a iniciar sesión desde login.html.");
    }
    return usuario;
}

export function cerrarSesion() {
    try {
        sessionStorage.removeItem(CLAVE_SESION);
    } catch {
        throw new Error("No se pudo cerrar la sesión. Comprueba los permisos del almacenamiento.");
    }
    location.replace("login.html");
}

// La huella evita guardar la clave como texto. El acceso sigue siendo local y didáctico.
export async function calcularHuella(clave, correo) {
    if (!crypto.subtle) throw new Error("Abre la aplicación en localhost o HTTPS para poder comprobar las claves.");
    // SHA-256 trabaja con bytes: primero convertimos el correo y la clave a UTF-8.
    const entrada = new TextEncoder().encode(correo + ":" + clave);
    const huella = await crypto.subtle.digest("SHA-256", entrada);
    // Representamos cada byte con dos dígitos hexadecimales para guardarlo como texto.
    return Array.from(new Uint8Array(huella), byte => byte.toString(16).padStart(2, "0")).join("");
}
