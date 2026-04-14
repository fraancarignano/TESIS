# Modulo de Despachos

## Resumen
Se implemento el modulo de **Despachos** para gestionar la salida final de proyectos terminados, con frontend y backend integrados.

- Flujo principal: generar despacho, listar, asignar ubicacion, imprimir etiqueta, marcar como despachado, consultar por QR
- Entidad principal: `Despacho`
- Relacion principal: un despacho por proyecto
- Soporta visor publico por codigo QR sin autenticacion

---

## Cambios destacados (actualizacion grande)
Se agrego soporte de **seguimiento logistico de salida** con codigo unico y consulta QR:

1. Backend:
   - Generacion automatica de `codigoDespacho`
   - Endpoint publico para consultar despacho por codigo
   - Actualizacion de estado del proyecto al despachar
   - Descuento de stock global al cerrar el despacho

2. Frontend:
   - Vista de gestion de despachos en `/despacho`
   - Asignacion de ubicaciones de despacho (`DES-*`)
   - Impresion de etiqueta con QR
   - Visor QR en `/despachos/qr/:codigo`

3. Integracion con proyectos:
   - Al completar la ultima area productiva, se crea el despacho automaticamente
   - El proyecto queda disponible en el modulo de despachos sin carga manual adicional

---

## Estado actual
Con backend y frontend levantados, el modulo deberia quedar operativo sin migraciones adicionales detectadas en esta pasada.

Requisitos para probar:
1. Backend levantado (API en `https://localhost:7163`)
2. Frontend levantado (Angular)
3. Proyecto existente y finalizado en su ultima area
4. Ubicaciones de despacho cargadas con codigo `DES-*`

---

## Cambios de Base de Datos
La tabla `Despacho` queda considerada con estos campos principales:

- `id_Despacho` (PK)
- `id_Proyecto` (FK a `Proyecto`)
- `codigo_Despacho`
- `id_Ubicacion` (nullable, FK a `Ubicacion`)
- `estado`
- `observaciones` (nullable)
- `fecha_Creacion`
- `fecha_Despacho` (nullable)

Relaciones observadas:

- `Despacho -> Proyecto`
- `Despacho -> Ubicacion`

Restriccion funcional implementada:

- solo se permite un despacho por proyecto

---

## Backend (API .NET)

### Endpoints
Controlador: `Backend/TESIS_OG/Controllers/DespachoController.cs`

- `GET /api/Despacho`
  - Lista todos los despachos
- `GET /api/Despacho/{id}`
  - Devuelve un despacho por id
- `GET /api/Despacho/codigo/{codigo}`
  - Devuelve informacion publica para QR
- `POST /api/Despacho`
  - Genera un despacho para un proyecto
- `PUT /api/Despacho/{id}/ubicacion`
  - Asigna o cambia la ubicacion del despacho
- `PUT /api/Despacho/{id}/despachar`
  - Marca el despacho como despachado y ejecuta cierre logistico

### Reglas backend implementadas
- El proyecto debe existir para crear despacho
- No se permite crear mas de un despacho para el mismo proyecto
- El `codigoDespacho` se genera automaticamente con formato `DSP-{idProyecto}-{XXXX}`
- Al crear, el despacho inicia en estado `Listo para Despacho`
- La asignacion de ubicacion valida que la ubicacion exista
- Al marcar despachado:
  - el despacho pasa a estado `Despachado`
  - se completa `FechaDespacho`
  - el proyecto asociado pasa a estado `Despachado`
  - se buscan `InsumoStocks` del proyecto
  - se descuentan esas cantidades del `StockActual` global
  - se eliminan los `InsumoStocks` del proyecto
- Si el descuento dejara stock negativo, el backend lo ajusta a `0`

### DTOs
Ubicacion: `Backend/TESIS_OG/DTOs/Despachos/`

- `DespachoDTO.cs`
  - incluye tambien `CreateDespachoDTO`
  - incluye tambien `AsignarUbicacionDTO`

### Modelo y mapeo EF
- Modelo: `Backend/TESIS_OG/Models/Despacho.cs`
- DbContext: `Backend/TESIS_OG/Data/TamarindoDbContext.cs`

---

## Frontend (Angular)

### Rutas
Definidas en `frontend/src/app/app.routes.ts`:

- `'/despacho'`
  - carga `DespachosListaComponent`
- `'/despachos/qr/:codigo'`
  - carga `DespachoQrVisorComponent`
  - ruta publica, fuera del layout privado

Permisos observados:

- `Despachos / Ver`
  - acceso a `/despacho`
- `Despachos / Gestionar`
  - asignar ubicacion
  - marcar despacho como despachado
- `Proyectos / CompletarArea`
  - generar despacho desde el cierre de proyecto

### Modulo Despachos (archivos)
Ubicacion: `frontend/src/app/modules/despachos/`

