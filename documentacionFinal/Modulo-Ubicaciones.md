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
