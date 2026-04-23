CASOS DE USO DEL SISTEMA

Este documento detalla los Casos de Uso (CU) que componen las funcionalidades del sistema, organizados por módulos operativos. 

---

### MÓDULO: PROYECTOS (CU01)
Este módulo gestiona el ciclo de vida de la producción textil.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| CU01-01 | Crear Proyecto | Permitir registrar un nuevo proyecto asociado a un cliente existente. | Administrador |
| CU01-02 | Editar Proyecto | Modificar los datos de un proyecto existente. | Administrador |
| CU01-03 | Consultar Detalles del Proyecto | Visualizar la información detallada de un proyecto. | Todos |
| CU01-04 | Registrar Avance de Proyecto | Actualizar el estado de avance del proyecto según su etapa. | Operario |
| CU01-05 | Registrar Scrap | Cargar los datos de los remanentes generados durante la producción. | Operario |
| CU01-06 | Vincular Materiales desde Inventario | Asociar al proyecto los materiales requeridos desde el stock. | Administrador |
| CU01-07 | Registrar Observaciones | Permitir que los operarios o encargados registren notas o incidencias en el desarrollo del proyecto. | Operario |
| CU01-08 | Modificar Estado | Cerrar, archivar o reactivar proyectos según su estado actual. | Operario |
| **CU01-09** | **Sincronizar con Diseño de Muestra** | **Sincronizar automáticamente imágenes y especificaciones de una muestra validada con el proyecto.** | **Administrador** |

---

### MÓDULO: CLIENTES (CU02)
Gestión del registro y seguimiento de clientes.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| CU02-01 | Registrar cliente | Permite crear un nuevo cliente con sus datos personales, de contacto y empresa. | Administrador / Gerente |
| CU02-02 | Modificar datos de cliente | Permite actualizar los datos de un cliente ya registrado. | Administrador |
| CU02-03 | Eliminar cliente | Permite eliminar clientes inactivos o incorrectamente registrados. | Administrador |
| CU02-04 | Consultar información de cliente | Permite visualizar la ficha completa de un cliente y su historial. | Administrador / Operador |
| CU02-05 | Registrar pedido desde cliente | Permite crear un pedido directamente asociado a un cliente desde su ficha. | Administrador / Operador |
| CU02-06 | Registrar observaciones del cliente | Permite añadir notas o comentarios del cliente. | Operador |
| CU02-07 | Buscar clientes por filtros | Permite realizar búsquedas avanzadas por nombre, tipo o estado. | Administrador / Operador |

---

### MÓDULO: INVENTARIO Y STOCK (CU03)
Gestión y control de existencia de insumos.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| CU03-06 | Registrar ingreso de insumos | Permite cargar insumos directamente al inventario (Compras menores). | Administrador |
| CU03-07 | Consultar inventario de insumos | El administrador puede visualizar un listado completo de los insumos. | Administrador / Operario |
| CU03-08 | Filtrar insumos | Permite realizar búsquedas específicas dentro del inventario por criterios. | Administrador / Operario |
| CU03-09 | Modificar insumo del inventario | Posibilita editar la información de un insumo existente o eliminarlo. | Administrador |

---

### MÓDULO: ÓRDENES DE COMPRA Y RECEPCIÓN (CU04)
Gestión de adquisiciones y control físico de mercadería.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| CU03-01 | Programar orden de compra | El administrador carga una nueva orden de compra, indicando insumos requeridos. | Administrador |
| CU03-02 | Registrar recepción de insumos | El administrador accede a una orden de compra pendiente y marca los insumos recibidos. | Administrador |
| CU03-03 | Modificar cantidad de insumos recibidos | Durante la recepción, el administrador puede ajustar cantidades. | Administrador |
| CU03-04 | Modificar estado de insumos recibidos | Durante la recepción, el administrador define si quedan pendientes o se eliminan. | Administrador |
| CU03-05 | Confirmar recepción completa | Una vez verificado el pedido completo, el administrador confirma la recepción. | Administrador |
| **CU04-06** | **Habilitar control de recepción** | **El administrador habilita al operario para realizar el control físico de una orden.** | **Administrador** |
| **CU04-07** | **Registrar control de recepción** | **El operario cuenta físicamente la mercadería y registra diferencias o estados.** | **Operario / Almacén** |
| **CU04-08** | **Recalcular/Reabrir recepción** | **Permite volver a habilitar el control de una orden ya cerrada para correcciones.** | **Administrador** |
| **CU04-09** | **Verificar orden** | **Aprobación final de la recepción para que el stock se considere definitivo.** | **Administrador** |

