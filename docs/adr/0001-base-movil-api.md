# ADR-0001: Flutter y monolito modular NestJS con PostgreSQL
Fecha: 2026-09-13. Estado: aceptada para desarrollo por correspondencia con DEC-01..03 del documento aportado.

Se mantiene Flutter para iOS/Android y NestJS/TypeScript para API. Una app web completa contradice §8.1; no se crea. El módulo pets encapsula validación y cálculo; sus repositorios aplican propiedad y cuota. PostgreSQL bloquea la fila de propietario en una transacción antes de contar/insertar, evitando carreras. Las fechas de nacimiento/llegada son DATE, nunca timestamps; hoy se deriva con la zona del propietario. Edad/etapa no se guardan.

Se separa identidad mediante puerto. La API normal deniega acceso hasta integrar sesiones reales; no acepta cabeceras de propietario ni JWT sin verificar. La demo efímera se inicia con ejecutable distinto, NODE_ENV=development y loopback. No se usa la demo para despliegue. Alternativa descartada: implementar cuentas provisionales que luego se confundan con autenticación de producción.

PostgreSQL es el adaptador duradero. Repositorio en memoria solo para demo y pruebas; sus pruebas no certifican bloqueos ni migraciones de PostgreSQL. No se inventan proveedores ni credenciales externos. Revisar este ADR si DP-012 cambia el contrato del principal.
