# Contexto General del Sistema Tamarindo

## 1) Objetivo actual del sistema
El sistema actual esta orientado a:
- centralizar la gestion operativa de Tamarindo (clientes, proyectos, inventario, usuarios, proveedores, talleres),
- registrar y trazar el avance productivo,
- medir scrap y calidad,
- generar reportes para apoyo de decisiones.

Importante: hoy el sistema **mide y visibiliza** el scrap. La optimizacion automatica/predictiva del scrap esta planteada como evolucion.

---

## 2) Stack y arquitectura
- Frontend: Angular (standalone components + rutas lazy + guards).
- Backend esperado: API REST .NET (base URL via `environment.apiUrl`).
- Base de datos: SQL Server (segun documentacion funcional y tecnica).
- Patrón general: separacion por modulos (`modules/*`), servicios por dominio (`services/*.ts`), modelos (`models/*.ts`).

Configuracion de entorno:
- `src/environments/environment*.ts`
- `apiUrl` base actual esperada en local: `https://localhost:7163/api`

---

## 3) Seguridad, sesion y permisos

### Autenticacion
- Login con JWT desde `Login`.
- Persistencia en `localStorage` (`token`, `token_expiration`, `usuario`).
- Auto-logout por expiracion.
- Auth guard para rutas privadas.

Archivo clave:
- `src/app/modules/login/services/auth.service.ts`

### Autorizacion (RBAC + permisos efectivos)
- Carga de permisos por usuario desde endpoint de usuarios.
- Guard de permisos por modulo/accion.
- Directiva `appHasPermission` para mostrar/ocultar items de UI.

Archivos clave:
- `src/app/core/services/permission.service.ts`
- `src/app/core/guards/permission.guard.ts`
- `src/app/core/directives/has-permission.directive.ts`

---

## 4) Mapa de modulos existentes (frontend)

Directorio base:
- `src/app/modules`

Modulos detectados:
- `login`
- `clientes`
- `proyectos`
- `inventario`
- `movimientos`
- `ubicaciones`
- `orden-compra`
- `reportes`
- `usuarios`
- `proveedores`
- `talleres`
- `notificaciones`

---

## 5) Rutas principales actuales

Definidas en:
- `src/app/app.routes.ts`

Principales:
- `/login`
- `/clientes`
- `/proyectos`
- `/proyectos/:id`
- `/proyectos/crear`
- `/proyectos/lista`
- `/inventario`
- `/inventario/catalogo`
- `/inventario/transferir`
- `/inventario/movimientos`
- `/inventario/control-recepcion`
- `/ubicaciones`
- `/reportes/proyectos`
- `/reportes/inventario`
- `/reportes/calidad`
- `/reportes/clientes` (alias `/reportes/clientes-temporada`)
- `/ordenes`
- `/notificaciones`
- `/usuarios/internos`
- `/usuarios/proveedores`
- `/usuarios/talleres`

Nota:
- En el layout aparece enlace a `/reportes/financiero`, pero esa ruta no esta definida en `app.routes.ts`.

---

## 6) Integracion de servicios (frontend -> API)

Servicios y controladores esperados:
- Clientes -> `/Cliente`, `/Provincia`, `/Ciudad`, `/EstadoCliente`
- Proyectos -> `/Proyecto` (y consulta por taller)
- Inventario -> `/Insumo`, `/TipoInsumo`, `/Proveedor`
- Ordenes de compra -> `/OrdenCompra`
- Proveedores -> `/Proveedor`, `/Provincia`, `/Ciudad`
- Talleres -> `/Taller`, `/Provincia`, `/Ciudad`
- Ubicaciones -> `/Ubicacion`
- Movimientos -> `/Movimiento`
- Usuarios internos -> `/Login` (usuarios/roles/areas/auditoria)
- Permisos efectivos -> `/Usuarios/{idUsuario}/permisos-efectivos`
- Reportes -> `/Reportes/*`

---

## 7) Funcionamiento por area (estado resumido)

## 7.1 Clientes
- CRUD de clientes.
- Busqueda/filtros y modal de detalle/formulario.
- Uso de provincia/ciudad y estado.

## 7.2 Proyectos
- Vista principal tipo tablero (pendiente/en proceso/finalizado).
- Alta de proyecto y vista detalle.
- Flujo por areas productivas.
- Registro de observaciones.
- Control de calidad dentro del detalle (incluye serializacion compacta en observaciones).

Pendiente tecnico visible:
- Exportacion desde pantalla de proyectos aun no implementada (TODO en componente).

## 7.3 Inventario + Movimientos + Ubicaciones
- Gestion de insumos y catalogo.
- Transferencia entre ubicaciones.
- Historial de movimientos.
- Control de recepcion.

