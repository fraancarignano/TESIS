# Modulo de Inventario

## Resumen
El modulo de **Inventario** es el sistema de gestion de stock mas complejo del sistema. Gestiona insumos (telas, hilos, accesorios), ubicaciones fisicas de almacenamiento, movimientos de stock, transferencias entre ubicaciones, asignacion a proyectos, control de recepcion de ordenes de compra y auditoria completa de todos los cambios.

- Gestion de insumos con stock global y trazabilidad granular por ubicacion/proyecto
- Ubicaciones con estructura Rack/Division/Espacio
- Transferencias: OC → Ubicacion, Ubicacion → Ubicacion, Ubicacion → Proyecto
- Control de recepcion de ordenes de compra
- Estados de insumo: Disponible, En uso, A designar, Agotado
- Filtros avanzados y busqueda
- Auditoria completa de movimientos
- Indicadores de stock bajo y alertas

---

## Pantallas principales

### 1) Lista de Inventario
Archivo: `components/inventario.component.*`

**Para que sirve**
- Vista principal del modulo. Muestra todos los insumos con stock en una tabla con busqueda y filtros avanzados.
- Permite crear, editar, ver detalle, cambiar estado y eliminar insumos.
- Muestra indicadores visuales de stock bajo (rojo si stock < stock minimo).
- Envia notificaciones de stock faltante o sobrante.

**Acciones**
1. Buscar por nombre de insumo.
2. Aplicar filtros avanzados (estado, tipo, unidad, stock bajo, fechas).
3. Hacer click en una fila para ver el detalle completo con trazabilidad.
4. Boton editar por fila para abrir el formulario de edicion.
5. Dropdown de estado por fila para cambiar estado con confirmacion.
6. Boton eliminar por fila con confirmacion.
7. Boton de notificacion de stock (faltante/sobrante) para enviar alerta.

**Parte tecnica**
- Carga: `cargarInsumos()` → `InsumosService.getInsumosConStock()`.
- Filtrado reactivo: getter `insumosFiltrados` combina busqueda por texto + `FiltrosInsumo`.
- Cambio de estado: dropdown con confirmacion antes de aplicar.
- Notificaciones: modal para enviar alerta de stock via `NotificacionesService`.
- Indicador de stock bajo: clase CSS `stock-bajo` si `stockActual < stockMinimo`.
- Permisos: `HasPermissionDirective` controla visibilidad de acciones.

---

### 2) Filtros Avanzados
Archivo: `components/insumo-filtros/insumo-filtros.component.*`

**Para que sirve**
- Panel de filtros que emite un objeto `FiltrosInsumo` al componente padre cada vez que cambia alguna seleccion.

**Filtros disponibles**
| Filtro | Tipo | Opciones |
|---|---|---|
| Estado | Chips multi-seleccion | Disponible, En uso, Agotado, A designar |
| Tipo de insumo | Select | Cargado desde API |
| Unidad de medida | Select | mts, kg, unidades, etc. |
| Stock bajo | Checkbox | Solo insumos con stock < stock minimo |
| Fecha desde | Date | - |
| Fecha hasta | Date | - |

**Parte tecnica**
- Emite `FiltrosInsumo` via `@Output() filtrosChange`.
- `contadorFiltrosActivos` calcula cuantos filtros estan activos para mostrar badge.
- Chips de estado con toggle visual.

---

### 3) Formulario de Insumo (crear / editar)
Archivo: `insumo-form/insumo-form.component.*`

**Para que sirve**
- Formulario reactivo para crear un insumo nuevo o editar uno existente.
- Permite importar desde catalogo o crear desde cero.

**Campos del formulario**
- Nombre del insumo — obligatorio
- Tipo de insumo — obligatorio (select)
- Unidad de medida — obligatorio (select: mts, kg, unidades, etc.)
- Stock actual — obligatorio, min 0
- Stock minimo — opcional
- Proveedor — opcional (select)
- Ubicacion — opcional (select)
- Estado — obligatorio (default: Disponible)
- Color — opcional (para telas)
- Tipo de tela — opcional (para telas)

**Parte tecnica**
- Formulario reactivo con `FormBuilder`.
- Autocomplete de catalogo: busca insumos existentes y pre-carga datos.
- Validaciones: nombre obligatorio, stock >= 0, tipo y unidad obligatorios.
- Guardado: `InsumosService.agregarInsumo()` o `actualizarInsumo()` segun modo.
- Cancelar con cambios pendientes muestra confirmacion via `AlertasService`.

