-- Script para crear tabla de incidencias de calidad de indumentaria (reproceso)

IF OBJECT_ID('dbo.CalidadIncidencia', 'U') IS NOT NULL DROP TABLE dbo.CalidadIncidencia;

CREATE TABLE dbo.CalidadIncidencia (
    id_CalidadIncidencia INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_Proyecto INT NOT NULL,
    id_Taller INT NULL,
    id_UsuarioRegistro INT NOT NULL,
    fecha_Deteccion DATETIME NOT NULL DEFAULT GETDATE(),
    nombre_Prenda VARCHAR(120) NOT NULL,
    talle VARCHAR(50) NOT NULL,
    criterio_Id VARCHAR(50) NOT NULL,
    criterio_Nombre VARCHAR(160) NOT NULL,
    cantidad INT NOT NULL,
    detalle_Falla VARCHAR(500) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_EnvioTaller DATETIME NULL,
    fecha_Reingreso DATETIME NULL,
    fecha_Cierre DATETIME NULL
);

ALTER TABLE dbo.CalidadIncidencia
ADD CONSTRAINT FK_CalidadIncidencia_Proyecto FOREIGN KEY (id_Proyecto)
REFERENCES dbo.Proyectos(id_Proyecto);

ALTER TABLE dbo.CalidadIncidencia
ADD CONSTRAINT FK_CalidadIncidencia_Taller FOREIGN KEY (id_Taller)
REFERENCES dbo.Taller(id_Taller);

ALTER TABLE dbo.CalidadIncidencia
ADD CONSTRAINT FK_CalidadIncidencia_UsuarioRegistro FOREIGN KEY (id_UsuarioRegistro)
REFERENCES dbo.Usuario(id_Usuario);

