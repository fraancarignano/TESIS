# Documentacion Tecnica - Modulo Clientes

## 1. Objetivo del modulo
El modulo `Clientes` permite administrar los clientes del sistema desde el frontend y exponer su ABM desde el backend.

Alcance funcional:
- Listar clientes.
- Buscar clientes por texto.
- Filtrar por estado, categoria, ubicacion, fecha de alta y tipo de documento.
- Crear clientes.
- Editar clientes.
- Ver detalle de clientes.
- Eliminar clientes cuando no tienen datos dependientes.
- Exportar el listado filtrado a PDF, Excel y CSV.

Ruta principal:
- `/clientes`

Permiso de ruta:
- `modulo: 'Clientes'`
- `accion: 'Ver'`

Permisos de acciones en UI:
- Crear: `modulo: 'Clientes', accion: 'Crear'`
- Editar/eliminar: `modulo: 'Clientes', accion: 'Editar'`

## 2. Estructura frontend
Archivos principales:
- `frontend/src/app/modules/clientes/clientes.routes.ts`
- `frontend/src/app/modules/clientes/models/cliente.model.ts`
- `frontend/src/app/modules/clientes/services/clientes.service.ts`
- `frontend/src/app/modules/clientes/services/provincia.service.ts`
- `frontend/src/app/modules/clientes/services/ciudad.service.ts`
- `frontend/src/app/modules/clientes/components/clientes.component.ts`
- `frontend/src/app/modules/clientes/components/clientes.component.html`
- `frontend/src/app/modules/clientes/components/clientes.component.css`
- `frontend/src/app/modules/clientes/components/cliente-form/cliente-form.component.ts`
- `frontend/src/app/modules/clientes/components/cliente-form/cliente-form.component.html`
- `frontend/src/app/modules/clientes/components/cliente-form/cliente-form.component.css`
- `frontend/src/app/modules/clientes/components/cliente-filtros/cliente-filtros.component.ts`
- `frontend/src/app/modules/clientes/components/cliente-filtros/cliente-filtros.component.html`
- `frontend/src/app/modules/clientes/components/cliente-filtros/cliente-filtros.component.css`
- `frontend/src/app/modules/clientes/cliente-detalle-modal/cliente-detalle-modal.component.ts`

Componente principal:
- `ClientesComponent`

Componentes hijos:
- `ClienteFormComponent`: modal de alta/edicion.
- `ClienteDetalleModalComponent`: modal de solo lectura.
- `ClienteFiltrosComponent`: barra y panel de filtros.

Servicios usados:
- `ClientesService`: consumo principal de endpoints de clientes, provincias, ciudades y estados.
- `ExportService`: exportacion de la lista filtrada.
- `AlertasService`: alertas, confirmaciones y errores.

## 3. Modelo frontend
El modelo principal esta en `cliente.model.ts`.

`Cliente`:
- `idCliente: number`
- `nombreCompleto?: string`
- `nombre?: string`
- `apellido?: string`
- `razonSocial?: string`
- `tipoDocumento?: string`
- `numeroDocumento?: string`
- `tipoCliente: string`
- `telefono: string`
- `email: string`
- `idEstadoCliente: number`
- `idCiudad: number`
- `idProvincia: number`
- `nombreCiudad?: string`
- `nombreProvincia?: string`
- `nombreEstado?: string`
- `direccion?: string`
- `codigoPostal?: string`
- `observaciones?: string`
- `fechaAlta: string`
- `cuitCuil?: string`

`NuevoCliente` y `ActualizarCliente` representan el contrato de alta y edicion. `ActualizarCliente` extiende `NuevoCliente` e incluye `idCliente`.

Modelos auxiliares:
- `Provincia`: `idProvincia`, `nombre`.
- `Ciudad`: `idCiudad`, `nombre`, `idProvincia`.
- `EstadoCliente`: `idEstadoCliente`, `nombre`.

## 4. Conceptos de negocio importantes
Hay dos conceptos separados que no deben mezclarse:

- Tipo de persona: se usa solo en frontend para decidir que campos mostrar.
  - `Fisica`
  - `Juridica`

- Categoria del cliente: se persiste en backend en `tipoCliente`.
  - `Mayorista`
  - `Minorista`
  - `Otro`

El formulario usa el control `tiposPersona` solo para UI. Ese campo no se envia al backend.

La persona fisica se representa con:
- `nombre`
- `apellido`
- `tipoDocumento`
- `numeroDocumento`

La persona juridica se representa con:
- `razonSocial`
- `cuitCuil`

El detalle infiere el tipo de persona desde los datos:
- Si hay `razonSocial`, es juridica.
- Si no hay `razonSocial`, es fisica.

## 5. Pantalla de listado
`ClientesComponent` carga clientes al iniciar mediante:
- `clientesService.obtenerClientes()`

