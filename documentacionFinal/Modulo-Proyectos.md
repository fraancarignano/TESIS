# Modulo de Proyectos

## Resumen
El modulo de **Proyectos** es el nucleo del sistema. Gestiona el ciclo de vida completo de una orden de produccion textil: desde la creacion con prendas y materiales, pasando por el avance en cada area de produccion, hasta el despacho final.

- Soporta proyectos con **multiples prendas** y distribucion por talles
- Calculo automatico de materiales con validacion de stock
- Flujo de produccion en **5 areas** (Diseño → Corte → Confeccion → Calidad → Empaquetado)
- Vista Kanban con drag-and-drop y vista de tabla con filtros
- Gestion de muestras, diseño, scrap y auditoria

---

## Pantallas principales

### 1) Tablero Kanban
Archivo: `components/proyectos.component.*`

**Para que sirve**
- Vista principal del modulo. Muestra los proyectos en columnas por estado: Pendiente, En Proceso, Finalizado.
- Permite mover proyectos entre columnas con drag-and-drop.
- Muestra estadisticas: total activos, archivados y promedio de scrap.

**Acciones**
1. Buscar proyectos por nombre, codigo o cliente.
2. Arrastrar tarjetas entre columnas para cambiar estado.
3. Abrir modal de nuevo proyecto.
4. Hacer click en una tarjeta para ver el detalle.

**Parte tecnica**
- Columnas: `proyectosPendientes`, `proyectosEnProceso`, `proyectosFinalizados`.
- Filtrado reactivo: `proyectosPendientesFiltrados`, etc.
- Drag-drop: `CdkDragDrop` + `moveItemInArray` / `transferArrayItem`.
- Carga: `cargarProyectos()` → `ProyectosService.obtenerProyectosConCache()`.

---

### 2) Lista de Proyectos (tabla)
Archivo: `components/proyecto-lista/proyecto-list.component.*`

**Para que sirve**
- Ver proyectos en tabla con filtros avanzados y paginacion.
- Exportar a Excel.

**Acciones**
1. Filtrar por estado, prioridad, tipo de prenda y rango de fechas.
2. Buscar por nombre, codigo, tipo de prenda o cliente.
3. Exportar el listado filtrado.
4. Filtrar por taller (via query params `taller` y `nombreTaller`).

**Parte tecnica**
- Carga: `cargarProyectos()` decide entre `obtenerProyectosPorTaller()` y `obtenerProyectosConCache()`.
- Filtros: `proyectosFiltrados` combina busqueda + `ProyectoFiltrosComponent`.
- Paginacion: `paginaActual`, `tamanioPagina`, `proyectosPaginados`.
- Exportacion: `exportarExcel()` → `ExportService.exportarProyectosExcel()`.

---

### 3) Detalle de Proyecto (modal)
Archivo: `components/proyecto-detalle-modal/proyecto-detalle-modal.component.*`

**Para que sirve**
- Ver toda la informacion de un proyecto.
- Gestionar avances por area.
- Registrar calidad, corte, confeccion, recepciones y diseño.
- Ver auditoria completa.

**Pestañas**
- **Informacion**: datos generales y control de estado.
- **Areas y Avances**: seguimiento por area de produccion.
- **Materiales**: asignaciones, uso y desperdicio.
- **Auditoria**: historial de observaciones y eventos.

**Acciones clave**
1. **Iniciar proyecto** (solo si estado es Pendiente).
2. **Archivar proyecto** (solo visible despues de iniciar).
3. Registrar avances y observaciones por area.
4. Completar formularios de calidad, corte, confeccion y recepciones.

**Parte tecnica**
- Tab activa: `tabActiva` (default `areas`, cambia a `info` si estado Pendiente).
- Areas: usa `AREAS_PRODUCCION` y helpers `getAreaActual`, `areaEstaCompleta`, `areaEnProgreso`.
- Calidad: `criteriosCalidad`, `seguimientoTalles`, `historialInspeccionesCalidad`.
- Corte: `cortePlan` + `corteReal`, guardado via `agregarObservacion()`.
- Confeccion: planilla + recepciones, exporta PDF via `ExportService`.
- Diseño: carga y guarda via `DisenoService` + sincronizacion con `MuestrasService`.
- Auditoria: `auditoriaItems` construido desde `proyecto.observaciones`.
- Permisos: `HasPermissionDirective` + `PermissionService`.

