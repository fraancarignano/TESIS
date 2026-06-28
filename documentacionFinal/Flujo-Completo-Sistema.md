# Flujo completo del sistema

## 1. Objetivo general

El sistema gestiona el circuito completo de una organizacion textil: desde que un cliente llega con una idea hasta que el producto terminado se despacha. Integra clientes, muestras, proyectos, compras, inventario, ubicaciones de deposito, produccion por areas, calidad, talleres externos, despacho, usuarios, permisos, auditoria y reportes.

La idea central es que cada etapa deje trazabilidad. El sistema no solo registra datos, sino que acompana el proceso operativo: valida si el cliente existe, controla que una muestra este aprobada antes de producir, calcula materiales, detecta faltantes, genera ordenes de compra, controla recepciones, asigna materiales a proyectos, registra avances por area, gestiona incidencias de calidad y cierra el ciclo con despacho y consulta por QR.

## 2. Actores y responsabilidades

### Administrador

Tiene acceso completo al sistema. Gestiona usuarios, roles, permisos, clientes, proveedores, inventario, ubicaciones, ordenes de compra, proyectos, reportes y despachos. Tambien puede intervenir en cualquier punto del flujo para corregir datos, aprobar operaciones o consultar auditorias.

### Supervisor

Supervisa el avance operativo. Puede gestionar clientes, muestras, proyectos, ordenes de compra, produccion, controles y despachos segun los permisos asignados. Es el rol que acompana la ejecucion del trabajo y valida que el proyecto avance correctamente.

### Operario

Trabaja sobre las areas de produccion que tiene asignadas. Registra avances, completa tareas del area correspondiente y puede participar en controles fisicos, por ejemplo en recepcion de materiales o en etapas productivas.

### Deposito

Gestiona stock, ubicaciones, recepcion de materiales y movimientos internos. Controla donde se guarda cada insumo, que cantidad esta disponible y que material queda asignado a cada proyecto.

### Cliente

No necesariamente opera el sistema, pero es el origen del flujo. Solicita una idea o producto, valida la muestra, recibe feedback y finalmente recibe el producto terminado.

### Proveedor

Abastece los materiales necesarios. Se relaciona con el sistema mediante ordenes de compra, entregas, controles de recepcion y reportes de rendimiento.

### Taller externo

Puede intervenir cuando una parte del proyecto se terceriza. El sistema permite registrar talleres, asignarlos a proyectos y consultar la produccion asociada.

## 3. Flujo macro del sistema

El flujo completo puede verse como una cadena principal con ramas de soporte:

```text
Login
  -> Gestion de usuarios y permisos
  -> Registro del cliente
  -> Creacion de muestra
  -> Revision de muestra
      -> Aprobada: crear proyecto
      -> Rechazada: feedback y correccion
      -> Rechazo definitivo: fin del ciclo comercial
  -> Calculo de materiales del proyecto
  -> Validacion de stock
      -> Stock suficiente: asignar materiales
      -> Stock insuficiente: generar orden de compra
  -> Recepcion y control fisico de materiales
  -> Ubicacion en deposito
  -> Asignacion de materiales al proyecto
  -> Inicio de produccion
  -> Avance por areas
  -> Control de calidad y correcciones
  -> Finalizacion del proyecto
  -> Generacion de despacho
  -> Ubicacion de despacho
  -> Entrega al cliente
  -> Reportes y auditoria
```

## 4. Inicio de sesion, seguridad y permisos

El sistema comienza con el login de un usuario interno. Al autenticarse, el backend valida el usuario, su contrasena y su estado. Si el usuario esta activo, se genera el acceso al sistema con sus permisos efectivos.

La autorizacion se maneja por capas:

- El rol define una base de permisos.
- Los permisos personalizados del usuario pueden habilitar o deshabilitar acciones especificas.
- Las areas asignadas definen que puede completar un operario dentro del flujo productivo.

