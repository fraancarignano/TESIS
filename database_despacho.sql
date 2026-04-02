USE [Tamarindo-Dev];
GO

-- Crear tabla Despacho
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Despacho' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[Despacho] (
        [id_Despacho] INT IDENTITY(1,1) PRIMARY KEY,
        [id_Proyecto] INT NOT NULL,
        [codigo_Despacho] VARCHAR(50) NOT NULL,
        [id_Ubicacion] INT NULL,
        [estado] VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        [observaciones] VARCHAR(500) NULL,
        [fecha_Creacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [fecha_Despacho] DATETIME NULL,
        CONSTRAINT [FK_Despacho_Proyecto] FOREIGN KEY ([id_Proyecto]) REFERENCES [dbo].[Proyecto]([id_Proyecto]),
        CONSTRAINT [FK_Despacho_Ubicacion] FOREIGN KEY ([id_Ubicacion]) REFERENCES [dbo].[Ubicacion]([id_Ubicacion])
    );
END
GO

-- Añadir ubicaciones DES-01 a DES-14 si no existen
DECLARE @i INT = 1;
DECLARE @codigo VARCHAR(20);

WHILE @i <= 14
BEGIN
    SET @codigo = 'DES-' + RIGHT('00' + CAST(@i AS VARCHAR), 2);
    
    IF NOT EXISTS (SELECT * FROM [dbo].[Ubicacion] WHERE [codigo] = @codigo)
    BEGIN
        INSERT INTO [dbo].[Ubicacion] ([codigo], [rack], [division], [espacio], [descripcion])
        VALUES (@codigo, 99, 1, @i, 'Ubicacion de despacho ' + CAST(@i AS VARCHAR));
    END
    
    SET @i = @i + 1;
END
GO

-- Insertar Permisos de Despacho
IF NOT EXISTS (SELECT * FROM [dbo].[Permiso] WHERE [nombre_Permiso] = 'Ver_Despacho' OR ([modulo] = 'Despachos' AND [accion] = 'Ver'))
BEGIN
    INSERT INTO [dbo].[Permiso] ([nombre_Permiso], [descripcion], [modulo], [accion])
    VALUES ('Ver_Despacho', 'Permite visualizar la lista de proyectos en Despacho', 'Despachos', 'Ver');
END
GO

IF NOT EXISTS (SELECT * FROM [dbo].[Permiso] WHERE [nombre_Permiso] = 'Gestionar_Despacho' OR ([modulo] = 'Despachos' AND [accion] = 'Gestionar'))
BEGIN
    INSERT INTO [dbo].[Permiso] ([nombre_Permiso], [descripcion], [modulo], [accion])
    VALUES ('Gestionar_Despacho', 'Permite asignar ubicaciones y despachar proyectos', 'Despachos', 'Gestionar');
END
GO