---

### 4) Avance por Areas (operarios)
Archivo: `components/avance-areas/avance-areas.component.*`

**Para que sirve**
- Operarios completan las areas de produccion asignadas a su usuario.

**Acciones**
1. Seleccionar area asignada.
2. Agregar observaciones.
3. Marcar area como completada.

**Notas**
- Si se completa la ultima area (Etiquetado/Empaquetado), el proyecto pasa a estado Finalizado automaticamente.
- El usuario debe tener el area asignada en su perfil para poder completarla.

**Parte tecnica**
- Carga: `obtenerAvanceAreas(idProyecto)`.
- Completar: `completarArea(idProyecto, area, payload)`.
- Validacion: `PermissionService.esOperario()` + `obtenerAreasAsignadas()`.

---

### 5) Diseño de Proyecto
Archivo: `components/diseno-proyecto/diseno-proyecto.component.*`

**Para que sirve**
- Cargar logo y mockup por prenda del proyecto.
- Completar el area de Diseño.

**Acciones**
1. Subir imagenes (logo/mockup) por prenda.
2. Guardar diseño.
3. Completar el area de Diseño.
4. Sincronizar con la muestra si existe.

**Parte tecnica**
- Carga: `forkJoin(resumen, diseno)` desde `DisenoService`.
- Validaciones: formatos `jpg/jpeg/png`, max 5MB.
- Guardado: `POST /api/Proyecto/{id}/diseno`.
- Completar area: `POST /api/Proyecto/{id}/areas/Diseno/completar`.
- Sincronizacion: `POST /api/Muestra/{id}/sincronizar-diseno`.

---

### 6) Muestras

#### 6.1) Lista de Muestras
Archivo: `components/muestra-lista/muestra-list.component.*`

**Acciones**
1. Buscar por nombre, codigo, estado o cliente.
2. Abrir detalle de muestra.
3. Crear nueva muestra.

**Parte tecnica**
- Carga: `MuestrasService.obtenerMuestras()`.
- Busqueda reactiva: `muestrasFiltradas`.
- Navegacion: `router.navigate(['/proyectos/muestras', id])`.

#### 6.2) Detalle de Muestra
Archivo: `components/muestra-detalle-page/muestra-detalle-page.component.*`

**Acciones**
1. Ver datos de la muestra.
2. Editar y guardar cambios (con comentario obligatorio).
3. Aceptar o rechazar la muestra.

**Parte tecnica**
- Carga: `MuestrasService.obtenerMuestraPorId(id)`.
- Actualizacion: `PUT /api/Muestra/{id}`.
- Aceptar: `PUT /api/Muestra/{id}/aceptar`.
- Rechazar: `PUT /api/Muestra/{id}/rechazar`.

#### 6.3) Crear Muestra / Proyecto
Archivo: `components/nuevo-muestra-modal/muestra-form.component.*`

**Acciones**
1. Completar datos basicos del proyecto.
2. Agregar prendas, talles y materiales.
3. Validar stock y materiales.
4. Guardar el proyecto o la muestra.

**Parte tecnica**
- Inicializacion: `ProyectosServiceNuevo.obtenerDatosFormulario()`.
- Validaciones locales: `validarFormularioLocal()`.
- Calculo de materiales: `calcularMateriales()` → `POST /api/Proyecto/calcular-materiales`.
- Validacion de stock: `validarStock()` → `POST /api/Proyecto/validar-stock`.
- Guardado: `POST /api/Proyecto`.

---

## Estados del Proyecto

| Estado | Descripcion |
|---|---|
| Pendiente | Proyecto creado, aun no iniciado |
| En Proceso | Al menos un area completada |
| Finalizado | Todas las areas completadas |
| Despachado | Enviado al cliente |
| Cancelado | Cancelado antes de finalizar |
| Pausado | Detenido temporalmente |
| Archivado | Archivado manualmente |

---

## Areas de Produccion

Definidas en `constants/areas.constants.ts`. Deben coincidir con la tabla `AreaProduccion` de la BD.

