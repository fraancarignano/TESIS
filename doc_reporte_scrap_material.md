# Reporte de Scrap por Material (Corte)

## 1) Objetivo de negocio
El reporte de scrap por material permite medir, por cada tipo de tela/material, cuanto se uso en corte, cuanto termino como scrap y cuanto quedo recuperable. El objetivo no es reemplazar Audaces, sino evaluar eficiencia real de ejecucion y soportar decisiones de produccion.

Decisiones que habilita:
- Priorizar materiales/partidas con peor rendimiento.
- Detectar desvio entre consumo teorico (Audaces) y consumo real (corte).
- Medir impacto operativo por cliente/proyecto/material.
- Mejorar compra y planificacion con datos historicos.

## 2) Alcance funcional implementado
Se implemento un reporte frontend con:
- Filtros: fecha desde/hasta, cliente, material.
- KPI generales:
  - Tela usada total (kg)
  - Scrap total (kg)
  - Scrap general (%)
  - Recuperable (kg)
  - Cantidad de cortes
  - Promedio kg/prenda
- Tabla resumen por material (agregado).
- Tabla detalle por corte (trazabilidad).

Ruta de acceso:
- `/reportes/scrap-material`

Menu:
- Reportes -> `Scrap por Material`

## 3) Modelo conceptual
Cada corte real se interpreta como un registro con campos de produccion.

Entrada principal:
- Observaciones del proyecto con marcador `[CORTE_REAL]`.

Complemento para identificar material:
- Ultimo `[CORTE_PLAN]` del proyecto (campos `atl`/`tel`).
- Fallback: materiales del proyecto cuyo nombre de insumo contenga `tela`.

### Definiciones operativas usadas
- `telaUsadaKg`: kg totales usados en el corte.
- `scrapKg`: `restoKg + fallaKg`.
- `utilizableKg`: merma recuperable registrada.
- `scrapPorcentaje`: `(scrapKg / telaUsadaKg) * 100`.
- `kgPorPrenda`: `telaUsadaKg / prendasCortadas`.
- `desvioConsumoKg`: `telaUsadaKg - consumoTeoricoKg`.
- `desvioConsumoPorcentaje`: `(desvioConsumoKg / consumoTeoricoKg) * 100`.

## 4) Funcionamiento tecnico (codigo)

### 4.1 Componente principal
Archivo:
- `frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.ts`

Responsabilidades:
- Cargar proyectos desde `ProyectosService.obtenerProyectosConCache()`.
- Parsear observaciones `[CORTE_REAL]` y `[CORTE_PLAN]`.
- Transformar observaciones en registros de scrap normalizados.
- Aplicar filtros en memoria.
- Agregar datos por material para el resumen.
- Exponer KPIs calculados.

### 4.2 Vista del reporte
Archivos:
- `frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.html`
- `frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.css`

Secciones:
- Encabezado + accion de actualizar.
- Panel de filtros.
- Tarjetas KPI.
- Tabla resumen por material.
- Tabla detalle por corte.

### 4.3 Integracion de navegacion
Archivos:
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/layouts/private-layout/private-layout.component.html`

Cambios:
- Alta de ruta `reportes/scrap-material` con permiso `Reportes/Ver`.
- Alta de opcion en submenu de reportes.

## 5) Flujo de calculo
1. Se obtienen todos los proyectos.
2. Por cada proyecto:
   - Se detecta el ultimo `[CORTE_PLAN]` para inferir material.
   - Se leen todas las observaciones `[CORTE_REAL]`.
   - Cada observacion se parsea a estructura tipada.
   - Se calculan metricas por corte.
3. Se consolidan todos los cortes en una coleccion global.
4. Se aplican filtros de usuario.
5. Se agregan resultados por material.
6. Se renderizan KPIs + tablas.

## 6) Criterios de calidad del dato
El reporte depende de que los registros de corte real se carguen completos. Para que sea confiable:
- Registrar siempre `fechaCorte`, `partidaTela`, `telaUsadaKg`, `restoKg`, `fallaKg`, `utilizableKg`, `prendasCortadas`.
- Cargar `consumoTeoricoKg` cuando exista dato de Audaces para calcular desvio.
- Mantener consistencia semantica de `resto` vs `utilizable` en el equipo operativo.

## 7) Limitaciones actuales
- Fuente principal: observaciones parseadas por texto (`[CORTE_REAL]`), no entidad dedicada.
- No hay costo por kg integrado en este reporte (impacto economico directo pendiente).
- Sin integracion automatica con Audaces (carga manual del teorico/referencia).

## 8) Evolucion recomendada
Para fase siguiente:
- Migrar de texto a entidad estructurada de `ParteCorte` en backend.
- Agregar `idInsumo`, `motivoScrap`, `destinoScrap`, `costoKg`, `turno/maquina`.
- Incorporar alertas automaticas por umbral de scrap/desvio.
- Exponer endpoint especifico de reporte para paginado server-side.

## 9) Defensa teorica resumida
El sistema separa claramente planificacion y ejecucion:
- Audaces define el escenario teorico (aprovechamiento/consumo esperado).
- El sistema registra el escenario real de corte.
- El reporte cuantifica la brecha entre ambos escenarios por material.

Con esto, el indicador deja de ser solo descriptivo ("cuanto scrap hubo") y se vuelve explicativo ("en que material, con que desvio y en que contexto operativo ocurrio").
