# Modulo de Orden de Compra

## Resumen
Se implemento el modulo de **Orden de Compra** dentro del apartado de **Inventario**, con frontend y backend para gestionar el ciclo completo de compras de insumos.

- Flujo principal: listar, crear, ver detalle, habilitar control, controlar recepcion, verificar, anular, eliminar
- Entidad principal: `Orden_Compra`
- Relacion principal: proveedor + detalle de insumos
- Soporta asociacion opcional a `Proyecto`
- Soporta carga de insumos existentes y alta de insumos nuevos desde la misma orden

---

## Cambios destacados (actualizacion grande)
Se agrego soporte de **control de recepcion** sobre ordenes de compra:

1. Base de datos:
   - Nuevas columnas en `Orden_Compra`:
     - `FechaHabilitacionControl`
     - `FechaRecepcionControl`
     - `IdUsuarioControl`
     - `ObservacionControl`
   - Script para entornos existentes:
     - `Backend/TESIS_OG/script_control_recepcion.sql`

2. Backend:
   - Nuevos endpoints para:
     - habilitar control
     - listar ordenes pendientes de control
     - confirmar control fisico
     - recalcular / reabrir control
     - verificar orden recibida
     - anular orden
   - La API calcula `CantidadRecibida`, `Diferencia` y `EstadoRecepcion` por cada detalle

3. Frontend:
   - Vista principal de ordenes con badges por estado
   - Modal de alta con carga de insumos existentes o nuevos
   - Pantalla separada de control fisico en `inventario/control-recepcion`
   - Detalle de orden con resumen de recepcion por insumo

---

## Estado actual
Con la base de datos actualizada y el backend/frontend levantados, el modulo deberia quedar operativo.

Requisitos para probar:
1. Backend levantado (API en `https://localhost:7163`)
2. Frontend levantado (Angular)
3. Tabla `Orden_Compra` existente
4. Script `Backend/TESIS_OG/script_control_recepcion.sql` aplicado si la BD no tenia aun las columnas de control

---

## Cambios de Base de Datos
La tabla `Orden_Compra` queda considerada con estos campos principales:

- `id_OrdenCompra` (PK)
- `nro_Orden` / `NroOrden`
- `id_Proveedor` (FK a `Proveedor`)
- `id_Proyecto` (nullable)
- `descripcion` (nullable)
- `fecha_Solicitud`
- `fecha_EntregaEstimada` (nullable)
- `estado`
- `total_Orden`
- `FechaHabilitacionControl` (nullable)
- `FechaRecepcionControl` (nullable)
- `IdUsuarioControl` (nullable)
- `ObservacionControl` (nullable)

Detalle asociado en `Detalle_OrdenCompra`:

- `id_Detalle` (PK)
- `id_OrdenCompra` (FK)
- `id_Insumo` (FK)
- `cantidad`
- `precio_Unitario`
- `subtotal`

### Script para entornos existentes
Archivo: `Backend/TESIS_OG/script_control_recepcion.sql`

Que hace:
1. Verifica si existe `FechaHabilitacionControl`
2. Si no existe, agrega las 4 columnas nuevas de control de recepcion
3. Evita reaplicar cambios si la migracion ya corrio

---

## Backend (API .NET)

### Endpoints
Controlador: `Backend/TESIS_OG/Controllers/OrdenCompraController.cs`

- `GET /api/OrdenCompra`
  - Lista todas las ordenes
- `GET /api/OrdenCompra/{id}`
  - Devuelve una orden por id
- `POST /api/OrdenCompra`
  - Crea una nueva orden
- `PUT /api/OrdenCompra/{id}`
  - Actualiza una orden existente
- `DELETE /api/OrdenCompra/{id}`
  - Elimina una orden solo si esta `Anulada`
- `POST /api/OrdenCompra/{id}/habilitar-control`
  - Pasa la orden a `PendienteControl`
- `GET /api/OrdenCompra/pendiente-control`
  - Lista ordenes listas para control fisico
- `POST /api/OrdenCompra/{id}/control`
  - Registra el control de recepcion y actualiza stock
- `POST /api/OrdenCompra/{id}/recalcular`
  - Reabre una orden `Recibida` y la vuelve a `PendienteControl`
- `POST /api/OrdenCompra/{id}/verificar`
  - Pasa una orden `Recibida` a `Verificada`
- `POST /api/OrdenCompra/{id}/anular`
  - Anula una orden si esta en estado valido
- `POST /api/OrdenCompra/{id}/receive`
  - Endpoint legacy de recepcion directa