Esto permite que dos usuarios con el mismo rol tengan distinto alcance si la organizacion lo necesita. Por ejemplo, un operario puede estar habilitado para Corte pero no para Calidad, o un supervisor puede ver reportes sin administrar usuarios.

El modulo de Usuarios permite crear usuarios internos, editar datos, desactivarlos con baja logica, asignar roles, asignar areas a operarios, consultar auditoria y administrar permisos personalizados.

## 5. Registro y gestion del cliente

Cuando llega un cliente a la organizacion, primero debe quedar registrado. El modulo de Clientes centraliza sus datos comerciales, fiscales, de contacto y ubicacion.

El cliente puede ser:

- Persona fisica: nombre, apellido, documento, telefono, email y direccion.
- Persona juridica: razon social, CUIT/CUIL, telefono, email y direccion.

Tambien se define su categoria, por ejemplo mayorista, minorista u otro, y su estado: activo, inactivo, suspendido o en revision.

Este registro es importante porque el resto del sistema necesita relacionar muestras, proyectos, demandas, despachos y reportes con un cliente concreto. Ademas, el sistema evita eliminar clientes que ya tienen proyectos u ordenes asociadas, para no romper la trazabilidad historica.

## 6. Creacion de la muestra

Luego de registrar el cliente, se crea una muestra en base a la idea que el cliente trae. La muestra funciona como prototipo o validacion inicial antes de comprometer materiales, tiempos y produccion.

En la muestra se registra informacion como:

- Cliente asociado.
- Nombre o descripcion de la idea.
- Tipo de prenda.
- Cantidades estimadas.
- Talles.
- Materiales previstos.
- Color.
- Bordado, estampado o diseno.
- Logo, mockup o imagenes si corresponde.
- Observaciones y comentarios.

La muestra permite transformar una idea comercial en una propuesta concreta. En este punto todavia no se deberia iniciar produccion, porque el objetivo es validar que el cliente apruebe lo que se va a fabricar.

## 7. Aprobacion, feedback o rechazo de la muestra

La muestra tiene un ciclo de revision. Puede aprobarse, rechazarse con feedback o cerrarse definitivamente si la idea no avanza.

### Muestra aprobada

Si el cliente aprueba la muestra, el sistema habilita el paso siguiente: crear un proyecto productivo. La muestra queda como antecedente del diseno y sirve para mantener trazabilidad entre la idea original y la produccion final.

### Muestra rechazada con feedback

Si la muestra no cumple con lo esperado, se registra el rechazo y el comentario correspondiente. El equipo puede corregir la propuesta, modificar datos, ajustar diseno, cambiar materiales o rehacer el planteo.

El ciclo vuelve a revision:

```text
Muestra creada
  -> Revision
  -> Rechazada con comentario
  -> Correccion
  -> Nueva revision
```

Este circuito se repite hasta que la muestra sea aprobada o hasta que se decida no continuar.

### Rechazo definitivo

Si la idea no se aprueba finalmente, el ciclo termina sin crear proyecto. Aun asi, queda registro de la muestra, los comentarios y la decision, lo cual sirve para historial comercial y futuras consultas.

## 8. Creacion del proyecto

Cuando la muestra esta aprobada, se crea el proyecto. El proyecto representa la orden real de produccion. Ya no es solo una idea o prototipo: es el trabajo que la organizacion debe planificar, abastecer, producir, controlar y despachar.

En el proyecto se define:

- Cliente.
- Muestra asociada, si corresponde.
- Nombre y codigo del proyecto.
- Descripcion.
- Fecha de inicio y fecha estimada de finalizacion.
- Prioridad.
- Usuario encargado.
- Prendas a producir.
- Cantidad total por prenda.
- Distribucion por talles.
- Tipo de material.
- Color de tela.
- Si lleva bordado, estampado o diseno.
- Materiales calculados automaticamente.
- Materiales manuales, como hilos, etiquetas, accesorios u otros insumos.

