# Modulo de Reportes

## Resumen
El modulo de **Reportes** agrupa todos los reportes analiticos del sistema, organizados por dominio de negocio. Cada reporte es un componente Angular standalone con sus propios graficos (Chart.js / ng2-charts), filtros y datos del backend. Todos los endpoints requieren el permiso `Reportes.Ver`.

**Reportes disponibles:**

| Nombre | Ruta Angular | Descripcion |
|---|---|---|
| Inventario Critico + Rotacion | `/reportes` (ruta raiz) | Stock actual vs minimo + rotacion mensual de insumos |
| Rendimiento de Proveedores | `/reportes/proveedores` | Tiempos de entrega y precision de pedidos |
| Demanda por Cliente (Temporada) | Navegacion interna desde sidebar | Proyectos y prendas por cliente en un rango de fechas |
| Produccion por Prenda | Navegacion interna | Cantidad producida por tipo de prenda con evolucion temporal |
| Calidad de Produccion | Navegacion interna | Inspecciones de calidad con distribucion y fallas por taller |

---

## Pantallas principales

### 1) Reporte de Inventario Critico + Rotacion de Insumos
Archivo: `Inventario/reporte-inventario-critico.component.*`

**Para que sirve**
- Muestra el estado actual del stock de todos los insumos clasificados por nivel de criticidad.
- Incluye un grafico de barras Stock vs Minimo y una seccion de rotacion mensual (consumo vs reposicion).

**Secciones**

*Tarjetas de resumen:*
- Total insumos monitoreados
- Insumos agotados
- Insumos criticos
- Insumos bajos
- Insumos en alerta
- Porcentaje de criticidad global

*Grafico de barras — Stock vs Minimo:*
- Eje Y: nombre del insumo; Eje X: cantidad
- Barras coloreadas segun criticidad: Rojo (Agotado), Naranja (Critico), Amarillo (Bajo), Verde agua (Alerta), Verde (Normal)
- Si hay mas de 5 insumos el grafico cambia a orientacion horizontal automaticamente

*Tabla de detalle:*
- Columnas: nombre, tipo, stock actual, stock minimo, unidad de medida, nivel de criticidad (badge), dias restantes

*Seccion Rotacion de Insumos:*
- Filtros: insumo (select), anio (ultimos 5 anios)
- Tarjetas: total consumo, total reposicion, diferencia
- Grafico de barras agrupadas: Consumo (naranja) vs Reposicion (azul oscuro) por mes (eje X fijo 12 meses)

**Filtros disponibles**

| Filtro | Tipo | Aplica a |
|---|---|---|
| Insumo | Select (lista de insumos activos) | Rotacion |
| Anio | Select (ultimos 5 anios) | Rotacion |

**Parte tecnica**
- Carga principal: `cargarDatos()` → `ReportesService.obtenerReporteInventarioCritico()`.
- Rotacion: `cargarDatosRotacion()` → `ReportesService.obtenerRotacionInsumo(idInsumo, anio)`.
- Graficos con `Chart.js` registrado manualmente (`Chart.register(...registerables)`).
- Se usa `ChangeDetectorRef.detectChanges()` + `setTimeout` para asegurar que el canvas este en el DOM antes de crear el grafico.
- El grafico anterior se destruye (`chart.destroy()`) antes de crear uno nuevo para evitar errores de canvas.
- `getBadgeClass(nivelCriticidad)` y `getFilaClass(nivelCriticidad)` devuelven las clases CSS correspondientes.
- `ngOnDestroy` destruye ambas instancias de Chart para liberar memoria.

---

### 2) Reporte de Rendimiento de Proveedores
Archivo: `components/proveedores/reporte-proveedores.component.*`

**Para que sirve**
- Analiza el desempeno de los proveedores en dos dimensiones:
  1. **Tiempos de entrega**: cuantas ordenes llegaron a tiempo, anticipadas o con retraso, y promedio de dias de retraso.
  2. **Precision de pedidos**: cantidad pedida vs cantidad realmente recibida por proveedor.

