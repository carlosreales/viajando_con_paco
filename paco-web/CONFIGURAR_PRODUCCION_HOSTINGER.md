# Publicar Paco dejando huella en Hostinger

Esta aplicación requiere un plan de Hostinger con aplicaciones Node.js: Business Web Hosting o Cloud. En el panel, usa **Websites → Add Website → Deploy Web App** e importa el repositorio de GitHub. Selecciona el tipo **Other**, Node.js 22.x, rama `main`, comando de construcción `npm run build` y comando de inicio `npm start`.

## Variables de entorno

En el panel de Hostinger, añade estas variables; no subas un archivo `.env` ni copies su contenido al repositorio.

| Variable | Valor de producción |
| --- | --- |
| `PORT` | El puerto que asigne Hostinger. Si ya lo crea el panel, no lo reemplaces. |
| `HOST` | `0.0.0.0` |
| `APP_ORIGIN` | `https://tu-dominio.example` sin `/` final |
| `SUPABASE_URL` | URL HTTPS pública del proyecto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable `sb_publishable_...` del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada de servidor; sólo en Hostinger |

Hostinger puede conectar un proyecto Supabase desde su asistente de base de datos e instalar sus variables automáticamente. Confirma que los nombres coincidan con esta tabla y que la clave de servicio quede privada.

## Ajustes de Supabase antes de invitar usuarios

En **Authentication → URL Configuration** configura:

- **Site URL:** `https://tu-dominio.example`
- **Redirect URLs:** `https://tu-dominio.example`
- Conserva `http://127.0.0.1:4174` sólo para desarrollo local.

Usa el dominio exacto de producción. Supabase usa estas direcciones para confirmación de correo y restablecimiento de contraseña.

## Verificación posterior al despliegue

1. Abre `https://tu-dominio.example/api/health`; debe devolver `{"status":"ok"}`.
2. Registra una cuenta de prueba, confirma el correo, inicia sesión y recupera la contraseña.
3. Registra una mascota y carga una imagen JPEG, PNG o WebP.
4. Comprueba con una segunda cuenta que no puede consultar ni sustituir datos o fotos de la primera.

Si falla la primera publicación, revisa los registros del deployment y el estado de **Deployments** en Hostinger. No edites manualmente `public_html`, porque Hostinger lo regenera al desplegar.
