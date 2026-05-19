# Modulo de Clientes

## Resumen
El modulo de **Clientes** gestiona el registro completo de los clientes de la empresa. Soporta dos tipos de persona (Fisica y Juridica) con sus respectivos campos de identificacion, ubicacion geografica en cascada (Provincia → Ciudad), estados de cuenta y exportacion del listado en multiples formatos.

- Tipos de persona: **Fisica** (nombre, apellido, DNI/CUIL) y **Juridica** (razon social, CUIT)
- Categorias de cliente: Mayorista, Minorista, Otro
- Ubicacion: Provincia y Ciudad en cascada
- Estados: Activo, Inactivo, Suspendido, En Revision
- Flujo principal: listar, crear, editar, ver detalle, eliminar, exportar

---

## Pantallas principales

### 1) Lista de Clientes
Archivo: `components/clientes.component.*`

**Para que sirve**
- Vista principal del modulo. Muestra todos los clientes en una tabla con busqueda rapida y filtros avanzados.
- Permite crear, editar, ver detalle y eliminar clientes.
- Exporta el listado filtrado a PDF, Excel o CSV.

**Acciones**
1. Buscar por nombre, apellido, razon social, email, numero de documento o telefono.
2. Aplicar filtros avanzados (estado, tipo de cliente, provincia, ciudad, rango de fechas, tipo de documento).
3. Hacer click en una fila para ver el detalle del cliente.
4. Boton editar por fila para abrir el formulario de edicion.
5. Boton eliminar por fila con confirmacion.
6. Exportar listado filtrado a PDF / Excel / CSV.

**Parte tecnica**
- Carga: `cargarClientes()` → `ClientesService.obtenerClientes()`.
- Filtrado reactivo: getter `clientesFiltrados` combina busqueda por texto + `FiltrosCliente` del componente de filtros.
- Exportacion: `ExportService.exportarPDF()`, `exportarExcel()`, `exportarCSV()`.
- Permisos: `HasPermissionDirective` controla visibilidad de acciones.
- Detalle: `obtenerClientePorId(id)` antes de abrir el modal para tener datos frescos.

---

### 2) Filtros Avanzados
Archivo: `components/cliente-filtros/cliente-filtros.component.*`

**Para que sirve**
- Panel de filtros que emite un objeto `FiltrosCliente` al componente padre cada vez que cambia alguna seleccion.

**Filtros disponibles**
| Filtro | Tipo | Opciones |
|---|---|---|
| Estado | Multi-seleccion | Activo, Inactivo, Suspendido, En Revision |
| Tipo de cliente | Multi-seleccion | Mayorista, Minorista, Otro |
| Provincia | Select | Cargado desde API |
| Ciudad | Select | Filtrado por provincia seleccionada |
| Fecha de alta desde | Date | - |
| Fecha de alta hasta | Date | - |
| Tipo de documento | Select | DNI, CUIT/CUIL |

**Parte tecnica**
- Cascada Provincia → Ciudad: al cambiar provincia llama a `ClientesService.obtenerCiudadesPorProvincia(id)`.
- Emite `FiltrosCliente` via `@Output() filtrosChange`.
- `contadorFiltrosActivos` calcula cuantos filtros estan activos para mostrar badge.

---

### 3) Formulario de Cliente (crear / editar)
Archivo: `components/cliente-form/cliente-form.component.*`

**Para que sirve**
- Formulario reactivo para crear un cliente nuevo o editar uno existente.
- Cambia los campos visibles y las validaciones segun el tipo de persona seleccionado.

**Campos del formulario**

*Comunes a ambos tipos:*
- Tipo de persona (Fisica / Juridica) — solo UI, no se envia al backend
- Categoria del cliente (Mayorista / Minorista / Otro) — obligatorio
- Telefono — obligatorio
- Email — obligatorio, formato email
- Estado — obligatorio (default: Activo)
- Provincia → Ciudad (cascada)
- Direccion
- Codigo postal
- Observaciones

*Solo Persona Fisica:*
- Nombre — obligatorio, min 2 caracteres
- Apellido — obligatorio, min 2 caracteres
- Tipo de documento (DNI / CUIL)
- Numero de documento — obligatorio

*Solo Persona Juridica:*
- Razon social — obligatorio, min 3 caracteres
- CUIT/CUIL — obligatorio, formato `XX-XXXXXXXX-X`

**Parte tecnica**
- Formulario reactivo con `FormBuilder`.
- Validaciones dinamicas: al cambiar tipo de persona se limpian y reconfiguran los validators.
- Cascada Provincia → Ciudad via `valueChanges` en el control `idProvincia`.
- En edicion: infiere tipo de persona desde los datos (`razonSocial` presente → Juridica).
- Guardado: `ClientesService.agregarCliente()` o `actualizarCliente()` segun modo.
- Cancelar con cambios pendientes muestra confirmacion via `AlertasService`.

---

### 4) Modal de Detalle
Archivo: `cliente-detalle-modal/cliente-detalle-modal.component.ts`

**Para que sirve**
- Modal de solo lectura con toda la informacion del cliente organizada en secciones.

**Secciones**
- Tipo de persona (badge Fisica / Juridica)
- Informacion personal (nombre, apellido, tipo y numero de documento) — solo si es Fisica
- Informacion fiscal (razon social, CUIT/CUIL) — solo si es Juridica
- Informacion de contacto (telefono, email)
- Ubicacion (provincia, ciudad, direccion, codigo postal) — solo si tiene datos
- Estado y registro (estado, fecha de alta, categoria)
- Observaciones — solo si tiene datos

**Parte tecnica**
- Componente standalone con template y estilos inline.
- `esPersonaFisica()`: devuelve `true` si `razonSocial` esta vacio.
- `esPersonaJuridica()`: devuelve `true` si `razonSocial` tiene valor.
- Recibe el cliente completo via `@Input() cliente`.

---

## Estados del Cliente

| ID | Nombre | Badge |
|---|---|---|
| 1 | Activo | Verde |
| 2 | Inactivo | Rojo |
| 3 | Suspendido | Naranja |
| 4 | En Revision | - |

---

## Modelo de Datos

### Tabla `Cliente` (base de datos)

