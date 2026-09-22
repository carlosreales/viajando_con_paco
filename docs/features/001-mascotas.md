# Primer incremento: registro y consulta de mascotas

Estado: preparada. Fecha: 2026-09-13.

## Objetivo y fuentes
Iniciar la aplicación móvil descrita en `docs/source/Documento_Maestro_MVP_App_Mascotas.md`, no una app de viajes. La carpeta fue indicada por el usuario; PetLife sigue siendo nombre provisional (DP-001). No existía código previo ni instrucciones AGENTS en la carpeta inspeccionada.

Fuentes: §1.4, §8, §13, RN-002 y RN-010..016, RF-PET-001/002/009, §27.3 y §34. Esta entrega es una parte de EPIC-03, no la conclusión de esas historias completas.

## Alcance
API NestJS para crear, listar y consultar mascotas propias. Fechas civiles estrictas, edad calculada en zona del propietario, etapa de vida derivada y límite por plan atómico. Adaptador PostgreSQL y migración inicial. Cliente Flutter con lista, formulario mínimo y perfil. Datos privados por defecto.

Excluidos de este incremento: identidad real (DP-012 pendiente), edición, borrado, fotos, hitos, XP, recomendaciones, recordatorios, pagos y publicación. No inventar sus efectos secundarios. La tabla de etapas es una clasificación provisional del documento, no consejo clínico; requiere revisión veterinaria antes de producción.

## Actores y permisos
| Actor | Acción | Ámbito | Condición | Denegación |
|---|---|---|---|---|
| Propietario | Crear/listar/consultar | Mascotas propias | Principal resuelto en servidor, cuenta habilitada | 401 sin sesión, 403 suspendido |
| Otro propietario | Consultar | Mascota ajena | Nunca | 404 igual a inexistente |
| Anónimo / administrador / soporte | Acceder API privada | Todos | Sin autorización en este incremento | 401 |

La identidad será un puerto de servidor. El arranque normal usa un resolver que deniega todo. Un ejecutable demo separado solo escucha loopback, exige entorno development y token aleatorio efímero. No admite `user_id`, plan o rol desde el cliente. Usa datos sintéticos en memoria, desaparecen al reiniciar. Nunca es la autenticación productiva.

## Reglas y flujo
1. Propietario accede a su lista; vacío invita a crear.
2. Introduce nombre, especie y nacimiento exacto o estimado; llegada y peso opcionales.
3. Servidor rechaza campos desconocidos y fechas imposibles, futuras o de hace más de 40 años (RN-013); llegada entre nacimiento y hoy; peso 0.1..120 kg.
4. Bajo bloqueo por propietario, lee el plan en servidor, cuenta mascotas ACTIVE y crea solo si hay capacidad; identifica con UUID v4.
5. Devuelve perfil; Flutter vuelve a lista y abre el perfil. No persiste edad ni etapa.

Estados: inexistente -> POST válido -> ACTIVE/PRIVATE. Lectura no cambia estado. No hay transiciones de archivo/fallecimiento en esta fase.
Alternativas: límite devuelve 409 PET_LIMIT; formulario conserva contenido. Sin red/servidor: mensaje y reintento, sin simular guardado. Entrada inválida: 400 INVALID_INPUT, cero escrituras. Sesión ausente: 401. UUID malformado/inexistente/ajeno: 404. Doble envío: botón deshabilitado mientras guarda; API no promete idempotencia y limita concurrencia por plan.

## Criterios y riesgos
| Criterio | Verificación prevista |
|---|---|
| CA-01 Crear con mínimos; fechas válidas; privado y UUID | Unidad y HTTP |
| CA-02 Rechazar futuras/imposibles, más de 40 años, llegada anterior, peso fuera de rango y campos privilegiados | Unidad y HTTP sin mutación |
| CA-03 Ninguna lectura cruzada ni elevación por payload | HTTP con dos propietarios y anónimo |
| CA-04 Límite serializado incluso con peticiones concurrentes | Prueba del contrato en memoria; integración PostgreSQL pendiente si no hay servidor |
| CA-05 Edad dinámica y etapas en límites; zona horaria cambia fecha civil | Unidad con reloj fijo |
| CA-06 Formulario/lista/perfil, estado vacío/error/carga | Flutter analyze/test si SDK disponible |
| CA-07 Arranque normal no acepta credenciales demo | HTTP y prueba de guardas de arranque |

Riesgos: BOLA -> filtrado owner_id y 404; asignación masiva -> allowlist estricta; carrera de cuota -> bloqueo del propietario; fechas UTC incorrectas -> fecha civil por zona del perfil; pérdida demo -> etiqueta explícita; proveedor identidad ausente -> denegar por defecto; dependencias -> lockfile y auditoría.

## Decisiones y pendientes
- Flutter/NestJS/PostgreSQL se conservan (DEC-01..03). Node disponible; Flutter y daemon Docker no disponibles inicialmente.
- DP-003: 2/10 son fixtures de desarrollo del documento, no precios ni política comercial aprobada; tabla de planes configurable en servidor.
- DP-002: admitir DOG/CAT/OTHER en dominio como vocabulario extensible; demo prueba perro/gato. OTHER no tiene etapa específica. Confirmar antes del lanzamiento.
- DP-004: textos Flutter externalizados en español/inglés; marca provisional.
- Autenticación pendiente de respuesta. Solo integración productiva dependiente queda detenida.

**Preparada para implementar: sí**, exclusivamente este incremento de dominio/API y cliente de desarrollo. Reglas, permisos, errores y pruebas definidos. No habilita acceso real ni asume decisiones comerciales pendientes.
