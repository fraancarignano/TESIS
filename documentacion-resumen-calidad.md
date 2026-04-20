# Sistema de Control de Calidad - Prendas Rechazadas

## Descripción
Sistema simplificado para gestionar prendas que no aprueban el control de calidad. Cuando se detectan criterios que no cumplen durante la inspección, las prendas se registran automáticamente y se pueden devolver al taller para reproceso.

## Flujo de Trabajo

### 1. Inspección de Calidad
- El inspector evalúa cada criterio de calidad (costuras, medidas, manchas, color, etc.)
- Marca los criterios como: Cumple, No cumple, No aplica o Pendiente
- Ingresa observaciones para cada criterio rechazado
- Especifica la cantidad de prendas inspeccionadas por talle

### 2. Detección Automática de Prendas Rechazadas
Al guardar la inspección, si hay criterios marcados como "No cumple":
- Se crea automáticamente un registro de prenda rechazada
- Se incluyen todos los criterios que no cumplen con sus observaciones
- La prenda queda en estado "PENDIENTE"

### 3. Devolución a Taller
- El inspector puede devolver la prenda al taller con el botón "Devolver a taller"
- Se crea una incidencia en el backend con todos los detalles
- La prenda cambia a estado "EN_TALLER"

### 4. Recepción del Taller
- Cuando la prenda vuelve del taller, se usa el botón "Recibir y controlar"
- La prenda cambia a estado "REINGRESADA"
- Indica que debe ser controlada nuevamente

### 5. Aprobación Final
- Después de reinspeccionar la prenda, si ahora cumple con los criterios
- Se usa el botón "Aprobar prenda"
- La incidencia se cierra y la prenda se elimina de la lista de rechazadas

## Estados de Prendas Rechazadas

1. **PENDIENTE**: Prenda detectada con fallas, pendiente de envío a taller
2. **EN_TALLER**: Prenda enviada al taller para reproceso
3. **REINGRESADA**: Prenda que volvió del taller, pendiente de recontrol

## Interfaz de Usuario

### Sección "Prendas que no aprueban calidad"
Muestra una lista de prendas rechazadas con:
- **Nombre de prenda y talle**
- **Cantidad de unidades**
- **Estado actual** (con colores diferenciados)
- **Lista de criterios rechazados** con sus observaciones
- **Botones de acción** según el estado:
  - Pendiente → "Devolver a taller"
  - En taller → "Recibir y controlar"
  - Reingresada → "Aprobar prenda"

## Integración con Backend

### Creación de Incidencia
Cuando se devuelve una prenda al taller:
```typescript
POST /api/proyectos/{idProyecto}/calidad-incidencias
{
  "idTaller": number,
  "nombrePrenda": string,
  "talle": string,
  "criterioId": string,
  "criterioNombre": string, // Lista de criterios separados por coma
  "cantidad": number,
  "detalleFalla": string // Detalle de todos los criterios rechazados
}
```

### Cambio de Estado
```typescript
PUT /api/proyectos/{idProyecto}/calidad-incidencias/{id}/estado
{
  "estado": "EN_TALLER" | "REINGRESADA" | "CERRADA"
}
```

## Beneficios

- ✅ **Automático**: Las prendas rechazadas se detectan automáticamente al guardar la inspección
- ✅ **Trazabilidad**: Cada prenda tiene un registro completo de sus fallas y su recorrido
- ✅ **Control de flujo**: Estados claros que guían el proceso de reproceso
- ✅ **Integración**: Se conecta con el sistema de incidencias existente
- ✅ **Simple**: Interfaz clara con botones específicos para cada acción

## Notas Técnicas

- Las prendas rechazadas se almacenan en memoria en el componente
- Al devolver a taller, se crea una incidencia en el backend
- Los cambios de estado se sincronizan con el backend
- Al aprobar, la prenda se elimina de la lista local y la incidencia se cierra en el backend
- El resumen por talle se actualiza automáticamente con cada cambio de estado

