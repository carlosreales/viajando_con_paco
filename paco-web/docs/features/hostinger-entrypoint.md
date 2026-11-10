# Feature: entrada compatible con Hostinger

Estado: implementada

Objetivo y resultado observable: Hostinger debe detectar una llamada a `listen()` al cargar el archivo de entrada y servir la aplicación sin devolver 503.

Fuente y comportamiento actual: registro de Hostinger del 10 de noviembre de 2026: la aplicación no llamó a `listen()` en tres segundos porque `server.mjs` protegía el arranque mediante una comprobación de módulo principal.

Alcance: `server.mjs` inicia el servicio cuando el proceso no es el ejecutor de pruebas de Node. `hostinger.mjs` lo importa como entrada compatible. Se conserva la posibilidad de importar el servidor durante pruebas.

RF-01: el archivo configurado como entrada en Hostinger debe iniciar el servidor sin una guarda de módulo principal.

CA-01: dado `hostinger.mjs` como archivo de entrada y variables válidas, cuando Hostinger carga el módulo, entonces se invoca `listen()`.

Riesgo R-01: Hostinger carga el módulo de entrada de forma distinta a `node server.mjs` y el servidor no inicia. Control: punto de entrada dedicado sin guarda; verificación: comprobación sintáctica y despliegue en Hostinger.

Preparada para implementar: sí; el registro determina la causa y no afecta datos ni permisos.

Trazabilidad: RF-01/CA-01/R-01 | `hostinger.mjs`, `server.mjs` | `node --check hostinger.mjs`, pruebas Node; producción pendiente de redeploy.
