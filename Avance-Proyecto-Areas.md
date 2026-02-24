# Avance de Proyecto por Áreas

## Objetivo
Gestionar el progreso operativo de un proyecto a través de etapas secuenciales (áreas), controlando qué se puede avanzar, cuándo se considera finalizado y cómo retroceder ante imprevistos.

## Modelo funcional
- Cada proyecto avanza por una secuencia de áreas de producción.
- Cada área posee un porcentaje de avance (0 a 100).
- El proyecto mantiene:
  - área actual,
  - progreso general,
  - estado global (`Pendiente`, `En Proceso`, `Finalizado`, etc.).

## Flujo general
1. Se selecciona un proyecto.
2. En el detalle del proyecto se visualizan todas las áreas y su porcentaje.
3. El usuario confirma el avance del área seleccionada.
4. El sistema registra el avance, recalcula el progreso general y enfoca la siguiente área.
5. Al completar la última área, el proyecto se marca como `Finalizado`.

## Reglas de negocio
- Solo se puede avanzar áreas cuando el proyecto está en estado `En Proceso`.
- El avance es secuencial:
  - no se puede completar un área si la anterior no está completa.
- Cada actualización de área queda registrada con porcentaje y fecha.
- Al completar todas las áreas:
  - el estado del proyecto pasa a `Finalizado`.
- Se puede retroceder al área anterior:
  - se deshace el último avance completo,
  - se recalculan área actual, progreso y estado del proyecto.

## Comportamiento esperado en interfaz
- Visualización de estado por área:
  - pendiente,
  - en progreso,
  - completa.
- Botón **Continuar**:
  - habilitado solo cuando se cumplen las reglas de avance,
  - deshabilitado (gris) cuando no corresponde avanzar.
- Actualización automática de:
  - porcentaje por área,
  - progreso general del proyecto,
  - selección visual de la siguiente etapa.
- Registro opcional de observaciones por avance.

## Persistencia y trazabilidad
- Se conserva historial de avances por proyecto y área.
- Se mantiene un estado resumido del proyecto para:
  - tablero operativo,
  - consultas por estado,
  - reportes de seguimiento.

## Estados y avance
- `Pendiente`: no habilita avance de áreas.
- `En Proceso`: habilita avance secuencial y retroceso.
- `Finalizado`: todas las áreas completas.
- Si se retrocede desde finalizado, el proyecto vuelve a `En Proceso`.

## Alcance actual
El módulo se enfoca en consistencia operativa del avance por etapas.  
Las restricciones por roles/permisos pueden incorporarse posteriormente sobre esta base.