---

### 4) Modal de Detalle
Archivo: `insumo-detalle-modal/insumo-detalle-modal.component.ts`

**Para que sirve**
- Modal con toda la informacion del insumo organizada en secciones.
- Muestra tabla de trazabilidad de stock (detalleStock) con ubicacion, proyecto, orden de compra y cantidad.
- Permite editar cantidades inline y devolver stock al general.

**Secciones**
- Informacion general (nombre, tipo, unidad, stock, proveedor, ubicacion, estado)
- Indicador de stock bajo (badge rojo si stock < stock minimo)
- Tabla de detalle de stock (ubicacion, proyecto, OC, cantidad, fecha)
- Acciones por fila: editar cantidad, devolver al stock general
- Navegacion a detalle de ubicacion o proyecto

**Parte tecnica**
- Componente standalone con template y estilos inline.
- Recibe el insumo completo via `@Input() insumo`.
- Edicion de cantidad: `PATCH /api/insumo/stock/{idInsumoStock}` con validacion contra stock general.
- Devolucion: `DELETE /api/insumo/stock/{idInsumoStock}/devolver` solo si esta asignado a proyecto.
- Navegacion: `router.navigate(['/ubicaciones', id])` o `['/proyectos', id]`.

---

### 5) Catalogo de Insumos
Archivo: `components/insumo-catalog/insumo-catalog.component.*`

**Para que sirve**
- Listado de todos los insumos del sistema (con y sin stock).
- Permite crear nuevos insumos y eliminar del catalogo.

**Acciones**
1. Buscar por nombre.
2. Crear nuevo insumo.
3. Eliminar insumo del catalogo (solo si no tiene stock ni asignaciones).

**Parte tecnica**
- Carga: `InsumosService.getInsumos()` (sin filtro de stock).
- Eliminacion: valida que no tenga stock ni proyectos asignados.

---

### 6) Control de Recepcion
Archivo: `components/control-recepcion/control-recepcion.component.*`

**Para que sirve**
- Pantalla para ingresar las cantidades recibidas de una orden de compra.
- Actualiza el stock del sistema y cambia el estado de la OC a "Ingresada".

**Flujo**
1. Carga ordenes de compra en estado "Verificada".
2. Selecciona una OC.
3. Muestra tabla con insumos de la OC y cantidades esperadas.
4. Usuario ingresa cantidades recibidas (pre-cargadas con faltante o total).
5. Usuario ingresa observaciones por insumo (opcional).
6. Confirma recepcion.
7. Sistema actualiza stock global e InsumoStock.
8. OC pasa a estado "Ingresada".
9. Movimiento registrado en auditoria.

**Parte tecnica**
- Carga: `OrdenCompraService.obtenerOrdenesVerificadas()`.
- Pre-carga: si ya se recibio algo, muestra faltante; sino muestra total.
- Confirmacion: `OrdenCompraService.confirmarRecepcion(idOC, items)`.
- Validacion: cantidad recibida <= cantidad esperada.

---

### 7) Transferencias de Ubicacion
Archivo: `components/ubicacion-transfer/ubicacion-transfer.component.*`

**Para que sirve**
- Pantalla con 3 tabs para gestionar transferencias de stock.

**Tab 1: OC → Ubicacion (Ingreso de stock general)**
- Selecciona OC en estado "Ingresada".
- Selecciona ubicacion destino.
- Opcionalmente asigna a un proyecto.
- Confirma transferencia.
- Sistema actualiza InsumoStock con ubicacion y proyecto (si aplica).

**Tab 2: Ubicacion → Ubicacion (Transferencia entre almacenes)**
- Selecciona ubicacion origen.
- Selecciona insumos a transferir con cantidades.
- Selecciona ubicacion destino.
- Confirma transferencia.
- Sistema actualiza InsumoStock preservando asignaciones de proyecto.

**Tab 3: Asignar a Proyecto**
- Replica funcionalidad de `proyecto-transfer.component`.
- Carga materiales necesarios del proyecto.
- Valida disponibilidad de stock (con coincidencia de color).
- Asigna materiales disponibles.
- Genera OC para materiales faltantes.

**Parte tecnica**
- Transferencias: `UbicacionService.transferirInsumos(payload)`.
- Validacion: cantidad a transferir <= cantidad disponible en origen.
- Movimiento registrado en auditoria.