| # | Nombre | Campo modelo | Color |
|---|---|---|---|
| 1 | Diseño y Desarrollo | `avanceDiseno` | Violeta |
| 2 | Corte | `avanceCorte` | Rojo |
| 3 | Confeccion | `avanceConfeccion` | Naranja |
| 4 | Control de Calidad | `avanceCalidadPrenda` | Verde |
| 5 | Etiquetado y Empaquetado | `avanceEtiquetadoEmpaquetado` | Azul |

**Reglas de avance**
- Las areas deben completarse en orden (no se puede completar Corte sin Diseño).
- Completar la ultima area cambia el estado del proyecto a `Finalizado`.
- Solo usuarios con el area asignada en su perfil pueden completarla.

---

## Backend (API .NET)

### Endpoints

Controladores: `Controllers/Proyectos/ProyectoController.cs`, `ProyectoAreasController.cs`, `ProyectoAreaController.cs`

#### CRUD principal
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Proyecto` | Lista todos los proyectos (detalle completo) |
| GET | `/api/Proyecto/resumen` | Lista liviana para carga inicial |
| GET | `/api/Proyecto/{id}` | Detalle de un proyecto |
| GET | `/api/Proyecto/estado/{estado}` | Proyectos por estado |
| GET | `/api/Proyecto/cliente/{idCliente}` | Proyectos por cliente |
| POST | `/api/Proyecto` | Crear proyecto |
| PUT | `/api/Proyecto/{id}` | Actualizar proyecto |
| PATCH | `/api/Proyecto/{id}/estado` | Cambiar estado |
| DELETE | `/api/Proyecto/{id}` | Archivar proyecto |
| DELETE | `/api/Proyecto/{id}/definitivo` | Eliminar definitivamente |

#### Materiales
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/Proyecto/calcular-materiales` | Preview de materiales sin crear |
| POST | `/api/Proyecto/validar-stock` | Validar stock antes de crear |
| POST | `/api/Proyecto/validar-talles` | Validar distribucion de talles |
| POST | `/api/Proyecto/{id}/recalcular-materiales` | Recalcular materiales de proyecto existente |
| GET | `/api/Proyecto/{id}/prendas` | Prendas del proyecto con talles |

#### Avance y areas
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Proyecto/{id}/avance-areas` | Estado de cada area |
| POST | `/api/Proyecto/{id}/areas/{area}/completar` | Completar un area |
| PUT | `/api/Proyecto/{id}/avance` | Actualizar porcentaje de avance |
| PUT | `/api/Proyecto/{id}/retroceder-area` | Retroceder area actual |

#### Diseño, scrap y observaciones
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Proyecto/{id}/resumen` | Resumen para pantalla de diseño |
| GET | `/api/Proyecto/{id}/diseno` | Detalle de diseño por prenda |
| POST | `/api/Proyecto/{id}/diseno` | Guardar diseño (logo/mockup) |
| POST | `/api/Proyecto/{id}/scrap` | Registrar scrap/desperdicio |
| POST | `/api/Proyecto/{id}/observaciones` | Agregar observacion |