**Secciones**

*Filtros (formulario reactivo):*
- Fecha inicio / Fecha fin
- Proveedor (select con lista completa)

*Grafico de tiempos — Dona (doughnut):*
- Segmentos: A tiempo (verde), Anticipado (cyan), Con retraso (rojo)
- Porcentajes mostrados sobre cada segmento via `chartjs-plugin-datalabels`

*Tarjetas de tiempos:*
- Total ordenes analizadas
- A tiempo, anticipadas, con retraso (conteos)
- Promedio dias de retraso

*Tabla de detalle de tiempos:*
- N° orden, proveedor, fecha estimada, fecha real, dias de diferencia, estado

*Grafico de precision — Barras agrupadas:*
- Eje X: proveedores; Eje Y: cantidad; Dataset 1: pedida (azul), Dataset 2: recibida (verde)

*Tabla de resumen por proveedor:*
- Nombre, cantidad pedida, cantidad recibida, % cumplimiento

**Filtros disponibles**

| Filtro | Tipo | Descripcion |
|---|---|---|
| Fecha inicio | Date | Filtra por fecha de recepcion control |
| Fecha fin | Date | Filtra por fecha de recepcion control |
| Proveedor | Select | ID del proveedor (opcional, todos si no se selecciona) |

**Parte tecnica**
- Formulario reactivo con `FormBuilder`.
- `generarReporte()` lanza en paralelo las dos llamadas: `obtenerReporteTiemposEntrega()` y `obtenerReportePrecisionPedidos()`.
- Los graficos usan `ng2-charts` (`BaseChartDirective`) con `ChartData` y `ChartConfiguration` de `chart.js`.
- `actualizarGraficoTiempos()` y `actualizarGraficoPrecision()` actualizan los datos mutando el objeto y forzando redibujado via spread operator (`{...this.chartData}`).
- Dependencia de `ProveedoresService.obtenerProveedores()` para poblar el select de proveedores.

---

### 3) Reporte de Demanda por Cliente (Temporada)
Archivo: `components/clientes-temporada/clientes-temporada.component.*`

**Para que sirve**
- Muestra cuantos proyectos y prendas ha generado cada cliente en un rango de fechas (temporada).
- Permite identificar los clientes de mayor volumen y analizar tasas de cancelacion.
- Exportable a Excel.

**Secciones**

*Filtros:*
- Fecha inicio / Fecha fin (default: ultimos 2 anios)
- Cliente (select, opcional)

*Tarjetas de resumen:*
- Total prendas del periodo
- Total proyectos del periodo
- Clientes con demanda (al menos 1 prenda)

*Grafico de barras horizontal:*
- Eje Y: clientes ordenados por total de prendas desc
- Eje X: cantidad de prendas
- Tooltip ampliado: prendas, proyectos, finalizados, cancelados con %

*Tabla de detalle ordenada:*
- Columnas: cliente, tipo, proyectos, total prendas, promedio prendas/proyecto, finalizados, cancelados, % cancelacion

**Filtros disponibles**

| Filtro | Tipo | Descripcion |
|---|---|---|
| Fecha inicio | Date | Inicio del rango de temporada |
| Fecha fin | Date | Fin del rango de temporada |
| Cliente | Select | Filtrar por un cliente especifico |

**Parte tecnica**
- `cargarReporte()` → `ReportesService.obtenerReporteClientesTemporada(filtros)`.
- Las filas se ordenan por `totalPrendas desc` al recibir del backend.
- `obtenerClientesPorPrendas()`: agrupa filas por `idCliente` para el grafico (un cliente puede tener N filas de proyectos).
- `exportarExcel()`: usa la libreria `xlsx` para generar y descargar un `.xlsx` con los datos filtrados.
- `alturaGrafico` calcula dinamicamente la altura del canvas segun la cantidad de clientes (minimo 320px, 56px por cliente).
- Validacion de rango de fechas antes de ejecutar filtros.