---

### 8) Asignacion a Proyectos
Archivo: `components/proyecto-transfer/proyecto-transfer.component.*`

**Para que sirve**
- Pantalla para asignar materiales a un proyecto especifico.
- Valida disponibilidad de stock con coincidencia exacta de color.
- Genera ordenes de compra para materiales faltantes.
- Verifica si todos los materiales estan listos para iniciar el proyecto.

**Flujo**
1. Selecciona proyecto (puede venir pre-seleccionado via query params).
2. Sistema carga materiales necesarios del proyecto.
3. Para cada material:
   - Busca insumos disponibles con mismo tipo y color.
   - Muestra stock disponible.
   - Usuario asigna cantidad (max = disponible).
4. Para materiales faltantes:
   - Usuario selecciona proveedor.
   - Usuario ingresa fecha de entrega.
   - Sistema genera OC automaticamente.
5. Una vez todos los materiales estan asignados:
   - Boton "Iniciar Proyecto" se habilita.
   - Usuario confirma inicio.
   - Proyecto pasa a estado "En Proceso".

**Parte tecnica**
- Carga materiales: `ProyectosServiceNuevo.obtenerProyectoPorId(id)`.
- Validacion de color: normaliza colores (sin acentos, mayusculas) para comparar.
- Asignacion: `ProyectosService.asignarMateriales(idProyecto, materiales)`.
- Generacion de OC: `OrdenCompraService.crearOrdenCompra(payload)`.
- Inicio de proyecto: `ProyectosService.cambiarEstado(idProyecto, 'En Proceso')`.

---

## Estados del Insumo

| Estado | Descripcion | Badge |
|---|---|---|
| Disponible | Stock disponible para asignar | Verde |
| En uso | Asignado a proyectos activos | Azul |
| A designar | Pendiente de asignacion | Naranja |
| Agotado | Sin stock disponible | Rojo |

**Nota:** El backend normaliza el estado "pulenta" a "Disponible" automaticamente.

---

## Modelo de Datos

### Tabla `Insumo` (base de datos)

| Campo | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `id_Insumo` | INT PK | Si | Identificador unico |
| `nombre_Insumo` | VARCHAR | Si | Nombre del insumo |
| `id_TipoInsumo` | INT FK | Si | FK a `TipoInsumo` |
| `unidad_Medida` | VARCHAR | Si | mts, kg, unidades, etc. |
| `stock_Actual` | DECIMAL | Si | Stock global disponible |
| `stock_Minimo` | DECIMAL | No | Umbral de alerta de stock bajo |
| `id_Proveedor` | INT FK | No | FK a `Proveedor` |
| `id_Ubicacion` | INT FK | No | Ubicacion principal |
| `estado` | VARCHAR | Si | Disponible / En uso / A designar / Agotado |
| `color` | VARCHAR | No | Color (para telas) |
| `tipo_Tela` | VARCHAR | No | Tipo de tela (para telas) |
| `fecha_Actualizacion` | DATE | Si | Ultima actualizacion |

### Tabla `InsumoStock` (trazabilidad granular)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_InsumoStock` | INT PK | Identificador |
| `id_Insumo` | INT FK | FK a `Insumo` |
| `id_Proyecto` | INT FK | FK a `Proyecto` (nullable) |
| `id_Ubicacion` | INT FK | FK a `Ubicacion` (nullable) |
| `id_OrdenCompra` | INT FK | FK a `OrdenCompra` (nullable) |
| `cantidad` | DECIMAL | Cantidad en esta ubicacion/proyecto |
| `fecha_Actualizacion` | DATETIME | Ultima actualizacion |

**Regla:** La suma de todas las cantidades en `InsumoStock` debe ser igual a `Insumo.stock_Actual`.

### Tabla `InventarioMovimiento` (auditoria)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Movimiento` | INT PK | Identificador |
| `id_Insumo` | INT FK | FK a `Insumo` |
| `tipo_Movimiento` | VARCHAR | Crear / Editar / Eliminar / Transferencia |
| `cantidad` | DECIMAL | Cantidad del movimiento |
| `unidad_Medida` | VARCHAR | Unidad de medida |
| `fecha_Movimiento` | DATE | Fecha del movimiento |
| `id_Usuario` | INT FK | Usuario que realizo el movimiento |
| `origen` | VARCHAR | Origen del movimiento |
| `destino` | VARCHAR | Destino del movimiento |
| `observacion` | TEXT | Observaciones |

