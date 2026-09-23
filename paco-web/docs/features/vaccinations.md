# Feature: vacunación y recordatorios

Estado: preparada

## Objetivo y resultado observable

Una persona autenticada puede registrar, consultar, editar y eliminar vacunas de cada una de sus mascotas. Paco muestra en Salud el historial y en Inicio una alerta cuando la próxima dosis está vencida, vence hoy o vence en los próximos 30 días.

## Fuentes y comportamiento actual

- Petición del usuario del 23-09-2026: continuar con vacunación y recordatorios.
- Flujo `Paco_App` de Figma: onboarding con esquema de vacunas, Salud, alta y consulta de vacuna.
- Aplicación actual: mascotas, recuerdos y fotos privadas con Supabase/RLS; no existen registros sanitarios ni alertas.

## Alcance y exclusiones

Incluye historial manual, próxima dosis, edición, eliminación y recordatorio dentro de la aplicación. No incluye documentos, imágenes de carnés, notificaciones push, avisos por correo, diagnósticos médicos ni recomendaciones veterinarias.

## Actores y permisos

| Actor | Acción | Recurso/ámbito | Condición | Denegación |
|---|---|---|---|---|
| Usuario autenticado | CRUD | Vacunas de sus mascotas | La pareja `pet_id`/`owner_id` debe existir | RLS oculta datos ajenos; FK/trigger rechazan mascota ajena |
| Usuario anónimo | Cualquier acceso | Vacunas | Sin sesión | Sin permisos sobre la tabla |
| Otro usuario | Leer o modificar | Vacunas ajenas | Nunca | RLS devuelve cero filas o rechaza la escritura |

## Reglas y transiciones

- RF-01: vacuna: nombre obligatorio, máximo 100 caracteres; notas opcionales, máximo 1.000.
- RF-02: la fecha de aplicación debe estar entre el nacimiento de la mascota y hoy (UTC).
- RF-03: la próxima dosis es opcional y, si existe, no puede ser anterior a la fecha de aplicación.
- RF-04: una vacuna pertenece de forma inmutable a una mascota y a su propietario. Solo se editan nombre, fechas y notas.
- RF-05: Inicio agrupa las próximas dosis de la mascota seleccionada: vencida, hoy/próximos 30 días, o sin alertas.
- Estado: sin vacunas → Salud vacía; crear/editar → guardada; eliminar → confirmación nativa → eliminada; error → no se persiste ningún cambio local optimista.

## Flujo principal y alternativas

Precondición: sesión válida y mascota seleccionada. En Salud, la persona crea una vacuna, completa los datos y guarda. La base de datos confirma la propiedad y las fechas; el historial y la alerta se recargan.

Alternativas: puede editar o eliminar un registro propio; puede dejar vacía la próxima dosis. Si selecciona otra mascota, se carga solo su historial. Si no hay datos, se muestra un estado vacío con la acción de alta.

Errores: fechas inválidas, texto fuera de límite, sesión vencida o red caída muestran un mensaje recuperable y conservan la información del formulario. Un identificador ajeno no revela si existe.

## Criterios y riesgos

- CA-01: Dada una mascota propia, al crear una vacuna válida, aparece en su historial y se conserva tras recargar.
- CA-02: Dada una vacuna con próxima dosis vencida o dentro de 30 días, Inicio muestra su recordatorio.
- CA-03: Dado otro usuario, no puede leer, crear para, editar ni borrar vacunas de una mascota ajena.
- CA-04: Dada una fecha previa al nacimiento, futura o con próxima dosis anterior, la base de datos rechaza la escritura.
- R-01 BOLA/IDOR: modificar UUID ajeno. Control: FK compuesta, RLS por `owner_id`, privilegios de columna y prueba cruzada.
- R-02 datos sanitarios incorrectos. Control: Paco no interpreta los datos ni sustituye al veterinario; solo registra lo introducido por el usuario.
- R-03 avisos perdidos. Control: los avisos son visibles únicamente mientras se entra a la app; push/correo quedan explícitamente fuera de alcance.

## Decisiones y supuestos

El umbral de aviso es 30 días para que sea útil sin introducir configuración adicional. Es una decisión reversible documentada, no una recomendación clínica. Se usa fecha sin hora y UTC, coherente con las mascotas y recuerdos actuales.

Preparada para implementar: sí. El usuario autorizó continuar y no falta una decisión que afecte permisos, pagos o datos de terceros.