## 7.4 Ordenes de compra
- Alta/listado/detalle/recepcion.
- Flujo de habilitar y recalcular control.

Pendiente tecnico visible:
- Rechazo de orden pendiente de endpoint backend.

## 7.5 Usuarios / Proveedores / Talleres
- Usuarios internos con alta/edicion/baja logica y detalle con auditoria.
- Proveedores con CRUD completo y soporte provincia/ciudad.
- Talleres externos con su modulo dedicado.

## 7.6 Reportes
Reportes implementados en frontend:
- Reporte de proyectos.
- Reporte de inventario critico.
- Reporte de calidad.
- Reporte de clientes por temporada.

Soporte de filtros:
- segun reporte (fecha/proyecto/cliente/temporada, etc).

Estado general:
- hay buena base de reporteria, pero aun no cubre todo el set funcional del documento de tesis (varios reportes avanzados faltantes).

## 7.7 Notificaciones
- Modulo presente para notificaciones operativas (incluye badge en sidebar).

---

## 8) Flujo funcional transversal (end-to-end simplificado)
1. Usuario ingresa por login.
2. Se obtiene token y usuario actual.
3. Se cargan permisos efectivos.
4. UI habilita solo modulos/acciones permitidas.
5. Operaciones de dominio se ejecutan via servicios HTTP por modulo.
6. Proyecto avanza por areas; se registran observaciones y calidad.
7. Inventario/ordenes/movimientos mantienen trazabilidad operativa.
8. Reportes consolidan informacion para seguimiento gerencial.

---

## 9) Scrap: estado real hoy

Lo que ya existe:
- captura de informacion de avance/observaciones,
- carga de inspecciones de calidad en proyectos,
- reportes que permiten analizar desempeno y desvio.

Lo que falta para optimizacion real:
- prediccion de scrap por similitud historica,
- recomendaciones automaticas de mitigacion,
- alertas proactivas de riesgo,
- circuito de reutilizacion de remanentes con impacto medible.

---

## 10) Pendientes tecnicos detectados (codigo)
- TODO: rechazo de orden sin endpoint backend.
- TODO: exportacion en pantalla de proyectos.
- TODO: uso de `idUsuario` hardcodeado en observaciones de proyecto/calidad (debe salir de sesion/auth).
- posible inconsistencia de navegacion: link a `reportes/financiero` sin ruta activa.

---

## 11) Deuda tecnica y riesgo funcional
- Cobertura de tests automatizados aun baja para el tamaño del sistema.
- Se mezclan en algunos puntos validaciones de negocio en frontend que conviene reforzar tambien en backend.
- Para nuevas funcionalidades, priorizar contratos de datos estables para no duplicar logica entre modulos.

---

## 12) Recomendacion para continuar sin duplicar trabajo
1. Usar este documento como fuente unica de mapa funcional.
2. Antes de agregar feature nueva, validar:
   - si ya existe modulo/ruta/servicio similar,
   - si hay endpoint ya disponible,
   - si la accion ya esta cubierta por permisos.
3. Mantener una seccion "estado por sprint" en este mismo archivo (append al final).
4. Cada nueva funcionalidad debe incluir:
   - modulo afectado,
   - ruta,
   - endpoint,
   - permiso requerido,
   - impacto en reportes.

---

## 13) Proxima evolucion recomendada (alineada al objetivo real)
1. Cerrar pendientes tecnicos actuales.
2. Completar reporteria faltante de tesis.
3. Agregar prediccion de scrap v1 basada en historico.
4. Agregar recomendador de acciones para reducir scrap.
5. Integrar agente IA como capa de consulta gerencial y explicacion de recomendaciones.

---

## 14) Referencias rapidas de archivos clave
- Rutas app: `src/app/app.routes.ts`
- Layout/menu: `src/app/layouts/private-layout/private-layout.component.html`
- Auth: `src/app/modules/login/services/auth.service.ts`
- Permisos: `src/app/core/services/permission.service.ts`
- Reportes service: `src/app/modules/reportes/services/reportes.service.ts`
- Proyectos (kanban): `src/app/modules/proyectos/components/proyectos.component.ts`
- Detalle proyecto/calidad: `src/app/modules/proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component.ts`
- Ordenes compra: `src/app/modules/orden-compra/components/orden-compra.component.ts`

---

## 15) Nota de mantenimiento del documento
Ultima actualizacion: 2026-03-05.
Actualizar este archivo cada vez que:
- se agregue modulo/ruta,
- se cambie contrato de API,
- se cierre un pendiente tecnico,
- se incorpore funcionalidad de optimizacion/prediccion.
