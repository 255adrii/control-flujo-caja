const NOMBRE_COOKIE = "flujoCajaHorizonte";

export function leerHorizonte() {
    const prefijo = NOMBRE_COOKIE + "=";
    const cookie = document.cookie.split(";").map(par => par.trim())
        .find(par => par.startsWith(prefijo));
    return cookie ? Number(cookie.slice(prefijo.length)) : 7;
}

export function guardarHorizonte(dias) {
    document.cookie = NOMBRE_COOKIE + "=" + dias + "; Max-Age=2592000; Path=/; SameSite=Lax";
}
