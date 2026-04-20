-- Agregar columnas de bordado y estampado a la tabla ProyectoDiseño
-- Ejecutar este script UNA VEZ en la base de datos

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProyectoDiseño]') AND name = 'imagen_Bordado')
    ALTER TABLE [dbo].[ProyectoDiseño] ADD [imagen_Bordado] VARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProyectoDiseño]') AND name = 'descripcion_Bordado')
    ALTER TABLE [dbo].[ProyectoDiseño] ADD [descripcion_Bordado] VARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProyectoDiseño]') AND name = 'imagen_Estampado')
    ALTER TABLE [dbo].[ProyectoDiseño] ADD [imagen_Estampado] VARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProyectoDiseño]') AND name = 'descripcion_Estampado')
    ALTER TABLE [dbo].[ProyectoDiseño] ADD [descripcion_Estampado] VARCHAR(500) NULL;