### Tabla `Ubicacion`

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Ubicacion` | INT PK | Identificador |
| `codigo` | VARCHAR | Codigo unico (ej: A1-01-03) |
| `rack` | VARCHAR | Rack del almacen |
| `division` | VARCHAR | Division del rack |
| `espacio` | VARCHAR | Espacio en la division |
| `descripcion` | TEXT | Descripcion de la ubicacion |

### Tabla `TipoInsumo`

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_TipoInsumo` | INT PK | Identificador |
| `nombre_Tipo` | VARCHAR | Tela / Hilo / Accesorio / etc. |
| `descripcion` | TEXT | Descripcion del tipo |

---

## Backend (API .NET)

### Endpoints de Insumos
Controlador: `Backend/TESIS_OG/Controllers/InsumoController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/Insumo` | Crear insumo |
| GET | `/api/Insumo` | Listar todos los insumos |
| GET | `/api/Insumo/con-stock` | Solo insumos con stock disponible |
| GET | `/api/Insumo/{id}` | Detalle completo con trazabilidad |
| PUT | `/api/Insumo/{id}` | Actualizar insumo |
| DELETE | `/api/Insumo/{id}` | Eliminar insumo |
| POST | `/api/Insumo/buscar` | Buscar con filtros |
| POST | `/api/Insumo/buscar-con-stock` | Buscar con stock y filtros |
| PATCH | `/api/Insumo/{id}/estado` | Cambiar estado |
| PATCH | `/api/Insumo/stock/{idInsumoStock}` | Editar cantidad de stock entry |
| DELETE | `/api/Insumo/stock/{idInsumoStock}/devolver` | Devolver stock al general |

### Endpoints de Tipos de Insumo
Controlador: `Backend/TESIS_OG/Controllers/TipoInsumoController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/TipoInsumo` | Listar tipos |
| GET | `/api/TipoInsumo/{id}` | Detalle tipo |

### Endpoints de Ubicaciones
Controlador: `Backend/TESIS_OG/Controllers/UbicacionController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/Ubicacion` | Crear ubicacion |
| GET | `/api/Ubicacion` | Listar ubicaciones |
| GET | `/api/Ubicacion/{id}` | Detalle ubicacion |
| PUT | `/api/Ubicacion/{id}` | Actualizar ubicacion |
| DELETE | `/api/Ubicacion/{id}` | Eliminar ubicacion |
| GET | `/api/Ubicacion/{id}/insumos` | Insumos en ubicacion |
| GET | `/api/Ubicacion/{id}/proyectos` | Proyectos en ubicacion |
| POST | `/api/Ubicacion/transfer` | Transferir insumos |

### Endpoints de Movimientos
Controlador: `Backend/TESIS_OG/Controllers/MovimientoController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/Movimiento/buscar` | Obtener movimientos con filtros |

### Reglas backend implementadas
- No permite crear insumo con mismo nombre + color.
- Valida que tipo de insumo y proveedor existan antes de crear.
- Al crear insumo con ubicacion y stock > 0, crea entrada en `InsumoStock`.
- Al editar stock, registra movimiento en `InventarioMovimiento`.
- Al eliminar insumo, registra movimiento de eliminacion.
- Edicion de stock entry valida que cantidad no exceda stock general disponible.
- Devolucion de stock solo funciona si esta asignado a proyecto.
- Transferencia entre ubicaciones preserva asignaciones de proyecto.
- Estado "pulenta" se normaliza a "Disponible".
- Color se normaliza a mayusculas sin acentos.

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Insumos/`

| Archivo | Uso |
|---|---|
| `InsumoCreateDTO.cs` | Crear insumo |
| `InsumoEditDTO.cs` | Editar insumo |
| `InsumoIndexDTO.cs` | Respuesta de listado y detalle (incluye detalleStock y proyectosAsignados) |
| `InsumoSearchDTO.cs` | Filtros de busqueda |
| `InsumoStockDTO.cs` | Detalle de stock por ubicacion/proyecto |
| `ProyectoAsignadoDTO.cs` | Proyectos con asignacion de insumo |

---

## Frontend (Angular)

### Ruta
Archivo: `inventario.routes.ts`
- `path: ''` → `InventarioComponent`

### Estructura de archivos
Ubicacion: `frontend/src/app/modules/inventario/`

```
components/
  inventario.component.*                    ← Lista principal
  insumo-filtros/
    insumo-filtros.component.*              ← Panel de filtros avanzados
  insumo-catalog/
    insumo-catalog.component.*              ← Catalogo de insumos
  control-recepcion/
    control-recepcion.component.*           ← Control de recepcion de OC
  ubicacion-transfer/
    ubicacion-transfer.component.*          ← Transferencias (3 tabs)
  proyecto-transfer/
    proyecto-transfer.component.*           ← Asignacion a proyectos