Estados visuales:
- `loading`: muestra spinner.
- `error`: muestra estado de error y boton de reintento.
- tabla: se muestra cuando no hay error ni carga.
- sin resultados: se muestra si `clientesFiltrados.length === 0`.

Columnas de la tabla:
- Nombre / Razon Social.
- Tipo Cliente.
- Estado.
- Telefono.
- Email.
- Documento.
- Ubicacion.
- Fecha Alta.
- Acciones.

El click sobre una fila abre el detalle. Los botones de editar y eliminar hacen `event.stopPropagation()` para no abrir el detalle accidentalmente.

## 6. Busqueda y filtros
La busqueda por texto se aplica en el getter `clientesFiltrados`.

Campos considerados en la busqueda:
- `nombre`
- `apellido`
- `razonSocial`
- `email`
- `numeroDocumento`
- `cuitCuil`
- `telefono`

Filtros avanzados:
- Estados.
- Tipos/categorias de cliente.
- Provincia.
- Ciudad.
- Fecha desde.
- Fecha hasta.
- Tipo de documento.

El componente `ClienteFiltrosComponent` emite un objeto `FiltrosCliente`:

```ts
export interface FiltrosCliente {
  estados: number[];
  tiposCliente: string[];
  idProvincia?: number;
  idCiudad?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoDocumento?: string;
}
```

El componente padre recibe el evento en:
- `onFiltrosChange(filtros)`

Si no hay filtros activos, `filtrosActuales` se deja en `null`.

Nota de mantenimiento:
- La cascada provincia-ciudad se carga desde `ClientesService.obtenerCiudadesPorProvincia(idProvincia)`.
- En el listado actual, el filtro de provincia/ciudad compara contra campos de nombre en vez de ids. Esto conviene revisarlo si los filtros de ubicacion no responden como se espera.
- En `ClienteFiltrosComponent`, `limpiarFiltros()` marca los tipos de cliente como seleccionados (`true`), aunque el estado inicial los crea como `false`. Revisar si se quiere un comportamiento de default consistente.

## 7. Alta y edicion
Componente:
- `ClienteFormComponent`

Modal:
- Selector de tipo de persona.
- Campos para persona fisica o juridica segun corresponda.
- Campos comunes de contacto.
- Ubicacion.
- Estado.
- Categoria del cliente.
- Observaciones.

Formulario reactivo:
- `tiposPersona`
- `tipoCliente`
- `nombre`
- `apellido`
- `tipoDocumento`
- `numeroDocumento`
- `razonSocial`
- `cuitCuil`
- `telefono`
- `email`
- `idEstadoCliente`
- `observaciones`
- `idProvincia`
- `idCiudad`
- `direccion`
- `codigoPostal`

Validaciones frontend:
- `tiposPersona`: requerido.
- `tipoCliente`: requerido.
- `telefono`: requerido.
- `email`: requerido y formato email.
- Persona fisica:
  - `nombre`: requerido, minimo 2.
  - `apellido`: requerido, minimo 2.
  - `tipoDocumento`: requerido.
  - `numeroDocumento`: requerido.
- Persona juridica:
  - `razonSocial`: requerido, minimo 3.
  - `cuitCuil`: requerido y patron `XX-XXXXXXXX-X`.

Al cambiar el tipo de persona:
- Se limpian validaciones de campos opcionales.
- Se aplican validaciones del tipo seleccionado.
- Se limpian los campos que no corresponden al tipo.

En edicion:
- `cargarDatosCliente()` precarga los datos.
- El tipo de persona se infiere con `razonSocial ? 'Juridica' : 'Fisica'`.
- Si hay provincia, se cargan ciudades para poder mostrar la ciudad seleccionada.

Preparacion del payload:
- `prepararDatosCliente()` no envia `tiposPersona`.
- Si es fisica, envia `nombre`, `apellido`, `tipoDocumento`, `numeroDocumento` y limpia `razonSocial`/`cuitCuil`.
- Si es juridica, envia `razonSocial`, `cuitCuil` y limpia `nombre`/`apellido`/`tipoDocumento`/`numeroDocumento`.

Servicios llamados:
- Alta: `clientesService.agregarCliente(clienteData)`.
- Edicion: `clientesService.actualizarCliente({ idCliente, ...clienteData })`.

## 8. Detalle
Componente:
- `ClienteDetalleModalComponent`

Flujo:
- Al hacer click en una fila, `ClientesComponent.abrirDetalle(cliente)` valida `idCliente`.
- Luego llama a `clientesService.obtenerClientePorId(idCliente)`.
- Con la respuesta completa abre el modal.