| Campo | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `id_Cliente` | INT PK | Si | Identificador unico |
| `tipo_Cliente` | VARCHAR | Si | Mayorista / Minorista / Otro |
| `nombre` | VARCHAR | Condicional | Solo Persona Fisica |
| `apellido` | VARCHAR | Condicional | Solo Persona Fisica |
| `razon_Social` | VARCHAR | Condicional | Solo Persona Juridica |
| `tipo_Documento` | VARCHAR | No | DNI / CUIL |
| `numero_Documento` | VARCHAR | No | Numero de documento |
| `cuit_Cuil` | VARCHAR | No | CUIT/CUIL (Persona Juridica) |
| `telefono` | VARCHAR | Si | Telefono de contacto |
| `email` | VARCHAR | Si | Email de contacto |
| `id_EstadoCliente` | INT FK | Si | FK a `EstadoCliente` (default 1 = Activo) |
| `id_Provincia` | INT FK | No | FK a `Provincia` |
| `id_Ciudad` | INT FK | No | FK a `Ciudad` |
| `direccion` | VARCHAR | No | Direccion postal |
| `codigo_Postal` | VARCHAR | No | Codigo postal |
| `observaciones` | TEXT | No | Notas internas |
| `fecha_Alta` | DATE | Si | Fecha de registro |

### Tabla `EstadoCliente`

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_EstadoCliente` | INT PK | Identificador |
| `nombre_Estado` | VARCHAR | Activo / Inactivo / Suspendido / En Revision |

### Tabla `Provincia`

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Provincia` | INT PK | Identificador |
| `nombre_Provincia` | VARCHAR | Nombre de la provincia |

### Tabla `Ciudad`

| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Ciudad` | INT PK | Identificador |
| `nombre_Ciudad` | VARCHAR | Nombre de la ciudad |
| `id_Provincia` | INT FK | FK a `Provincia` |

---

## Backend (API .NET)

### Endpoints de Clientes
Controlador: `Backend/TESIS_OG/Controllers/ClienteController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Cliente` | Lista todos los clientes |
| GET | `/api/Cliente/{id}` | Devuelve cliente por ID |
| POST | `/api/Cliente` | Crea un nuevo cliente |
| PUT | `/api/Cliente/{id}` | Actualiza un cliente existente |
| DELETE | `/api/Cliente/{id}` | Elimina un cliente |
| POST | `/api/Cliente/buscar` | Busca clientes con filtros |

### Endpoints de Estados
Controlador: `Backend/TESIS_OG/Controllers/EstadoClienteController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/EstadoCliente` | Lista todos los estados |
| GET | `/api/EstadoCliente/{id}` | Devuelve estado por ID |

### Endpoints de Ubicacion
Controladores: `Controllers/Localidad/ProvinciaController.cs`, `CiudadController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Provincia` | Lista todas las provincias |
| GET | `/api/Provincia/{id}` | Devuelve provincia por ID |
| GET | `/api/Ciudad` | Lista todas las ciudades |
| GET | `/api/Ciudad/{id}` | Devuelve ciudad por ID |
| GET | `/api/Ciudad/provincia/{idProvincia}` | Ciudades filtradas por provincia |

### Reglas backend implementadas
- No permite eliminar un cliente si tiene proyectos u ordenes de compra asociadas (lanza `InvalidOperationException`).
- `idEstadoCliente` tiene default 1 (Activo) si no se especifica.
- El campo `NombreCompleto` en `ClienteIndexDTO` se calcula en el backend: si tiene `RazonSocial` la devuelve, sino concatena `Nombre + Apellido`.
- La respuesta incluye `NombreCiudad` y `NombreProvincia` resueltos para mostrar directamente en la UI.

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Clientes/`

| Archivo | Uso |
|---|---|
| `ClienteCreateDTO.cs` | Crear cliente |
| `ClienteEditDTO.cs` | Editar cliente |
| `ClienteIndexDTO.cs` | Respuesta de listado y detalle (incluye nombres de ubicacion y estado) |
| `ClienteSearchDTO.cs` | Filtros de busqueda |

---

## Frontend (Angular)

### Ruta
Archivo: `clientes.routes.ts`
- `path: ''` → `ClientesComponent`

### Estructura de archivos
Ubicacion: `frontend/src/app/modules/clientes/`

```
components/
  clientes.component.*                    ← Lista principal
  cliente-filtros/
    cliente-filtros.component.*           ← Panel de filtros avanzados
  cliente-form/
    cliente-form.component.*              ← Formulario crear/editar
cliente-detalle-modal/
  cliente-detalle-modal.component.ts      ← Modal de detalle (solo lectura)
models/
  cliente.model.ts                        ← Interfaces Cliente, NuevoCliente, ActualizarCliente, Provincia, Ciudad, EstadoCliente
services/
  clientes.service.ts                     ← Servicio principal
  provincia.service.ts                    ← Servicio de provincias
  ciudad.service.ts                       ← Servicio de ciudades
```

### Servicio principal (`services/clientes.service.ts`)
- Base URL: `${environment.apiUrl}/Cliente`
- Metodos: `obtenerClientes()`, `obtenerClientePorId(id)`, `agregarCliente()`, `actualizarCliente()`, `eliminarCliente()`, `obtenerProvincias()`, `obtenerCiudadesPorProvincia(id)`, `obtenerEstadosCliente()`

### Modelos (`models/cliente.model.ts`)

| Interface | Uso |
|---|---|
| `Cliente` | Entidad completa con campos calculados del backend (`nombreCompleto`, `nombreCiudad`, `nombreProvincia`, `nombreEstado`) |
| `NuevoCliente` | DTO para crear (sin `idCliente`) |
| `ActualizarCliente` | Extiende `NuevoCliente` con `idCliente` |
| `Provincia` | `{ idProvincia, nombre }` |
| `Ciudad` | `{ idCiudad, nombre, idProvincia }` |
| `EstadoCliente` | `{ idEstadoCliente, nombre }` |

---

## Contrato JSON

