# Control de flujo de caja y previsión de liquidez

Aplicación para gestionar cuentas, registrar cobros y pagos y consultar la liquidez prevista a 7, 15 o 30 días.

Proyecto individual de 2.º DAW para la primera entrega de Desarrollo Web en Entorno Cliente (RA2–RA5). Desarrollado con HTML, CSS y JavaScript, con módulos nativos y un componente web para el menú.

## Cómo probar la aplicación

### Con Visual Studio Code y Live Server

1. Descarga el repositorio desde **Code → Download ZIP** y descomprímelo, o clónalo con Git.
2. Abre la carpeta del proyecto en Visual Studio Code.
3. Abre [flujo-caja/login.html](flujo-caja/login.html) con **Open with Live Server**.
4. Inicia sesión con el perfil de demostración o registra un perfil local.

### Con Python

Abre una terminal en la carpeta del repositorio y entra en la aplicación:

```sh
cd flujo-caja
```

En Windows, inicia el servidor con:

```sh
py -m http.server 8000 --bind 127.0.0.1
```

En Linux o macOS, si tienes Python 3 instalado:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre **http://127.0.0.1:8000/login.html** en el navegador. Puedes detener el servidor con `Ctrl+C`.

La aplicación necesita servirse desde localhost o HTTPS para utilizar los módulos, Web Crypto y Web Locks. Utiliza un navegador compatible con estas APIs. No requiere instalar paquetes npm ni compilar el proyecto.

## Perfil de demostración

- **Correo:** `demo@ejemplo.com`
- **Clave:** `DemoCaja2026`

El acceso es una simulación local para la práctica. Utiliza nombres, correos y claves ficticios.

## Qué puedes hacer

- Crear, consultar, editar, eliminar, filtrar y ordenar cuentas y movimientos.
- Asociar cada movimiento a una cuenta y distinguir cobros y pagos pendientes o realizados.
- Consultar el saldo total y los próximos vencimientos en Resumen.
- Consultar la previsión de una cuenta y detectar saldos negativos al cierre de cada fecha.
- Mantener los cambios entre recargas y actualizar los datos de otras pestañas.

## Recorrido de ejemplo

1. Entra con el perfil de demostración. Con los datos iniciales recién cargados, Resumen muestra **595 €** de saldo total.
2. Abre Previsión y selecciona Cuenta principal: parte de **500 €**, pasa a **−150 €** con el pago pendiente de 650 € y después a **150 €** con el cobro de 300 €.
3. Crea una cuenta Ahorros con **200 €** de saldo inicial.
4. Registra para ella un pago de **250 €**, con vencimiento mañana y fecha real vacía. Su saldo actual sigue siendo 200 € y su previsión muestra **−50 €**.
5. Edita el pago y establece hoy como fecha real. El saldo actual pasa a −50 € y el pago deja de estar pendiente.

Las fechas iniciales se generan al entrar por primera vez en cada perfil. Para repetir el ejemplo desde cero conservando tus datos habituales, puedes utilizar una ventana privada.

## Páginas y organización

Los archivos de la aplicación están en `flujo-caja/`:

- [login.html](flujo-caja/login.html): acceso al perfil.
- [registro.html](flujo-caja/registro.html): creación de un perfil con validaciones.
- [index.html](flujo-caja/index.html): resumen de saldos y vencimientos.
- [cuentas.html](flujo-caja/cuentas.html): gestión de cuentas.
- [movimientos.html](flujo-caja/movimientos.html): gestión de cobros y pagos.
- [prevision.html](flujo-caja/prevision.html): previsión de liquidez por cuenta.
- [estilos.css](flujo-caja/estilos.css): estilos compartidos.
- [js/](flujo-caja/js/): clases, almacenamiento, validaciones, componente del menú y lógica de las páginas.

## Datos y funcionamiento

- Los datos de cada perfil se guardan por separado en `localStorage`; la sesión activa utiliza `sessionStorage`.
- Una cookie conserva el horizonte de previsión. Usa siempre la misma dirección y puerto para recuperar los mismos datos.
- Los importes se almacenan en céntimos enteros y las fechas en formato `aaaa-mm-dd`.
- La fecha real vacía indica que el movimiento sigue pendiente. Los vencidos se incluyen hoy en la previsión.
- Una cuenta con movimientos asociados no puede eliminarse hasta reasignarlos o eliminarlos.
- Cada guardado espera su turno con `navigator.locks` y vuelve a leer los datos actuales. Si otra pestaña ha cambiado el mismo registro durante una edición, se avisa para evitar sobrescribirlo.
- Los errores de almacenamiento muestran un aviso; los datos incorrectos se conservan y no se sustituyen automáticamente por los de ejemplo.

El proyecto funciona íntegramente en el navegador. Las cuentas y los perfiles permanecen en el navegador donde se crearon; no se comparten entre dispositivos.
