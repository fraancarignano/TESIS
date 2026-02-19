# Modulo de Proveedores

## Resumen
Se implemento el modulo de **Proveedores** dentro del apartado de **Usuarios**, con frontend y backend completos para CRUD.

- Tipo de proveedor: persona juridica
- Identificador fiscal principal: `CUIT`
- Flujo principal: listar, crear, editar, eliminar, ver detalle
- Ubicacion soportada: `provincia` y `ciudad` (opcional, con relacion entre ambas)

---

## Cambios destacados (actualizacion grande)
Se agrego soporte completo de **ubicacion por provincia/ciudad** en todo el modulo:

1. Base de datos:
   - Nuevas columnas en `Proveedor`: `id_Provincia` e `id_Ciudad`
   - Nuevas FK:
     - `FK_Proveedor_Provincia -> Provincia(id_Provincia)`
     - `FK_Proveedor_Ciudad -> Ciudad(id_Ciudad)`
   - Script de migracion para BD existente:
     - `database/migrations/2026-02-18_proveedor_ubicacion.sql`

2. Backend:
   - DTOs de proveedores extendidos con `idProvincia`, `idCiudad`, `nombreProvincia`, `nombreCiudad`
   - API valida existencia de provincia/ciudad y consistencia entre ambas
   - Listado y detalle devuelven nombres de ubicacion listos para mostrar en UI

3. Frontend:
   - Formulario de proveedor con selects de `Provincia -> Ciudad` en cascada
   - Tabla principal ahora muestra provincia y ciudad
   - Busqueda incluye provincia y ciudad
   - Modal de detalle muestra provincia y ciudad

---

## Estado actual
Con la base de datos ya actualizada (como la aplicaste), el modulo deberia estar funcionando.

Requisitos para probar:
1. Backend levantado (API en `https://localhost:7163`)
2. Frontend levantado (Angular)
3. Tabla `Proveedor` con columnas y FK nuevas aplicadas (`id_Provincia`, `id_Ciudad`)

---

## Cambios de Base de Datos
Se considero la tabla `Proveedor` con estos campos:

- `id_Proveedor` (PK)
- `nombre_Proveedor` (obligatorio)
- `cuit` (obligatorio, unico)
- `telefono` (nullable)
- `email` (nullable)
- `direccion` (nullable)
- `id_Provincia` (nullable, FK a `Provincia`)
- `id_Ciudad` (nullable, FK a `Ciudad`)
- `observaciones` (nullable)
- `fecha_Alta` (obligatorio, default fecha actual)

Nota: la validacion de formato de CUIT se dejo en frontend (segun decision del equipo).

### Script para entornos existentes
Archivo: `database/migrations/2026-02-18_proveedor_ubicacion.sql`

Que hace:
1. Agrega `id_Provincia` si no existe
2. Agrega `id_Ciudad` si no existe
3. Crea `FK_Proveedor_Provincia` si no existe
4. Crea `FK_Proveedor_Ciudad` si no existe

---

## Backend (API .NET)

### Endpoints
Controlador: `Backend/TESIS_OG/Controllers/ProveedorController.cs`

- `GET /api/Proveedor`
  - Lista todos los proveedores
- `GET /api/Proveedor/{id}`
  - Devuelve proveedor por id
- `POST /api/Proveedor`
  - Crea proveedor
- `PUT /api/Proveedor/{id}`
  - Actualiza proveedor
- `DELETE /api/Proveedor/{id}`
  - Elimina proveedor (si no tiene relaciones activas)