El proyecto inicia normalmente en estado Pendiente. En ese estado todavia no debe avanzar por produccion, porque primero hay que verificar y asignar materiales.

## 9. Calculo de materiales y validacion de stock

Al crear o preparar el proyecto, el sistema calcula los materiales necesarios segun el tipo de prenda, cantidad, talles y configuracion de materiales. Para telas, el calculo puede ser automatico. Para otros insumos, el usuario puede agregar materiales manuales.

El sistema valida:

- Que el proyecto tenga al menos una prenda.
- Que cada prenda tenga talles definidos.
- Que la suma de cantidades por talle coincida con la cantidad total.
- Que existan los insumos necesarios.
- Que haya stock disponible suficiente.
- Que el color requerido coincida con el color disponible cuando aplica.

Si el stock alcanza, el flujo puede pasar a asignacion de materiales. Si falta material, el sistema informa los faltantes y se activa el circuito de compras.

## 10. Inventario e insumos

El modulo de Inventario administra todos los materiales utilizados por la organizacion: telas, hilos, cierres, botones, etiquetas, accesorios y cualquier otro insumo necesario.

Cada insumo tiene:

- Nombre.
- Tipo.
- Unidad de medida.
- Stock actual.
- Stock minimo.
- Proveedor asociado.
- Ubicacion.
- Estado.
- Color y tipo de tela cuando corresponde.

El stock minimo permite detectar insumos en alerta. El sistema puede mostrar stock bajo, stock critico o insumos agotados. Esto ayuda a anticipar compras antes de que la produccion quede detenida.

La trazabilidad del stock se maneja con detalle granular: no solo importa cuanto stock existe, sino donde esta, si pertenece a una orden de compra, si esta asignado a un proyecto y en que ubicacion fisica se encuentra.

## 11. Ubicaciones de deposito

Las ubicaciones representan lugares fisicos dentro del deposito. Estan identificadas por codigos, por ejemplo `RCK-01-03` para ubicaciones regulares o `DES-01` para zonas de despacho.

Una ubicacion regular se usa para almacenar insumos. Una ubicacion de despacho se usa para proyectos terminados que esperan salida.

El deposito puede:

- Crear ubicaciones.
- Editarlas.
- Consultar que insumos contiene una ubicacion.
- Consultar proyectos ubicados en una zona de despacho.
- Transferir insumos entre ubicaciones.
- Evitar eliminar ubicaciones que tengan stock asociado.

Cuando llega material comprado, primero se controla y luego se guarda en una ubicacion. De esta forma el sistema sabe no solo que el material existe, sino donde esta fisicamente.

## 12. Proveedores y ordenes de compra

Cuando el stock no alcanza, se genera una orden de compra. Para eso debe existir un proveedor registrado y los insumos deben estar identificados o poder darse de alta desde la orden.

Una orden de compra contiene:

- Numero generado automaticamente.
- Proveedor.
- Proyecto asociado, si la compra nace por un proyecto.
- Descripcion.
- Fecha de solicitud.
- Fecha estimada de entrega.
- Detalles de insumos.
- Cantidades.
- Precios unitarios.
- Subtotales y total.
- Estado de la orden.

El flujo principal de una orden es:

```text
Pendiente
  -> Aprobada o habilitada para control
  -> PendienteControl
  -> Control fisico de recepcion
  -> Recibida
  -> Verificada
```

Tambien puede anularse si todavia esta en un estado valido para cancelacion.

## 13. Recepcion y control fisico de materiales

Cuando el proveedor entrega los materiales, el sistema no deberia sumar stock sin control. Primero se habilita el control de recepcion.

El proceso es:

1. El administrador o responsable habilita el control de la orden.
2. La orden pasa a estado PendienteControl.
3. Deposito u operario ingresa a la pantalla de control.
4. Se revisa fisicamente cada insumo recibido.
5. Se cargan cantidades reales recibidas.
6. Se registran observaciones si hay diferencias.
7. El sistema actualiza stock.
8. Se generan movimientos de inventario.
9. La orden pasa a Recibida.
10. Luego puede verificarse administrativamente.

