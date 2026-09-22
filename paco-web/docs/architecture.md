# Integración beta
Cliente de revisión JavaScript -> Supabase Auth y Data API (RLS). SDK oficial empaquetado localmente, sin CDN.
Node -> /api/config con URL y clave publishable exclusivamente; /api/photos procesa imágenes antes de Storage. Clave secreta solo backend.
PostgreSQL gobierna propiedad, cuotas y fechas con restricciones y triggers. Usuario no puede editar id/owner_id/created_at ni insertar metadatos de foto arbitrarios.
Fotos privadas: solo servicio inserta; usuarios leen únicamente rutas de su UUID. Nunca bucket público.
No migración automática de datos demo. Misma identidad visual, puerto distinto 4174. Configuración ausente detiene acceso. Flutter sigue siendo arquitectura objetivo del producto móvil.
Alternativa a servicio propio completo NestJS: Supabase gestionado aceptado por el usuario. El proxy Node es mínimo para validar imágenes y no reemplaza reglas por validaciones de interfaz.

