# MANDATO DEL PROYECTO — AMPLIADO (V4)

Proyecto: Sistema de Gestión Integral para Tamarindo S.A.
Equipo: Rodriguez, Carignano, Janiszewski

---

## PROBLEMAS DETECTADOS

| Problema | Prioridad |
|---|---|
| Utilizan un sistema "enlatado" (genérico) que los limita al registrar materia prima y detallar proyectos. | Alta |
| No existe un sistema que registre y controle el scrap textil, generando pérdida económica por materiales no reutilizados ni costeados. | Media |
| Falta de reportes sistematizados que faciliten la toma de decisiones estratégicas (impacto económico, scrap por período, rendimiento de proyectos, etc.). | Media |
| Ausencia de seguimiento entre áreas operativas, lo que provoca información desactualizada, poco clara o duplicada al transferirse entre sectores. | Alta |
| Sin control de la gestión de órdenes de compra a proveedores ni de la recepción física de mercadería, generando diferencias entre lo pedido y lo recibido. | Alta |
| Falta de trazabilidad logística: no existe registro formal del movimiento de prendas hacia talleres externos ni de su despacho final al cliente. | Media |

---

## OBJETIVOS

### Objetivo General

Desarrollar un sistema web integral para Tamarindo S.A. que permita gestionar el ciclo completo de la producción textil: desde la recepción de materia prima, la planificación y seguimiento de proyectos, el control de scrap y calidad, hasta el despacho final al cliente. El sistema brindará soporte operativo a todas las áreas involucradas y habilitará la generación de reportes analíticos orientados a la gerencia, con el fin de mejorar la proyección presupuestaria y la toma de decisiones del negocio.

---

## ALCANCE

### Plataforma
El sistema es una aplicación web, accesible desde navegadores modernos sin necesidad de instalación local.

### Módulos incluidos

#### 1. Usuarios, Roles y Permisos
- Alta, baja y modificación de usuarios del sistema.
- Definición de roles (operarios, supervisores, administradores, gerentes).
- Asignación de permisos granulares diferenciados por módulo y acción.
- Control de acceso mediante credenciales seguras y bloqueo de cuentas.
- Gestión administrativa de **Proveedores** y **Talleres externos** con lógica equivalente.

#### 2. Clientes
- Registro de clientes con datos personales, de contacto y comerciales.
- Historial de proyectos y pedidos por cliente.
- Gestión de observaciones comerciales.
- Búsqueda y filtrado avanzado.

#### 3. Inventario y Stock
- Registro de materia prima con características (tipo, color, proveedor, peso, etc.).
- Consulta del stock disponible en tiempo real.
- Modificación y eliminación controlada de insumos con auditoría.
- Alertas configurables de stock mínimo.

#### 4. Órdenes de Compra y Control de Recepción
- Creación y seguimiento de órdenes de compra a proveedores.
- Flujo de aprobación: Pendiente → Aprobada → PendienteControl → Recibida → Verificada.
- Habilitación del control físico de recepción por parte del administrador.
- Registro de diferencias entre lo solicitado y lo recibido por parte de los operarios de almacén.
- Actualización automática del stock al confirmar la recepción.
- Posibilidad de recalcular/reabrir la recepción para correcciones.

#### 5. Ubicaciones Físicas del Depósito
- Gestión de la estructura del almacén: racks, divisiones y espacios.
- Código de ubicación auto-generado (`RCK-DD-EE`).
- Consulta de insumos almacenados por posición física.
- Soporte para zonas de despacho (prefijo `DES`) con visualización de proyectos en espera.
- Transferencia de materiales entre ubicaciones.

#### 6. Proyectos de Producción
- Creación de proyectos asociados a clientes, con múltiples prendas, talles y materiales.
- Seguimiento del flujo productivo en 5 áreas: Diseño, Corte, Confección, Control de Calidad, Etiquetado y Empaquetado.
- Avance secuencial por área con validaciones de orden.
- Registro de scrap (remanentes) por etapa con costo asociado.
- Checklist de calidad integrado al proceso.
- Vista Kanban y vista tabla con filtros avanzados.
- Gestión de diseño: carga de logo y mockup por prenda.
- Auditoria completa del ciclo de vida del proyecto.

#### 7. Muestras (Prototipos)
- Registro de muestras testigo previo a la producción masiva.
- Flujo de aprobación / rechazo con comentarios obligatorios.
- Vinculación de muestras a proyectos de producción definitiva.
- Sincronización bidireccional de diseños (logos/mockups) entre muestra y proyecto.

#### 8. Despachos
- Generación automática del registro de despacho al completar un proyecto.
- Asignación de zonas físicas de despacho en el depósito (ubicaciones DES).
- Registro de la salida física con actualización de estado a "Despachado".
- Egreso definitivo del stock de insumos asignado al proyecto al ser despachado.
- Consulta pública del despacho mediante código QR para verificación del cliente.

#### 9. Reportes e Indicadores
- Reporte de avance y estado general de producción.
- Reporte de stock de insumos con alertas de criticidad.
- Reporte de scrap y remanentes por material, área y proyecto.
- Reporte de desempeño y tiempos de entrega de proveedores.
- Reporte de eficiencia operativa por taller.
- Exportación de reportes en formato PDF y Excel.
- Filtros por período, tipo, proveedor, estado y área.

### Funcionalidades transversales
- Historial de cambios y auditoría de acciones por usuario.
- Sistema de notificaciones internas (cambios de estado, alertas de stock, etc.).
- Permisos granulares por módulo: la visibilidad y las acciones disponibles dependen del rol del usuario.

---

## LÍMITE

El sistema abarca el ciclo integral de producción textil de Tamarindo S.A., desde la recepción de materia prima hasta el despacho final al cliente, incluyendo la gestión de insumos, muestras, seguimiento de áreas, control de calidad, órdenes de compra a proveedores y trazabilidad logística interna. No contempla la integración con sistemas externos de terceros (ERP, plataformas de e-commerce, etc.) ni la gestión financiera o contable de la empresa.

---

## NO INCLUYE

- **Facturación y contabilidad**: El sistema no genera ni gestiona facturas, notas de crédito ni registros contables.
- **Ventas y comercialización externa**: No se gestiona el proceso de venta directa al mercado ni cotizaciones para clientes.
- **Integración con sistemas de terceros**: No se contempla conexión con ERPs, plataformas de logística externa, ni sistemas de gestión de almacén (WMS) de proveedores.
- **Logística de última milla**: El despacho final al cliente se registra en el sistema, pero la coordinación del transporte externo queda fuera del alcance.
- **Gestión de recursos humanos**: No incluye liquidación de sueldos, control de presentismo ni fichaje de empleados.

---

## ENTREGABLES

- Aplicación web funcional desplegada en entorno de producción.
- Código fuente completo con documentación técnica (Backend .NET + Frontend Angular).
- Manuales de usuario por perfil de rol.
- Documentación del proyecto completa (mandato, casos de uso, diagramas, etc.).