#### Formulario
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Proyecto/formulario/inicializacion` | Catalogos para el formulario (clientes, prendas, talles, insumos, usuarios) |

### Reglas backend implementadas
- `nombreProyecto` e `idCliente` son obligatorios.
- Debe incluir al menos una prenda con al menos un talle.
- La suma de cantidades por talle debe coincidir con `cantidadTotal` de la prenda.
- Al completar un area, valida que la anterior este al 100%.
- Solo el usuario con el area asignada puede completarla (permiso `Proyectos.CompletarArea`).
- Al completar la ultima area, el proyecto pasa automaticamente a `Finalizado`.

### DTOs principales
Ubicacion: `Backend/TESIS_OG/DTOs/Proyectos/`

| Archivo | Uso |
|---|---|
| `ProyectoCrearDTO.cs` | Crear proyecto (prendas + talles + materiales manuales) |
| `ProyectoListaDTO.cs` | Listado liviano |
| `ProyectoActualizarDTOs.cs` | Actualizar datos generales |
| `AvanceAreasDTOs.cs` | Estado de areas (`ProyectoAvanceAreaDTO`, `CompletarAreaRequestDTO`) |
| `ActualizarAvanceDTO.cs` | Actualizar porcentaje de un area |
| `RegistrarScrapDTO.cs` | Registrar desperdicio |
| `AgregarObservacionDTO.cs` | Agregar observacion al historial |
| `DisenoDTOs.cs` | Resumen y detalle de diseño por prenda |
| `MaterialProyectoDTO.cs` | Materiales asignados al proyecto |

---

## Frontend (Angular)

### Ruta
Archivo: `proyectos.routes.ts`
- `path: ''` → `ProyectosComponent` (Kanban)

### Estructura de archivos
Ubicacion: `frontend/src/app/modules/proyectos/`

```
components/
  proyectos.component.*              ← Kanban principal
  proyecto-card/                     ← Tarjeta del Kanban
  proyecto-lista/                    ← Vista tabla
  proyecto-detalle-modal/            ← Modal de detalle completo
  proyecto-filtros/                  ← Componente de filtros
  proyecto-explorar/                 ← Vista explorar
  avance-areas/                      ← Completar areas (operarios)
  diseno-proyecto/                   ← Gestion de diseño
  muestra-lista/                     ← Lista de muestras
  muestra-detalle-page/              ← Detalle de muestra
  nuevo-proyecto-modal/              ← Formulario crear proyecto
  nuevo-muestra-modal/               ← Formulario crear muestra
constants/
  areas.constants.ts                 ← Definicion de 5 areas + helpers
models/
  proyecto.model.ts                  ← Interfaces principales
  nuevo-proyecto.model.ts            ← Interfaces multi-prenda
  diseno.model.ts                    ← Modelos de diseño
  muestra.model.ts                   ← Modelo de muestra
services/
  proyecto.service.ts                ← Servicio principal (con cache)
  proyectos-nuevo.service.ts         ← Servicio multi-prenda
  diseno.service.ts                  ← Servicio de diseño
  muestra.service.ts                 ← Servicio de muestras
