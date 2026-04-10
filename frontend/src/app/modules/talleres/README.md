# Manual de Usuario – Modulo Talleres

Este manual explica como usar el modulo de Talleres desde la interfaz y agrega la parte tecnica de cada pantalla y servicio.

## Pantallas principales

### 1) Listado de Talleres
Archivo: `components/talleres.component.*`

**Para que sirve**
- Ver todos los talleres externos.
- Buscar por nombre, tipo, responsable, telefono, email, provincia o ciudad.
- Crear, editar o eliminar talleres.
- Ver detalle y proyectos asignados.

**Acciones**
1. Usar el buscador para filtrar talleres.
2. Click en “Nuevo taller” para crear.
3. Click en “Editar” para modificar.
4. Click en un taller para ver su detalle.
5. Click en “Ver proyectos” para ir a Proyectos filtrados por taller.
6. Eliminar un taller (requiere confirmacion).

**Parte tecnica (codigo)**
- Carga: `cargarTalleres()` -> `TalleresService.obtenerTalleres()`.
- Busqueda: `talleresFiltrados` filtra por campos de `Taller`.
- Navegacion a proyectos: `router.navigate(['/proyectos/lista'], { queryParams: { taller, nombreTaller } })`.
- Eliminacion: `eliminarTaller()` / `eliminarTallerDesdeDetalle()` -> `TalleresService.eliminarTaller()`.
- Modal detalle: `TallerDetalleModalComponent` (standalone) con acciones de editar/eliminar/ver proyectos.

### 2) Formulario de Taller (alta/edicion)
Archivo: `components/taller-form/taller-form.component.*`

**Para que sirve**
- Crear un taller nuevo.
- Editar un taller existente.

**Acciones**
1. Completar datos basicos (nombre, tipo, responsable, contacto).
2. Seleccionar provincia y ciudad.
3. Guardar o cancelar.

**Parte tecnica (codigo)**
- Formulario reactivo con validaciones: nombre requerido, email valido, provincia/ciudad requeridas.
- Cascada provincia -> ciudad: `configurarCascadaProvinciaCiudad()`.
- Guardado:
  - Alta: `TalleresService.agregarTaller()`.
  - Edicion: `TalleresService.actualizarTaller()`.
- Confirmacion al cancelar si hay cambios: `alertas.confirmar()`.

### 3) Detalle de Taller (modal)
Archivo: `taller-detalle-modal.component.ts`

**Para que sirve**
- Ver datos completos del taller.
- Acciones rapidas: editar, eliminar, ver proyectos.

**Parte tecnica (codigo)**
- Standalone component con template inline.
- Inputs/Outputs: `taller`, `cerrar`, `editar`, `eliminar`, `verProyectos`.

## Modelos
Archivo: `models/taller.model.ts`
- `Taller`: entidad principal con contacto y ubicacion.
- `NuevoTaller`: payload para crear.
- `ActualizarTaller`: payload para actualizar.
- `Provincia`, `Ciudad`: catalogos para select.

## Servicios (API)
Archivo: `services/talleres.service.ts`

**Base URLs**
- Talleres: `${environment.apiUrl}/Taller`
- Provincias: `${environment.apiUrl}/Provincia`
- Ciudades: `${environment.apiUrl}/Ciudad`

**Endpoints utilizados**
- `GET /Taller` -> listar talleres.
- `GET /Taller/{id}` -> detalle de taller.
- `POST /Taller` -> crear.
- `PUT /Taller/{id}` -> actualizar.
- `DELETE /Taller/{id}` -> eliminar.
- `GET /Provincia` -> listar provincias.
- `GET /Ciudad/provincia/{idProvincia}` -> listar ciudades por provincia.
- `POST /Taller/{idTaller}/proyectos/{idProyecto}` -> asignar proyecto a taller.

**Manejo de errores**
- `handleError()` normaliza mensajes comunes: 404, 500, sin conexion, mensaje del backend.

## Flujo de datos (alto nivel)
1. `TalleresComponent` carga talleres desde API.
2. Usuario filtra y selecciona acciones.
3. Para crear/editar, se abre `TallerFormComponent`.
4. Provincias y ciudades se cargan dinamicamente.
5. El detalle se muestra con `TallerDetalleModalComponent`.

## Reglas importantes
- Provincia y ciudad son obligatorias en el formulario.
- La eliminacion requiere confirmacion.
- La opcion “Ver proyectos” abre `Proyectos/Listado` filtrado por taller.

## Preguntas frecuentes

**1. No aparecen ciudades al seleccionar provincia**
Verificar que exista endpoint `GET /Ciudad/provincia/{idProvincia}` y que devuelva datos.

**2. No puedo guardar el taller**
Revisar campos obligatorios (nombre, provincia, ciudad) y formato de email.

**3. Eliminar taller falla**
Puede haber proyectos asociados o una regla en backend que lo impida.
