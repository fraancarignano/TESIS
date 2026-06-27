-- Add fields for extra materials support in DetalleOrdenCompra
ALTER TABLE DetalleOrdenCompra
ADD IdProyecto INT NULL,
    IdProyectoPrenda INT NULL,
    EsMaterialExtra BIT NULL;
