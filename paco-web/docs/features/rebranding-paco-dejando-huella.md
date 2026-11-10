# Feature: rebranding-paco-dejando-huella
Estado: verificada

Objetivo y resultado observable:
La aplicación se presenta como **Paco dejando huella** y adopta la identidad visual del nodo de Figma 114:386: azul como color principal, naranja, café, celeste, amarillo y gris como acentos. El usuario conserva el mismo acceso, datos y flujos.

Fuentes y comportamiento actual:
- Petición del usuario: aplicar el branding actualizado y cambiar el nombre.
- Figma, archivo Paco_App, nodo 114:386 titulado “Paco dejando huella - Logo”.
- La aplicación usa actualmente la marca “paco.” y una paleta verde en src/app.js y src/style.css.

Alcance y exclusiones:
- Incluye: marca textual, icono de huella, paleta, contraste, cabeceras, accesos y superficies compartidas.
- Excluye: cambios de cuentas, permisos, datos de Supabase, modelos de mascota y navegación funcional.

Actores y recursos:
| actor | acción | recurso/ámbito | condiciones | denegación |
| --- | --- | --- | --- | --- |
| Visitante o usuario autenticado | visualizar la identidad | interfaz de Paco | cualquier pantalla | no aplica |

RF-01: Toda superficie de marca muestra “Paco dejando huella” y mantiene una etiqueta accesible coherente.
RF-02: Los controles de acción, estados de foco y avisos usan la nueva paleta sin reducir su legibilidad.
RNF-01: La app debe compilar y mantener los flujos autenticados existentes sin cambios de contrato.

Estados y transiciones:
No aplica: la marca no introduce estado ni persistencia.

Flujo principal:
Precondición: el usuario abre una pantalla de Paco.
Pasos: ve la marca y los colores actualizados; utiliza los controles existentes.
Resultado y postcondición: la interacción se comporta igual que antes del rebranding.

Errores:
No aplica: no hay entradas, operaciones remotas ni efectos persistidos.

CA-01: Dado cualquier acceso o vista autenticada, cuando se renderiza, entonces se visualiza “Paco dejando huella”.
CA-02: Dado un control de acción o foco, cuando el usuario interactúa, entonces conserva un estado visible y legible con la paleta nueva.
CA-03: Dado una sesión, cuando el usuario navega o guarda un dato, entonces el comportamiento de backend no cambia.

Riesgo R-01: pérdida de contraste o navegación comprimida en móvil | impacto: baja legibilidad | control: tokens de color y prueba de compilación | verificación: revisión de CSS y demo local.
Riesgo R-02: cambiar accidentalmente contratos de autenticación o datos | impacto: pérdida de funcionalidad | control: no modificar backend ni esquema | verificación: pruebas existentes de autenticación y flujos.

Decisiones y supuestos con procedencia:
- El nombre visible es “Paco dejando huella”, tomado del título del nodo de branding aportado por el usuario.
- Los valores hexadecimales se aproximan a la paleta visible en el nodo porque Figma no expone sus variables en la vista de solo lectura; se preservará la jerarquía de azul, naranja, café, celeste, amarillo y gris.

Preguntas críticas pendientes:
No aplica.

Preparada para implementar: sí; el cambio es de presentación, el nombre y la paleta están definidos en el nodo indicado.

Trazabilidad:
| RF/RNF | CA | componente | prueba | evidencia |
| --- | --- | --- | --- | --- |
| RF-01 | CA-01 | src/app.js y src/paco-mark.svg | demo local y bundle | build y revisión del navegador |
| RF-02 | CA-02 | src/style.css | demo local | revisión del navegador |
| RNF-01 | CA-03 | proyecto existente | suite de pruebas | 13 pruebas correctas |
