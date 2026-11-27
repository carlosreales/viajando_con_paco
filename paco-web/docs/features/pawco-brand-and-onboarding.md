# Feature: identidad Pawco y primer perfil ligero

Estado: verificada localmente

Objetivo y resultado observable: que Pawco use una identidad coherente en acceso, formularios, diario, salud, ajustes y navegación; y que una persona pueda crear el perfil inicial de su mascota sin sentir que debe completar toda su ficha médica de inmediato.

Fuentes y comportamiento actual: solicitud del 27 de noviembre de 2026; recorrido publicado de `https://viajandoconpaco.com`; y sistema de diseño Figma Pawco. Figma define Collar `#3066B1`, Burbuja `#B0D6F6`, naranja `#F4991A`, marrón `#572F01`, Bricolage Grotesque para interfaz y acciones de 14/16/18 px. Los tipos de marca Pawco Rebote no estaban disponibles como archivos para web, por lo que no se sustituyen ni se cargan desde terceros.

Alcance y exclusiones: se actualizan nombre visible, tipografía local, jerarquía visual y progresión del onboarding. No se cambia esquema, permisos, recuperación de contraseña, Storage, los datos existentes ni se habilitan funciones sociales o de geolocalización.

Actores y recursos: visitante (entiende la propuesta y se registra); usuario autenticado (crea y consulta su diario privado); mascota propia (perfil, recuerdos y vacunas). Supabase mantiene la autorización existente por usuario.

| Actor | Acción | Recurso/ámbito | Condición | Denegación |
| --- | --- | --- | --- | --- |
| Visitante | Crear cuenta | Su futura cuenta | Acepta la nota de beta privada | No se muestran datos de otros usuarios |
| Usuario | Crear perfil inicial | Mascota propia | Nombre, especie y fecha válidos | Las reglas actuales del dominio rechazan datos inválidos |
| Usuario | Añadir detalles y foto | Mascota propia | Acción explícita y sesión válida | Las políticas existentes protegen fotos y datos |

RF-01: la interfaz debe usar Pawco como nombre visible y tokens de color y tipografía derivados del sistema de diseño.

RF-02: la fuente de interfaz se sirve desde el mismo dominio para no revelar la navegación a un proveedor de fuentes externo.

RF-03: en el primer perfil sólo se solicitan nombre, especie y fecha; raza, peso y sexo aparecen bajo una sección opcional. Al editar, esa sección se mantiene abierta para facilitar ajustes.

RF-04: la foto de mascota se muestra como una acción opcional plegada y no interrumpe el primer recorrido hacia el diario.

RNF-01: accesibilidad | los focos visibles, etiquetas y navegación por teclado se mantienen | inspección de HTML/CSS y controles existentes | comprobación sintáctica y prueba manual pendiente.

Flujo principal: bienvenida con propuesta privada → crear cuenta o acceder → crear perfil esencial → entrar al inicio → guardar el primer recuerdo → añadir foto o datos de detalle cuando la persona lo decida.

Alternativas: quien ya tiene una mascota abre los detalles opcionales al editar; quien no desea foto conserva la ilustración provisional; las fuentes locales tienen una pila de respaldo de sistema si no pueden cargarse.

Errores: se preservan los mensajes y validaciones del dominio actual; un error de fuente no interrumpe la aplicación. No se agregan llamadas de red nuevas desde el navegador.

CA-01: dado un visitante en la bienvenida, cuando lee la pantalla, entonces ve que Pawco es privado, conserva recuerdos y permite consultar la cartilla.

CA-02: dado un usuario creando su mascota, cuando llega al formulario, entonces puede guardar nombre, especie y fecha sin completar raza, peso ni sexo.

CA-03: dado un usuario en el inicio, cuando aún no ha añadido una foto, entonces ve una acción clara y plegada para hacerlo, sin un formulario abierto por defecto.

Riesgo R-01: uso inconsistente de marca | pérdida de confianza y confusión entre Paco/Pawco | nombre visible unificado y tokens locales | revisión de textos y CSS.

Riesgo R-02: proveedor de tipografía externo | revelación innecesaria de la IP de navegación | fuentes alojadas en `/fonts` del mismo sitio | inspección de CSS y de la copia de build.

Decisiones y supuestos: se toma **Pawco** como nombre público porque el usuario lo indicó y el sistema tipográfico lo emplea. Se conserva el nombre interno de archivos existentes para no crear una migración técnica sin necesidad. El álbum, salud ampliada y comunidad permanecen como fases posteriores.

Preparada para implementar: sí; no faltan decisiones que afecten datos o permisos.

Trazabilidad: RF-01/RF-02 | `src/style.css`, `src/index.html`, `scripts/build.mjs` | comprobación sintáctica y build; RF-03/RF-04 | `src/app.js` | prueba de interacción manual; R-02 | fuentes `src/fonts/` y build | inspección de archivos generados.

Verificación: `npm test` correcto: 16 pruebas. `npm run check` correcto. `npm run build` correcto; las cuatro fuentes locales se copiaron en `dist/fonts/`. La comprobación visual final en el dominio publicado queda pendiente del despliegue automático de Hostinger.

