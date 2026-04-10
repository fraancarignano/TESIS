# Flujo de Uso del Sistema

Este documento describe cómo se usa el sistema en la práctica, dividido en dos grandes ramas de trabajo: la **gestión de proyectos** (desde el cliente hasta el despacho) y la **gestión de insumos y stock** (desde los proveedores hasta el reabastecimiento). También se indica qué puede hacer cada rol en cada etapa.

---

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **Administrador** | Acceso total. Gestiona usuarios, configura el sistema, aprueba operaciones y tiene visibilidad completa. |
| **Supervisor** | Supervisa el avance de proyectos y puede gestionar muestras, proyectos y despachos. |
| **Operario** | Trabaja en áreas de producción asignadas. Registra el avance de su área y confirma recepciones físicas de materiales. |
| **Depósito** | Gestiona el stock, recibe materiales y confirma el control físico de las órdenes de compra. |

---

## Rama 1 — Gestión de Proyectos

Esta rama cubre todo el ciclo de vida de un pedido: desde que se registra un cliente hasta que la prenda sale despachada con su código de empaquetado.

---

### Paso 1 — Registrar el Cliente

Todo empieza con el cliente. Antes de hacer cualquier cosa, el cliente tiene que estar cargado en el sistema.

Se registran sus datos básicos: nombre o razón social, contacto, dirección, etc.

**¿Quién lo hace?** Administrador o Supervisor.

---

### Paso 2 — Crear una Muestra

Antes de arrancar la producción, el cliente pide una muestra para validar el diseño. La muestra es el prototipo: define qué tipo de prenda se va a hacer, el material, el color, si lleva bordado o estampado, y cómo se ve (mockup).

La muestra pasa por un proceso de aprobación:

```
Pendiente → Aprobada
         → Rechazada (se devuelve con comentario para corregir)
```

Mientras no esté aprobada, no se puede avanzar a producción.

**¿Quién lo hace?**
- Administrador o Supervisor crean y gestionan la muestra.
- El rechazo o aprobación queda registrado con comentarios para trazabilidad.

---

### Paso 3 — Crear el Proyecto

Con el cliente registrado y la muestra aprobada, se crea el proyecto de producción. El proyecto es la orden de trabajo real: define cuántas prendas se van a hacer, en qué talles, con qué materiales, y para cuándo.

Al crear el proyecto, el sistema calcula automáticamente los materiales necesarios según el tipo de prenda. También se puede agregar manualmente hilos, accesorios u otros materiales que no se calculan solos.

Una vez creado, la muestra se vincula al proyecto para mantener la trazabilidad del diseño.

El proyecto arranca en estado **Pendiente**.

**¿Quién lo hace?** Administrador o Supervisor.

---

### Paso 4 — Verificar el Stock

Antes de arrancar la producción, el sistema verifica si hay suficiente material en stock para cubrir el proyecto. Si falta algo, se genera una alerta.

Si hay faltantes, se debe gestionar una orden de compra (ver Rama 2 — Gestión de Insumos).

**¿Quién lo hace?** Administrador, Supervisor o Depósito.

---

### Paso 5 — Producción por Áreas

Una vez que el stock está confirmado, el proyecto pasa a **En Proceso** y comienza a avanzar por las áreas de producción en orden:

| # | Área | Descripción |
|---|------|-------------|
| 1 | Gerencia y Administración | Coordinación y aprobación inicial |
| 2 | Diseño y Desarrollo | Patrones, diseño técnico, ajustes |
| 3 | Corte | Corte de telas según los patrones |
| 4 | Confección | Armado y costura de las prendas |
| 5 | Etiquetado y Empaquetado | Etiquetado, doblado y preparación para despacho |

Cada área debe completarse al 100% antes de pasar a la siguiente. Si hay un error, se puede retroceder al área anterior.

Cada avance queda registrado con la fecha y el usuario que lo realizó. Se pueden agregar observaciones en cualquier momento.

Cuando el área 5 llega al 100%, el proyecto pasa automáticamente a **Finalizado**.

**¿Quién lo hace?**
- Administrador y Supervisor pueden avanzar cualquier área.
- Operario solo puede avanzar las áreas que tiene asignadas.

---

### Paso 6 — Despacho y Código de Empaquetado

Con el proyecto finalizado, se genera el despacho. El sistema crea automáticamente un **código único de empaquetado** que identifica el envío.

Ese código se puede imprimir como QR y pegarlo en el paquete. Al escanearlo, muestra todos los datos del proyecto: cliente, prendas, cantidades y talles.

El flujo del despacho es:

