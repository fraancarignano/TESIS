-- =========================================================
-- Migración: Control de Recepción — Nuevas columnas en OrdenCompra
-- =========================================================
-- APLICAR ESTE SCRIPT UNA SOLA VEZ sobre la base de datos
-- Tabla afectada: Orden_Compra

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orden_Compra' AND COLUMN_NAME = 'FechaHabilitacionControl'
)
BEGIN
    ALTER TABLE Orden_Compra
        ADD FechaHabilitacionControl DATE         NULL,
            FechaRecepcionControl     DATE         NULL,
            IdUsuarioControl          INT          NULL,
            ObservacionControl        NVARCHAR(500) NULL;

    PRINT 'Columnas de Control de Recepción agregadas correctamente.';
END
ELSE
BEGIN
    PRINT 'Las columnas ya existen. No se realizaron cambios.';
END
GO
