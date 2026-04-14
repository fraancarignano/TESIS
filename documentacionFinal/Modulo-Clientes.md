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