Si lo recibido coincide con lo pedido, el detalle queda satisfecho. Si falta o sobra material, la diferencia queda registrada. Esto permite medir precision de proveedores y tener historial de recepciones.

## 14. Guardado del material en deposito

Luego de la recepcion, el material se ubica en el deposito. El sistema permite transferir stock desde una orden de compra hacia una ubicacion fisica.

Este paso responde a una pregunta operativa clave: donde esta el material que acaba de llegar.

El deposito puede asignar:

- Orden de compra origen.
- Ubicacion destino.
- Insumos recibidos.
- Cantidades.
- Proyecto asociado, si ya se sabe que el material corresponde a un proyecto especifico.

Con esto, el stock queda disponible y trazado en `InsumoStock`.

## 15. Asignacion de materiales al proyecto

Antes de iniciar la produccion, el material calculado debe asignarse al proyecto. Esta etapa busca optimizar el uso del inventario y evitar desperdicios.

El sistema carga los materiales necesarios del proyecto y compara contra el stock disponible. Para cada material, el usuario puede asignar la cantidad requerida desde el stock real. Si se trata de telas, tambien se valida el color.

El flujo es:

```text
Proyecto pendiente
  -> Materiales calculados
  -> Validacion de disponibilidad
  -> Asignacion de stock existente
  -> Generacion de OC para faltantes, si aplica
  -> Todos los materiales listos
  -> Inicio de proyecto
```

Cuando todos los materiales necesarios estan asignados, el proyecto puede pasar a En Proceso.

Esta etapa es importante porque separa el stock general del stock comprometido a un proyecto. Asi se evita que otro proyecto use materiales que ya fueron reservados.

## 16. Inicio del proyecto

Con cliente registrado, muestra aprobada, proyecto creado y materiales asignados, el proyecto puede iniciar.

El estado cambia de Pendiente a En Proceso. Desde ese momento comienza el seguimiento por areas productivas.

El proyecto conserva informacion de:

- Materiales asignados.
- Cantidades requeridas.
- Usuario responsable.
- Fechas.
- Avance por area.
- Observaciones.
- Scrap.
- Incidencias de calidad.
- Auditoria.

## 17. Produccion por areas

El proyecto avanza por areas de produccion en orden. Segun la documentacion tecnica del modulo, las areas principales son:

1. Diseno y Desarrollo.
2. Corte.
3. Confeccion.
4. Control de Calidad.
5. Etiquetado y Empaquetado.

Cada area cumple una funcion distinta.

### Diseno y Desarrollo

Valida y completa la informacion tecnica del producto. Puede incluir logo, mockup, detalles de bordado o estampado, color, descripcion del diseno y ajustes que vienen de la muestra aprobada.

Esta area transforma la aprobacion comercial en informacion lista para producir.

### Corte

Utiliza los materiales asignados para cortar las prendas segun patron, talle y cantidad. En esta etapa pueden registrarse observaciones, diferencias y scrap de material si hay desperdicio, fallas o sobrantes.

El registro de scrap permite analizar desperdicios y mejorar el calculo futuro de materiales.

### Confeccion

Arma la prenda a partir de las partes cortadas. Puede realizarse internamente o con apoyo de talleres externos. El sistema permite asignar talleres y consultar proyectos por taller.

Esta area registra avances, observaciones y recepciones relacionadas con el armado de prendas.

### Control de Calidad

Evalua si las prendas cumplen los criterios esperados. El sistema permite registrar inspecciones, resultados, fallas por criterio, cantidades por talle y prendas rechazadas.

Si una prenda no cumple, se crea una incidencia de calidad. La incidencia puede pasar por estados como:

```text
PENDIENTE -> EN_TALLER -> REINGRESADA -> CERRADA
```

