# Requirements Document

## Introduction

Esta feature agrega un filtro de proyectos en el selector del componente **Asignar Material a Proyecto** (ruta: Inventario → Transferir Insumos → Asignar a Proyectos). El objetivo es que el selector únicamente muestre proyectos que sean candidatos válidos para recibir asignación de materiales: proyectos que aún no iniciaron producción (estado `Pendiente`) y proyectos en producción que todavía no llegaron a la etapa de Corte. Los proyectos que ya alcanzaron la etapa de Corte o cualquier etapa posterior no necesitan más asignación de insumos desde este módulo, por lo que deben ocultarse del selector.

---

## Glossary

- **Proyecto**: Entidad principal del sistema que representa un pedido de confección con un estado y un avance por áreas de producción.
- **Estado_Proyecto**: Valor de cadena que indica el ciclo de vida del proyecto. Valores posibles conocidos: `Pendiente`, `En Proceso`, `Finalizado`, `Despachado`, `Cancelado`, `Pausado`, `Anulado`, `Archivado`.
- **Área_Actual**: Campo `areaActual` del proyecto que indica en qué etapa de producción se encuentra actualmente el proyecto.
- **Etapa_Corte**: La segunda área de la secuencia de producción, identificada por el nombre `"Corte"`. Una vez que un proyecto llega a esta etapa, los materiales ya fueron asignados previamente.
- **Etapa_Pre_Corte**: Cualquier área cuyo orden en la secuencia de producción sea anterior a `Etapa_Corte`. En la configuración actual, únicamente la etapa `"Diseño y Desarrollo"` (orden 1) cumple esta condición.
- **Selector_Proyecto**: El elemento `<select>` del componente `ProyectoTransferComponent` que permite elegir a qué proyecto asignar material.
- **Filtro_Proyectos**: La función de filtrado del lado del cliente (frontend) que determina qué proyectos son visibles en el `Selector_Proyecto`.
- **AvanceCorte**: Campo numérico (0-100) en el modelo de proyecto que representa el porcentaje de avance del área de Corte.

---

## Requirements

### Requirement 1: Incluir proyectos en estado Pendiente

**User Story:** Como operador de inventario, quiero ver en el selector únicamente los proyectos que pueden recibir materiales, para no asignar insumos a proyectos que ya no los necesitan en esta etapa.

#### Acceptance Criteria

1. WHEN se carga el `Selector_Proyecto`, THE `Filtro_Proyectos` SHALL incluir en el `Selector_Proyecto` todo proyecto cuyo `Estado_Proyecto` sea `"Pendiente"`, independientemente del valor de `AvanceCorte` o de `Área_Actual`.
2. WHEN se carga el `Selector_Proyecto`, THE `Filtro_Proyectos` SHALL excluir del `Selector_Proyecto` todo proyecto cuyo `Estado_Proyecto` sea `"Finalizado"`.
3. WHEN se carga el `Selector_Proyecto`, THE `Filtro_Proyectos` SHALL excluir del `Selector_Proyecto` todo proyecto cuyo `Estado_Proyecto` sea `"Cancelado"`.
4. WHEN se carga el `Selector_Proyecto`, THE `Filtro_Proyectos` SHALL excluir del `Selector_Proyecto` todo proyecto cuyo `Estado_Proyecto` sea `"Despachado"`.
5. WHEN se carga el `Selector_Proyecto`, THE `Filtro_Proyectos` SHALL excluir del `Selector_Proyecto` todo proyecto cuyo `Estado_Proyecto` sea `"Archivado"`.
6. WHEN se carga el `Selector_Proyecto`, THE `Filtro_Proyectos` SHALL excluir del `Selector_Proyecto` todo proyecto cuyo `Estado_Proyecto` sea `"Anulado"`.
7. IF el `Estado_Proyecto` de un proyecto es `null`, `undefined`, o un valor fuera del conjunto de estados conocidos, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del `Selector_Proyecto`.

---

### Requirement 2: Incluir proyectos "En Proceso" cuya etapa actual es anterior a Corte

**User Story:** Como operador de inventario, quiero poder asignar materiales a proyectos en producción que todavía no llegaron a la etapa de Corte, para completar la preparación de insumos antes de que comiencen a cortar.

#### Acceptance Criteria