Datos mostrados:
- Tipo de persona.
- Informacion personal si es persona fisica.
- Informacion fiscal si es persona juridica.
- Telefono.
- Email.
- Provincia.
- Ciudad.
- Direccion.
- Codigo postal.
- Estado.
- Fecha de alta.
- Categoria del cliente.
- Observaciones.

Detalle clave:
- El modal no usa `tipoCliente` para decidir si es fisica o juridica, porque `tipoCliente` representa la categoria comercial (`Mayorista`, `Minorista`, `Otro`).

## 9. Eliminacion
Frontend:
- Metodo: `ClientesComponent.eliminarCliente(cliente, event)`.
- Muestra confirmacion con `AlertasService.confirmar()`.
- Si se confirma, llama a `clientesService.eliminarCliente(idCliente)`.
- En caso de error muestra `err.message` cuando esta disponible.

Backend:
- Endpoint: `DELETE /api/Cliente/{id}`.
- Servicio: `ClienteService.EliminarClienteAsync(id)`.

Restriccion:
- No se elimina un cliente si tiene proyectos, muestras o historial asociados.
- En ese caso el backend lanza `InvalidOperationException` y el controller responde `400 Bad Request` con un mensaje de negocio.

Mensaje actual:
- `No se puede eliminar el cliente porque tiene proyectos, muestras o historial asociados.`

Esto evita errores 500 por restricciones de claves foraneas y deja una respuesta comprensible para el usuario.

## 10. Exportacion
Desde el listado se puede exportar la coleccion `clientesFiltrados`.

Formatos:
- PDF: `exportService.exportarPDF(clientesParaExportar)`
- Excel: `exportService.exportarExcel(clientesParaExportar)`
- CSV: `exportService.exportarCSV(clientesParaExportar)`

Si no hay datos, se muestra:
- `No hay clientes para exportar`

Al exportar correctamente:
- Se muestra alerta de exito.
- Se cierra el menu de exportacion.

## 11. Servicios frontend
`ClientesService` usa estos endpoints:
- `GET /api/Cliente`
- `GET /api/Cliente/{id}`
- `POST /api/Cliente`
- `PUT /api/Cliente/{id}`
- `DELETE /api/Cliente/{id}`
- `GET /api/Provincia`
- `GET /api/Ciudad/provincia/{idProvincia}`
- `GET /api/EstadoCliente`

Manejo de errores:
- `400`: toma `error.error.message` si existe.
- `404`: toma `error.error.message` si existe.
- `500`: toma `error.error.message` si existe.
- `0`: indica que no se pudo conectar con el backend.

Nota:
- Existen `ProvinciaService` y `CiudadService`, pero el flujo actual de clientes usa `ClientesService` para provincias y ciudades.

## 12. Backend
Archivos principales:
- `Backend/TESIS_OG/Controllers/ClienteController.cs`
- `Backend/TESIS_OG/Services/ClientesService/IClienteService.cs`
- `Backend/TESIS_OG/Services/ClientesService/ClienteService.cs`
- `Backend/TESIS_OG/DTOs/Clientes/ClienteCreateDTO.cs`
- `Backend/TESIS_OG/DTOs/Clientes/ClienteEditDTO.cs`
- `Backend/TESIS_OG/DTOs/Clientes/ClienteIndexDTO.cs`
- `Backend/TESIS_OG/DTOs/Clientes/ClienteSearchDTO.cs`
- `Backend/TESIS_OG/Models/Cliente.cs`

Controller:
- `POST /api/Cliente`: crear cliente.
- `GET /api/Cliente`: obtener todos.
- `GET /api/Cliente/{id}`: obtener por id.
- `PUT /api/Cliente/{id}`: actualizar.
- `DELETE /api/Cliente/{id}`: eliminar.
- `POST /api/Cliente/buscar`: buscar con filtros.

Servicio:
- `CrearClienteAsync`
- `ObtenerTodosLosClientesAsync`
- `ObtenerClientePorIdAsync`
- `ActualizarClienteAsync`
- `EliminarClienteAsync`
- `BuscarClientesAsync`

Entidad `Cliente`:
- Tiene FK opcionales a `Ciudad` y `Provincia`.
- Tiene FK obligatoria a `EstadoCliente`.
- Tiene colecciones relacionadas:
  - `HistorialClientes`
  - `Proyectos`
  - `Muestras`

## 13. DTOs backend
`ClienteCreateDTO`:
- `TipoCliente`
- `Telefono`
- `Email`
- `IdEstadoCliente`
- `Observaciones`
- `Nombre`
- `Apellido`
- `TipoDocumento`
- `NumeroDocumento`
- `RazonSocial`
- `CuitCuil`
- `IdCiudad`
- `IdProvincia`
- `Direccion`
- `CodigoPostal`

