# Activar Paco con Supabase

Esta versión ya incluye acceso por correo, datos privados y fotos privadas. El proyecto `viajando-con-paco` ya está creado en Supabase y sus migraciones ya se aplicaron.

1. En **Authentication > Providers > Email**, deja activo el proveedor de correo y exige la confirmación. En el plan gratuito, usa las plantillas predeterminadas con enlace: Paco ya admite los enlaces de confirmación y recuperación.
2. En **Authentication > URL Configuration**, añade `http://127.0.0.1:4174` como URL del sitio y como URL de redirección permitida. Cuando publiques la app, sustituye esa dirección por su URL HTTPS definitiva.
3. El archivo `.env` ya contiene la URL y la clave pública del proyecto. Para activar fotografías, copia la clave privada de servidor desde **Project Settings > API** en `SUPABASE_SERVICE_ROLE_KEY`. Nunca la compartas ni la subas a Git.
4. En este equipo no hace falta instalar `pnpm`. Abre PowerShell dentro de la carpeta y ejecuta `node --env-file-if-exists=.env server.mjs`. Después abre `http://127.0.0.1:4174`.

## Antes de invitar a usuarios

- Prueba crear dos cuentas distintas: una no debe poder ver, modificar ni abrir fotos de la otra.
- Prueba registro, confirmación por enlace, inicio de sesión, recuperación y subida de JPEG, PNG y WebP.
- Cambia `APP_ORIGIN` a una URL HTTPS estable antes de publicar. El servidor rechaza cargas de fotos desde orígenes distintos.
- Guarda la clave de servicio sólo en el entorno del servidor. El navegador recibe únicamente la clave pública.

## Límites de esta beta

Dos mascotas y 500 recuerdos por cuenta. Las fotos se convierten a JPEG, se redimensionan a un máximo de 2048 px y se eliminan sus metadatos. Se aceptan JPEG, PNG y WebP de hasta 8 MB; HEIC y vídeo aún no están disponibles.