### Reglas backend implementadas
- `nombreProveedor` obligatorio
- `cuit` obligatorio
- No permite CUIT duplicado
- Si viene `idProvincia`, valida que exista
- Si viene `idCiudad`, valida que exista
- Si vienen ambos, valida que la ciudad pertenezca a la provincia
- No permite eliminar proveedor si tiene:
  - insumos asociados
  - ordenes de compra asociadas

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Proveedores/`

- `ProveedorCreateDTO.cs`
- `ProveedorEditDTO.cs`
- `ProveedorIndexDTO.cs`

### Modelo y mapeo EF
- Modelo: `Backend/TESIS_OG/Models/Proveedor.cs`
- DbContext principal: `Backend/TESIS_OG/Data/TamarindoDbContext.cs`
- DbContext scaffold alternativo: `Backend/TESIS_OG/Models/TamarindoDbContext.cs`

Se mapearon todos los campos nuevos (`telefono`, `email`, `direccion`, `id_Provincia`, `id_Ciudad`, `observaciones`, `fecha_Alta`).

---

## Frontend (Angular)

### Ruta
Se agrego en `frontend/src/app/app.routes.ts`:

- `'/usuarios'` redirige a `'/usuarios/proveedores'`
- `'/usuarios/proveedores'` carga `ProveedoresComponent` con `authGuard`

### Modulo Proveedores (archivos)
Ubicacion: `frontend/src/app/modules/proveedores/`

- `components/proveedores.component.ts`
- `components/proveedores.component.html`
- `components/proveedores.component.css`
- `components/proveedor-form/proveedor-form.component.ts`
- `components/proveedor-form/proveedor-form.component.html`
- `components/proveedor-form/proveedor-form.component.css`
- `proveedor-detalle-modal.component.ts`
- `models/proveedor.model.ts`
- `services/proveedores.service.ts`
- `proveedores.routes.ts`

### Comportamiento en UI
- Listado con busqueda
- Alta de proveedor
- Edicion de proveedor
- Baja con confirmacion
- Modal de detalle
- Campo fiscal principal: CUIT
- Select de provincia
- Select de ciudad filtrado por provincia
- Tabla con columnas de provincia y ciudad
- Busqueda por provincia/ciudad

---

## Contrato JSON esperado

### Crear / editar proveedor (request)
```json
{
  "nombreProveedor": "Textiles del Centro SA",
  "cuit": "30-12345678-9",
  "telefono": "+54 351 444-7788",
  "email": "compras@textilescentro.com",
  "direccion": "Av. Siempre Viva 123",
  "idProvincia": 2,
  "idCiudad": 18,
  "observaciones": "Proveedor estrategico"
}
```

### Respuesta de proveedor (index/detail)
```json
{
  "idProveedor": 10,
  "nombreProveedor": "Textiles del Centro SA",
  "cuit": "30-12345678-9",
  "telefono": "+54 351 444-7788",
  "email": "compras@textilescentro.com",
  "direccion": "Av. Siempre Viva 123",
  "idProvincia": 2,
  "idCiudad": 18,
  "nombreProvincia": "Cordoba",
  "nombreCiudad": "Villa Maria",
  "observaciones": "Proveedor estrategico",
  "fechaAlta": "2026-02-18"
}
```

---

## Verificacion tecnica realizada
Se ejecuto build y compilo correctamente:

- Frontend: `npm run build`
- Backend: `dotnet build Backend/TESIS_OG/TESIS_OG.csproj`

Hay warnings preexistentes del proyecto, pero sin errores bloqueantes para este modulo.

---

## Checklist rapido de QA
1. Crear proveedor nuevo
2. Verificar que aparezca en listado
3. Crear proveedor con provincia y ciudad
4. Editar proveedor cambiando provincia y validar que cambien ciudades disponibles
5. Ver detalle y validar provincia/ciudad
6. Buscar proveedor por nombre de provincia o ciudad
7. Eliminar proveedor sin relaciones
8. Intentar eliminar proveedor con relaciones (debe bloquear)
9. Intentar crear CUIT duplicado (debe bloquear)
10. Probar ciudad que no corresponde a provincia (debe rechazar backend)

---

## Notas
- Este modulo es la primera parte del bloque **Usuarios**.
- Queda pendiente implementar (si aplica):
  - usuarios internos
  - talleres externos
