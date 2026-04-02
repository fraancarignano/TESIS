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
Cada corte real se interpreta como uno o varios registros por tela/material.

Entrada principal:
- Observaciones del proyecto con marcador `[CORTE_REAL]`.
- En cada observación se serializa el detalle por tela en el token `tl`.

Complemento para identificar material:
- Último `[CORTE_PLAN]` del proyecto (tokens `cls`/`tls`).
- Fallback: materiales del proyecto cuyo nombre de insumo contenga `tela`.

### Definiciones operativas usadas
- `telaUsadaKg`: kg usados por tela (dato principal).
- `scrapKg`: kg de merma por tela.
- `prendasCortadas`: unidades cortadas por tela.
- `scrapPorcentaje`: `(scrapKg / telaUsadaKg) * 100`.
- `kgPorPrenda`: `telaUsadaKg / prendasCortadas`.

## 4) Funcionamiento tecnico (codigo)

### 4.1 Componente principal
Archivo:
- `frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.ts`

Responsabilidades:
- Cargar proyectos desde `ProyectosService.obtenerProyectosConCache()`.
- Parsear observaciones `[CORTE_REAL]` y `[CORTE_PLAN]`.
- Transformar observaciones en registros por tela (token `tl`).
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
   - Se genera un registro por cada tela incluida en `tl`.
   - Se calculan metricas por tela y por corte.
3. Se consolidan todos los cortes en una coleccion global.
4. Se aplican filtros de usuario.
5. Se agregan resultados por material.
6. Se renderizan KPIs + tablas.

## 6) Criterios de calidad del dato
El reporte depende de que los registros de corte real se carguen completos por tela. Para que sea confiable:
- Registrar siempre `fechaCorte`, `telaUsadaKg`, `scrapKg`, `prendasCortadas` en cada tela.
- Mantener consistencia en el código/partida de la tela (se autocompleta desde el proyecto).
- Evitar valores en cero si hubo producción real (distorsiona KPIs).

## 7) Limitaciones actuales
- Fuente principal: observaciones parseadas por texto (`[CORTE_REAL]`), no entidad dedicada.
- Sin integración automática con Audaces (carga manual de datos).
- No se calcula costo por kg ni desviaciones teóricas por ahora.

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
