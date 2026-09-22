# Cuentas, mascotas y fotos con Supabase
Fecha: 2026-09-21. Preparada para implementar: sí, integración desplegable; activación externa pendiente.
Fuentes: petición actual; usuario elige preparar Supabase; Paco_App observado en sesión anterior (registro -> verificación -> mascota, login y recuperación); documento maestro RF-AUTH, RF-PET, RF-TIMELINE, RN-010..013, RN-024, RN-027..029.
Estado inicial: solo demo de navegador con credenciales ficticias y persistencia local incompleta. Se conserva en ../apps/preview. Esta entrega es la primera integración real del cliente de revisión; no es un binario Flutter ni la totalidad del MVP.

## Actores/permisos
Anónimo: configuración pública y formularios de autenticación, cero datos privados.
Usuario: crear/leer/editar propias mascotas y propios recuerdos; ver sus imágenes con URL temporal.
Otro usuario: ninguna lectura/escritura sobre recursos ajenos. Autorización RLS, no UI.
Procesador de imágenes de confianza: valida usuario con Auth, comprueba propiedad con JWT del usuario, procesa imagen y sube con clave secreta en servidor. El cliente no puede subir archivos sin procesar directamente al bucket.
Sin roles administrativos en este incremento.

## Flujo y reglas
Registro email/contraseña -> código real por correo -> onboarding. Login real -> mascotas. Recuperación código de propósito recovery -> cambiar contraseña -> cierre global de sesiones -> login.
Se sigue orden OTP de Figma en beta privada; difiere de RN-003 del maestro. No declarar política final de lanzamiento. Se mantiene respuesta de registro/recuperación neutra para evitar enumeración.
Contraseña mínima 10 configurada también en Supabase; código validado por proveedor, sin código fijo. SESIÓN persistida por SDK bajo origen dedicado; sin guardar contraseñas. CSP estricta y textos escapados.
Perfil mascotas: nombre/especie/nacimiento obligatorio, fecha válida <= hoy y >= hace 40 años. Campo fecha es DATE; servidor calcula límites en UTC en beta, pendiente zona horaria por cuenta del MVP.
2 mascotas por usuario y 500 recuerdos por mascota son límites beta del documento, no plan de pago. Triggers y bloqueos transaccionales impiden superar límites por API. Editar nacimiento no puede dejar recuerdos anteriores.
Recuerdo: título, fecha entre nacimiento y hoy, nota, foto opcional. Si falla foto se conserva texto, se ofrece reintentar desde el recuerdo; UUID cliente evita duplicación por reintento de creación.
Fotos JPEG/PNG/WebP, entrada <=8 MB, salida JPEG <=8 MB, máximo 2048px y 40M píxeles decodificados, metadata eliminada en servidor. HEIC/vídeo pendientes y rechazados explícitamente. Bucket privado, URLs 10 minutos, lectura requiere propiedad. Reemplazo: subir -> asociar -> retirar anterior; si falla asociación, limpiar nueva imagen; posible huérfano si falla limpieza externa (registrar solo código, sin ruta sensible).
No cobros, no SSO, no diagnósticos, no notificaciones ni importación automática del diario local.
No borrado irreversible en esta fase. Se exportan datos propios como JSON.

## Estados/errores
Sin configuración -> pantalla de instalación, nunca fallback demo.
Carga, lista vacía, error de conexión/reintento, sesión expirada -> login y borrado del estado privado en memoria.
Carga foto -> botones bloqueados -> éxito o error recuperable, anterior imagen conservada.
Datos inválidos -> 400; sin sesión -> 401; recurso ajeno/inexistente -> 404 uniforme; demasiadas cargas -> 429; servicio incompleto -> 503.
No se publican trazas ni secretos. Peticiones de subida con Origin esperado, Bearer válido y límite de cuerpo.

## Criterios / evidencia prevista
CA1 auth: SDK oficial signUp/verifyOtp/signInWithPassword/resetPasswordForEmail/updateUser/signOut; pruebas contrato con doble de proveedor, activación real pendiente proyecto/SMTP.
CA2 RLS: PostgreSQL local de pruebas (PGlite), dos usuarios y anónimo; escritura ajena y owner_id manipulados rechazados.
CA3 reglas: SQL fechas, cuota, recuerdos y propiedad; backend procesamiento real de imagen y rechazo de archivos falsos/EXIF.
CA4 interfaz: compilación y pruebas DOM de configuración ausente; recorrido real pendiente URL/keys y navegador disponible.
CA5 secretos: configuración pública allowlist; clave service_role solo servidor; bucket sin inserción directa por usuarios.
CA6 sesión: recuperación solo después de OTP recovery válido; cierre borra memoria y vuelve login.

## Activación pendiente
Crear proyecto Supabase UE, migraciones, SMTP con remitente verificado, plantillas Token, claves en .env local, CAPTCHA/rate limits y textos legales revisados antes de acceso público. No se inventan claves ni se contratan servicios.
Riesgos residuales: sin proyecto no puede verificarse correo/sesión/Storage reales; PGlite verifica SQL real pero no concurrencia multi-conexión ni Auth/Storage de Supabase. No prometer producción.