### Crear / editar cliente Persona Fisica (request)
```json
{
  "tipoCliente": "Mayorista",
  "nombre": "Juan",
  "apellido": "Perez",
  "tipoDocumento": "DNI",
  "numeroDocumento": "30123456",
  "telefono": "+54 351 444-7788",
  "email": "juan.perez@email.com",
  "idEstadoCliente": 1,
  "idProvincia": 3,
  "idCiudad": 22,
  "direccion": "Av. Siempre Viva 742",
  "codigoPostal": "5000",
  "observaciones": "Cliente frecuente"
}
```

### Crear / editar cliente Persona Juridica (request)
```json
{
  "tipoCliente": "Mayorista",
  "razonSocial": "Textiles del Centro SA",
  "cuitCuil": "30-12345678-9",
  "telefono": "+54 351 444-7788",
  "email": "compras@textilescentro.com",
  "idEstadoCliente": 1,
  "idProvincia": 3,
  "idCiudad": 22,
  "direccion": "Av. Siempre Viva 123",
  "codigoPostal": "5000",
  "observaciones": null
}
```

### Respuesta de cliente (index / detalle)
```json
{
  "idCliente": 15,
  "tipoCliente": "Mayorista",
  "nombreCompleto": "Juan Perez",
  "nombre": "Juan",
  "apellido": "Perez",
  "razonSocial": null,
  "tipoDocumento": "DNI",
  "numeroDocumento": "30123456",
  "cuitCuil": null,
  "telefono": "+54 351 444-7788",
  "email": "juan.perez@email.com",
  "idEstadoCliente": 1,
  "nombreEstado": "Activo",
  "idProvincia": 3,
  "idCiudad": 22,
  "nombreProvincia": "Cordoba",
  "nombreCiudad": "Villa Maria",
  "direccion": "Av. Siempre Viva 742",
  "codigoPostal": "5000",
  "observaciones": "Cliente frecuente",
  "fechaAlta": "2026-04-14"
}
```

### Buscar clientes (request)
```json
{
  "tipoCliente": "Mayorista",
  "nombre": "Juan",
  "idEstadoCliente": 1,
  "idProvincia": 3
}
```

---

## Checklist rapido de QA
1. Crear cliente Persona Fisica con todos los campos
2. Crear cliente Persona Juridica con CUIT formato `XX-XXXXXXXX-X`
3. Verificar que aparezca en el listado con nombre completo correcto
4. Editar cliente y cambiar provincia: verificar que las ciudades se actualicen
5. Ver detalle y verificar que muestre la seccion correcta segun tipo de persona
6. Buscar por nombre, email y numero de documento
7. Filtrar por estado Activo y tipo Mayorista
8. Filtrar por provincia y verificar que solo aparezcan clientes de esa provincia
9. Exportar listado filtrado a Excel y PDF
10. Eliminar cliente sin proyectos asociados
11. Intentar eliminar cliente con proyectos (debe bloquear con mensaje)
12. Crear cliente con email duplicado o datos invalidos (debe mostrar error)
13. Cancelar formulario con cambios pendientes (debe pedir confirmacion)

---

## Notas
- El campo `tiposPersona` (Fisica/Juridica) es solo de UI: no se envia al backend. El backend infiere el tipo por la presencia de `razonSocial`.
- El campo `cuitCuil` en `Cliente` esta marcado como DEPRECATED. Usar `numeroDocumento` para personas fisicas y `cuitCuil` para juridicas.
- Las ciudades solo se cargan cuando se selecciona una provincia. Sin provincia seleccionada, el select de ciudad queda vacio.
- La eliminacion falla con mensaje de error si el cliente tiene proyectos u ordenes de compra asociadas.

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

# Modulo de Ubicaciones

## Resumen
El modulo de **Ubicaciones** gestiona la estructura geografica interna del deposito de la empresa. Cada ubicacion representa una posicion fisica dentro del almacen, identificada por un codigo unico y compuesta por rack, division y espacio. Las ubicaciones se clasifican en dos tipos: **regulares** (almacenan insumos de inventario) y **de despacho** (prefijo `DES`, reservadas para proyectos en espera de entrega).

- Estructura: Rack → Division → Espacio, con codigo auto-generado `RCK-DD-EE`
- Tipos de ubicacion: **Regular** (stock de insumos) y **Despacho** (proyectos listos para despachar)
- Relaciones: una ubicacion puede tener muchos insumos (`InsumoStock`) y muchos despachos
- Flujo principal: listar, crear, editar, ver detalle (con insumos o proyectos segun tipo), eliminar

---

## Pantallas principales

### 1) Lista de Ubicaciones
Archivo: `components/ubicaciones.component.*`

**Para que sirve**
- Vista principal del modulo. Muestra todas las ubicaciones en una tabla con busqueda en tiempo real.
- Permite crear, editar, ver detalle y eliminar ubicaciones.
- Al hacer click en una fila se abre el modal de detalle mostrando los insumos o proyectos segun el tipo de ubicacion.

**Acciones**
1. Ver listado de todas las ubicaciones con codigo, rack, division, espacio y descripcion.
2. Crear nueva ubicacion con formulario inline.
3. Editar una ubicacion existente (reutiliza el mismo formulario inline).
4. Ver detalle de la ubicacion: insumos almacenados (ubicaciones regulares) o proyectos en despacho (ubicaciones DES).
5. Eliminar ubicacion (bloqueado si tiene insumos asociados).

**Parte tecnica**
- Carga: `cargarUbicaciones()` → `UbicacionesService.getUbicaciones()`.
- Formulario inline: `mostrarFormulario` alterna entre crear y editar segun si `ubicacionSeleccionada` tiene valor.
- Generacion de codigo: `generarCodigo()` construye el codigo como `RCK-${div}-${esp}`.
- Modal de detalle: `abrirDetalle(ubicacion)` → `UbicacionDetalleModalComponent`.
- Detalle de proyecto desde tabla DES: `abrirDetalleProyecto(idProyecto)` → `ProyectoDetalleModalComponent`.
- Permisos: `HasPermissionDirective` controla visibilidad de acciones.

---

### 2) Formulario de Ubicacion (crear / editar)
Archivo: `components/ubicaciones.component.*` (inline en la misma vista)

**Para que sirve**
- Formulario simple embebido en la lista que permite crear o editar una ubicacion.

**Campos del formulario**

