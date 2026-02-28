# Actualización de Base de Datos: Módulo de Usuarios y Roles

Se ha implementado una nueva estructura en la base de datos para manejar **Subroles** (basados en áreas de producción) y **Permisos Específicos** por usuario, además de los roles principales.

## 🛠️ Cambios Estructurales

1. **Tabla `UsuarioArea` (Subroles)**
   - Permite asignar a un operario a múltiples áreas de producción.
   - **Campos:** `id_Usuario`, `id_Area`.
   - **Ejemplo:** Un usuario con rol "Operario" puede estar asignado a las áreas de "Corte" y "Diseño" simultáneamente.

2. **Tabla `UsuarioPermiso` (Permisos Especiales)**
   - Permite otorgar o denegar acciones de forma individualizada a un usuario, saltándose las reglas estrictas de su Rol base.
   - **Campos:** `id_Usuario`, `id_Permiso`, `puede_Acceder` (booleano).
   - **Ejemplo:** A un usuario específico se le puede dar permiso extra para editar inventario en Producción, aunque el resto de los operarios no puedan.

*(Los scripts SQL para aplicar estas tablas ya están en el repositorio: `script_roles_permisos.sql`)*.

---

## 👥 Usuarios de Prueba Creados

Para facilitar las pruebas de desarrollo, se han generado los siguientes usuarios iniciales (todos tienen la contraseña base `123456`):

1. **👑 Alan Herrera (`alanski`)**
   - **Rol:** Admin/Gerente/Dueño (Ve todo y audita).
   - **Nivel de Acceso:** ID Rol 1.

2. **✂️ Franco (`franco`)**
   - **Rol Principal:** Operario (ID Rol 3).
   - **Subrol (Área Asignada):** Corte. Solo verá sus proyectos asignados y filtrados.

3. **📦 Octa (`octa`)**
   - **Rol Principal:** Depósito (ID Rol 4).
   - **Permisos Base:** Ve inventario, ubicaciones y reportes de estado crítico.

*(El script SQL para insertar/actualizar estos usuarios de prueba está en el repositorio: `script_test_users.sql`)*.
