# Manual de Usuario – Modulo Proyectos

Este manual explica como usar el modulo de Proyectos desde la interfaz. Esta pensado para usuarios operativos y administrativos.

## Pantallas principales


### 2) Lista de Proyectos (tabla)
Archivo: `components/proyecto-lista/proyecto-list.component.*`

**Para que sirve**
- Ver proyectos en una tabla con filtros y paginacion.
- Exportar a Excel.

**Acciones**
1. Usar filtros por estado, prioridad, tipo de prenda y rango de fechas.
2. Buscar por nombre, codigo, tipo de prenda o cliente.
3. Exportar el listado filtrado.
4. Filtrar por taller (si se entra con query params `taller` y `nombreTaller`).

**Parte tecnica (codigo)**
- Carga: `cargarProyectos()` decide entre `obtenerProyectosPorTaller()` y `obtenerProyectosConCache()`.
- Filtros: `proyectosFiltrados` combina busqueda + filtros de `ProyectoFiltrosComponent`.
- Paginacion: `paginaActual`, `tamanioPagina`, `proyectosPaginados`.
- Exportacion: `exportarExcel()` usa `ExportService.exportarProyectosExcel()`.

### 3) Detalle de Proyecto (modal)
Archivo: `components/proyecto-detalle-modal/proyecto-detalle-modal.component.*`

**Para que sirve**
- Ver toda la informacion de un proyecto.
- Gestionar avances por area.
- Registrar calidad, corte, confeccion, recepciones y diseno.
- Ver auditoria.

**Pestanas**
- **Informacion**: datos generales y control de estado.
- **Areas y Avances**: seguimiento por area (diseno, corte, confeccion, calidad, empaquetado).
- **Materiales**: asignaciones, uso y desperdicio.
- **Auditoria**: historial de observaciones/eventos del proyecto.

**Acciones clave**
1. **Iniciar proyecto** (solo si esta en Pendiente).
2. **Archivar proyecto** (solo visible despues de iniciar).
3. Registrar avances y observaciones por area.
4. Completar formularios de calidad, corte, confeccion y recepciones.

**Parte tecnica (codigo)**
- Tab activa: `tabActiva` (default `areas`, cambia a `info` si estado Pendiente).
- Areas: usa `AREAS_PRODUCCION` (constants) y helpers `getAreaActual`, `areaEstaCompleta`, `areaEnProgreso`.
- Calidad: usa `criteriosCalidad`, `seguimientoTalles`, `historialInspeccionesCalidad`.
- Corte: `cortePlan` + `corteReal` con guardado via `agregarObservacion()`.
- Confeccion: planilla + recepciones, exporta PDF via `ExportService`.
- Diseno: carga y guarda via `DisenoService` + sincronizacion con `MuestrasService`.
- Auditoria: `auditoriaItems` se construye desde `proyecto.observaciones`.
- Permisos: `HasPermissionDirective` y `PermissionService`.

### 4) Avance por Areas (operarios)
Archivo: `components/avance-areas/avance-areas.component.*`

**Para que sirve**
- Operarios completan areas asignadas.

**Acciones**
1. Seleccionar area.
2. Agregar observaciones.
3. Marcar como completada.

**Notas**
- Si se completa la ultima area (etiquetado/empaquetado) se crea despacho automaticamente.

**Parte tecnica (codigo)**
- Carga: `obtenerAvanceAreas(idProyecto)`.
- Completar: `completarArea(idProyecto, area, payload)`.
- Validacion por permisos: `PermissionService.esOperario()` + `obtenerAreasAsignadas()`.
- Envio a despacho: `DespachoService.crearDespacho()` si ultima area.

### 5) Diseno de Proyecto
Archivo: `components/diseno-proyecto/diseno-proyecto.component.*`

**Para que sirve**
- Cargar logo y mockup por prenda.
- Completar el area de diseno.

**Acciones**
1. Subir imagenes (logo/mockup) por prenda.
2. Guardar diseno.
3. Completar el area de diseno.
4. Sincronizar con la muestra si existe.

**Parte tecnica (codigo)**
- Carga: `forkJoin(resumen, diseno)` desde `DisenoService`.
- Validaciones de archivos: formatos `jpg/jpeg/png`, max 5MB.
- Guardado: `guardarDiseno()` -> `POST /Proyecto/{id}/diseno`.
- Completar area: `POST /Proyecto/{id}/areas/Diseno/completar`.
- Sincronizacion: `POST /Muestra/{id}/sincronizar-diseno`.

### 6) Muestras

#### 6.1) Lista de Muestras
Archivo: `components/muestra-lista/muestra-list.component.*`

**Acciones**
1. Buscar por nombre, codigo, estado o cliente.
2. Abrir detalle de muestra.
3. Crear nueva muestra.

**Parte tecnica (codigo)**
- Carga: `MuestrasService.obtenerMuestras()`.
- Busqueda: `muestrasFiltradas`.
- Navegacion: `router.navigate(['/proyectos/muestras', id])`.

#### 6.2) Detalle de Muestra
Archivo: `components/muestra-detalle-page/muestra-detalle-page.component.*`

**Acciones**
1. Ver datos de la muestra.
2. Editar y guardar cambios (con comentario).
3. Aceptar o rechazar la muestra.

**Parte tecnica (codigo)**
- Carga: `MuestrasService.obtenerMuestraPorId(id)`.
- Actualizacion: `MuestrasService.actualizarMuestra(id, dto)`.
- Aceptar: `PUT /Muestra/{id}/aceptar`.
- Rechazar: `PUT /Muestra/{id}/rechazar`.
- Historial: depende del backend (`muestra.historial`).

#### 6.3) Crear Muestra / Proyecto
Archivo: `components/nuevo-muestra-modal/muestra-form.component.*`

