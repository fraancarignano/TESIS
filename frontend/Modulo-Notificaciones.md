# Modulo de Notificaciones

## Resumen
Se implemento el modulo de **Notificaciones** como bandeja operativa para dos flujos principales:

- alertas de stock
- solicitudes de material por proyecto

El modulo cuenta con frontend y backend integrados, badge de pendientes en sidebar y acciones para marcar items como leidos o atendidos.

---

## Cambios destacados (actualizacion grande)
Se agrego soporte unificado de **avisos operativos** y **solicitudes internas de material**:

1. Backend:
   - Endpoints para crear y listar alertas de stock
   - Conteo de alertas no leidas
   - Marcado de alertas como leidas por usuario
   - Endpoints para crear, listar, contar y atender solicitudes de material

2. Base de datos:
   - Uso de `HistorialUsuario` para persistir alertas de stock y lecturas
   - Nueva tabla `SolicitudMaterialProyecto` para pedidos internos de material
   - Script de creacion para entornos que no tuvieran esa tabla

3. Frontend:
   - Pantalla `/notificaciones` con dos tabs:
     - `Solicitudes de Material`
     - `Alertas de Stock`
   - Badge de pendientes en el sidebar
   - Navegacion directa a `inventario/asignar-proyecto` desde una solicitud pendiente

---

## Estado actual
Con backend y frontend levantados, el modulo deberia estar operativo.

Requisitos para probar:
1. Backend levantado (API en `https://localhost:7163`)
2. Frontend levantado (Angular)
3. Usuario autenticado con permisos de `Notificaciones`
4. Tabla `SolicitudMaterialProyecto` creada si la base todavia no la tenia

---

## Cambios de Base de Datos
El modulo utiliza dos fuentes de datos distintas:

### 1. Historial de alertas de stock
Tabla usada: `HistorialUsuario`

Campos relevantes:

- `IdHistorial` (PK)
- `IdUsuario`
- `Accion`
- `FechaAccion`
- `Modulo`

Uso funcional:

- `Modulo = "NotificacionesStock"`
  - guarda la notificacion original
- `Modulo = "NotificacionesStockLeidas"`
  - guarda la marca de lectura por usuario

Formato de `Accion` para alertas:

- `STOCK|Tipo|I:ID|A:stockActual|M:stockMinimo|MSG:...`

Formato de `Accion` para lecturas:

- `READ|N:idHistorial`

### 2. Solicitudes de material
Tabla usada: `SolicitudMaterialProyecto`

Campos principales:

- `id_Solicitud` (PK)
- `id_Proyecto`
- `nombre_Proyecto`
- `id_TipoInsumo` (nullable)
- `nombre_TipoInsumo` (nullable)
- `color_Solicitado` (nullable)
- `cantidad_Estimada` (nullable)
- `unidad_Medida` (nullable)
- `mensaje` (nullable)
- `estado`
- `id_Usuario_Emisor`
- `fecha_Solicitud`
- `fecha_Atendida` (nullable)
- `id_Usuario_Atiende` (nullable)

### Script para entornos existentes
Archivo: `Backend/TESIS_OG/Scripts/crear_solicitud_material_proyecto.sql`

Que hace:
1. Crea la tabla `SolicitudMaterialProyecto` si no existe
2. Define PK y relaciones necesarias
3. Crea indices por proyecto y estado

---

## Backend (API .NET)

### Endpoints
Controlador: `Backend/TESIS_OG/Controllers/NotificacionesController.cs`

#### Alertas de stock
- `POST /api/Notificaciones/stock`
  - Crea una alerta de stock
- `GET /api/Notificaciones/stock`
  - Lista alertas de stock
- `GET /api/Notificaciones/stock/count`
  - Cuenta alertas no leidas de los ultimos 7 dias
- `POST /api/Notificaciones/stock/{idHistorial}/leer`
  - Marca una alerta como leida para el usuario actual

#### Solicitudes de material
- `POST /api/Notificaciones/solicitudes-material`
  - Crea una o varias solicitudes de material para un proyecto
- `GET /api/Notificaciones/solicitudes-material`
  - Lista solicitudes, con filtro opcional por estado
- `GET /api/Notificaciones/solicitudes-material/count`
  - Cuenta solicitudes pendientes
- `POST /api/Notificaciones/solicitudes-material/{id}/atender`
  - Marca una solicitud como atendida

### Reglas backend implementadas

#### Alertas de stock
- El usuario debe estar autenticado
- El insumo indicado debe existir
- `Tipo` se normaliza a:
  - `Sobrante`
  - `Faltante`
- Si no se informa `StockActual` o `StockMinimo`, se usan los valores del insumo
- La alerta se guarda como evento en `HistorialUsuario`
- La accion se recorta a 100 caracteres si excede ese largo
- El marcado como leida es por usuario autenticado
- Si la lectura ya existia, no duplica el registro
- El conteo de alertas considera solo los ultimos 7 dias