---

### 4) Reporte de Produccion por Prenda
Archivo: `Proyectos/reporte-proyectos.component.*`

**Para que sirve**
- Muestra la cantidad de prendas producidas por tipo de prenda.
- Si se selecciona un tipo de prenda especifico, cambia a modo evolucion temporal (grafico de linea por mes).

**Modos**

*Modo normal (sin tipo de prenda seleccionado):*
- Grafico de barras vertical: tipos de prenda en X, cantidad en Y
- Colores alternados (naranja / azul oscuro)

*Modo evolucion (con tipo de prenda seleccionado):*
- Grafico de linea: meses en X, cantidad en Y
- Linea naranja con relleno semitransparente

**Filtros disponibles**

| Filtro | Tipo | Descripcion |
|---|---|---|
| Fecha desde | Date | Inicio del rango |
| Fecha hasta | Date | Fin del rango |
| Cliente | Select | Filtrar por cliente |
| Tipo de prenda | Select | Si se selecciona activa modo evolucion |

**Parte tecnica**
- `get modoEvolucion()`: devuelve `true` si `filtros.tipoPrenda` tiene valor.
- Modo normal → `obtenerProduccionPorTipoPrenda()`.
- Modo evolucion → `obtenerEvolucionPrenda(tipoPrenda, ...)`.
- Los datos de filtros (clientes y tipos de prenda) se cargan al iniciar con `cargarOpciones()`.
- El grafico se destruye y recrea en cada llamada a `crearGrafico()`.

---

### 5) Reporte de Calidad de Produccion
Archivo: `Calidad/reporte-calidad.component.*`

**Para que sirve**
- Analiza el resultado de las inspecciones de calidad registradas en el modulo de Proyectos.
- Muestra distribucion de resultados, fallas por criterio, inspeccionados por talle y rendimiento por taller confeccionista.

**Secciones**

*Tarjetas de resumen:*
- Total inspecciones
- Unidades inspeccionadas
- Aprobadas / Observadas / Rechazadas (conteos y porcentaje)

*Grafico de dona — Distribucion de resultados:*
- Segmentos: Aprobada (verde), Observada (naranja), Rechazada (rojo), otras

*Grafico de barras — Inspeccionadas por talle:*
- Barras verticales azules, una barra por talle

*Grafico de barras horizontal — Fallas por criterio:*
- Top 8 criterios de falla, barras rojas horizontales

*Grafico de barras horizontal apiladas — Calidad por taller:*
- Un taller por fila, barras apiladas al 100%: % aprobadas (verde), % observadas (naranja), % rechazadas (rojo)
- Tooltip ampliado: porcentaje + conteo absoluto + total inspecciones del taller

*Tabla de resumen por proyecto:*
- Nombre del proyecto, total inspecciones, unidades inspeccionadas, rechazadas

**Filtros disponibles**

| Filtro | Tipo | Descripcion |
|---|---|---|
| ID Proyecto | NUMBER | Filtrar por proyecto especifico |
| Fecha inicio | Date | Inicio del rango de inspeccion |
| Fecha fin | Date | Fin del rango de inspeccion |

**Parte tecnica**
- `cargarDatos()` lanza en paralelo: `obtenerReporteCalidad()` y `obtenerCalidadPorTaller()`.
- Los datos de calidad provienen de registros `ObservacionProyecto` que contienen `[CONTROL_CALIDAD]` en su descripcion.
- El backend parsea el texto de la observacion con regex para extraer resultado, lote, talles (JSON) y fallas (pipe-separated).
- `destruirGraficos()` llama a `.destroy()` en los 4 graficos antes de recrearlos para evitar conflictos.
- `getTallerOrdenado()` ordena los talleres por % de aprobacion descendente para el grafico de barras.
- `getPorcentajeAprobacion(taller)` calcula el % con division segura (evita division por cero).
- Exportado como `default` para compatibilidad con lazy loading.

