-- ============================================================
-- Agrega columna color_Tela a ProyectoPrenda
-- Guarda el color solicitado al crear el proyecto
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'ProyectoPrenda' AND COLUMN_NAME = 'color_Tela'
)
BEGIN
    ALTER TABLE dbo.ProyectoPrenda
    ADD color_Tela NVARCHAR(80) NULL;

    PRINT 'Columna color_Tela agregada a ProyectoPrenda.';
END
ELSE
BEGIN
    PRINT 'La columna color_Tela ya existe.';
END
GO