`ClienteEditDTO`:
- Mismos campos principales que `ClienteCreateDTO`, sin `IdCliente` porque el id viaja en la ruta `PUT /api/Cliente/{id}`.

`ClienteIndexDTO`:
- Respuesta usada por listado y detalle.
- Incluye `NombreCompleto` calculado.
- Incluye ids y nombres de ubicacion.
- Incluye `TipoDocumento`.
- Incluye `NombreEstado`.

`ClienteSearchDTO`:
- `TipoCliente`
- `Nombre`
- `Apellido`
- `RazonSocial`
- `NumeroDocumento`
- `CuitCuil`
- `Email`
- `IdEstadoCliente`
- `IdCiudad`
- `IdProvincia`
- `CodigoPostal`

## 14. Validaciones backend
Alta:
- Verifica duplicado de `NumeroDocumento` cuando aplica documento.
- Verifica duplicado de `CuitCuil` cuando aplica CUIT/CUIL.
- Valida que exista el estado.
- Valida que exista ciudad si se envia `IdCiudad`.
- Valida que exista provincia si se envia `IdProvincia`.

Edicion:
- Valida existencia del cliente.
- Valida duplicados excluyendo el propio cliente.
- Valida ciudad y provincia cuando se envian.

Punto de atencion:
- El backend tiene validaciones antiguas que comparan `TipoCliente` con valores de persona (`Persona Fisica`, `Persona Juridica`). Como hoy `TipoCliente` representa categoria comercial, esas condiciones no se ejecutan para `Mayorista`, `Minorista` u `Otro`. La validacion fuerte de persona queda principalmente en frontend.

## 15. Alertas y estilos globales
Las confirmaciones usan SweetAlert2 via `AlertasService`.

El CSS de SweetAlert2 esta agregado en `frontend/angular.json`:
- `node_modules/sweetalert2/dist/sweetalert2.min.css`

Esto es importante para que los modales de confirmacion se vean correctamente y no aparezcan sin estilos.

Tambien existe una clase global:
- `.swal-high-zindex`

Se usa para mantener las alertas por encima de modales de la aplicacion.

## 16. UI y layout
El modulo usa estilos propios en:
- `clientes.component.css`
- `cliente-form.component.css`
- `cliente-filtros.component.css`
- estilos inline en `cliente-detalle-modal.component.ts`

Modal de crear/editar:
- Ancho maximo aproximado de `1180px`.
- Alto maximo `94vh`.
- En desktop usa dos columnas para compactar el formulario.
- En mobile vuelve a una columna.

Modal de detalle:
- Ancho maximo aproximado de `1080px`.
- Alto maximo `94vh`.
- En desktop usa dos columnas para compactar secciones.
- En mobile vuelve a una columna.

La tabla en mobile usa scroll horizontal.

## 17. Flujo resumido
Listado:
1. `ngOnInit()`.
2. `cargarClientes()`.
3. `GET /api/Cliente`.
4. Se renderiza `clientesFiltrados`.

Alta:
1. Click en `Nuevo Cliente`.
2. Abre `ClienteFormComponent` sin cliente.
3. Usuario completa formulario.
4. `guardar()`.
5. `POST /api/Cliente`.
6. Al exito, se cierra modal y se recarga el listado.

Edicion:
1. Click en editar.
2. Abre `ClienteFormComponent` con copia del cliente.
3. Precarga datos y ciudades si corresponde.
4. `PUT /api/Cliente/{id}`.
5. Al exito, se cierra modal y se recarga el listado.

Detalle:
1. Click en fila.
2. `GET /api/Cliente/{id}`.
3. Abre `ClienteDetalleModalComponent`.

Eliminacion:
1. Click en eliminar.
2. Confirmacion SweetAlert.
3. `DELETE /api/Cliente/{id}`.
4. Si no tiene relaciones, elimina y recarga.
5. Si tiene relaciones, muestra mensaje de negocio.

Exportacion:
1. Click en `Exportar`.
2. Seleccion de formato.
3. Exporta `clientesFiltrados`.

## 18. Comandos utiles
Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
dotnet build Backend/TESIS_OG/TESIS_OG.csproj -nologo
```

## 19. Riesgos y mejoras pendientes
- Revisar el filtro por provincia/ciudad del listado para que compare contra `idProvincia` e `idCiudad`, no contra nombres.
- Normalizar el estado inicial de filtros de categoria en `ClienteFiltrosComponent`.
- Llevar al backend una distincion explicita entre `tipoPersona` y `tipoCliente` si se necesita validacion fuerte del lado servidor.
- Considerar baja logica de clientes en lugar de eliminacion fisica si el negocio requiere conservar historico.
- Revisar si `cuitCuil` debe seguir separado o unificarse con `tipoDocumento`/`numeroDocumento`.
- Reducir logs `console.log` de servicios/componentes si se prepara una version final.