---

## Modelo de Datos

### Interfaces del servicio (`reportes.service.ts`)

#### ResumenInventarioCritico
| Campo | Tipo | Descripcion |
|---|---|---|
| `totalInsumosMonitoreados` | number | Total de insumos en sistema |
| `insumosCriticos` | number | Con stock ≤ 30% del minimo |
| `insumosAgotados` | number | Con stock = 0 |
| `insumosBajos` | number | Con stock ≤ 80% del minimo |
| `insumosAlerta` | number | Con stock ≤ 100% del minimo |
| `porcentajeCriticidad` | number | % de insumos con problemas |
| `insumos` | InventarioCritico[] | Listado completo |

#### InventarioCritico (item)
| Campo | Tipo | Descripcion |
|---|---|---|
| `idInsumo` | number | ID del insumo |
| `nombreInsumo` | string | Nombre descriptivo |
| `tipoInsumo` | string | Tipo de insumo |
| `stockActual` | number | Stock disponible actualmente |
| `stockMinimo` | number | Umbral critico configurado |
| `unidadMedida` | string | Unidad de medida |
| `nivelCriticidad` | string | Agotado / Critico / Bajo / Alerta / Normal |
| `diasRestantes?` | number | Estimacion de dias de stock restante |
| `ultimaActualizacion` | Date | Fecha de ultima actualizacion del stock |

#### RotacionInsumo
| Campo | Tipo | Descripcion |
|---|---|---|
| `año` | number | Anio del periodo |
| `mes` | number | Mes (1-12) |
| `consumo` | number | Unidades consumidas (salidas) |
| `reposicion` | number | Unidades repuestas (entradas) |

#### ReporteCalidad
| Campo | Tipo | Descripcion |
|---|---|---|
| `totalInspecciones` | number | Numero de inspecciones realizadas |
| `totalUnidadesInspeccionadas` | number | Unidades totales inspeccionadas |
| `inspeccionesAprobadas` | number | Conteo aprobadas |
| `inspeccionesObservadas` | number | Conteo observadas |
| `inspeccionesRechazadas` | number | Conteo rechazadas |
| `porcentajeAprobacion` | number | % aprobadas sobre total |
| `distribucionResultados` | ResultadoCalidad[] | Por resultado |
| `distribucionPorTalle` | TalleCalidad[] | Por talle |
| `fallasPorCriterio` | CriterioFalla[] | Por criterio de falla |
| `resumenPorProyecto` | ProyectoCalidad[] | Agrupado por proyecto |

#### ReporteTiemposEntrega
| Campo | Tipo | Descripcion |
|---|---|---|
| `totalOrdenes` | number | Total ordenes analizadas |
| `ordenesATiempo` | number | Ordenes recibidas a tiempo |
| `ordenesConRetraso` | number | Ordenes recibidas con retraso |
| `ordenesAnticipadas` | number | Ordenes recibidas antes de la fecha |
| `promedioDiasRetraso` | number | Promedio de dias de retraso |
| `detalleOrdenes` | OrdenTiempo[] | Detalle orden a orden |

#### ReportePrecisionPedidos
| Campo | Tipo | Descripcion |
|---|---|---|
| `totalCantidadPedida` | number | Total unidades pedidas |
| `totalCantidadRecibida` | number | Total unidades recibidas |
| `porcentajeCumplimientoGlobal` | number | % global de cumplimiento |
| `resumenPorProveedor` | PrecisionProveedor[] | Resumen agregado por proveedor |
| `detalleOrdenes` | OrdenPrecision[] | Detalle orden a orden |

---

## Backend (API .NET)

### Controlador
`Backend/TESIS_OG/Controllers/Reportes/ReportesController.cs`

