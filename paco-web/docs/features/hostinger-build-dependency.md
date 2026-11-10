# Feature: compilación de producción en Hostinger

Estado: verificación parcial

Objetivo y resultado observable: Hostinger debe instalar `esbuild` aun cuando configure `NODE_ENV=production`, para que `npm run build` pueda generar `dist`.

Fuente y comportamiento actual: diagnóstico de Hostinger del 10 de noviembre de 2026: `ERR_MODULE_NOT_FOUND` para `esbuild`; el paquete se encontraba en `devDependencies` mientras el script de compilación lo importa.

Alcance y exclusiones: se mueve únicamente `esbuild` a `dependencies`. No se modifican secretos, Supabase ni el servidor.

Actor y flujo: Hostinger instala dependencias de producción, ejecuta `npm run build` y genera `dist`. Si `esbuild` falta, el proceso se detiene antes de publicar.

RF-01: `esbuild` debe ser una dependencia de producción porque el build remoto lo requiere.

CA-01: dado un entorno que omite `devDependencies`, cuando Hostinger ejecuta `npm run build`, entonces Node puede resolver `esbuild`.

Riesgo R-01: una dependencia de compilación omitida bloquea el despliegue. Control: declarar `esbuild` en `dependencies`; verificación: revisión del manifiesto y build local.

Preparada para implementar: sí; corrección localizada y autorizada por la solicitud de resolver el error.

Trazabilidad: RF-01/CA-01/R-01 | `package.json` | `node scripts/build.mjs`.

Verificación: `node scripts/build.mjs` correcto. La prueba HTTP local no se pudo completar en este entorno porque la conexión de bucle local fue denegada (`EACCES`); no afecta al cambio de dependencias. Hostinger debe reinstalar dependencias y redeplegar para confirmar el entorno real.
