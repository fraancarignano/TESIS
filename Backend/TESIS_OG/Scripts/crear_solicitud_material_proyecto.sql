-- ============================================================
-- Tabla: SolicitudMaterialProyecto
-- Guarda solicitudes de transferencia de material a un proyecto
-- generadas al crear/editar un proyecto desde el módulo de Proyectos
--
-- IMPORTANTE: Verificar que estás en la base de datos correcta
-- antes de ejecutar. Ej: USE TamarindoDB;
-- ============================================================

-- Verificar que las tablas referenciadas existen
IF OBJECT_ID('dbo.Proyecto', 'U') IS NULL
    RAISERROR('La tabla Proyecto no existe en este esquema. Verificar la base de datos.', 16, 1);
GO

IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
    RAISERROR('La tabla Usuario no existe en este esquema. Verificar la base de datos.', 16, 1);
GO

-- Crear tabla solo si no existe
IF OBJECT_ID('dbo.SolicitudMaterialProyecto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SolicitudMaterialProyecto (
        id_Solicitud        INT IDENTITY(1,1) NOT NULL,
        id_Proyecto         INT NOT NULL,
        nombre_Proyecto     NVARCHAR(120) NOT NULL,
        id_TipoInsumo       INT NULL,
        nombre_TipoInsumo   NVARCHAR(100) NULL,
        color_Solicitado    NVARCHAR(80) NULL,
        cantidad_Estimada   DECIMAL(10,2) NULL,
        unidad_Medida       NVARCHAR(20) NULL,
        mensaje             NVARCHAR(500) NULL,
        estado              NVARCHAR(30) NOT NULL CONSTRAINT DF_SolicitudMaterial_Estado DEFAULT 'Pendiente',
        id_Usuario_Emisor   INT NOT NULL,
        fecha_Solicitud     DATE NOT NULL CONSTRAINT DF_SolicitudMaterial_Fecha DEFAULT CAST(GETDATE() AS DATE),
        fecha_Atendida      DATE NULL,
        id_Usuario_Atiende  INT NULL,

        CONSTRAINT PK_SolicitudMaterialProyecto PRIMARY KEY (id_Solicitud),

        CONSTRAINT FK_SolicitudMaterial_Proyecto
            FOREIGN KEY (id_Proyecto) REFERENCES dbo.Proyecto(id_Proyecto),

        CONSTRAINT FK_SolicitudMaterial_Emisor
            FOREIGN KEY (id_Usuario_Emisor) REFERENCES dbo.Usuario(id_Usuario),

        CONSTRAINT FK_SolicitudMaterial_Atiende
            FOREIGN KEY (id_Usuario_Atiende) REFERENCES dbo.Usuario(id_Usuario)
    );

    -- Índice para consultas por proyecto y estado
    CREATE INDEX IX_SolicitudMaterial_Proyecto ON dbo.SolicitudMaterialProyecto(id_Proyecto);
    CREATE INDEX IX_SolicitudMaterial_Estado   ON dbo.SolicitudMaterialProyecto(estado);

    PRINT 'Tabla SolicitudMaterialProyecto creada correctamente.';
END
ELSE
BEGIN
    PRINT 'La tabla SolicitudMaterialProyecto ya existe, no se realizaron cambios.';
END
GO