Todos los endpoints requieren permisos via `[RequiresPermission("Reportes", "Ver")]` a nivel de clase.

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Reportes/inventario-critico` | Resumen + listado completo de insumos con nivel de criticidad |
| GET | `/api/Reportes/dashboard-inventario` | Stock por tipo, movimientos recientes (6 meses), top 10 insumos |
| GET | `/api/Reportes/rotacion-insumo?idInsumo=&anio=` | Consumo vs reposicion mensual de un insumo |
| GET | `/api/Reportes/calidad?idProyecto=&fechaInicio=&fechaFin=` | Reporte de inspecciones de calidad |
| GET | `/api/Reportes/calidad-por-taller?idProyecto=&fechaInicio=&fechaFin=` | Calidad agrupada por taller confeccionista |
| GET | `/api/Reportes/produccion-por-prenda?fechaInicio=&fechaFin=&idCliente=&nombrePrenda=` | Produccion por tipo de prenda |
| GET | `/api/Reportes/evolucion-prenda?nombrePrenda=&fechaInicio=&fechaFin=&idCliente=` | Evolucion mensual de una prenda |
| GET | `/api/Reportes/clientes-temporada?fechaInicio=&fechaFin=&idCliente=` | Demanda por cliente en rango de fechas |
| GET | `/api/Reportes/clientes-con-proyectos` | Lista de clientes con al menos un proyecto (para filtros) |
| GET | `/api/Reportes/tipos-prenda` | Lista de tipos de prenda usados (para filtros) |
| GET | `/api/Reportes/proveedores/tiempos-entrega?fechaInicio=&fechaFin=&idProveedor=` | Tiempos de entrega de proveedores |
| GET | `/api/Reportes/proveedores/precision-pedidos?fechaInicio=&fechaFin=&idProveedor=` | Precision de pedidos por proveedor |

### Reglas backend implementadas

**Inventario Critico:**
- Clasifica cada insumo segun la relacion `stockActual / stockMinimo`: ≤0 → Agotado, ≤0.3 → Critico, ≤0.8 → Bajo, ≤1 → Alerta, >1 → Normal.
- Devuelve TODOS los insumos (no solo los criticos).

**Calidad:**
- Los datos se extraen de `ObservacionProyecto.Descripcion` que contiene la cadena `[CONTROL_CALIDAD]`.
- Parsing via regex: `res=APROBADA`, `lot=30`, `tj={"XS":5,"S":10}`, `f=costura|tela` (soporta formato legado tambien).
- `ExtraerResultadoCalidad`, `ExtraerLote`, `ExtraerTalles`, `ExtraerFallas` son metodos estaticos privados del controlador.

**Proveedores:**
- Solo considera ordenes en estado `Recibida` con `FechaRecepcionControl` no nulo.
- La precision usa movimientos de inventario (`TipoMovimiento = "Entrada"` con origen que contiene `"Recepcion"`) como fuente de cantidad realmente recibida.

**Demanda por Cliente:**
- Validacion: `fechaInicio` no puede ser mayor que `fechaFin`. Retorna `BadRequest` con mensaje.
- Delega la logica a `IReportesService.ObtenerReporteClientesPorTemporada()`.

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Reportes/`

| Archivo / Namespace | Uso |
|---|---|
| `DTOs/Reportes/Inventario/` | `ResumenInventarioCriticoDTO`, `InventarioCriticoDTO`, `RotacionInsumoDTO` |
| `DTOs/Reportes/Calidad/` | `ReporteCalidadDTO`, `ResultadoCalidadDTO`, `TalleCalidadDTO`, `CriterioFallaDTO`, `ProyectoCalidadDTO`, `CalidadPorTallerDTO` |
| `DTOs/Reportes/Proveedores/` | `ReporteTiemposEntregaDTO`, `OrdenTiempoDTO`, `ReportePrecisionPedidosDTO`, `PrecisionProveedorDTO`, `OrdenPrecisionDTO` |
| `DTOs/Reportes/` | `ProduccionPorPrendaDTO`, `ReporteClientesTemporadaRequestDTO`, `ReporteClientesTemporadaResponseDTO` |

---

## Frontend (Angular)

### Rutas
Archivo: `reportes.routes.ts`