1. IF el `Estado_Proyecto` es `"En Proceso"` AND el campo `AvanceCorte` del proyecto es `0`, THEN THE `Filtro_Proyectos` SHALL incluir ese proyecto en el `Selector_Proyecto`.
2. IF el `Estado_Proyecto` es `"En Proceso"` AND el campo `AvanceCorte` del proyecto es mayor que `0`, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del `Selector_Proyecto`.
3. IF el `Estado_Proyecto` es `"En Proceso"` AND el campo `AvanceCorte` del proyecto es `null` o `undefined`, THEN THE `Filtro_Proyectos` SHALL tratar dicho valor como `0` e incluir el proyecto en el `Selector_Proyecto`.
4. IF el `Estado_Proyecto` es `"En Proceso"` AND el campo `AvanceCorte` del proyecto es un valor negativo o mayor que `100`, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del `Selector_Proyecto` por datos fuera de rango.

---

### Requirement 3: Excluir proyectos "En Proceso" en etapa Corte o posterior

**User Story:** Como operador de inventario, quiero que el selector oculte los proyectos que ya iniciaron o completaron el Corte, para evitar confusión y asignaciones innecesarias.

#### Acceptance Criteria

1. IF el `Estado_Proyecto` es `"En Proceso"` AND el campo `AvanceCorte` es mayor que `0`, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del `Selector_Proyecto`, independientemente del valor de `Área_Actual`.
2. IF el `Estado_Proyecto` es `"En Proceso"` AND el campo `AvanceCorte` es `0`, `null` o `undefined`, THEN THE `Filtro_Proyectos` SHALL incluir ese proyecto en el `Selector_Proyecto`.
3. WHEN el `Selector_Proyecto` es cargado o recargado, THE `Filtro_Proyectos` SHALL evaluar la condición de `AvanceCorte` en ese momento para cada proyecto con `Estado_Proyecto` igual a `"En Proceso"`.

---

### Requirement 4: Comportamiento de la lógica de filtrado como función pura

**User Story:** Como desarrollador, quiero que la lógica de filtrado esté encapsulada en una función reutilizable y testeable, para poder verificar su correctitud con distintos conjuntos de proyectos.

#### Acceptance Criteria

1. THE `Filtro_Proyectos` SHALL implementarse como una función pura que recibe un arreglo de proyectos y retorna un subconjunto filtrado, sin mutar el arreglo de entrada y sin producir efectos observables fuera del valor retornado.
2. WHEN se invoca el `Filtro_Proyectos` dos veces consecutivas sobre el mismo arreglo de entrada sin modificaciones intermedias, THE `Filtro_Proyectos` SHALL producir el mismo resultado en ambas ejecuciones, en el mismo orden (determinismo).
3. THE `Filtro_Proyectos` SHALL retornar únicamente proyectos que estaban presentes en el arreglo de entrada; no SHALL agregar proyectos nuevos al resultado.
4. WHEN el arreglo de entrada está vacío, THE `Filtro_Proyectos` SHALL retornar un arreglo vacío.
5. THE `Filtro_Proyectos` SHALL excluir del resultado todo proyecto cuyo `Estado_Proyecto` sea `"Finalizado"`, `"Cancelado"`, `"Despachado"`, `"Archivado"` o `"Anulado"`.
6. THE `Filtro_Proyectos` SHALL excluir del resultado todo proyecto cuyo `Estado_Proyecto` sea `"En Proceso"` y cuyo `AvanceCorte` no sea `0` ni `null`.
7. IF el `Estado_Proyecto` de un proyecto no pertenece al conjunto de valores conocidos, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del resultado.

---

### Requirement 5: Proyectos en estado Pausado

**User Story:** Como operador de inventario, quiero saber si los proyectos pausados deben aparecer en el selector, para no tener ambigüedad en el comportamiento del filtro.

#### Acceptance Criteria

1. IF el `Estado_Proyecto` es `"Pausado"` AND el campo `AvanceCorte` es `0` o `null`, THEN THE `Filtro_Proyectos` SHALL incluir ese proyecto en el `Selector_Proyecto`.
2. IF el `Estado_Proyecto` es `"Pausado"` AND el campo `AvanceCorte` es mayor que `0`, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del `Selector_Proyecto`.
3. IF el `Estado_Proyecto` es `"Pausado"` AND el campo `AvanceCorte` es un valor negativo, THEN THE `Filtro_Proyectos` SHALL excluir ese proyecto del `Selector_Proyecto` por datos fuera de rango.