| Campo | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| Codigo | TEXT | Si | Identificador unico de la ubicacion (ej: `RCK-01-03`) |
| Rack | NUMBER | Si | Numero de rack |
| Division | NUMBER | Si | Numero de division dentro del rack |
| Espacio | NUMBER | No (default 1) | Espacio dentro de la division |
| Descripcion | TEXT | No | Descripcion opcional |

**Parte tecnica**
- La validacion minima verifica que `codigo`, `rack` y `division` no esten vacios antes de guardar.
- En modo **crear**: llama a `UbicacionesService.createUbicacion()`.
- En modo **editar**: llama a `UbicacionesService.updateUbicacion(id)`.
- Boton "Generar Codigo" ejecuta `generarCodigo()`, que arma automaticamente el codigo en formato `RCK-DD-EE`.
- Errores se muestran con `alert()` nativo usando el mensaje del backend.

---

### 3) Modal de Detalle
Archivo: `components/ubicacion-detalle-modal/ubicacion-detalle-modal.component.ts`

**Para que sirve**
- Modal que muestra el contenido de una ubicacion: insumos almacenados (ubicaciones regulares) o proyectos en zona de despacho (ubicaciones DES).

**Secciones**

*Ubicaciones regulares (cualquier codigo que NO empiece con `DES` o contenga `-DES`):*
- Header: codigo + rack / division / espacio
- Descripcion (si tiene)
- Tabla de insumos: nombre, proyecto asociado (del primer stock disponible), stock actual con unidad de medida, estado (badge de color)

*Ubicaciones de despacho (codigo que empieza con `DES` o contiene `-DES`, case-insensitive):*
- Header equivalente + badge `ZONA DES`
- Tabla de proyectos: codigo de proyecto, nombre, fecha de ingreso a despacho
- Boton "Ver Control" por fila que emite evento `abrirProyecto(idProyecto)` hacia el padre

**Parte tecnica**
- `esUbicacionDespacho`: getter que evalua `codigo.startsWith('DES') || codigo.includes('-DES')` (case-insensitive).
- Si es despacho → `cargarProyectos()` → `UbicacionesService.getProyectosPorUbicacion(id)`.
- Si es regular → `cargarInsumos()` → `UbicacionesService.getInsumosPorUbicacion(id)`.
- `getEstadoClass(estado)`: devuelve clase CSS segun estado del insumo (`estado-disponible`, `estado-en-uso`, `estado-agotado`, `estado-a-designar`).
- `getEstadoTexto(estado)`: normaliza los estados legacy (`pulenta` → `Disponible`).
- Emite evento `cerrar` al componente padre para cerrar el modal.
- Emite evento `abrirProyecto(id)` hacia el padre cuando se hace click en "Ver Control".

---

## Modelo de Datos

### Tabla `Ubicacion` (base de datos)

| Campo | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `id_Ubicacion` | INT PK | Si | Identificador unico |
| `codigo` | VARCHAR | Si | Codigo de ubicacion (unico, ej: `RCK-01-03`, `DES-01`) |
| `rack` | INT | Si | Numero de rack fisico |
| `division` | INT | Si | Division dentro del rack |
| `espacio` | INT | Si | Espacio dentro de la division |
| `descripcion` | VARCHAR | No | Descripcion libre de la ubicacion |

**Relaciones:**
- `Insumo` (1:N): un insumo puede asignarse a una ubicacion via FK `id_Ubicacion`
- `InsumoStock` (1:N): detalle de stock por ubicacion y proyecto
- `Despacho` (1:N): despachos de proyectos asignados a esta ubicacion

---

## Backend (API .NET)

### Endpoints de Ubicaciones
Controlador: `Backend/TESIS_OG/Controllers/UbicacionController.cs`

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/Ubicacion` | Lista todas las ubicaciones |
| GET | `/api/Ubicacion/{id}` | Devuelve ubicacion por ID |
| POST | `/api/Ubicacion` | Crea una nueva ubicacion |
| PUT | `/api/Ubicacion/{id}` | Actualiza una ubicacion |
| DELETE | `/api/Ubicacion/{id}` | Elimina una ubicacion |
| GET | `/api/Ubicacion/{id}/insumos` | Lista insumos almacenados en la ubicacion |
| GET | `/api/Ubicacion/{id}/proyectos` | Lista proyectos en zona de despacho |
| POST | `/api/Ubicacion/transfer` | Transfiere insumos entre ubicaciones |

### Reglas backend implementadas
- No permite eliminar una ubicacion si tiene insumos asociados (retorna `BadRequest` con mensaje indicativo).
- El codigo de ubicacion debe ser unico: si se intenta crear con un codigo duplicado, retorna `BadRequest`.
- `IUbicacionService` encapsula la logica de negocio (patron Strategy). La inyeccion se hace via constructor.
- `TransferirInsumosAsync` valida que origen y destino existan y que haya stock suficiente en el origen.

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Ubicacion/`

| Archivo | Uso |
|---|---|
| `UbicacionCreateDTO.cs` | Crear ubicacion (codigo, rack, division, espacio, descripcion) |
| `UbicacionEditDTO.cs` | Editar ubicacion |
| `InsumoTransferDTO.cs` | Transferencia entre ubicaciones (idOrigen, idDestino, cantidad, idInsumo) |

---

## Frontend (Angular)

### Ruta
Modulo lazy-loaded desde `app.routes.ts`.
- `path: 'ubicaciones'` → `UbicacionesComponent`

### Estructura de archivos
Ubicacion: `frontend/src/app/modules/ubicaciones/`

```
components/
  ubicaciones.component.*                      ← Lista + formulario inline
  ubicacion-detalle-modal/
    ubicacion-detalle-modal.component.ts        ← Modal de detalle (inline template + styles)
services/
  ubicaciones.service.ts                        ← Servicio principal + interface Ubicacion
```

### Servicio principal (`services/ubicaciones.service.ts`)
- Base URL: `${environment.apiUrl}/Ubicacion`
- Metodos: `getUbicaciones()`, `getUbicacion(id)`, `createUbicacion()`, `updateUbicacion(id)`, `deleteUbicacion(id)`, `getInsumosPorUbicacion(id)`, `getProyectosPorUbicacion(id)`, `transferirDesdeOrden(dto)`