| Path | Componente |
|---|---|
| `` (raiz) | `ReporteInventarioCriticoComponent` |
| `proveedores` | `ReporteProveedoresComponent` |

> Los reportes de Calidad, Proyectos y Clientes-Temporada se navegan via sidebar interno (no tienen rutas separadas en `reportes.routes.ts`).

### Estructura de archivos
Ubicacion: `frontend/src/app/modules/reportes/`

```
Inventario/
  reporte-inventario-critico.component.*      ← Inventario critico + Rotacion
Calidad/
  reporte-calidad.component.*                 ← Calidad de produccion
Proyectos/
  reporte-proyectos.component.*              ← Produccion por prenda
  reporte-scrap-material.component.*          ← Scrap de material
components/
  proveedores/
    reporte-proveedores.component.*           ← Rendimiento de proveedores
  clientes-temporada/
    clientes-temporada.component.*            ← Demanda por cliente
models/
  reporte.model.ts                            ← Interfaces para reporte de temporada
services/
  reportes.service.ts                         ← Servicio centralizado con todas las interfaces y metodos
reportes.routes.ts
```

### Servicio principal (`services/reportes.service.ts`)
- Base URL: `${environment.apiUrl}/Reportes`
- Manejo de errores centralizado en metodo privado `handleError()` que traduce codigos HTTP a mensajes amigables.
- Todos los metodos devuelven `Observable<T>` con `catchError(this.handleError)`.

---

## Checklist rapido de QA

### Inventario Critico
1. Cargar la pagina y verificar que las tarjetas de resumen muestran valores correctos
2. Verificar que el grafico cambia a horizontal si hay mas de 5 insumos
3. Seleccionar un insumo en el select de Rotacion y verificar el grafico de 12 meses
4. Cambiar el anio en el select y verificar que el grafico se actualiza
5. Verificar colores de badge segun nivel de criticidad (Agotado=rojo, Critico=naranja, etc.)

### Rendimiento de Proveedores
6. Generar reporte sin filtros y verificar que carga tiempos y precision en paralelo
7. Filtrar por un proveedor especifico y verificar que los graficos se actualizan
8. Filtrar por rango de fechas y verificar el tooltip con porcentaje en la dona

### Demanda por Cliente
9. Verificar que el rango default sea los ultimos 2 anios
10. Exportar a Excel y verificar columnas y datos
11. Aplicar filtro de cliente y verificar que el grafico muestra solo ese cliente
12. Validar que fechaInicio > fechaFin muestra advertencia

### Produccion por Prenda
13. Verificar modo normal (sin tipo de prenda): grafico de barras verticales
14. Seleccionar tipo de prenda: grafico cambia a linea de evolucion temporal

### Calidad
15. Cargar sin filtros y verificar los 4 graficos
16. Verificar que el grafico de talleres muestra porcentajes porcentuales apilados
17. Verificar tooltip del grafico de talleres: muestra % + conteo absoluto + total
18. Filtrar por proyecto y verificar que los graficos se actualizan

---

## Notas
- Todos los endpoints requieren el permiso `Reportes.Ver` (via atributo `[RequiresPermission]` en la clase del controlador).
- El reporte de calidad no tiene una tabla propia en la base de datos: extrae informacion parseando el campo texto `Descripcion` de `ObservacionProyecto` con patrones regex definidos en el backend.
- La precision de pedidos usa la tabla `InventarioMovimiento` como fuente de verdad de cantidades realmente recibidas (no el campo en la orden).
- Los graficos de inventario critico se crean con `Chart.js` directamente (sin `ng2-charts`). Los de proveedores usan `ng2-charts` + `chartjs-plugin-datalabels`.
- `ReporteInventarioCriticoComponent` y `ReporteCalidadComponent` se exportan como `default` para compatibilidad con lazy loading.
- El componente de rotacion de insumos esta embebido dentro de `ReporteInventarioCriticoComponent` (no es un componente separado).
