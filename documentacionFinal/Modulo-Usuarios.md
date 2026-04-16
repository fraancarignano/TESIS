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