### Interface Ubicacion (definida en el propio servicio)

| Campo | Tipo | Descripcion |
|---|---|---|
| `idUbicacion?` | number | PK (opcional al crear) |
| `codigo` | string | Codigo de la ubicacion |
| `rack` | number | Numero de rack |
| `division` | number | Division del rack |
| `espacio` | number | Espacio dentro de la division |
| `descripcion?` | string | Descripcion libre |

---

## Contrato JSON

### Crear ubicacion (request)
```json
{
  "codigo": "RCK-01-03",
  "rack": 1,
  "division": 1,
  "espacio": 3,
  "descripcion": "Zona de telas livianas"
}
```

### Respuesta de ubicacion
```json
{
  "idUbicacion": 12,
  "codigo": "RCK-01-03",
  "rack": 1,
  "division": 1,
  "espacio": 3,
  "descripcion": "Zona de telas livianas"
}
```

### Transferir insumos (request)
```json
{
  "idUbicacionOrigen": 5,
  "idUbicacionDestino": 12,
  "idInsumo": 3,
  "cantidad": 10
}
```

### Respuesta de insumos por ubicacion
```json
[
  {
    "idInsumo": 3,
    "nombreInsumo": "Tela Jersey",
    "stockActual": 45,
    "unidadMedida": "metros",
    "estado": "En uso",
    "detalleStock": [
      { "nombreProyecto": "Proyecto Verano 2026" }
    ]
  }
]
```

### Respuesta de proyectos por ubicacion DES
```json
[
  {
    "idProyecto": 7,
    "codigoProyecto": "PRY-0007",
    "nombreProyecto": "Coleccion Primavera",
    "fechaIngreso": "2026-04-10T14:30:00"
  }
]
```

---

## Checklist rapido de QA
1. Crear ubicacion regular con codigo `RCK-01-01` y verificar que aparece en la lista
2. Intentar crear otra ubicacion con el mismo codigo (debe bloquear con mensaje)
3. Usar "Generar Codigo" y verificar que el formato es `RCK-DD-EE`
4. Editar una ubicacion y cambiar su descripcion
5. Ver detalle de una ubicacion regular: verificar tabla de insumos con stock y estados
6. Crear ubicacion con prefijo `DES` y ver detalle: debe mostrar tabla de proyectos y badge `ZONA DES`
7. Hacer click en "Ver Control" de un proyecto en zona DES: debe abrir modal de detalle del proyecto
8. Intentar eliminar una ubicacion con insumos (debe bloquear con mensaje)
9. Eliminar una ubicacion vacia (debe eliminar y recargar la lista)
10. Verificar que `HasPermissionDirective` oculta acciones segun rol

---

## Notas
- El campo `codigo` es unico en la base de datos. El backend retorna `BadRequest` si ya existe.
- La diferenciacion entre ubicacion regular y de despacho es puramente por convencion de codigo: `DES` al inicio o `-DES` en cualquier posicion (case-insensitive). No hay un campo de tipo en la base de datos.
- `espacio` tiene default 1 al inicializar el formulario.
- El servicio `UbicacionesService` define la interface `Ubicacion` directamente en el mismo archivo (no en un archivo de modelos separado).
- El modal de detalle tiene template y estilos completamente inline (sin archivos `.html`/`.css` separados).
- La transferencia de insumos entre ubicaciones se usa principalmente desde el modulo de Ordenes de Compra al recibir materiales.

# Modulo de Usuarios

## Resumen
El modulo de **Usuarios** gestiona el alta, edicion, desactivacion y consulta de usuarios internos del sistema, asi como la asignacion de roles, areas de produccion (subroles para operarios) y permisos personalizados. Implementa un sistema de autorizacion en capas: **Rol** (base) → **Override por Usuario** (excepcion individual). Las contrasenas se almacenan con hash BCrypt.

- Roles disponibles: Administrador, Supervisor, Operario, Deposito
- Subroles de area (solo Operario): areas de produccion asignables (Corte, Confeccion, etc.)
- Permisos: catalogo global agrupado por modulo con overrides por usuario
- Flujo principal: listar, crear, editar, ver detalle (con auditoria), desactivar (baja logica), gestionar permisos
- La eliminacion es siempre **baja logica** (cambia estado a `Inactivo`): nunca se borra un registro

---

## Pantallas principales

### 1) Lista de Usuarios Internos
Archivo: `components/usuarios-internos.component.*`

**Para que sirve**
- Vista principal del modulo. Muestra todos los usuarios internos en una tabla con busqueda en tiempo real.
- Permite crear, editar, ver detalle y desactivar usuarios.
- Desde el detalle se puede acceder al panel de permisos personalizados.

**Acciones**
1. Buscar por nombre, apellido, usuario de ingreso, rol o estado.
2. Hacer click en una fila para ver el detalle del usuario (con historial de auditoria).
3. Boton crear para abrir el formulario de alta.
4. Boton editar por fila para modificar datos.
5. Boton desactivar por fila con confirmacion (baja logica).

**Parte tecnica**
- Carga: `cargarDatos()` lanza en paralelo `obtenerUsuarios()`, `obtenerRoles()` y `obtenerAreasSubrol()`.
- Roles: si el rol `Deposito` no viene del backend, se agrega manualmente al array con `idRol: 4`.
- Areas: se filtran las areas con nombre `confeccion` (normalizando texto sin acentos).
- Busqueda: getter `usuariosFiltrados` filtra por texto en `nombre + apellido`, `nombreUsuarioIngreso`, `nombreRol` y `estado`.
- Detalle: `abrirDetalle(usuario)` abre el modal y lanza `obtenerAuditoria(id)` en paralelo.
- Permisos: `HasPermissionDirective` controla visibilidad de botones de accion.
- Desactivacion: usa `AlertasService.confirmar()` (sweet alert) antes de ejecutar la baja.

---

### 2) Formulario de Usuario (crear / editar)
Archivo: `components/usuario-form/usuario-form.component.*`

**Para que sirve**
- Formulario para crear un usuario nuevo o editar uno existente.
- Muestra u oculta el campo de contrasena segun el modo: en crear es obligatoria, en editar es opcional.
- Si el rol seleccionado es Operario, muestra la seccion de subroles de area (checkboxes).

