-- Ampliar columna descripcion en Observacion_Proyecto de VARCHAR(200) a VARCHAR(MAX)
-- Ejecutar UNA VEZ en la base de datos

ALTER TABLE [dbo].[Observacion_Proyecto]
ALTER COLUMN [descripcion] VARCHAR(MAX) NULL;
