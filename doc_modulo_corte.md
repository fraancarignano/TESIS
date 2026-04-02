# Modulo de Corte

## 1) Alcance y objetivo
Este modulo cubre la planificacion de corte (Paso 1) y la ejecucion real de corte (Paso 3) dentro del detalle de cada proyecto. No reemplaza Audaces; registra informacion operativa y compara teorico vs real para control de produccion.

## 2) Ubicacion en la app
- UI principal: `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component.html`
- Logica: `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component.ts`
- Estilos: `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component.css`
- Area de produccion: `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/proyectos/constants/areas.constants.ts`

## 3) Paso 1 - Requerimiento de corte (solo lectura)
Seccion visible cuando el area seleccionada es `avanceCorte`.

### Datos mostrados
- Cliente, prenda, articulo
- Pedido total
- Colores
- Tela asignada y articulo de tela
- Taller destino
- Distribucion por talles

### Persistencia
Se guarda como observacion del proyecto con el marcador `[CORTE_PLAN]` y un formato clave=valor.

Campos principales codificados:
- `est` estado planificacion
- `ver` version planificacion
- `fec` fecha necesidad de corte
- `ped` pedido total
- `cli` cliente
- `prd` prenda
- `art` articulo
- `col` colores
- `tel` tela asignada
- `atl` articulo de tela
- `tal` taller destino
- `obs` observaciones plan

### Codigo relevante
- Construccion del plan: `construirResumenPlanCorte()`
- Extraccion del plan: `extraerPlanCorteDeObservacion()`

## 4) Paso 3 - Parte de corte real (manual)
Seccion visible cuando el area seleccionada es `avanceCorte`.

### Campos principales
- corteNumero, fechaCorte, partidaTela
- responsable
- telaUsadaKg, pesoRealKg, pesoTizaKg
- capas, prendasCortadas
- restoKg, fallaKg, utilizableKg
- consumoTeoricoKg, capasTeoricas
- referenciaExterna, observacionExterna
- observacionesCorte

### Validaciones
En `puedeGuardarCorteReal`:
- corteNumero, fechaCorte, partidaTela, responsable obligatorios
- telaUsadaKg, pesoRealKg, capas, prendasCortadas > 0

### Calculos automaticos
- `sumaMermaCorteReal`: resto + falla + utilizable
- `balanceTelaCorteReal`: tela usada - merma total
- `kgPorPrendaCorteReal`: tela usada / prendas
- `desvioConsumoCorteReal`: tela usada - consumo teorico

### Persistencia
Se guarda como observacion `[CORTE_REAL]` con formato clave=valor.

Campos codificados:
- `cn` corte numero
- `fc` fecha corte
- `pt` partida
- `tu` tela usada
- `pr` peso real
- `pz` peso tiza
- `ca` capas
- `re` resto
- `fa` falla
- `ut` utilizable
- `pc` prendas cortadas
- `rs` responsable
- `es` estado ejecucion
- `ct` consumo teorico
- `cpt` capas teoricas
- `rf` referencia externa
- `oe` observacion externa
- `ob` observaciones corte

### Codigo relevante
- Construccion del parte real: `construirResumenCorteReal()`
- Extraccion del parte real: `extraerCorteRealDeObservacion()`
- Inicializacion: `inicializarFormularioCorteReal()`

## 5) Relacion con scrap
El modulo calcula scrap real con los campos de corte:
- `scrapKg = restoKg + fallaKg`
- `% scrap = scrapKg / telaUsadaKg * 100`

En el servicio de proyectos existe un endpoint para registrar scrap:
- `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/proyectos/services/proyecto.service.ts`
- metodo `registrarScrap(id, scrap)`

Actualmente el formulario de corte real no llama a este endpoint; el reporte calcula scrap a partir de observaciones.

## 6) Reporte de scrap por material (relacion directa)
El reporte consume los datos del modulo de corte (observaciones `[CORTE_REAL]` y `[CORTE_PLAN]`).

Archivos:
- `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.ts`
- `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.html`
- `Tamarindo-ESCMB-Frontend/frontend/src/app/modules/reportes/Proyectos/reporte-scrap-material.component.css`

Ruta:
- `/reportes/scrap-material`

## 7) Flujo de datos resumido
1. Operario carga parte de corte real.
2. Se guarda observacion `[CORTE_REAL]`.
3. Reporte parsea observaciones y calcula indicadores.

## 8) Limitaciones actuales
- Persistencia en observaciones (texto), no entidad dedicada.
- Sin integracion automatica con Audaces.
- No se registra costo por kg ni motivo/destino de scrap.

## 9) Mejora recomendada
- Crear entidad `ParteCorte` en backend y dejar observaciones solo como historial.
- Agregar `idInsumo`, `motivoScrap`, `destinoScrap`, `costoKg`, `turno/maquina`.
- Exponer endpoint de reporte con paginado server-side.