**Acciones**
1. Completar datos basicos del proyecto.
2. Agregar prendas, talles y materiales.
3. Validar stock y materiales.
4. Guardar el proyecto o la muestra.

**Parte tecnica (codigo)**
- Inicializacion: `ProyectosServiceNuevo.obtenerDatosFormulario()`.
- Validaciones locales: `validarFormularioLocal()` en `ProyectosServiceNuevo`.
- Calculo de materiales: `calcularMateriales()`.
- Validacion de stock: `validarStock()`.
- Guardado: `POST /Proyecto`.

## Estados del Proyecto
- Pendiente
- En Proceso
- Finalizado
- Despachado
- Cancelado
- Pausado
- Archivado

## Auditoria
- Se muestra en el detalle del proyecto.
- Se alimenta con `observaciones` del proyecto.
- Si no hay observaciones, se muestra “No hay eventos de auditoria”.

## Reglas importantes
- El boton **Iniciar proyecto** solo esta habilitado cuando el estado es Pendiente.
- El boton **Archivar proyecto** solo se muestra despues de iniciar.
- Algunas acciones requieren permisos (modulo Proyectos, accion Editar).

## Preguntas frecuentes

**1. No veo auditoria, esta roto?**
No. La auditoria depende de que el backend devuelva `observaciones` en el detalle del proyecto.

**2. No me deja completar un area**
Tu usuario debe tener permisos y el area debe estar asignada.

**3. No veo un proyecto en el Kanban**
Si el estado es Archivado, Cancelado o Pausado, no aparece en el tablero.

---

# Anexo tecnico del modulo

## Rutas
Archivo: `proyectos.routes.ts`
- `path: ''` -> `ProyectosComponent`.

## Constantes de areas
Archivo: `constants/areas.constants.ts`
- Define `AREAS_PRODUCCION` con `idArea` que debe coincidir con DB.
- Helpers: `getAreaActual`, `getSiguienteArea`, `areaEstaCompleta`, `areaEnProgreso`, `areaPendiente`, `calcularProgresoGeneralPorAreas`, `getResumenAreas`.

## Servicios (API)

### ProyectosService
Archivo: `services/proyecto.service.ts`
- Base URL: `${environment.apiUrl}/Proyecto`.
- Cache local: `proyectos_cache_v2` (TTL 5 min).
- Endpoints:
  - `GET /Proyecto/resumen`
  - `GET /Proyecto/{id}`
  - `GET /Proyecto/estado/{estado}`
  - `POST /Proyecto/buscar`
  - `GET /Taller/{idTaller}/proyectos`
  - `POST /Proyecto`
  - `PUT /Proyecto/{id}`
  - `PATCH /Proyecto/{id}/estado`
  - `DELETE /Proyecto/{id}`
  - `POST /Proyecto/{id}/materiales`
  - `PUT /Proyecto/{id}/avance`
  - `GET /Proyecto/{id}/avance-areas`
  - `POST /Proyecto/{id}/areas/{area}/completar`
  - `PUT /Proyecto/{id}/retroceder-area`
  - `POST /Proyecto/{id}/scrap`
  - `POST /Proyecto/{id}/observaciones`

### ProyectosServiceNuevo
Archivo: `services/proyectos-nuevo.service.ts`
- Base URL: `${environment.apiUrl}/Proyecto`.
- Endpoints:
  - `GET /Proyecto/formulario/inicializacion`
  - `POST /Proyecto`
  - `PUT /Proyecto/{id}`
  - `GET /Proyecto/{id}/validar-edicion`
  - `GET /Proyecto/{id}/historial`
  - `POST /Proyecto/calcular-materiales`
  - `POST /Proyecto/validar-stock`
  - `POST /Proyecto/{id}/recalcular-materiales`
  - `GET /Proyecto/{id}/prendas`
  - `POST /Proyecto/validar-talles`

### DisenoService
Archivo: `services/diseno.service.ts`
- Base URL: `${environment.apiUrl}/Proyecto`.
- Endpoints:
  - `GET /Proyecto/{id}/resumen`
  - `GET /Proyecto/{id}/diseno`
  - `POST /Proyecto/{id}/diseno`
  - `POST /Proyecto/{id}/areas/Diseno/completar`
  - `POST /Muestra/{idMuestra}/sincronizar-diseno`

### MuestrasService
Archivo: `services/muestra.service.ts`
- Base URL: `${environment.apiUrl}/Muestra`.
- Cache local: `muestras_cache_v1` (TTL 5 min).
- Endpoints:
  - `GET /Muestra`
  - `GET /Muestra/{id}`
  - `POST /Muestra`
  - `PUT /Muestra/{id}`
  - `PUT /Muestra/{id}/aceptar`
  - `PUT /Muestra/{id}/rechazar`
  - `POST /Muestra/{id}/sincronizar-diseno`
  - `PUT /Muestra/{id}/asignar-proyecto/{idProyecto}`

## Modelos

### proyecto.model.ts
- Entidades: `Proyecto`, `ProyectoVista`, `MaterialProyecto`, `ObservacionProyecto`.
- DTOs: `CrearProyectoDTO`, `EditarProyectoDTO`, `BuscarProyectosDTO`, `ActualizarAvanceDTO`, `RegistrarScrapDTO`, `AgregarObservacionDTO`, `CompletarAreaRequestDTO`.
- Helpers: `calcularProgresoGeneral`, `calcularDiasTranscurridos`, `proyectoToVista`, `mapearEstadoParaBackend`.

### nuevo-proyecto.model.ts
- Estructuras para proyectos multi prenda, materiales, talles y validaciones.

### diseno.model.ts
- Modelos para diseno: resumen, detalle, payload.

### muestra.model.ts
- Modelo de muestra con historial y prendas.