### Reglas backend implementadas
- El proveedor debe existir
- Cada detalle debe tener `cantidad > 0`
- Cada detalle debe tener `precioUnitario > 0`
- El `subtotal` se recalcula por detalle
- El `totalOrden` se ajusta automaticamente segun la suma de subtotales
- El `nroOrden` se genera automaticamente con formato `OC-YYYYMMDD-XXXX`
- Al crear, la orden inicia en estado `Pendiente`
- Si un detalle viene con `idInsumo = 0`, el backend permite:
  - reutilizar un insumo existente compatible
  - o crear un insumo nuevo con stock inicial `0`
- `habilitar-control` solo aplica a ordenes `Pendiente` o `Aprobada`
- `control` solo aplica a ordenes `PendienteControl`
- `recalcular` solo aplica a ordenes `Recibida`
- `verificar` solo aplica a ordenes `Recibida`
- `anular` no aplica a ordenes `Recibida`, `PendienteControl` ni `Anulada`
- `delete` solo aplica a ordenes `Anulada`
- El control de recepcion genera movimientos de inventario tipo `Entrada`
- Si un insumo creado desde OC estaba `A designar` o `Agotado`, al recibirlo pasa a `Disponible`

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/OrdenCompra/`

- `OrdenCompraCreateDTO.cs`
- `OrdenCompraEditDTO.cs`
- `OrdenCompraIndexDTO.cs`
- `OrdenCompraReceiveDTO.cs`
- `DetalleOrdenCompraDTO.cs`
- `ControlRecepcionDTO.cs`
- `HabilitarControlDTO.cs`

### Modelo y mapeo EF
- Modelo orden: `Backend/TESIS_OG/Models/OrdenCompra.cs`
- Modelo detalle: `Backend/TESIS_OG/Models/DetalleOrdenCompra.cs`
- DbContext: `Backend/TESIS_OG/Data/TamarindoDbContext.cs`

Se mapearon campos de cabecera, detalle y control de recepcion.

---

## Frontend (Angular)

### Rutas
Definidas en `frontend/src/app/app.routes.ts`:

- `'/ordenes'`
  - carga `OrdenCompraComponent`
- `'/inventario/control-recepcion'`
  - carga `ControlRecepcionComponent`

Permisos observados:

- `OrdenesCompra / Recepcionar`
  - acceso a `/ordenes`
- `OrdenesCompra / Crear`
  - boton de nueva orden
- `Inventario / Recepcionar`
  - acceso a la pantalla operativa de control fisico

### Modulo Orden de Compra (archivos)
Ubicacion: `frontend/src/app/modules/orden-compra/`

- `components/orden-compra.component.ts`
- `components/orden-compra.component.html`
- `components/orden-compra.component.css`
- `components/orden-compra-form/orden-compra-form.component.ts`
- `components/orden-compra-form/orden-compra-form.component.html`
- `components/orden-compra-form/orden-compra-form.component.css`
- `components/orden-compra-receive/orden-compra-receive.component.ts`
- `components/orden-compra-receive/orden-compra-receive.component.html`
- `components/orden-compra-receive/orden-compra-receive.component.css`
- `models/orden-compra.model.ts`
- `models/orden-compra-receive.model.ts`
- `services/orden-compra.service.ts`
- `orden-compra.routes.ts`

Pantalla complementaria de control:

- `frontend/src/app/modules/inventario/components/control-recepcion/control-recepcion.component.ts`
- `frontend/src/app/modules/inventario/components/control-recepcion/control-recepcion.component.html`
- `frontend/src/app/modules/inventario/components/control-recepcion/control-recepcion.component.css`

### Comportamiento en UI
- Listado con busqueda por numero, proveedor o estado
- Alta de orden con proveedor, proyecto opcional, descripcion y fechas
- Agregado de insumos existentes
- Alta de insumos nuevos desde la misma orden
- Modal de detalle con resumen de recepcion
- Acciones por estado:
  - habilitar recepcion
  - anular
  - reabrir control
  - verificar
  - eliminar
- Vista de control fisico separada para operario / deposito
- Chips visuales de recepcion:
  - satisfecho
  - faltante
  - sobrante

---

## Flujo funcional actual
1. Admin crea la orden en estado `Pendiente`
2. Admin habilita la recepcion
3. La orden pasa a `PendienteControl`
4. Operario / deposito ingresa a `inventario/control-recepcion`
5. Registra cantidades recibidas por insumo
6. Se actualiza stock y se generan movimientos de inventario
7. La orden pasa a `Recibida`
8. Admin puede:
   - verificarla (`Verificada`)
   - o recalcularla para reabrir el control

Nota:
- Sigue existiendo un flujo legacy con `POST /receive`, pero el flujo actual visible en UI se apoya principalmente en `habilitar-control` + `control`.

---

## Contrato JSON esperado

### Crear orden de compra (request)
```json
{
  "idProveedor": 3,
  "idProyecto": 12,
  "descripcion": "Compra de telas para temporada invierno",
  "fechaSolicitud": "2026-04-13",
  "fechaEntregaEstimada": "2026-04-20",
  "totalOrden": 158000.0,
  "detalles": [
    {
      "idInsumo": 8,
      "cantidad": 120,
      "precioUnitario": 950,
      "subtotal": 114000
    },
    {
      "idInsumo": 0,
      "cantidad": 40,
      "precioUnitario": 1100,
      "subtotal": 44000,
      "nuevoNombreInsumo": "Tela polar premium",
      "nuevoIdTipoInsumo": 2,
      "nuevoColor": "NEGRO",
      "nuevoUnidadMedida": "Metros"
    }
  ]
}
```

### Habilitar control (request)
```json
{
  "idUsuarioAdmin": 5
}
```

### Confirmar control de recepcion (request)
```json
{
  "idOrdenCompra": 25,
  "idUsuarioControl": 9,
  "fechaControl": "2026-04-15",
  "observacion": "Recepcion realizada sin novedades",
  "detalles": [
    {
      "idInsumo": 8,
      "cantidadRecibida": 120
    },
    {
      "idInsumo": 41,
      "cantidadRecibida": 38,
      "observacionDetalle": "Llegaron 2 metros menos"
    }
  ]
}
```

### Respuesta de orden (index/detail)
```json
{
  "idOrdenCompra": 25,
  "nroOrden": "OC-20260413-0001",
  "idProveedor": 3,
  "nombreProveedor": "Textiles del Centro SA",
  "idProyecto": 12,
  "nombreProyecto": "Coleccion Invierno 2026",
  "descripcion": "Compra de telas para temporada invierno",
  "fechaSolicitud": "2026-04-13",
  "fechaEntregaEstimada": "2026-04-20",
  "estado": "Recibida",
  "totalOrden": 158000.0,
  "fechaHabilitacionControl": "2026-04-14",
  "fechaRecepcionControl": "2026-04-15",
  "observacionControl": "Recepcion realizada sin novedades",
  "detalles": [
    {
      "idDetalle": 70,
      "idInsumo": 8,
      "nombreInsumo": "Gabardina",
      "colorInsumo": "AZUL",
      "cantidad": 120,
      "cantidadRecibida": 120,
      "diferencia": 0,
      "estadoRecepcion": "Satisfecho",
      "precioUnitario": 950,
      "subtotal": 114000
    },
    {
      "idDetalle": 71,
      "idInsumo": 41,
      "nombreInsumo": "Tela polar premium",
      "colorInsumo": "NEGRO",
      "cantidad": 40,
      "cantidadRecibida": 38,
      "diferencia": -2,
      "estadoRecepcion": "Faltante",
      "precioUnitario": 1100,
      "subtotal": 44000
    }
  ]
}
```

---

## Verificacion tecnica realizada
Para esta documentacion se relevaron los archivos de frontend, backend y DTOs del modulo.

No ejecute build ni pruebas automatizadas en esta pasada, porque el pedido fue de documentacion y no de cambios funcionales.

---

## Checklist rapido de QA
1. Crear orden nueva con proveedor valido
2. Crear orden asociada a proyecto
3. Crear orden agregando un insumo existente
4. Crear orden agregando un insumo nuevo
5. Verificar generacion automatica de `nroOrden`
6. Habilitar control de recepcion
7. Verificar que la orden aparezca en `/inventario/control-recepcion`
8. Confirmar control con cantidades completas
9. Confirmar control con faltantes o sobrantes
10. Validar actualizacion de stock y movimientos de inventario
11. Reabrir control de una orden recibida
12. Verificar una orden recibida
13. Anular una orden pendiente
14. Eliminar una orden anulada
15. Intentar eliminar una orden no anulada (debe bloquear)

---

## Notas
- El componente `orden-compra-receive` sigue presente y consume el endpoint legacy `/receive`.
- La UI principal actual no expone ese flujo legacy como accion visible; el flujo operativo vigente usa la pantalla `control-recepcion`.
- Sigue pendiente en frontend la accion de rechazo explicita: el componente muestra un `TODO` indicando que no existe endpoint backend para rechazo.
