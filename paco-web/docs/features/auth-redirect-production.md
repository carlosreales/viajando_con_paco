# Feature: redirección de recuperación en producción

Estado: implementada; verificación parcial

Objetivo y resultado observable: los correos de confirmación y recuperación generados desde Paco publicado solicitan volver al origen HTTPS que el usuario está usando, en vez de una dirección local configurada por error.

Fuentes y comportamiento actual: reporte del usuario del 10 de noviembre de 2026: un correo de recuperación abrió `127.0.0.1:4174`. El cliente ya envía `redirectTo` a Supabase, pero procedía exclusivamente de `APP_ORIGIN` entregado por el servidor.

Alcance y exclusiones: ajusta el cliente y la guía de despliegue. No cambia contraseñas, sesiones, plantillas de correo ni la expiración administrada por Supabase.

Actores y recursos: usuario anónimo solicita recuperación para una cuenta; navegador publicado aporta su propio origen; Supabase emite y valida el enlace de un solo uso.

| Actor | Acción | Recurso/ámbito | Condiciones | Denegación |
| --- | --- | --- | --- | --- |
| Usuario anónimo | Solicitar recuperación | Cuenta indicada | Origen HTTPS o localhost válido y URL registrada en Supabase | Respuesta neutra y sin sesión |
| Supabase | Redirigir el enlace | URL de recuperación | Destino incluido en Redirect URLs | Enlace rechazado o URL del sitio por defecto |

RF-01: para registro, recuperación y reenvío, el cliente debe solicitar como destino el origen HTTPS actual. Sólo se permite HTTP para localhost/127.0.0.1/[::1]; en otro caso conserva el origen seguro del servidor.

RF-02: la configuración operativa debe registrar `https://viajandoconpaco.com` como Site URL y Redirect URL en Supabase, además de `APP_ORIGIN` del mismo valor en Hostinger.

Flujo principal: usuario solicita recuperación en el dominio publicado → cliente pide el correo con `redirectTo=https://viajandoconpaco.com` → Supabase verifica que esté permitido y entrega un enlace de un solo uso → al abrirlo, Supabase crea el estado `PASSWORD_RECOVERY` y Paco muestra el formulario de nueva contraseña.

Alternativas: en desarrollo local, se conserva `http://127.0.0.1:4174`; si el navegador no informa un origen válido, se usa `APP_ORIGIN` como respaldo.

Errores: un enlace ya utilizado o vencido muestra el error de Supabase y no crea sesión de recuperación; se debe solicitar un correo nuevo.

CA-01: dado el navegador en `https://viajandoconpaco.com`, cuando se solicita recuperación, entonces el SDK recibe exactamente esa URL en `redirectTo`.

CA-02: dado un navegador HTTP que no sea local, cuando se construye el destino, entonces no se usa como URL de autenticación.

Riesgo R-01: redirección a un dominio no confiable | exposición de enlace de recuperación | sólo HTTPS/localhost en el cliente y allowlist de Supabase | prueba de contrato y configuración manual verificada.

Decisiones y supuestos con procedencia: la allowlist de Supabase sigue siendo la autoridad de destinos; el origen en tiempo de ejecución protege contra una variable de Hostinger desactualizada sin ampliar la allowlist.

Preparada para implementar: sí; el dominio de producción y el comportamiento de error fueron aportados por el usuario.

Trazabilidad: RF-01/CA-01 | `src/app.js`, `src/backend.js` | `tests/backend.test.mjs` (correcta); RF-02/R-01 | `CONFIGURAR_PRODUCCION_HOSTINGER.md` | comprobación manual en panel Supabase (pendiente).

Verificación: `node --test tests/backend.test.mjs tests/config.test.mjs` — 7 pruebas correctas. Comprobaciones sintácticas de los módulos afectados correctas. `node scripts/build.mjs` no disponible en esta copia: falta el binario opcional local `@esbuild/win32-x64`; Hostinger instala las dependencias desde cero durante el despliegue.