insumo-form/
  insumo-form.component.*                   ← Formulario crear/editar
insumo-detalle-modal/
  insumo-detalle-modal.component.ts         ← Modal de detalle con trazabilidad
models/
  insumo.model.ts                           ← Interfaces Insumo, InsumoStock, ProyectoAsignado, TipoInsumo, Proveedor
services/
  insumos.service.ts                        ← Servicio principal
```

### Servicio principal (`services/insumos.service.ts`)
- Base URL: `${environment.apiUrl}/Insumo`
- Metodos: `getInsumos()`, `getInsumosConStock()`, `getInsumoById(id)`, `agregarInsumo()`, `actualizarInsumo()`, `eliminarInsumo()`, `cambiarEstado()`, `editarStockEntry()`, `devolverStock()`, `getTiposInsumo()`, `getProveedores()`

### Modelos (`models/insumo.model.ts`)

| Interface | Uso |
|---|---|
| `Insumo` | Entidad completa con detalleStock y proyectosAsignados |
| `InsumoStock` | Detalle de stock por ubicacion/proyecto |
| `ProyectoAsignado` | Proyectos con asignacion de insumo |
| `TipoInsumo` | `{ idTipoInsumo, nombreTipo, descripcion }` |
| `Proveedor` | `{ idProveedor, nombreProveedor, cuit }` |

---

## Contrato JSON

### Crear / editar insumo (request)
```json
{
  "nombreInsumo": "Tela Algodon Blanco",
  "idTipoInsumo": 1,
  "unidadMedida": "mts",
  "stockActual": 100,
  "stockMinimo": 20,
  "idProveedor": 5,
  "idUbicacion": 3,
  "estado": "Disponible",
  "color": "BLANCO",
  "tipoTela": "Algodon"
}
```

### Respuesta de insumo (index / detalle)
```json
{
  "idInsumo": 42,
  "nombreInsumo": "Tela Algodon Blanco",
  "idTipoInsumo": 1,
  "nombreTipoInsumo": "Tela",
  "unidadMedida": "mts",
  "stockActual": 100,
  "stockMinimo": 20,
  "fechaActualizacion": "2026-04-14",
  "idProveedor": 5,
  "nombreProveedor": "Textiles del Centro SA",
  "cuitProveedor": "30-12345678-9",
  "estado": "Disponible",
  "idUbicacion": 3,
  "codigoUbicacion": "A1-01-03",
  "color": "BLANCO",
  "tipoTela": "Algodon",
  "stockBajo": false,
  "proyectosAsignados": [
    {
      "idProyecto": 10,
      "nombreProyecto": "Remeras Verano 2026",
      "codigoProyecto": "PROY-0010",
      "cantidad": 50,
      "unidadMedida": "mts",
      "tipoCalculo": "Auto"
    }
  ],
  "detalleStock": [
    {
      "idInsumoStock": 1,
      "idInsumo": 42,
      "idProyecto": 10,
      "nombreProyecto": "Remeras Verano 2026",
      "codigoProyecto": "PROY-0010",
      "idUbicacion": 3,
      "codigoUbicacion": "A1-01-03",
      "cantidad": 50,
      "fechaActualizacion": "2026-04-14T10:30:00"
    },
    {
      "idInsumoStock": 2,
      "idInsumo": 42,
      "idUbicacion": 3,
      "codigoUbicacion": "A1-01-03",
      "cantidad": 50,
      "fechaActualizacion": "2026-04-14T10:30:00"
    }
  ]
}
```

### Buscar insumos (request)
```json
{
  "nombreInsumo": "Algodon",
  "idTipoInsumo": 1,
  "estado": "Disponible",
  "soloStockBajo": true,
  "fechaDesde": "2026-01-01",
  "fechaHasta": "2026-04-14"
}
```

### Transferir insumos (request)
```json
{
  "idOrdenCompra": 5,
  "idUbicacionDestino": 3,
  "idProyecto": 10,
  "items": [
    {
      "idInsumo": 42,
      "cantidad": 50
    }
  ]
}
```

### Editar stock entry (request)
```json
{
  "cantidad": 45
}
```

---

## Flujos de Negocio

### Flujo 1: Ingreso de Compra
1. OC llega en estado "Verificada"
2. Control de Recepcion ingresa cantidades recibidas
3. Sistema actualiza `Insumo.stock_Actual` e `InsumoStock`
4. OC pasa a "Ingresada"
5. Movimiento registrado en `InventarioMovimiento`

### Flujo 2: Transferencia entre Ubicaciones
1. Usuario selecciona ubicacion origen
2. Usuario selecciona insumos a transferir con cantidades
3. Usuario selecciona ubicacion destino
4. Sistema actualiza `InsumoStock` (cambia `id_Ubicacion`)
5. Sistema preserva asignaciones de proyecto
6. Movimiento registrado

### Flujo 3: Asignacion a Proyecto
1. Usuario selecciona proyecto
2. Sistema carga materiales necesarios
3. Sistema valida disponibilidad (color debe coincidir exactamente)
4. Usuario asigna cantidades disponibles
5. Para faltantes: usuario genera OC
6. Una vez completo: usuario inicia proyecto
7. Proyecto pasa a "En Proceso"

### Flujo 4: Edicion de Stock
1. Usuario abre detalle de insumo
2. Usuario edita cantidad en tabla de detalleStock
3. Sistema valida contra stock general disponible
4. Sistema actualiza `InsumoStock` y `Insumo.stock_Actual`
5. Movimiento registrado

### Flujo 5: Devolucion de Stock
1. Usuario abre detalle de insumo
2. Usuario hace click en "Devolver" en fila de detalleStock
3. Sistema valida que este asignado a proyecto
4. Sistema elimina entrada de `InsumoStock`
5. Sistema actualiza `Insumo.stock_Actual`
6. Movimiento registrado

---

## Validaciones y Reglas de Negocio

- No puede haber dos insumos con mismo nombre + color
- Stock no puede ser negativo
- Edicion de stock entry valida contra stock general disponible
- Devolucion de stock solo funciona si esta asignado a proyecto
- Transferencia entre ubicaciones preserva asignaciones de proyecto
- Color de insumo debe coincidir exactamente para asignacion a proyecto (normalizado sin acentos, mayusculas)
- Ubicacion no puede eliminarse si tiene insumos
- Estado "pulenta" se normaliza a "Disponible"
- La suma de cantidades en `InsumoStock` debe ser igual a `Insumo.stock_Actual`

---

## Auditoria y Trazabilidad

Todos los cambios se registran en `InventarioMovimiento`:
- Tipo: Crear, Editar, Eliminar, Transferencia
- Cantidad y unidades
- Origen y destino
- Usuario que realizo el cambio
- Fecha y hora
- Observaciones

---

## Checklist rapido de QA
1. Crear insumo con todos los campos
2. Verificar que aparezca en el listado con indicador de stock bajo si aplica
3. Editar insumo y cambiar stock: verificar que se registre movimiento
4. Ver detalle y verificar tabla de detalleStock
5. Editar cantidad en detalleStock: verificar validacion contra stock general
6. Devolver stock de proyecto al general
7. Buscar por nombre, tipo y estado
8. Filtrar por stock bajo
9. Cambiar estado con confirmacion
10. Enviar notificacion de stock faltante
11. Control de recepcion: ingresar cantidades de OC
12. Transferir de OC a ubicacion
13. Transferir entre ubicaciones
14. Asignar materiales a proyecto con validacion de color
15. Generar OC para materiales faltantes
16. Iniciar proyecto cuando todos los materiales estan listos
17. Eliminar insumo sin stock ni asignaciones
18. Intentar eliminar insumo con stock (debe bloquear)
19. Verificar auditoria de movimientos

---

## Notas
- El campo `color` se normaliza a mayusculas sin acentos para comparaciones.
- El estado "pulenta" es un easter egg que se normaliza a "Disponible".
- La trazabilidad granular permite saber exactamente donde esta cada unidad de stock.
- Las transferencias entre ubicaciones preservan las asignaciones de proyecto.
- La validacion de color en asignacion a proyectos es estricta: debe coincidir exactamente.
- El control de recepcion pre-carga cantidades faltantes si ya se recibio algo anteriormente.
