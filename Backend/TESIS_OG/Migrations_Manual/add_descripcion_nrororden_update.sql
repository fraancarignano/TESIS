-- Ampliar NroOrden de 15 a 20 caracteres para el nuevo formato OC-YYYYMMDD-XXXX
ALTER TABLE Orden_Compra ALTER COLUMN nro_Orden VARCHAR(20) NOT NULL;

-- Agregar columna Descripcion (opcional)
ALTER TABLE Orden_Compra ADD Descripcion NVARCHAR(500) NULL;

-- Agregar columna IdProyecto a Orden_Compra (proyecto asociado)
ALTER TABLE Orden_Compra ADD IdProyecto INT NULL;

-- Agregar estado "Verificada" es solo un valor de string, no requiere cambio de schema
