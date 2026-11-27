# Auditoría UX de Pawco — 27 de noviembre de 2026

## Recorrido evaluado

Se revisó la versión publicada desde bienvenida hasta registro e inicio de sesión. También se inspeccionó la estructura implementada de mascota, diario, salud y ajustes.

| Momento | Estado actual | Hallazgo | Ajuste aplicado |
| --- | --- | --- | --- |
| Bienvenida | Dos caminos claros: crear cuenta o entrar | Explicaba la propuesta, pero no dejaba claro de inmediato que era privada ni qué se guardaba | Se añaden tres beneficios: recuerdos privados, cartilla y diario personal |
| Registro | Correo, contraseña, aceptación de beta | Es directo y el aviso de privacidad ya existe | Se unifica el nombre Pawco y se conserva el consentimiento |
| Creación de mascota | Nombre, especie, fecha, raza, peso y sexo en un solo formulario | La ficha completa antes del primer recuerdo crea abandono potencial | Raza, peso y sexo pasan a “Añadir detalles opcionales”; el mínimo es nombre, especie y fecha |
| Inicio | Perfil, estadísticas, salud y acción de foto | El formulario de foto compite visualmente con el primer recuerdo | La foto se vuelve una acción plegada; “Guardar un recuerdo” se mantiene como siguiente paso principal |
| Diario | Línea de tiempo y alta de recuerdo | La propuesta privada se entiende bien | Pendiente para siguiente fase: editar o eliminar recuerdos y filtros por etapa/año |
| Salud | Vacunas y próximos vencimientos | El nombre “Salud” promete más que vacunas | Mantener vacunas en beta; añadir peso, baño y comida sólo como próxima fase explícita |
| Ajustes | Exportación y cierre global | Comunica privacidad, pero no explica aún retención o eliminación definitiva | Pendiente: borrado de cuenta, política de retención y centro de privacidad |

## Lo que hoy es intuitivo

- La bienvenida separa correctamente a quien es nuevo de quien ya tiene cuenta.
- La navegación móvil usa cuatro destinos estables: Mascota, Diario, Salud y Ajustes.
- El CTA de diario responde a una pregunta emocional clara: “¿Qué hizo especial el día de hoy?”.
- La cartilla tiene un flujo simple: agregar vacuna, fecha, próxima dosis y nota.
- El contenido se declara privado antes del registro y también desde Ajustes.

## Prioridades de producto, sin salir del MVP

### Ahora

1. Validar la nueva versión de onboarding con cinco personas que tengan mascota: medir si llegan a guardar un primer recuerdo sin ayuda.
2. Mantener el foco en diario + vacunas. No abrir feed, comentarios ni perfiles públicos.
3. Añadir una explicación breve de por qué una fecha aproximada es válida para mascotas rescatadas.

### Siguiente fase

1. Recordatorios opcionales de vacuna, baño, antiparasitarios y controles.
2. Peso y alimentación como registros personales, no como diagnóstico.
3. Hitos sugeridos para cachorros que reduzcan la página en blanco del diario.
4. Búsqueda de veterinarios por zona sólo con consentimiento puntual de ubicación.

### Más adelante

1. Álbum imprimible desde una selección explícita de recuerdos y fotos.
2. Álbum de homenaje con tono sensible, elección manual de contenido y sin automatizaciones invasivas.
3. Cuenta compartida con otro cuidador, con permisos simples por mascota.

## Criterio de éxito de comunidad

La primera comunidad no se mide por publicaciones públicas. Se mide por personas que vuelven a guardar un recuerdo, completan la cartilla, invitan a un cuidador de confianza y recomiendan Pawco porque conservó algo importante de su historia.

