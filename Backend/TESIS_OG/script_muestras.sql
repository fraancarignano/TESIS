-- Script para crear tablas de Muestras

IF OBJECT_ID('dbo.MuestraPrenda', 'U') IS NOT NULL DROP TABLE dbo.MuestraPrenda;
IF OBJECT_ID('dbo.MuestraHistorial', 'U') IS NOT NULL DROP TABLE dbo.MuestraHistorial;
IF OBJECT_ID('dbo.Muestra', 'U') IS NOT NULL DROP TABLE dbo.Muestra;

CREATE TABLE dbo.Muestra (
    id_Muestra INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_Cliente INT NOT NULL,
    nombre_Muestra VARCHAR(80) NOT NULL,
    descripcion VARCHAR(300) NULL,
    prioridad VARCHAR(10) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    fecha_Creacion DATE NOT NULL,
    fecha_Entrega DATE NULL,
    id_UsuarioEncargado INT NULL,
    codigo_Muestra VARCHAR(20) NULL,
    id_Proyecto INT NULL,
    mockup_url VARCHAR(500) NULL,
    bordado_requerido BIT NOT NULL DEFAULT 0,
    bordado_descripcion VARCHAR(400) NULL,
    bordado_referencia VARCHAR(500) NULL,
    estampado_requerido BIT NOT NULL DEFAULT 0,
    estampado_descripcion VARCHAR(400) NULL,
    estampado_referencia VARCHAR(500) NULL,
    otros_detalle VARCHAR(500) NULL,
    paleta_rgb VARCHAR(50) NULL
);

ALTER TABLE dbo.Muestra
ADD CONSTRAINT FK_Muestra_Cliente FOREIGN KEY (id_Cliente)
REFERENCES dbo.Cliente(id_Cliente);

ALTER TABLE dbo.Muestra
ADD CONSTRAINT FK_Muestra_UsuarioEncargado FOREIGN KEY (id_UsuarioEncargado)
REFERENCES dbo.Usuario(id_Usuario);

ALTER TABLE dbo.Muestra
ADD CONSTRAINT FK_Muestra_Proyecto FOREIGN KEY (id_Proyecto)
REFERENCES dbo.Proyectos(id_Proyecto);

CREATE UNIQUE INDEX UQ_CodigoMuestra ON dbo.Muestra(codigo_Muestra);

CREATE TABLE dbo.MuestraPrenda (
    id_MuestraPrenda INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_Muestra INT NOT NULL,
    id_TipoPrenda INT NOT NULL,
    id_TipoInsumo_Material INT NOT NULL,
    color_tela VARCHAR(80) NULL,
    tiene_bordado BIT NOT NULL DEFAULT 0,
    tiene_estampado BIT NOT NULL DEFAULT 0,
    descripcion_diseno VARCHAR(400) NULL
);

CREATE TABLE dbo.MuestraHistorial (
    id_MuestraHistorial INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_Muestra INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT GETDATE(),
    tipo VARCHAR(30) NOT NULL,
    comentario VARCHAR(500) NOT NULL,
    id_Usuario INT NULL
);

ALTER TABLE dbo.MuestraPrenda
ADD CONSTRAINT FK_MuestraPrenda_Muestra FOREIGN KEY (id_Muestra)
REFERENCES dbo.Muestra(id_Muestra);

ALTER TABLE dbo.MuestraPrenda
ADD CONSTRAINT FK_MuestraPrenda_TipoPrenda FOREIGN KEY (id_TipoPrenda)
REFERENCES dbo.TipoPrenda(id_TipoPrenda);

ALTER TABLE dbo.MuestraPrenda
ADD CONSTRAINT FK_MuestraPrenda_TipoInsumo FOREIGN KEY (id_TipoInsumo_Material)
REFERENCES dbo.TipoInsumo(id_TipoInsumo);

ALTER TABLE dbo.MuestraHistorial
ADD CONSTRAINT FK_MuestraHistorial_Muestra FOREIGN KEY (id_Muestra)
REFERENCES dbo.Muestra(id_Muestra);

ALTER TABLE dbo.MuestraHistorial
ADD CONSTRAINT FK_MuestraHistorial_Usuario FOREIGN KEY (id_Usuario)
REFERENCES dbo.Usuario(id_Usuario);