**Campos del formulario**

*Comunes:*
- Nombre — obligatorio
- Apellido — obligatorio
- Usuario de ingreso — obligatorio, unico
- Contrasena — obligatoria al crear, opcional al editar
- Rol — obligatorio (select: Administrador, Supervisor, Operario, Deposito)
- Estado — obligatorio en edicion (Activo / Inactivo); en crear siempre Activo

*Solo cuando el rol es Operario:*
- Areas asignadas — checkboxes de areas de produccion disponibles (multiples)

**Parte tecnica**
- Emite `UsuarioFormSubmit` al componente padre via `@Output() guardar`.
- `UsuarioFormSubmit` incluye: `nombre`, `apellido`, `nombreUsuarioIngreso`, `contrasena`, `idRol`, `estado`, `subRoles: number[]`.
- El componente padre (`UsuariosInternosComponent`) llama a `UsuariosService.crearUsuario()` o `actualizarUsuario()` con el payload.
- En modo edicion, los subroles existentes se pre-cargan con `subRolesSeleccionados`.

---

### 3) Modal de Detalle del Usuario
Archivo: `components/usuario-detalle-modal/usuario-detalle-modal.component.*`

**Para que sirve**
- Modal de solo lectura con la informacion completa del usuario y su historial de auditoria.
- Incluye un acceso al panel de permisos personalizados.

**Secciones**
- Datos del usuario: nombre completo, usuario de ingreso, rol, estado, fecha de creacion, ultimo acceso
- Areas asignadas (si es Operario)
- Historial de auditoria: listado de eventos (accion, modulo, fecha) ordenados por fecha desc
- Boton "Ver Permisos" que navega al componente de gestion de permisos

**Parte tecnica**
- Recibe `@Input() usuario: UsuarioInterno` y `@Input() auditoria: UsuarioAuditoria | null`.
- `loadingAuditoria` muestra un spinner mientras carga el historial.
- Emite `@Output() cerrar` al componente padre.

---

### 4) Panel de Permisos Personalizados
Archivo: `components/permisos-usuario/permisos-usuario.component.*`

**Para que sirve**
- Permite ver y modificar los permisos efectivos de un usuario especifico, con la posibilidad de crear overrides que anulan los permisos del rol.
- Muestra el catalogo completo de permisos agrupados por modulo con checkboxes.
- Los overrides existentes se resaltan visualmente (estado diferenciado del default del rol).

**Parte tecnica**
- Carga: `UsuariosService.obtenerPermisosPanel(idUsuario)` → `GET /api/Usuarios/{id}/permisos-panel`.
- Guardado: `UsuariosService.guardarPermisos(idUsuario, permisos)` → `PUT /api/Usuarios/{id}/permisos`.
- Los items con `tieneOverride = true` estan marcados como overrides personalizados del usuario.
- El panel no requiere permiso de `Administrador`; cualquier usuario con el permiso `Usuarios.VerPermisos` puede consultarlo, pero solo usuarios con `Usuarios.Ver` pueden guardar cambios.

---

## Roles y Estados

### Roles del sistema
| ID | Nombre | Descripcion |
|---|---|---|
| 1 | Administrador | Acceso completo a todos los modulos |
| 2 | Supervisor | Acceso a gestion, reportes y control |
| 3 | Operario | Acceso a areas de produccion asignadas |
| 4 | Deposito | Acceso a inventario y ubicaciones |

### Estados de usuario
| Estado | Descripcion |
|---|---|
| Activo | Usuario puede iniciar sesion |
| Inactivo | Baja logica, no puede iniciar sesion |

### Subroles de area (solo Operario)

Los operarios pueden tener asignadas multiples areas de produccion desde la tabla `UsuarioArea`. Las areas se obtienen del endpoint `/api/Login/areas` y se filtran excluyendo `confeccion` en el frontend.

---

## Sistema de Permisos

### Estructura
- **Tabla `Permiso`**: catalogo global de permisos con formato `Modulo.Accion` (ej: `Clientes.Crear`).
- **Tabla `RolPermiso`**: permisos base asignados por rol.
- **Tabla `UsuarioPermiso`**: overrides por usuario (si existe un registro aqui, tiene precedencia sobre el rol).

### Evaluacion de permisos (orden de prioridad)
1. Si existe un registro en `UsuarioPermiso` para el usuario → usa `PuedeAcceder` del override.
2. Si no existe override → evalua el permiso del rol via `IAuthorizationService.TienePermiso()`.

### Endpoint permisos-panel
Devuelve el catalogo completo con el estado efectivo para un usuario dado:
- `habilitado`: si el permiso esta activo (por rol o por override)
- `tieneOverride`: si hay un override explicito en `UsuarioPermiso`

---

## Modelo de Datos

### Tabla `Usuario` (base de datos)

| Campo | Tipo | Obligatorio | Descripcion |
|---|---|---|---|
| `id_Usuario` | INT PK | Si | Identificador unico |
| `nombre_Usuario` | VARCHAR | Si | Nombre del usuario |
| `apellido_Usuario` | VARCHAR | Si | Apellido del usuario |
| `usuario_Ingreso` | VARCHAR | Si | Username de login (unico) |
| `contrasena` | VARCHAR | Si | Hash BCrypt de la contrasena |
| `id_Rol` | INT FK | Si | FK a `Rol` |
| `estado` | VARCHAR | Si | Activo / Inactivo |
| `fecha_Creacion` | DATE | Si | Fecha de alta |
| `ultimo_Acceso` | DATE | No | Ultima sesion |

### Tabla `UsuarioArea`
| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Usuario` | INT FK | FK a `Usuario` |
| `id_Area` | INT FK | FK a `AreaProduccion` |

### Tabla `Permiso`
| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Permiso` | INT PK | Identificador |
| `nombre_Permiso` | VARCHAR | Formato `Modulo.Accion` |
| `descripcion` | VARCHAR | Descripcion legible |

### Tabla `UsuarioPermiso`
| Campo | Tipo | Descripcion |
|---|---|---|
| `id_Usuario` | INT FK | FK a `Usuario` |
| `id_Permiso` | INT FK | FK a `Permiso` |
| `puede_Acceder` | BOOL | Override: true=habilitado, false=deshabilitado |

