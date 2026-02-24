# Modulo Talleres Externos

## Objetivo
El modulo **Talleres Externos** permite:
- Registrar y mantener talleres tercerizados.
- Consultar su detalle con la misma estetica de `Clientes` y `Proveedores`.
- Vincular talleres con proyectos.
- Filtrar proyectos por taller asignado.
- Asignar taller a un proyecto desde la lista de proyectos.

## Alcance funcional
### En Usuarios > Talleres Externos
- Listado de talleres con busqueda.
- Alta de taller (modal).
- Edicion de taller (modal).
- Eliminacion de taller con confirmacion.
- Detalle de taller (modal naranja, estilo proveedores/clientes).
- Acceso rapido para ver proyectos asignados.

### En Proyectos > Lista
- Boton para **Asignar Taller** por cada proyecto.
- Modal para seleccionar taller.
- Filtro por query param (`taller`) para mostrar solo proyectos de ese taller.

## Estructura frontend
### Rutas y navegacion
- `frontend/src/app/app.routes.ts`
  - Ruta: `/usuarios/talleres`
- `frontend/src/app/layouts/private-layout/private-layout.component.html`
  - Item de menu: `Talleres Externos` dentro de `Usuarios`.

### Archivos principales del modulo
- `frontend/src/app/modules/talleres/models/taller.model.ts`
  - Interfaces `Taller`, `NuevoTaller`, `ActualizarTaller`, `Provincia`, `Ciudad`.
- `frontend/src/app/modules/talleres/services/talleres.service.ts`
  - CRUD de talleres.
  - Provincias y ciudades.
  - Asignacion de proyecto a taller.
- `frontend/src/app/modules/talleres/components/talleres.component.ts`
  - Logica de listado, busqueda, detalle, alta/edicion, eliminacion.
- `frontend/src/app/modules/talleres/components/talleres.component.html`
  - Tabla principal estilo proveedores/clientes.
- `frontend/src/app/modules/talleres/components/talleres.component.css`
  - Estetica naranja y layout consistente con otros modulos.
- `frontend/src/app/modules/talleres/components/taller-form/taller-form.component.ts`
  - Formulario reactivo de alta/edicion.
- `frontend/src/app/modules/talleres/components/taller-form/taller-form.component.html`
  - Modal de formulario con secciones.
- `frontend/src/app/modules/talleres/components/taller-form/taller-form.component.css`
  - Estilos del modal de formulario.
- `frontend/src/app/modules/talleres/taller-detalle-modal.component.ts`
  - Modal de detalle con botones `Editar`, `Eliminar`, `Ver proyectos`.

### Integracion con proyectos
- `frontend/src/app/modules/proyectos/services/proyecto.service.ts`
  - Metodo `obtenerProyectosPorTaller(idTaller)`.
- `frontend/src/app/modules/proyectos/components/proyecto-lista/proyecto-list.component.ts`
  - Lectura de query params `taller` y `nombreTaller`.
  - Carga condicional de proyectos por taller.
  - Modal de asignacion de taller por proyecto.
- `frontend/src/app/modules/proyectos/components/proyecto-lista/proyecto-list.component.html`
  - Boton `Asignar Taller`.
  - Modal de seleccion de taller.
- `frontend/src/app/modules/proyectos/components/proyecto-lista/proyecto-list.component.css`
  - Estilos del boton/modal de asignacion.

## API backend
### Controlador
- `Backend/TESIS_OG/Controllers/TallerController.cs`

### Endpoints
- `GET /api/Taller`
  - Lista talleres con ciudad/provincia y resumen de asignaciones.
- `GET /api/Taller/{id}`
  - Detalle de taller.
- `POST /api/Taller`
  - Alta de taller.
- `PUT /api/Taller/{id}`
  - Edicion de taller.
- `DELETE /api/Taller/{id}`
  - Baja de taller (bloqueada si tiene proyectos asignados).
- `GET /api/Taller/{id}/proyectos`
  - Proyectos vinculados al taller.
- `POST /api/Taller/{idTaller}/proyectos/{idProyecto}`
  - Asigna taller a proyecto.
  - Regla actual: mantiene una sola asignacion vigente por proyecto (reemplaza anterior).

### DTOs backend
- `Backend/TESIS_OG/DTOs/Talleres/TallerCreateDTO.cs`
- `Backend/TESIS_OG/DTOs/Talleres/TallerEditDTO.cs`
- `Backend/TESIS_OG/DTOs/Talleres/TallerIndexDTO.cs`

## Modelo de datos esperado
### Tabla `Taller`
Campos usados por el modulo:
- `id_Taller`
- `nombre_Taller`
- `tipo_Taller`
- `responsable`
- `telefono`
- `email`
- `direccion`
- `id_Ciudad`

### Tabla `Detalle_Taller_Proyecto`
Campos usados por el modulo:
- `id_Detalle_Taller`
- `id_Taller`
- `id_Proyecto`
- `fecha_Asignacion`
- `estado_Taller`
- `observaciones`

## Flujo de uso recomendado
1. Crear taller desde `Usuarios > Talleres Externos`.
2. Completar datos de identificacion, contacto y ubicacion.
3. Desde `Proyectos > Lista`, usar `Asignar Taller` en el proyecto.
4. Confirmar taller en modal de asignacion.
5. Verificar relacion desde:
   - `Usuarios > Talleres Externos` -> boton `Ver proyectos`.
   - `Proyectos > Lista` con filtro por taller.

## Validaciones y reglas
- Nombre de taller requerido.
- Ciudad requerida.
- Provincia/ciudad deben corresponder entre si.
- Email validado por formato.
- No se permite eliminar taller con proyectos asignados.
- Asignacion de taller por proyecto:
  - Al asignar uno nuevo, se reemplaza la asignacion previa de ese proyecto.

## Checklist de pruebas manuales
### Talleres
- Alta valida.
- Alta invalida (sin nombre, sin ciudad).
- Edicion valida.
- Eliminacion sin proyectos asignados.
- Intento de eliminacion con proyectos asignados (debe bloquear).
- Visualizacion del modal detalle.

### Proyectos
- Asignar taller a proyecto desde lista.
- Reasignar proyecto a otro taller.
- Navegar a lista de proyectos filtrada por taller.
- Limpiar filtro de taller en lista de proyectos.

## Notas
- La interfaz de talleres fue alineada visualmente con los modulos `Proveedores` y `Clientes` (estilo naranja, tabla y modales).
- Los warnings de build actuales no corresponden a este modulo (son preexistentes en otras partes del sistema).