- `components/despachos-lista/despachos-lista.component.ts`
- `components/despachos-lista/despachos-lista.component.html`
- `components/despachos-lista/despachos-lista.component.css`
- `components/despacho-qr-visor/despacho-qr-visor.component.ts`
- `components/despacho-qr-visor/despacho-qr-visor.component.html`
- `components/despacho-qr-visor/despacho-qr-visor.component.css`
- `models/despacho.model.ts`
- `services/despacho.service.ts`

### Comportamiento en UI
- Listado de despachos ordenados por fecha de creacion
- Tabla con:
  - codigo
  - proyecto
  - cliente
  - ubicacion
  - estado
  - fecha ingreso
- Select de ubicacion por despacho
- Solo se muestran como opciones las ubicaciones cuyo codigo comienza con `DES-`
- Boton para imprimir etiqueta
- Boton para marcar como despachado
- Vista QR publica con:
  - datos generales
  - cliente
  - ubicacion
  - prendas del proyecto
  - observaciones

---

## Integracion con Proyectos
El despacho no se carga manualmente desde el modulo de despachos.

Se genera automaticamente al completar la ultima area del proyecto en:

- `frontend/src/app/modules/proyectos/components/avance-areas/avance-areas.component.ts`
- `frontend/src/app/modules/proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component.ts`

Comportamiento observado:

1. Se completa la ultima area productiva
2. Se llama a `DespachoService.crearDespacho(...)`
3. El proyecto queda disponible en `/despacho`
4. El usuario de logistica puede asignar ubicacion y despacharlo

La ultima area se detecta por nombres que contienen:

- `etiquetado`
- `empaquetado`

---

## Contrato JSON esperado

### Crear despacho (request)
```json
{
  "idProyecto": 18,
  "observaciones": "Despacho preparado para retiro por transporte externo"
}
```

### Asignar ubicacion (request)
```json
{
  "idUbicacion": 7
}
```

### Respuesta de despacho (index/detail)
```json
{
  "idDespacho": 12,
  "idProyecto": 18,
  "nombreProyecto": "Coleccion Otono 2026",
  "cliente": "Boutique del Centro SA",
  "codigoDespacho": "DSP-18-A4F2",
  "idUbicacion": 7,
  "codigoUbicacion": "DES-01",
  "estado": "Listo para Despacho",
  "observaciones": "Despacho preparado para retiro por transporte externo",
  "fechaCreacion": "2026-04-13T14:22:10",
  "fechaDespacho": null
}
```

### Respuesta QR publica
```json
{
  "idDespacho": 12,
  "codigoDespacho": "DSP-18-A4F2",
  "estado": "Despachado",
  "observaciones": "Entrega coordinada con transporte externo",
  "fechaCreacion": "2026-04-13T14:22:10",
  "ubicacion": "DES-01",
  "proyecto": {
    "idProyecto": 18,
    "nombreProyecto": "Coleccion Otono 2026",
    "codigoProyecto": "PRY-2026-018",
    "cantidadTotal": 240
  },
  "cliente": {
    "nombre": "Boutique del Centro SA",
    "email": "compras@boutiquecentro.com",
    "telefono": "+54 351 444-7788"
  },
  "prendas": [
    {
      "tipo": "Campera",
      "cantidad": 120
    },
    {
      "tipo": "Pantalon",
      "cantidad": 120
    }
  ]
}
```

---

## Verificacion tecnica realizada
Para esta documentacion se relevaron:

- controlador, DTO y modelo backend de despachos
- servicio, modelos y componentes frontend
- integracion con el modulo de proyectos
- rutas y permisos asociados

No ejecute build ni pruebas automatizadas en esta pasada, porque el pedido fue de documentacion.

---

## Checklist rapido de QA
1. Completar la ultima area de un proyecto
2. Verificar que se cree automaticamente el despacho
3. Validar que no se cree un segundo despacho para el mismo proyecto
4. Verificar visualizacion en `/despacho`
5. Asignar ubicacion `DES-*`
6. Cambiar ubicacion del despacho
7. Imprimir etiqueta con QR
8. Abrir el visor QR con `/despachos/qr/{codigo}`
9. Validar datos de cliente, proyecto y prendas en el visor
10. Marcar despacho como despachado
11. Verificar cambio de estado del proyecto a `Despachado`
12. Verificar descuento del stock global y eliminacion de `InsumoStocks` del proyecto
13. Intentar asignar ubicacion inexistente (debe rechazar backend)
14. Intentar crear despacho para proyecto inexistente (debe rechazar backend)

---

## Notas
- El endpoint `GET /api/Despacho/codigo/{codigo}` es publico y esta pensado para lectura desde QR.
- El QR impreso en la UI contiene un bloque de texto con datos del despacho; en paralelo, existe tambien el visor web por codigo.
- La gestion del modulo de despachos no expone alta manual desde su propia pantalla; la generacion nace desde proyectos.