```
Proyecto Finalizado
    → Se genera el despacho con código único (ej: DSP-45-A3F2)
    → Se asigna la ubicación en el depósito
    → Se marca como Despachado
    → Proyecto pasa a estado "Despachado"
```

**¿Quién lo hace?** Administrador, Supervisor o Depósito.

---

### Resumen visual — Gestión de Proyectos

```
Cliente registrado
    └── Muestra (diseño + aprobación del cliente)
          └── Proyecto creado (Pendiente)
                └── Verificación de stock
                      └── Producción en proceso
                            ├── Área 1: Gerencia y Administración
                            ├── Área 2: Diseño y Desarrollo
                            ├── Área 3: Corte
                            ├── Área 4: Confección
                            └── Área 5: Etiquetado y Empaquetado
                                  └── Proyecto Finalizado
                                        └── Despacho → Código QR de empaquetado
```

---

## Rama 2 — Gestión de Insumos y Stock

Esta rama cubre todo lo relacionado con los materiales: cómo se registran, cómo se controla el stock y cómo se repone cuando falta.

---

### Paso 1 — Registrar Proveedores

Antes de poder comprar materiales, los proveedores tienen que estar cargados en el sistema con sus datos de contacto y condiciones comerciales.

**¿Quién lo hace?** Administrador.

---

### Paso 2 — Registrar Insumos

Los insumos son todos los materiales que se usan en producción: telas, hilos, botones, cierres, etiquetas, etc. Cada insumo tiene un tipo, una unidad de medida, un proveedor asociado y un nivel de stock mínimo.

El stock mínimo es importante: cuando el stock cae por debajo de ese valor, el sistema genera una alerta de reposición.

**¿Quién lo hace?** Administrador o Depósito.

---

### Paso 3 — Monitoreo de Stock

El sistema muestra en todo momento el stock disponible de cada insumo. Cuando un proyecto se crea, los materiales calculados quedan reservados para ese proyecto.

Si el stock disponible no alcanza para cubrir un proyecto, el sistema lo avisa antes de arrancar la producción.

**¿Quién lo hace?** Administrador, Supervisor o Depósito pueden consultar el stock.

---

### Paso 4 — Orden de Compra

Cuando falta material (ya sea por alerta de stock mínimo o por un proyecto nuevo), se genera una orden de compra al proveedor correspondiente.

La orden pasa por los siguientes estados:

```
Pendiente → Aprobada → PendienteControl → Recibida
          → Anulada (si se cancela antes de recibir)
```

**¿Quién hace qué?**
- **Administrador o Supervisor** crean y aprueban la orden.
- **Administrador** habilita el control de recepción cuando el material llega físicamente.
- **Operario o Depósito** confirman el control físico: verifican que lo que llegó coincide con lo pedido.
- Al confirmar la recepción, el stock se actualiza automáticamente.

---

### Paso 5 — Recepción y Control de Calidad del Material

Cuando el proveedor entrega los materiales, no se actualiza el stock directamente. Primero pasa por un control:

1. El administrador habilita el control de recepción de la orden.
2. El operario o encargado de depósito verifica físicamente lo recibido.
3. Confirma las cantidades reales recibidas.
4. El sistema actualiza el stock con lo confirmado.

Si hay diferencias entre lo pedido y lo recibido, quedan registradas.

**¿Quién lo hace?**
- Habilitación del control: Administrador.
- Confirmación física: Operario o Depósito.

---

### Paso 6 — Movimientos de Stock

Cada vez que un material entra o sale del depósito (por una recepción, por asignación a un proyecto, o por scrap), queda registrado como un movimiento. Esto permite tener trazabilidad completa de cada insumo.

**¿Quién lo hace?** El sistema lo registra automáticamente. El Administrador puede consultarlo.

---

### Resumen visual — Gestión de Insumos y Stock

```
Proveedores registrados
    └── Insumos cargados con stock mínimo
          └── Monitoreo continuo de stock
                ├── Stock suficiente → disponible para proyectos
                └── Stock insuficiente → alerta de reposición
                      └── Orden de Compra (Pendiente → Aprobada)
                            └── Material llega al depósito
                                  └── Control físico (Operario/Depósito)
                                        └── Stock actualizado automáticamente
```

---

## Conexión entre las dos ramas

Las dos ramas no son independientes: se cruzan en el momento en que se crea un proyecto.

```
Gestión de Insumos          Gestión de Proyectos
        │                           │
        │    ← Verificación de stock al crear proyecto
        │                           │
        └── Orden de Compra ────────┘
            (si falta material)
```

Un proyecto no debería arrancar producción si no hay stock suficiente. Si falta material, se activa la rama de insumos para reponerlo, y una vez que el stock está disponible, la producción puede continuar.
