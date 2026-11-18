import {
    DEMO, calcularHuella, guardarUsuario, iniciarSesion, obtenerSesion, obtenerUsuarios
} from "./sesion.js";
import { guardarJSON, leerJSON } from "./almacenamiento.js";

const formulario = document.querySelector("#formulario-acceso");
const aviso = document.querySelector("#mensaje");
const esRegistro = formulario.dataset.modo === "registro";
const patronNombre = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{1,59}$/u;
const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const patronClave = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,64}$/;

function avisar(texto, campo) {
    aviso.textContent = texto;
    if (campo) {
        campo.setAttribute("aria-invalid", "true");
        campo.focus();
    }
}

function validarAcceso(campos, correo, clave) {
    if (!patronCorreo.test(correo)) {
        avisar("Introduce un correo válido.", campos.correo);
        return false;
    }

    if (!patronClave.test(clave)) {
        avisar("Usa entre 8 y 64 caracteres, con mayúscula, minúscula y número, sin espacios.", campos.clave);
        return false;
    }

    return true;
}

async function registrar(campos, correo, clave) {
    const nombre = campos.nombre.value.trim();
    if (!patronNombre.test(nombre)) {
        avisar("Escribe un nombre de 2 a 60 caracteres con letras.", campos.nombre);
        return;
    }

    if (campos.confirmacion.value !== clave) {
        avisar("Las claves deben coincidir.", campos.confirmacion);
        return;
    }

    const huella = await calcularHuella(clave, correo);
    if (correo === DEMO.correo || obtenerUsuarios().some(usuario => usuario.correo === correo)) {
        avisar("Ya existe un perfil con ese correo.", campos.correo);
        return;
    }

    await guardarUsuario({ id: crypto.randomUUID(), nombre, correo, huella });
    try {
        guardarJSON("flujoCaja.registroConfirmado", 1, true);
    } catch {
        // El perfil ya se ha guardado aunque no podamos conservar este aviso.
        avisar("Perfil creado. Puedes ir a iniciar sesión; no se pudo guardar el aviso de confirmación.");
        return;
    }
    location.assign("login.html");
}

async function acceder(campos, correo, clave) {
    if (correo === DEMO.correo && clave === DEMO.clave) {
        iniciarSesion(DEMO);
        location.assign("index.html");
        return;
    }

    const usuario = obtenerUsuarios().find(usuario => usuario.correo === correo);
    if (!usuario || usuario.huella !== await calcularHuella(clave, correo)) {
        avisar("Correo o clave incorrectos.", campos.clave);
        return;
    }

    iniciarSesion(usuario);
    location.assign("index.html");
}

async function tramitarAcceso(evento) {
    evento.preventDefault();
    const campos = formulario.elements;
    const correo = campos.correo.value.trim().toLowerCase();
    const clave = campos.clave.value;
    const boton = formulario.querySelector("button[type='submit']");
    if (boton.disabled || !validarAcceso(campos, correo, clave)) return;

    boton.disabled = true;
    try {
        if (esRegistro) {
            await registrar(campos, correo, clave);
        } else {
            await acceder(campos, correo, clave);
        }
    } catch (error) {
        console.error(error);
        avisar(error.message);
    } finally {
        boton.disabled = false;
    }
}

function limpiarAviso(evento) {
    evento.target.removeAttribute("aria-invalid");
    aviso.textContent = "";
}

function iniciarAcceso() {
    try {
        if (obtenerSesion()) {
            location.replace("index.html");
            return;
        }
        if (!esRegistro) {
            const confirmado = leerJSON("flujoCaja.registroConfirmado", null, true);
            if (confirmado !== null && confirmado !== 1) throw new Error("El aviso de registro guardado no es válido.");
            if (confirmado === 1) {
                sessionStorage.removeItem("flujoCaja.registroConfirmado");
                avisar("Perfil creado. Ya puedes iniciar sesión.");
            }
        }
    } catch (error) {
        avisar(error.message || "No se pudo leer la sesión. Comprueba los permisos del almacenamiento.");
    }
    // Un fallo al leer la sesión no impide volver a introducir credenciales.
    formulario.addEventListener("submit", tramitarAcceso);
    formulario.addEventListener("input", limpiarAviso);
}

iniciarAcceso();