#### Solicitudes de material
- El usuario debe estar autenticado
- Debe incluir al menos un material
- Cada item genera un registro individual en `SolicitudMaterialProyecto`
- Toda solicitud nueva inicia en estado `Pendiente`
- `atender` cambia el estado a `Atendida`
- `atender` guarda fecha y usuario que atendio
- El listado permite filtrar por `estado`

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Notificaciones/`

- `NotificacionStockDTOs.cs`

Incluye:

- `CrearNotificacionStockDTO`
- `NotificacionStockItemDTO`
- `CrearSolicitudMaterialDTO`
- `SolicitudMaterialItemDTO`
- `SolicitudMaterialResponseDTO`

### Modelos y mapeo EF
- `Backend/TESIS_OG/Models/HistorialUsuario.cs`
- `Backend/TESIS_OG/Models/SolicitudMaterialProyecto.cs`
- `Backend/TESIS_OG/Data/TamarindoDbContext.cs`

---

## Frontend (Angular)

### Ruta
Definida en `frontend/src/app/app.routes.ts`:

- `'/notificaciones'`
  - carga `NotificacionesComponent`
  - requiere permiso `Notificaciones / Ver`

### Archivos principales

Pantalla:

- `frontend/src/app/modules/notificaciones/components/notificaciones.component.ts`

Servicio:

- `frontend/src/app/core/services/notificaciones.service.ts`

Integracion en layout:

- `frontend/src/app/layouts/private-layout/private-layout.component.ts`
- `frontend/src/app/layouts/private-layout/private-layout.component.html`

### Comportamiento en UI
- Pantalla con 2 tabs:
  - `Solicitudes de Material`
  - `Alertas de Stock`
- En `Solicitudes de Material`:
  - filtro por `Todas`, `Pendientes`, `Atendidas`
  - boton para recargar
  - boton `Ir a transferir material`
  - boton `Marcar como atendida`
- En `Alertas de Stock`:
  - lista de alertas
  - badge visual por tipo
  - boton `Marcar como leida`
- El sidebar muestra badge numerico con solicitudes pendientes
- El conteo del sidebar:
  - se actualiza al entrar
  - se refresca cada 60 segundos
  - se actualiza tambien al emitir cambios desde el servicio

---

## Flujo funcional actual

### Flujo 1: Alertas de stock
1. Un usuario crea una alerta de stock
2. El backend la registra en `HistorialUsuario`
3. Los usuarios con permiso `Notificaciones / Ver` la ven en la bandeja
4. Cada usuario puede marcarla como leida
5. La lectura queda registrada de forma individual

### Flujo 2: Solicitudes de material
1. Un usuario crea una solicitud de material para un proyecto
2. El backend genera uno o varios registros `Pendiente`
3. La bandeja de notificaciones los muestra en la tab de solicitudes
4. El usuario puede:
   - ir a `inventario/asignar-proyecto`
   - o marcar la solicitud como atendida
5. El sidebar refleja la cantidad de solicitudes pendientes

---

## Contrato JSON esperado

### Crear alerta de stock (request)
```json
{
  "idInsumo": 14,
  "tipo": "Faltante",
  "stockActual": 8,
  "stockMinimo": 20,
  "mensaje": "El insumo quedo por debajo del minimo operativo"
}
```

### Respuesta de alerta de stock (listado)
```json
{
  "idHistorial": 221,
  "idUsuarioEmisor": 5,
  "usuarioEmisor": "Juan Perez",
  "fecha": "2026-04-13",
  "idInsumo": 14,
  "tipo": "Faltante",
  "mensaje": "El insumo quedo por debajo del minimo operativo",
  "leida": false
}
```

### Crear solicitudes de material (request)
```json
{
  "idProyecto": 18,
  "nombreProyecto": "Coleccion Otono 2026",
  "materiales": [
    {
      "idTipoInsumo": 3,
      "nombreTipoInsumo": "Gabardina",
      "colorSolicitado": "NEGRO",
      "cantidadEstimada": 120,
      "unidadMedida": "Metros",
      "mensaje": "Necesario para avanzar con corte"
    },
    {
      "idTipoInsumo": 5,
      "nombreTipoInsumo": "Cierre",
      "colorSolicitado": "PLATA",
      "cantidadEstimada": 240,
      "unidadMedida": "Unidades",
      "mensaje": "Faltante detectado en preparacion"
    }
  ]
}
```

### Respuesta de solicitud de material (listado)
```json
{
  "idSolicitud": 33,
  "idProyecto": 18,
  "nombreProyecto": "Coleccion Otono 2026",
  "nombreTipoInsumo": "Gabardina",
  "colorSolicitado": "NEGRO",
  "cantidadEstimada": 120,
  "unidadMedida": "Metros",
  "mensaje": "Necesario para avanzar con corte",
  "estado": "Pendiente",
  "usuarioEmisor": "Juan Perez",
  "fechaSolicitud": "2026-04-13",
  "fechaAtendida": null
}
```

### Conteo de pendientes / no leidas
```json
{
  "total": 4
}
```

---

## Verificacion tecnica realizada
Para esta documentacion se relevaron:

- controlador y DTOs backend de notificaciones
- modelos usados en persistencia
- servicio frontend y pantalla del modulo
- integracion del badge en el layout privado

No ejecute build ni pruebas automatizadas en esta pasada, porque el pedido fue de documentacion.

---

## Checklist rapido de QA
1. Crear una alerta de stock con insumo valido
2. Verificar que aparezca en la tab `Alertas de Stock`
3. Marcar la alerta como leida
4. Confirmar que no vuelva a contar como no leida para ese usuario
5. Crear solicitud de material con un item
6. Crear solicitud de material con multiples items
7. Verificar que cada item genere una solicitud independiente
8. Verificar filtro `Pendiente`
9. Verificar filtro `Atendida`
10. Marcar solicitud como atendida
11. Verificar `fechaAtendida`
12. Usar `Ir a transferir material` y validar navegacion a `/inventario/asignar-proyecto`
13. Verificar badge en sidebar con solicitudes pendientes
14. Verificar refresco automatico del badge
15. Intentar crear alerta con insumo inexistente (debe rechazar backend)
16. Intentar crear solicitud sin materiales (debe rechazar backend)

---

## Notas
- El badge del sidebar hoy refleja `solicitudes pendientes`, no `alertas de stock no leidas`.
- La pantalla de notificaciones esta implementada como un solo componente standalone con template inline.
- El servicio `NotificacionesService` vive en `core`, porque alimenta tanto la pantalla del modulo como el layout principal.
