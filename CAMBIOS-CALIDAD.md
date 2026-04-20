# Cambios en Sistema de Control de Calidad

## Problema Resuelto
Las prendas rechazadas no se guardaban en el backend, solo se mostraban en memoria temporalmente.

## Solución Implementada

### 1. Guardado Automático en Backend
Cuando se guarda una inspección de calidad con criterios marcados como "No cumple":
- Se crean automáticamente incidencias en el backend para cada combinación prenda-talle
- Cada incidencia incluye:
  - Nombre de prenda y talle
  - Cantidad inspeccionada
  - Lista de criterios rechazados
  - Observaciones de cada criterio
  - Estado inicial: PENDIENTE

### 2. Carga desde Backend
Al abrir el área de calidad:
- Se cargan todas las incidencias del proyecto desde el backend
- Se filtran solo las no cerradas (PENDIENTE, EN_TALLER, REINGRESADA)
- Se convierten a formato de "prendas rechazadas" para mostrar en la UI
- Se agrupan por prenda-talle

### 3. Flujo Completo

#### Paso 1: Inspección
```
Inspector evalúa criterios → Marca "No cumple" → Agrega observaciones → Guarda inspección
```

#### Paso 2: Guardado Automático
```
Sistema crea incidencias en backend automáticamente
Estado: PENDIENTE
```

#### Paso 3: Devolución a Taller
```
Usuario hace clic en "Devolver a taller"
Estado cambia: PENDIENTE → EN_TALLER
```

#### Paso 4: Recepción
```
Usuario hace clic en "Recibir y controlar"
Estado cambia: EN_TALLER → REINGRESADA
```

#### Paso 5: Aprobación
```
Usuario hace clic en "Aprobar prenda"
Estado cambia: REINGRESADA → CERRADA
Prenda desaparece de la lista (filtrada)
```

## Código Clave

### Guardado Automático
```typescript
async guardarPrendasRechazadasEnBackend(cantidadesTalle: Record<string, number>): Promise<void> {
  const criteriosRechazados = this.criteriosCalidad.filter(c => c.resultado === 'no_cumple');
  
  if (criteriosRechazados.length === 0) return;

  // Crear incidencia por cada prenda-talle con cantidad > 0
  for (const prenda of prendas) {
    for (const [talle, cantidad] of Object.entries(cantidadesTalle)) {
      if (cantidad > 0) {
        await this.calidadIncidenciasService.crear(idProyecto, {
          nombrePrenda: prenda,
          talle: talle,
          cantidad: cantidad,
          criterioNombre: criteriosRechazados.map(c => c.nombre).join(', '),
          detalleFalla: criteriosRechazados.map(c => `${c.nombre}: ${c.observacion}`).join('; ')
        });
      }
    }
  }
}
```

### Conversión de Incidencias a Prendas Rechazadas
```typescript
convertirIncidenciasAPrendasRechazadas(): void {
  const prendasMap = new Map<string, PrendaRechazada>();

  this.incidenciasCalidad
    .filter(inc => inc.estado !== 'CERRADA') // Solo no cerradas
    .forEach(inc => {
      const key = `${inc.nombrePrenda}-${inc.talle}`;
      
      if (!prendasMap.has(key)) {
        prendasMap.set(key, {
          id: key,
          nombrePrenda: inc.nombrePrenda,
          talle: inc.talle,
          cantidad: inc.cantidad,
          estado: inc.estado,
          criteriosRechazados: [],
          idCalidadIncidencia: inc.idCalidadIncidencia
        });
      }

      // Agregar criterios rechazados
      const prenda = prendasMap.get(key)!;
      prenda.criteriosRechazados.push(...);
    });

  this.prendasRechazadas = Array.from(prendasMap.values());
}
```

## Beneficios

✅ **Persistencia**: Las prendas rechazadas se guardan en la base de datos
✅ **Trazabilidad**: Historial completo de cada prenda rechazada
✅ **Automático**: No requiere acción manual del usuario
✅ **Sincronización**: La lista se actualiza automáticamente desde el backend
✅ **Estados claros**: PENDIENTE → EN_TALLER → REINGRESADA → CERRADA

## Notas Importantes

- Las incidencias se crean automáticamente al guardar la inspección
- Solo se muestran incidencias no cerradas (estado !== 'CERRADA')
- Al aprobar una prenda, se cierra la incidencia y desaparece de la lista
- La lista se recarga desde el backend después de cada acción
- Cada combinación prenda-talle genera una incidencia separada