### Tabla `HistorialUsuario`
| Campo | Tipo | Descripcion |
|---|---|---|
| `id_HistorialUsuario` | INT PK | Identificador |
| `id_Usuario` | INT FK | FK a `Usuario` |
| `accion` | VARCHAR | Codigo de accion (`ALTA_USUARIO_INTERNO`, `MODIFICACION_USUARIO_INTERNO`, `BAJA_USUARIO_INTERNO`) |
| `modulo` | VARCHAR | Modulo donde ocurrio la accion |
| `fecha_Accion` | DATE | Fecha del evento |

---

## Backend (API .NET)

### Endpoints de Usuarios (LoginController)
Controlador: `Backend/TESIS_OG/Controllers/LoginController.cs`

Los endpoints de CRUD de usuarios estan en `LoginController` bajo el prefijo `/api/Login`:

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| GET | `/api/Login/usuarios` | `Usuarios.Ver` | Lista todos los usuarios internos |
| GET | `/api/Login/usuarios/{id}` | `Usuarios.Ver` | Devuelve usuario por ID |
| POST | `/api/Login/usuarios` | `Usuarios.Crear` | Crea un nuevo usuario interno |
| PUT | `/api/Login/usuarios/{id}` | `Usuarios.Editar` | Actualiza datos de un usuario |
| DELETE | `/api/Login/usuarios/{id}` | `Usuarios.Eliminar` | Baja logica (estado → Inactivo) |
| GET | `/api/Login/usuarios/{id}/auditoria` | `Auditoria.Ver` | Historial de eventos del usuario |
| GET | `/api/Login/roles` | - | Lista todos los roles disponibles |
| GET | `/api/Login/areas` | - | Lista areas de produccion activas |
| POST | `/api/Login/login` | - | Autenticacion y generacion de JWT |

### Endpoints de Permisos y Areas (UsuariosController)
Controlador: `Backend/TESIS_OG/Controllers/UsuariosController.cs`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| GET | `/api/Usuarios/{id}/permisos-efectivos` | Propio o `Usuarios.VerPermisos` | Permisos efectivos actuales del usuario |
| GET | `/api/Usuarios/{id}/permisos-panel` | Propio o `Usuarios.VerPermisos` | Catalogo completo con estado efectivo para el usuario |
| PUT | `/api/Usuarios/{id}/permisos` | `Usuarios.Ver` | Guarda overrides de permisos para el usuario |
| GET | `/api/Usuarios/{id}/areas` | `Usuarios.VerAreas` | Areas asignadas al usuario |
| POST | `/api/Usuarios/{id}/areas` | `Usuarios.AsignarArea` | Asigna un area al usuario |
| DELETE | `/api/Usuarios/{id}/areas/{idArea}` | `Usuarios.AsignarArea` | Desasigna un area del usuario |

### Reglas backend implementadas
- **Username unico**: al crear o editar, verifica que `UsuarioIngreso` no este duplicado. Retorna `BadRequest` si ya existe.
- **Baja logica**: `DELETE /usuarios/{id}` solo cambia `Estado = "Inactivo"`, no elimina el registro.
- **Contrasena**: se hashea con `BCrypt.Net.BCrypt.HashPassword()`. En edicion, si `Contrasena` viene vacio, no se sobreescribe.
- **Subroles de area**: solo se guardan si el rol es Operario (`EsRolOperario()`). Para otros roles, se eliminan todas las areas asignadas.
- **Auditoria automatica**: Las acciones `ALTA_USUARIO_INTERNO`, `MODIFICACION_USUARIO_INTERNO` y `BAJA_USUARIO_INTERNO` se registran en `HistorialUsuario` automaticamente en cada operacion.
- **Permisos — override**: `PUT /Usuarios/{id}/permisos` valida que todos los `idPermiso` enviados existan en la tabla `Permiso`. Crea o actualiza los registros en `UsuarioPermiso`.
- **Permiso propio**: un usuario puede consultar sus propios permisos sin tener `Usuarios.VerPermisos`; solo para terceros se exige ese permiso.

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Login/` y `Backend/TESIS_OG/DTOs/Usuarios/`

| Archivo | Uso |
|---|---|
| `UsuarioInternoIndexDTO.cs` | Respuesta de listado y detalle |
| `UsuarioInternoCreateDTO.cs` | Crear usuario (nombre, apellido, usuarioIngreso, contrasena, idRol, subRolesAreaIds) |
| `UsuarioInternoUpdateDTO.cs` | Editar usuario (incluye estado, contrasena opcional) |
| `UsuarioAuditoriaDTO.cs` | Historial con fecha creacion, ultimo acceso y lista de eventos |
| `UsuarioAuditoriaEventoDTO.cs` | Item de historial (accion, modulo, fechaAccion) |
| `PermisosPanelResponse.cs` | Respuesta con lista de modulos y permisos |
| `PermisoItemDTO.cs` | Item de permiso con estado efectivo y flag de override |
| `GuardarPermisosRequest.cs` | Request para guardar overrides |
| `PermisosEfectivosDTO.cs` | Respuesta de permisos efectivos del usuario |

---

## Frontend (Angular)

### Ruta
Archivo: `usuarios.routes.ts`
- `path: ''` → `UsuariosInternosComponent`

### Estructura de archivos
Ubicacion: `frontend/src/app/modules/usuarios/`

```
components/
  usuarios-internos.component.*               ← Lista principal
  usuario-form/
    usuario-form.component.*                  ← Formulario crear/editar
  usuario-detalle-modal/
    usuario-detalle-modal.component.*         ← Modal de detalle + auditoria
  permisos-usuario/
    permisos-usuario.component.*              ← Panel de gestion de permisos
models/
  usuario.model.ts                            ← Interfaces del modulo
services/
  usuarios.service.ts                         ← Servicio principal
