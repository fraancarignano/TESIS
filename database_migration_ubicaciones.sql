-- Create Ubicacion table
CREATE TABLE [dbo].[Ubicacion] (
    [id_Ubicacion] INT IDENTITY(1,1) NOT NULL,
    [codigo] VARCHAR(50) NOT NULL,
    [rack] INT NOT NULL,
    [division] INT NOT NULL,
    [espacio] INT NOT NULL,
    [descripcion] VARCHAR(200) NULL,
    CONSTRAINT [PK_Ubicacion] PRIMARY KEY CLUSTERED ([id_Ubicacion] ASC),
    CONSTRAINT [UQ_Ubicacion_Codigo] UNIQUE NONCLUSTERED ([codigo] ASC)
);

-- Add IdUbicacion column to Insumo table
ALTER TABLE [dbo].[Insumo]
ADD [IdUbicacion] INT NULL;

-- Add Foreign Key constraint
ALTER TABLE [dbo].[Insumo] WITH CHECK ADD CONSTRAINT [FK_Insumo_Ubicacion] FOREIGN KEY([IdUbicacion])
REFERENCES [dbo].[Ubicacion] ([id_Ubicacion]);

ALTER TABLE [dbo].[Insumo] CHECK CONSTRAINT [FK_Insumo_Ubicacion];