Esto permite devolver prendas a correccion, recibirlas nuevamente y aprobarlas cuando el problema se soluciona.

### Etiquetado y Empaquetado

Es la etapa final de produccion. Prepara el producto terminado para despacho: etiquetado, empaquetado, consolidacion de cantidades y preparacion para salida.

Cuando esta ultima area se completa, el proyecto pasa a Finalizado y se genera el despacho.

## 18. Reglas de avance por areas

El avance por areas tiene reglas para ordenar la produccion:

- No se puede completar un area si la anterior no esta finalizada.
- Cada area puede registrar observaciones.
- Los operarios solo pueden completar areas asignadas a su usuario.
- Administrador y supervisor pueden tener visibilidad mas amplia segun permisos.
- Completar la ultima area cambia el proyecto a Finalizado.
- El historial del proyecto registra eventos y observaciones.

Estas reglas evitan que el proyecto avance desordenadamente y permiten saber quien hizo cada accion.

## 19. Correcciones, observaciones y auditoria del proyecto

Durante el proyecto pueden surgir correcciones, ajustes o problemas. El sistema permite registrar observaciones asociadas al proyecto para que quede una linea de tiempo.

Ejemplos:

- Cambios de diseno.
- Aclaraciones de cliente.
- Problemas en corte.
- Fallas de material.
- Devolucion a taller.
- Resultado de control de calidad.
- Ajustes en cantidades.
- Avance de area.

La auditoria permite reconstruir que paso, cuando paso y quien lo registro. Esto es clave para controlar proyectos largos, resolver reclamos y justificar decisiones internas.

## 20. Scrap y optimizacion de materiales

El sistema contempla el registro de scrap o desperdicio. Cuando una parte del material se pierde, se descarta o no puede utilizarse, se registra:

- Insumo afectado.
- Cantidad.
- Motivo.
- Area donde ocurrio.
- Destino.
- Costo estimado si corresponde.

Esto permite medir desperdicio real por proyecto y mejorar la planificacion. La asignacion controlada de materiales al proyecto tambien ayuda a usar solo lo necesario, evitando que se consuma stock sin trazabilidad.

## 21. Talleres externos

Cuando parte del trabajo se terceriza, el sistema permite registrar talleres externos. Cada taller contiene informacion de contacto, ubicacion, responsable y tipo de trabajo.

Un proyecto puede asignarse a un taller. Esto permite:

- Saber que proyectos estan en manos de terceros.
- Consultar proyectos por taller.
- Reasignar un proyecto si cambia el proveedor externo.
- Medir calidad por taller mediante reportes.

En el flujo productivo, los talleres externos se integran especialmente con confeccion y calidad, porque pueden recibir prendas para armado o correccion y luego devolverlas para control.

## 22. Finalizacion del proyecto

Un proyecto se considera finalizado cuando todas las areas productivas estan completas, especialmente Etiquetado y Empaquetado.

Al finalizar:

- El estado del proyecto pasa a Finalizado.
- Se genera automaticamente un despacho.
- El proyecto queda disponible para el area de despachos.
- Se conserva toda la informacion historica: cliente, prendas, talles, materiales, avances, observaciones, scrap y calidad.

## 23. Despacho

El modulo de Despachos gestiona la salida final del producto terminado. No se carga como un proceso aislado: nace cuando el proyecto termina.

Cada despacho tiene:

- Proyecto asociado.
- Cliente.
- Codigo unico de despacho.
- Estado.
- Ubicacion de despacho.
- Observaciones.
- Fecha de creacion.
- Fecha de despacho.

El codigo se genera automaticamente, por ejemplo con formato `DSP-{idProyecto}-{XXXX}`.

El flujo es:

```text
Proyecto Finalizado
  -> Despacho creado automaticamente
  -> Asignacion de ubicacion DES
  -> Impresion de etiqueta / QR
  -> Producto preparado para entrega
  -> Marcar como Despachado
  -> Proyecto pasa a Despachado
```