usuarios.routes.ts
```

### Servicio principal (`services/usuarios.service.ts`)

| Metodo | Endpoint | Descripcion |
|---|---|---|
| `obtenerUsuarios()` | GET `/api/Login/usuarios` | Lista todos los usuarios |
| `crearUsuario(payload)` | POST `/api/Login/usuarios` | Alta de usuario |
| `actualizarUsuario(id, payload)` | PUT `/api/Login/usuarios/{id}` | Actualizacion de datos |
| `borrarUsuario(id)` | DELETE `/api/Login/usuarios/{id}` | Baja logica |
| `obtenerRoles()` | GET `/api/Login/roles` | Lista de roles |
| `obtenerAreasSubrol()` | GET `/api/Login/areas` | Areas para subroles de operario |
| `obtenerAuditoria(id)` | GET `/api/Login/usuarios/{id}/auditoria` | Historial del usuario |
| `obtenerPermisosPanel(id)` | GET `/api/Usuarios/{id}/permisos-panel` | Catalogo de permisos con estado efectivo |
| `guardarPermisos(id, permisos)` | PUT `/api/Usuarios/{id}/permisos` | Guardar overrides |

### Modelos (`models/usuario.model.ts`)

| Interface | Uso |
|---|---|
| `UsuarioInterno` | Entidad completa con rol, estado, subroles, fechas |
| `RolUsuario` | `{ idRol, nombreRol }` |
| `AreaSubrol` | `{ idArea, nombreArea }` |
| `UsuarioInternoCreate` | DTO para crear (sin idUsuario, estado siempre Activo) |
| `UsuarioInternoUpdate` | DTO para editar (incluye estado, contrasena opcional) |
| `UsuarioAuditoria` | Historial: fechaCreacion, ultimoAcceso, eventos[] |
| `UsuarioAuditoriaEvento` | Item de historial: accion, modulo, fechaAccion |
| `PermisoItem` | Item del catalogo: idPermiso, accion, descripcion, habilitado, tieneOverride |
| `ModuloPermisos` | Grupo de permisos por modulo |
| `PermisoPanelResponse` | Respuesta del panel: idUsuario + modulos[] |
| `GuardarPermisoItem` | Item para guardar override: idPermiso + puedeAcceder |

---

## Contrato JSON

### Crear usuario (request)
```json
{
  "nombre": "Carlos",
  "apellido": "Gomez",
  "nombreUsuarioIngreso": "cgomez",
  "contrasena": "MiPass123!",
  "idRol": 3,
  "subRolesAreaIds": [1, 3]
}
```

### Respuesta de usuario (index)
```json
{
  "idUsuario": 8,
  "nombre": "Carlos",
  "apellido": "Gomez",
  "nombreUsuarioIngreso": "cgomez",
  "idRol": 3,
  "nombreRol": "Operario",
  "estado": "Activo",
  "fechaCreacion": "2026-04-15",
  "ultimoAcceso": null,
  "subRolesAreaIds": [1, 3]
}
```

### Editar usuario (request)
```json
{
  "nombre": "Carlos",
  "apellido": "Gomez",
  "nombreUsuarioIngreso": "cgomez",
  "contrasena": "",
  "idRol": 3,
  "estado": "Activo",
  "subRolesAreaIds": [1, 2, 3]
}
```

### Auditoria de usuario (response)
```json
{
  "idUsuario": 8,
  "fechaCreacion": "2026-04-15",
  "ultimoAcceso": "2026-04-16",
  "eventos": [
    {
      "accion": "ALTA_USUARIO_INTERNO",
      "modulo": "Usuarios Internos",
      "fechaAccion": "2026-04-15"
    },
    {
      "accion": "MODIFICACION_USUARIO_INTERNO",
      "modulo": "Usuarios Internos",
      "fechaAccion": "2026-04-16"
    }
  ]
}
```

### Panel de permisos (response)
```json
{
  "idUsuario": 8,
  "modulos": [
    {
      "modulo": "Clientes",
      "permisos": [
        {
          "idPermiso": 1,
          "accion": "Ver",
          "descripcion": "Ver listado de clientes",
          "habilitado": true,
          "tieneOverride": false
        },
        {
          "idPermiso": 2,
          "accion": "Crear",
          "descripcion": "Crear nuevos clientes",
          "habilitado": false,
          "tieneOverride": true
        }
      ]
    }
  ]
}
```

### Guardar permisos (request)
```json
{
  "permisos": [
    { "idPermiso": 2, "puedeAcceder": true },
    { "idPermiso": 5, "puedeAcceder": false }
  ]
}
```

---

## Checklist rapido de QA
1. Crear usuario con rol Operario y verificar que los checkboxes de area aparecen
2. Crear usuario con username duplicado (debe bloquear con mensaje)
3. Editar usuario sin completar la contrasena: verificar que no se sobreescribe
4. Cambiar rol de Operario a Administrador: verificar que las areas se eliminan
5. Ver detalle del usuario y verificar que la auditoria se carga con los eventos
6. Desactivar usuario con confirmacion y verificar que aparece en estado Inactivo
7. Intentar iniciar sesion con el usuario desactivado (debe rechazar)
8. Abrir el panel de permisos de un Supervisor y verificar el catalogo por modulo
9. Deshabilitar un permiso via override y verificar que `tieneOverride = true`
10. Guardar permisos y verificar el mensaje de confirmacion
11. Verificar que un Admin puede ver permisos de otro usuario (requiere `Usuarios.VerPermisos`)
12. Verificar que un usuario puede ver sus propios permisos sin necesitar el permiso especial
13. `HasPermissionDirective` oculta botones de editar/eliminar segun rol del usuario logueado

---

## Notas
- Los usuarios se gestionan desde `LoginController` (para CRUD base) y `UsuariosController` (para permisos y areas). El servicio Angular unifica ambos bajo `apiUrl` y `apiUrlUsuarios`.
- La normalizacion de texto (`normalizarTexto()`) elimina acentos para comparaciones de rol y area: evita errores por diferencias de encoding.
- Si el rol `Deposito` (id=4) no viene de la API, el frontend lo agrega localmente. Esto es un parche temporal documentado en el componente.
- Los subroles de area se llaman `AreaSubrol` en el frontend y `UsuarioArea` en el backend.
- El campo `estado` en edicion es obligatorio; no existe un endpoint de "activar" separado: se usa el mismo `PUT` de edicion cambiando `estado = "Activo"`.
- Las contrasenas nunca se devuelven en ninguna respuesta del backend.