---

### MÓDULO: UBICACIONES (CU05)
Control geográfico del almacén y zonas de despacho.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| **CU05-01** | **Registrar ubicación física** | **Crear ubicaciones en el sistema especificando rack, división y espacio.** | **Administrador** |
| **CU05-02** | **Consultar contenido de ubicación** | **Visualizar qué insumos o proyectos (en zona DES) se encuentran en un sitio.** | **Todos** |
| **CU05-03** | **Transferir insumos** | **Mover materiales de una ubicación física a otra registrando el cambio.** | **Administrador** |

---

### MÓDULO: MUESTRAS (CU06)
Gestión de prototipos y validación técnica.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| **CU06-01** | **Registrar muestra testigo** | **Alta de prototipo de prenda con sus especificaciones y material asignado.** | **Administrador** |
| **CU06-02** | **Aprobar / Rechazar muestra** | **Cambio de estado de la muestra con comentarios obligatorios para rechazo.** | **Administrador / Gerente** |
| **CU06-03** | **Vincular muestra a proyecto** | **Asociar una muestra existente a un proyecto de producción masiva.** | **Administrador** |

---

### MÓDULO: DESPACHOS (CU07)
Gestión de salida final y logística externa de proyectos.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| **CU07-01** | **Generar despacho de proyecto** | **Creación automática del registro de despacho tras finalizar la producción.** | **Operario / Admin** |
| **CU07-02** | **Asignar ubicación de despacho** | **Asignar el proyecto finalizado a una zona de ubicación tipo DES.** | **Operario** |
| **CU07-03** | **Registrar salida física** | **Marcar el proyecto como "Despachado", efectuando el egreso real del sistema.** | **Administrador** |
| **CU07-04** | **Consultar despacho vía QR** | **Acceso público a la información del despacho mediante escaneo de etiqueta.** | **Público / Cliente** |

---

### MÓDULO: REPORTES (CU08)
Indicadores clave de desempeño y gestión.

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| CU04-01 | Consultar reporte de producción | Reporte consolidado con datos de avance, etapa, taller y fechas. | Administrador/Gerente |
| CU04-02 | Consultar reporte de stock | Reporte con cantidades, alertas de stock crítico y consumo promedio. | Administrador/Gerente |
| CU04-03 | Consultar reporte de scrap | Muestra cantidades descartadas, materiales afectados y remanentes. | Administrador/Gerente |
| CU04-04 | Exportar reporte | Guardar los reportes generados en formato PDF o Excel. | Administrador/Gerente |
| CU04-05 | Filtrar reporte | Aplicar filtros específicos (fecha, estado, tipo, proveedor, etc.). | Administrador/Gerente |
| CU04-06 | Buscar un reporte | Localizar información puntual dentro de un reporte existente. | Administrador/Gerente |

---

### MÓDULO: USUARIOS Y ROLES (CU09)
Seguridad y control de acceso. *Nota: Este módulo también abarca la gestión administrativa básica de **Proveedores** y **Talleres** siguiendo una lógica similar de registro y perfiles.*

| Código | Nombre | Descripción | Rol |
|---|---|---|---|
| CU05-01 | Crear usuario | Permite registrar un nuevo usuario con sus datos de acceso y perfil. | Administrador |
| CU05-02 | Modificar usuario | Permite editar los datos de un usuario existente, incluyendo su rol. | Administrador |
| CU05-03 | Eliminar usuario | Permite eliminar usuarios inactivos o que ya no pertenecen a la empresa. | Administrador |
| CU05-04 | Consultar usuarios | Permite visualizar el listado de usuarios registrados y sus roles. | Administrador |
| CU05-05 | Asignar roles y permisos | Permite asignar o modificar los permisos asociados a un rol específico. | Administrador |
| CU05-06 | Cambiar contraseña | Permite que los usuarios cambien su contraseña por seguridad. | Usuario |
| CU05-07 | Bloquear / Desbloquear usuario | Permite bloquear usuarios por inactividad prolongada o incidentes. | Administrador |
| CU05-08 | Auditar actividad de usuario | Permite visualizar el historial de acciones realizadas por cada usuario. | Administrador |