Las ubicaciones de despacho usan codigos `DES-*`. Esto permite separar fisicamente los proyectos terminados de los insumos del deposito.

## 24. QR y entrega al cliente

El despacho puede imprimir una etiqueta con codigo QR. Al consultar el QR, se muestran datos del despacho:

- Codigo.
- Estado.
- Proyecto.
- Cliente.
- Cantidad total.
- Prendas.
- Ubicacion.
- Observaciones.

Esta informacion sirve para identificar paquetes, facilitar el retiro o entrega y reducir errores logisticos.

Al marcar el despacho como Despachado:

- El despacho cambia a estado Despachado.
- Se completa la fecha de despacho.
- El proyecto asociado pasa a estado Despachado.
- Se cierran asignaciones de stock del proyecto.
- El stock global se ajusta segun los materiales consumidos.

## 25. Reportes

El modulo de Reportes permite analizar la operacion completa. No modifica el flujo, pero ayuda a tomar decisiones.

Los reportes principales son:

- Inventario critico: muestra insumos agotados, criticos, bajos o normales.
- Rotacion de insumos: compara consumo y reposicion mensual.
- Rendimiento de proveedores: analiza tiempos de entrega y precision entre pedido y recibido.
- Demanda por cliente: muestra volumen de proyectos y prendas por cliente en una temporada.
- Produccion por prenda: analiza cantidades producidas por tipo de prenda y evolucion temporal.
- Calidad de produccion: muestra inspecciones, fallas, prendas rechazadas y rendimiento por taller.

Estos reportes cierran el ciclo de mejora: lo que ocurre en compras, inventario, produccion y calidad vuelve como informacion para planificar mejor.

## 26. Estados principales

### Estados de muestra

```text
Pendiente -> Aprobada
Pendiente -> Rechazada -> Correccion -> Nueva revision
Pendiente/Rechazada -> Rechazo definitivo
```

### Estados de proyecto

```text
Pendiente -> En Proceso -> Finalizado -> Despachado
```

Estados complementarios:

- Pausado: proyecto detenido temporalmente.
- Cancelado: proyecto interrumpido antes de finalizar.
- Archivado: proyecto oculto o cerrado administrativamente sin borrado definitivo.

### Estados de orden de compra

```text
Pendiente -> Aprobada/PendienteControl -> Recibida -> Verificada
Pendiente/Aprobada -> Anulada
```

### Estados de insumo

```text
Disponible
En uso
A designar
Agotado
```

### Estados de despacho

```text
Listo para Despacho -> Despachado
```

### Estados de incidencia de calidad

```text
PENDIENTE -> EN_TALLER -> REINGRESADA -> CERRADA
```

## 27. Trazabilidad de punta a punta

El valor principal del sistema es que conecta todas las etapas. Un proyecto finalizado puede rastrearse hacia atras:

- Que cliente lo pidio.
- Que muestra lo origino.
- Que prendas y talles se fabricaron.
- Que materiales se calcularon.
- Que materiales se asignaron.
- Que compras se hicieron para cubrir faltantes.
- Que proveedor entrego cada insumo.
- Que cantidades llegaron realmente.
- En que ubicacion se guardaron.
- Que usuario inicio o avanzo cada area.
- Que observaciones hubo.
- Que scrap se genero.
- Que incidencias de calidad existieron.
- Que taller externo participo, si aplica.
- Que despacho se genero.
- Cuando se entrego al cliente.

Esto permite controlar la operacion y justificar cada movimiento.

## 28. Flujo completo narrado de ejemplo

Un administrador inicia sesion en el sistema. Llega un cliente nuevo a la organizacion y se lo registra con sus datos comerciales, fiscales y de contacto. El cliente explica que quiere producir una prenda con ciertas caracteristicas. Se crea una muestra donde se cargan tipo de prenda, cantidades estimadas, talles, color, materiales, diseno, mockup y observaciones.

