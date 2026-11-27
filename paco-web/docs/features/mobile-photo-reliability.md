# Feature: carga de fotos fiable y experiencia móvil instalable

Estado: preparada

## Objetivo y resultado observable

Permitir que una persona autenticada actualice la foto de su mascota con un flujo compacto y claro en móvil. Si su sesión caducó —incluido después de restablecer la contraseña— Pawco debe llevarla a iniciar sesión, nunca conservar una pantalla de mascota que ya no puede modificar. La web debe poder instalarse como aplicación desde el navegador y respetar las áreas seguras de pantalla de iPhone y Android.

## Fuentes y comportamiento actual

- Solicitud y captura del usuario del 27 de noviembre de 2026.
- La captura contiene el aviso “Contraseña actualizada. Inicia sesión de nuevo” y un intento de foto fallido dentro de una pantalla de mascota aún visible.
- `src/backend.js` obtiene la sesión antes de cargar; ante una sesión inexistente devuelve `UNAUTHENTICATED`.
- `src/app.js` mostraba el mensaje genérico de conexión dentro del formulario, sin abandonar el estado privado ya caducado.

## Alcance y exclusiones

En alcance: transición segura tras sesión caducada, mensajes específicos de carga, selector compacto con vista previa local, ajustes de interfaz móvil, manifiesto web y caché de recursos estáticos sin almacenar API ni datos privados.

Fuera de alcance: sustituir el stack, cambiar proveedores, habilitar HEIC, hacer pública información, cambiar políticas de acceso de Supabase o almacenar fotografías en la caché del dispositivo.

## Actores y recursos

| Actor | Acción | Recurso/ámbito | Condición | Denegación |
| --- | --- | --- | --- | --- |
| Usuario autenticado | Elegir y guardar una foto | Mascota propia | JPEG/PNG/WebP de hasta 8 MB y sesión activa | Errores claros sin persistencia parcial |
| Usuario con sesión caducada | Intentar guardar una foto | Pantalla privada obsoleta | La sesión ya no es válida | Se limpian datos de pantalla y se redirige a iniciar sesión |
| Servidor Pawco | Normalizar y almacenar foto | Storage privado propio | Token, propietario y origen válido | Conserva las validaciones y límites existentes |

## Requisitos y criterios

- RF-01: al elegir una foto, el formulario móvil muestra nombre, tamaño y vista previa antes de enviarla.
- RF-02: ante `UNAUTHENTICATED` o HTTP 401 en una carga, se limpia el contenido privado y se muestra inicio de sesión con una explicación.
- RF-03: los fallos de origen, límite, formato, almacenamiento y actualización del vínculo tienen mensajes accionables distintos.
- RF-04: la aplicación expone manifiesto y modo de pantalla completa para que el usuario pueda instalarla; el caché sólo cubre recursos estáticos públicos del propio dominio.
- RNF-01: en pantallas de hasta 700 px, los campos usan al menos 16 px, los controles táctiles al menos 44 px y la navegación respeta `safe-area-inset-bottom`.

## Flujo principal

Precondición: usuario autenticado y propietario de la mascota.

1. Abre “Añadir/Cambiar su fotografía”.
2. Elige una imagen admitida de hasta 8 MB.
3. Ve una previsualización local y confirma “Guardar foto”.
4. El servidor verifica sesión, propiedad, tipo, tamaño y origen; normaliza y guarda la foto privada.
5. La interfaz se actualiza con la nueva foto y confirma el resultado.

Alternativas y errores: cancelar selección restaura el estado inicial; archivo demasiado grande muestra el límite antes de enviar; formato inválido se rechaza en el servidor; sesión vencida vuelve a acceso; no se cachean respuestas de `/api` ni fotografías privadas.

## Riesgos y controles

| Riesgo | Impacto | Control | Verificación |
| --- | --- | --- | --- |
| Sesión vencida mostrada como activa | Confusión y carga fallida | Salida inmediata a inicio de sesión al recibir 401 | Prueba de backend y recorrido de interfaz |
| Foto privada disponible offline por error | Exposición de recuerdos | Service worker excluye API, Supabase y rutas de fotos | Prueba de reglas de caché |
| Selector móvil incómodo | Abandono de carga | Vista previa compacta y botones táctiles | Capturas móviles de recorridos |
| Error de proveedor sin contexto | Reintentos inútiles | Mensajes específicos y seguros | Pruebas negativas del adaptador |

## Decisiones y supuestos

- No se cambia de framework: el problema está en el estado de sesión y en la composición móvil, no en el rendimiento del JavaScript actual. Se mejora la experiencia como PWA instalable sin una migración que ponga en riesgo autenticación, datos y fotografías.
- La caché se limita a recursos públicos de interfaz; privacidad y datos en vivo siguen dependiendo de la sesión y de Supabase.

Preparada para implementar: sí; el usuario autorizó la corrección y los cambios no requieren nuevas decisiones de datos o permisos.

Trazabilidad: RF-01/RNF-01 | interfaz móvil y capturas; RF-02/RF-03 | `src/backend.js`, `src/app.js`, pruebas del adaptador; RF-04 | `src/index.html`, manifiesto, service worker y prueba de ruta/caché.

