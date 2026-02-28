# Documentacion Tecnica - Modulo Usuarios

## 1. Objetivo del modulo
El modulo `Usuarios Internos` permite:
- Listar usuarios internos.
- Crear usuario interno.
- Editar usuario interno.
- Baja logica (desactivar).
- Ver detalle con auditoria (fecha de creacion, ultima conexion y eventos).

Ademas, el frontend permite seleccionar subroles multiples para operarios, tomando los permisos disponibles.

## 2. Contexto funcional y de BD
Este modulo se apoya en la actualizacion de BD documentada en:
- `doc_usuarios_bd.md`

Tablas principales involucradas:
- `Usuario`
- `Rol`
- `Permiso`
- `Historial_Usuario`
- `UsuarioArea` (subroles por area)
- `UsuarioPermiso` (permisos puntuales por usuario)

## 3. Cambios aplicados recientemente
- El campo de ingreso de usuario se normalizo de `Email` a `UsuarioIngreso`.
- Se actualizo backend y contratos para usar `UsuarioIngreso`.
- El frontend de login y usuarios internos consume `usuarioIngreso` / `nombreUsuarioIngreso` segun DTO.

## 4. Frontend - estructura
Ruta principal:
- `/usuarios/internos`

Archivos clave:
- `frontend/src/app/modules/usuarios/components/usuarios-internos.component.ts`
- `frontend/src/app/modules/usuarios/components/usuarios-internos.component.html`
- `frontend/src/app/modules/usuarios/components/usuario-form/usuario-form.component.ts`
- `frontend/src/app/modules/usuarios/components/usuario-form/usuario-form.component.html`
- `frontend/src/app/modules/usuarios/components/usuario-detalle-modal/usuario-detalle-modal.component.ts`
- `frontend/src/app/modules/usuarios/services/usuarios.service.ts`
- `frontend/src/app/modules/usuarios/models/usuario.model.ts`

## 5. Frontend - comportamiento actual
### 5.1 Listado
Columnas visibles:
- Nombre de la persona
- Usuario ingreso
- Rol
- Estado
- Ultima conexion
- Acciones (editar, desactivar)

Incluye:
- Busqueda por nombre/apellido, usuario de ingreso, rol y estado.
- Badges de estado (`Activo` / `Inactivo`).

### 5.2 Alta y edicion
Formulario:
- Nombre
- Apellido
- Nombre de usuario (ingreso)
- Contrasena (con boton ver/ocultar)
- Rol
- Estado (solo edicion)
- Subrol multiple (solo si el rol contiene texto `operario`)

Validaciones frontend:
- Nombre y apellido obligatorios, minimo 2.
- Usuario de ingreso obligatorio, minimo 3.
- Contrasena obligatoria en alta, opcional en edicion.
- Rol obligatorio.

### 5.3 Baja logica
No elimina fisicamente:
- Cambia estado a `Inactivo`.

### 5.4 Detalle y auditoria
Muestra:
- Datos basicos del usuario.
- Fecha de creacion.
- Ultima conexion.
- Eventos de auditoria (accion, modulo, fecha).

## 6. Backend - endpoints
Controlador:
- `Backend/TESIS_OG/Controllers/LoginController.cs`

Base URL:
- `api/Login`

Endpoints usados por el modulo:
- `GET /api/Login/usuarios`
- `GET /api/Login/usuarios/{id}`
- `POST /api/Login/usuarios`
- `PUT /api/Login/usuarios/{id}`
- `DELETE /api/Login/usuarios/{id}`
- `GET /api/Login/usuarios/{id}/auditoria`
- `GET /api/Login/roles`
- `GET /api/Login/permisos`

Autenticacion general:
- `POST /api/Login/login`
- `POST /api/Login/registrar`

## 7. DTOs y contratos relevantes
Backend:
- `DTOs/Login/UsuarioInternoDTOs.cs`
- `DTOs/Login/LoginResponseDTO.cs`
- `DTOs/Login/UsuarioCreateDto.cs`
- `DTOs/Login/UsuarioListDTO.cs`

Frontend:
- `frontend/src/app/modules/usuarios/models/usuario.model.ts`
- `frontend/src/app/modules/login/models/auth.model.ts`

Campos clave:
- Persistencia: `Usuario.UsuarioIngreso`
- Front usuarios internos: `nombreUsuarioIngreso`
- Front login/auth response: `usuarioIngreso`

## 8. Persistencia actual y puntos hardcodeados
### 8.1 Persistido en BD
- Usuario base (`Usuario`): nombre, apellido, `UsuarioIngreso`, contrasena hasheada, rol, estado, fechas.
- Historial de eventos en `Historial_Usuario`.
- Catalogos de rol/permisos: `Rol`, `Permiso`.

### 8.2 Temporal/local (NO persistido en BD en este modulo)
Los subroles seleccionados en el formulario se guardan localmente en navegador:
- `localStorage` key: `usuarios_internos_subroles`
- Estructura: `Record<number, number[]>` (idUsuario -> ids permisos/subroles)

Esto se implemento como solucion transitoria hasta integrar guardado real en BD (`UsuarioArea` / `UsuarioPermiso`) desde API.

### 8.3 Hardcode funcional
- Alta de usuario interno crea estado por defecto: `Activo`.
- Acciones de auditoria grabadas con textos fijos:
  - `ALTA_USUARIO_INTERNO`
  - `MODIFICACION_USUARIO_INTERNO`
  - `BAJA_USUARIO_INTERNO`
  - `INICIO_SESION` (en login)
- El criterio de "es operario" en frontend usa `nombreRol.toLowerCase().includes('operario')`.

## 9. Login - comportamiento actual importante
Actualmente en `AuthService.LoginAsync` el login busca usuario por:
- `NombreUsuario`

No busca por `UsuarioIngreso` en ese metodo.

Impacto:
- Si se espera que el usuario ingrese con `UsuarioIngreso`, hay que ajustar ese query.

## 10. Seguridad actual
- Contrasena hasheada con BCrypt en alta/edicion.
- JWT generado en login.
- Se registra ultimo acceso y evento de inicio de sesion.

## 11. Datos de prueba
Script:
- `Backend/TESIS_OG/script_test_users.sql`

Usuarios de ejemplo documentados:
- `alanski` (admin)
- `franco` (operario)
- `octa` (deposito)

Nota:
- El script ya inserta columna `UsuarioIngreso`.

## 12. Pendientes recomendados
1. Persistir subroles/permisos seleccionados a BD (en vez de `localStorage`).
2. Unificar login para autenticar por `UsuarioIngreso` (si ese sera el identificador final de acceso).
3. Agregar validaciones de formato para `UsuarioIngreso` (caracteres permitidos, unicidad case-insensitive).
4. Mover endpoints de usuarios internos a un `UsuariosController` dedicado (opcional, para separar responsabilidades de Login).
5. Completar `usuarios.routes.ts` o eliminarlo si no se va a usar.