La muestra se revisa con el cliente. Si no se aprueba, se registran comentarios y se corrige. Este ciclo continua hasta que la idea queda aprobada o se decide rechazarla definitivamente. Si se rechaza de forma definitiva, el proceso termina y queda registro. Si se aprueba, la muestra se convierte en base para crear un proyecto.

Al crear el proyecto, se cargan prendas, talles, cantidades, prioridad, fechas, encargado, materiales y detalles de diseno. El sistema calcula materiales necesarios y valida stock. Si hay material suficiente, se asigna al proyecto. Si no alcanza, se genera una orden de compra al proveedor correspondiente.

Cuando el proveedor entrega el material, deposito u operario realiza el control fisico. Se cargan cantidades recibidas, se registran diferencias y se actualiza el inventario. Luego el material se guarda en una ubicacion del deposito. Con el stock disponible, se asignan al proyecto las cantidades exactas necesarias para optimizar el uso del material.

Cuando todos los materiales estan listos, el proyecto pasa de Pendiente a En Proceso. Primero trabaja Diseno y Desarrollo, luego Corte, luego Confeccion, luego Control de Calidad y finalmente Etiquetado y Empaquetado. Cada area registra su avance y observaciones. Si hay problemas, se generan correcciones, incidencias o devoluciones a taller. Si hay desperdicio, se registra scrap.

Cuando todas las areas terminan, el proyecto pasa a Finalizado. El sistema genera automaticamente un despacho con codigo unico. El area de despacho asigna una ubicacion `DES-*`, prepara el paquete, imprime la etiqueta o QR y finalmente marca el despacho como Despachado. En ese momento el proyecto queda en estado Despachado y el cliente puede recibir el producto.

Despues, la organizacion puede consultar reportes para analizar stock critico, rotacion de materiales, cumplimiento de proveedores, demanda por cliente, produccion por prenda, calidad y desempeno de talleres.

## 29. Resumen por area funcional

| Area / Modulo | Que hace dentro del flujo |
|---|---|
| Usuarios y permisos | Controla quien entra al sistema, que puede ver y que acciones puede ejecutar. |
| Clientes | Registra y mantiene los datos del cliente que origina la muestra y el proyecto. |
| Muestras | Permite prototipar la idea, recibir feedback y aprobar o rechazar antes de producir. |
| Proyectos | Coordina la produccion real: prendas, talles, materiales, avances, observaciones y estados. |
| Inventario | Controla insumos, stock, estados, detalle por ubicacion/proyecto y movimientos. |
| Ubicaciones | Indica donde esta fisicamente cada material o proyecto listo para despacho. |
| Ordenes de compra | Gestiona compras a proveedores cuando falta material. |
| Control de recepcion | Valida lo que llega fisicamente antes de sumar stock. |
| Deposito | Guarda, transfiere y asigna materiales a proyectos. |
| Produccion | Ejecuta el proyecto por areas ordenadas. |
| Calidad | Detecta fallas, crea incidencias y controla correcciones. |
| Talleres externos | Registra terceros y permite asociarlos a proyectos o correcciones. |
| Despachos | Prepara y registra la salida final del producto terminado. |
| Reportes | Analiza informacion historica y operativa para mejorar decisiones. |

## 30. Cierre

El sistema cubre el ciclo completo de trabajo de la organizacion. Parte de una necesidad del cliente, la convierte en muestra, luego en proyecto, asegura disponibilidad de materiales, controla compras y recepcion, administra deposito, acompana la produccion por areas, registra calidad y correcciones, y finaliza con despacho.

La principal ventaja es la integracion: cada modulo aporta informacion a los demas. Esto evita manejar el proceso con datos aislados, reduce errores, mejora el control de stock, permite saber en que etapa esta cada proyecto y deja trazabilidad completa desde la idea inicial hasta la entrega final.