```

### Servicios

#### ProyectosService (`services/proyecto.service.ts`)
- Base URL: `${environment.apiUrl}/Proyecto`
- Cache local: `proyectos_cache_v2` (TTL 5 minutos)
- Metodos clave: `obtenerProyectosConCache()`, `obtenerProyectoPorId()`, `crearProyecto()`, `actualizarAvance()`, `completarArea()`, `registrarScrap()`, `agregarObservacion()`

#### ProyectosServiceNuevo (`services/proyectos-nuevo.service.ts`)
- Maneja el formulario multi-prenda
- Metodos clave: `obtenerDatosFormulario()`, `crearProyecto()`, `calcularMateriales()`, `validarStock()`, `validarTalles()`

#### DisenoService (`services/diseno.service.ts`)
- Metodos clave: `obtenerResumen()`, `obtenerDiseno()`, `guardarDiseno()`, `completarAreaDiseno()`, `sincronizarConMuestra()`

#### MuestrasService (`services/muestra.service.ts`)
- Cache local: `muestras_cache_v1` (TTL 5 minutos)
- Metodos clave: `obtenerMuestras()`, `obtenerMuestraPorId()`, `crearMuestra()`, `actualizarMuestra()`, `aceptarMuestra()`, `rechazarMuestra()`

### Modelos principales

#### `proyecto.model.ts`
- `Proyecto`: entidad principal con avances, materiales, observaciones y prendas
- `ProyectoVista`: version enriquecida para la UI (progreso calculado, dias transcurridos)
- `EstadoProyecto`: union type con todos los estados posibles
- Helpers: `calcularProgresoGeneral()`, `calcularDiasTranscurridos()`, `proyectoToVista()`, `mapearEstadoParaBackend()`

#### `nuevo-proyecto.model.ts`
- `ProyectoCrearNuevo`: DTO de creacion con prendas y materiales manuales
- `FormularioProyectoInicializacion`: catalogos para el formulario (clientes, tipos de prenda, talles, insumos, usuarios)
- `CalculoMaterialesRequest/Response`: preview de materiales
- `ValidacionStock`: alertas de stock insuficiente

---

## Contrato JSON

### Crear proyecto (request)
```json
{
  "idCliente": 5,
  "nombreProyecto": "Remeras Verano 2026",
  "descripcion": "Pedido temporada verano",
  "prioridad": "alta",
  "estado": "Pendiente",
  "fechaInicio": "2026-04-15",
  "fechaFin": "2026-05-30",
  "idUsuarioEncargado": 3,
  "prendas": [
    {
      "idTipoPrenda": 1,
      "idTipoInsumoMaterial": 2,
      "cantidadTotal": 100,
      "tieneBordado": false,
      "tieneEstampado": true,
      "descripcionDiseno": "Logo frente",
      "colorTela": "Blanco",
      "talles": [
        { "idTalle": 1, "cantidad": 20 },
        { "idTalle": 2, "cantidad": 40 },
        { "idTalle": 3, "cantidad": 40 }
      ]
    }
  ],
  "materialesManuales": [
    {
      "idInsumo": 15,
      "cantidad": 5,
      "unidadMedida": "kg",
      "observaciones": "Hilo para costura"
    }
  ]
}
```

### Respuesta de proyecto (detalle)
```json
{
  "idProyecto": 42,
  "codigoProyecto": "PROY-0042",
  "idCliente": 5,
  "nombreCliente": "Juan Perez",
  "nombreProyecto": "Remeras Verano 2026",
  "prioridad": "alta",
  "estado": "En Proceso",
  "fechaInicio": "2026-04-15",
  "fechaFin": "2026-05-30",
  "cantidadTotal": 100,
  "cantidadProducida": 0,
  "areaActual": "Corte",
  "avanceDiseno": 100,
  "avanceCorte": 0,
  "avanceConfeccion": 0,
  "avanceCalidadPrenda": 0,
  "avanceEtiquetadoEmpaquetado": 0,
  "prendas": [...],
  "materiales": [...],
  "alertasStock": []
}
```

### Completar area (request)
```json
{
  "observaciones": "Corte finalizado sin inconvenientes"
}
```

### Registrar scrap (request)
```json
{
  "idInsumo": 7,
  "cantidadScrap": 1.5,
  "motivo": "Tela defectuosa",
  "destino": "Descarte",
  "areaOcurrencia": "Corte",
  "costoScrap": 350.00
}
```

---

## Auditoria
- Se muestra en la pestaña Auditoria del modal de detalle.
- Se alimenta con el campo `observaciones` del proyecto.
- Cada observacion tiene: fecha, usuario, descripcion.
- Las areas completadas generan una observacion automatica con prefijo `[AREA_COMPLETADA]`.
- Si no hay observaciones, se muestra "No hay eventos de auditoria".

---

## Permisos requeridos

| Accion | Permiso |
|---|---|
| Ver avance de areas | `Proyectos.VerAvanceAreas` |
| Completar un area | `Proyectos.CompletarArea` |
| Editar proyecto | `Proyectos.Editar` |
| Ver proyectos | `Proyectos.Ver` |

---

## Checklist rapido de QA
1. Crear proyecto con una prenda y distribucion de talles
2. Verificar que aparezca en el Kanban en columna Pendiente
3. Iniciar proyecto y verificar cambio a En Proceso
4. Completar area Diseño con observacion
5. Verificar que no se puede completar Corte sin Diseño
6. Completar todas las areas y verificar que el estado pase a Finalizado
7. Registrar scrap en un area
8. Subir logo y mockup en la pantalla de Diseño
9. Crear muestra y asociarla a un proyecto
10. Aceptar/rechazar muestra
11. Exportar listado de proyectos a Excel
12. Buscar proyecto por nombre, codigo y cliente
13. Intentar completar un area sin tener el area asignada (debe bloquear)
14. Verificar auditoria con historial de observaciones

---

## Notas
- El cache del frontend tiene TTL de 5 minutos. Si los datos no se actualizan, puede ser por cache.
- Los `idArea` en `areas.constants.ts` deben coincidir exactamente con los IDs de la tabla `AreaProduccion` en la BD.
- El formulario de creacion carga todos los catalogos en un solo request (`/formulario/inicializacion`).
- El calculo de materiales es automatico para telas (basado en tipo de prenda y cantidad) y manual para hilos y accesorios.
