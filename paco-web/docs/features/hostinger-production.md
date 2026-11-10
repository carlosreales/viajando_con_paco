# Feature: preparación para producción en Hostinger

Estado: verificada localmente

Objetivo y resultado observable: desplegar la misma aplicación Node.js en Hostinger, con un origen HTTPS configurado, fotos privadas operativas y una comprobación de salud sin datos sensibles.

Fuentes y comportamiento actual: solicitud del usuario del 28 de septiembre de 2026; el servidor usa `PORT`, `APP_ORIGIN`, Supabase y un endpoint de fotos. La guía oficial de Hostinger permite aplicaciones Node.js tipo `Other`, configuración por variables y despliegue desde GitHub.

Alcance y exclusiones: se prepara el repositorio y su documentación. No se crea un sitio Hostinger, no se modifican URLs de Supabase ni se publica una versión.

Actores y recursos: visitante anónimo (lee estáticos y salud); usuario autenticado (usa Supabase y puede cargar sus propias fotos); Hostinger (inyecta configuración del entorno); Supabase (Auth, datos y Storage).

| Actor | Acción | Recurso/ámbito | Condiciones | Denegación |
| --- | --- | --- | --- | --- |
| Visitante | Consultar salud | `GET /api/health` | Sin credenciales | No expone configuración ni secretos |
| Usuario autenticado | Cargar foto | Recursos propios | Origen igual a `APP_ORIGIN` y token válido | 401, 403 o 404 sin escribir datos |
| Hostinger | Iniciar servidor | Proceso Node.js | `PORT`, `HOST=0.0.0.0` y variables válidas | Inicio aborta ante configuración inválida |

RF-01: el servidor debe usar `HOST` para permitir que el proxy de Hostinger llegue al proceso, admitiendo solamente valores explícitos para desarrollo o producción.

RF-02: `GET /api/health` debe responder `200` con `{"status":"ok"}` y no revelar configuración.

RNF-01: secretos | nunca aparecen en la configuración pública, documentación de ejemplo ni registro de la aplicación | verificación con pruebas de configuración y revisión de archivos.

Flujo principal: Hostinger obtiene el repositorio, instala dependencias, ejecuta `npm run build`, inicia `npm start` con variables del panel y enruta HTTPS al proceso. El navegador carga la aplicación y usa el mismo origen configurado para fotos.

Alternativas: sin clave de servicio, la aplicación sigue funcionando pero fotos devuelve `503 PHOTOS_NOT_CONFIGURED`; la UI conserva el resto de funciones.

Errores: `HOST`, `PORT`, origen o URL de Supabase inválidos detienen el inicio con un mensaje genérico; no se imprime la causa ni secretos.

CA-01: dado `HOST=0.0.0.0`, `PORT=8080` y un origen HTTPS, cuando se interpreta el entorno, entonces la configuración es válida.

CA-02: dado el servidor iniciado, cuando se consulta `/api/health`, entonces responde 200 con sólo el estado `ok`.

Riesgo R-01: clave de servicio expuesta | acceso total a Storage y datos | variable privada en Hostinger, `.env` ignorado y configuración pública filtrada | pruebas y revisión.

Riesgo R-02: origen distinto | subida de foto desde un sitio no autorizado | comparación estricta con `APP_ORIGIN` | pruebas existentes de servidor y operación con dominio final.

Decisiones y supuestos con procedencia: se usa `HOST=0.0.0.0` exclusivamente en Hostinger porque la plataforma debe acceder al proceso Node.js; localmente queda `127.0.0.1`. Se elige la categoría `Other` pues el servidor HTTP propio no pertenece a un framework detectado. El dominio aún no fue proporcionado, por lo que su configuración en Hostinger y Supabase queda como operación posterior.

Preparada para implementar: sí; no cambia reglas de negocio ni autorización.

Trazabilidad: RF-01/CA-01 | `lib/config.mjs`, `server.mjs` | `tests/config.test.mjs`, `tests/server.test.mjs`; RF-02/CA-02 | `server.mjs` | `tests/server.test.mjs`; RNF-01/R-01 | `.env.example`, `CONFIGURAR_PRODUCCION_HOSTINGER.md` | pruebas de configuración y revisión.

Verificación: `node --test tests/*.test.mjs` (14 pruebas correctas), comprobaciones sintácticas de los módulos del servidor y `node scripts/build.mjs` (correcto). El despliegue real, el dominio y las URLs de redirección quedan pendientes porque requieren acceso al panel de Hostinger y el dominio definitivo.
