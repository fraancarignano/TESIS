-- =========================================
-- CREAR BASE DE DATOS
-- =========================================
CREATE DATABASE TamarindoDB;
GO

USE TamarindoDB;
GO

-- =========================================
-- TABLAS MAESTRAS
-- =========================================

CREATE TABLE Pais (
    id_Pais INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Pais VARCHAR(50) NOT NULL
);
GO

CREATE TABLE Provincia (
    id_Provincia INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Provincia VARCHAR(50) NOT NULL,
    id_Pais INT NOT NULL,
    FOREIGN KEY (id_Pais) REFERENCES Pais(id_Pais)
);
GO

CREATE TABLE Localidad (
    id_Localidad INT IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_Provincia INT NOT NULL,
    FOREIGN KEY (id_Provincia) REFERENCES Provincia(id_Provincia)
);
GO

CREATE TABLE Ciudad (
    id_Ciudad INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Ciudad VARCHAR(50) NOT NULL,
    id_Provincia INT NOT NULL,
    id_Localidad INT NOT NULL,
    FOREIGN KEY (id_Provincia) REFERENCES Provincia(id_Provincia),
    FOREIGN KEY (id_Localidad) REFERENCES Localidad(id_Localidad)
);
GO

CREATE TABLE Direccion (
    id_Direccion INT IDENTITY(1,1) PRIMARY KEY,
    calle VARCHAR(100) NOT NULL,
    numero VARCHAR(10),
    codigo_Postal VARCHAR(10),
    id_Ciudad INT NOT NULL,
    id_Localidad INT NOT NULL,
    id_Provincia INT NOT NULL,
    id_Pais INT NOT NULL,
    FOREIGN KEY (id_Ciudad) REFERENCES Ciudad(id_Ciudad),
    FOREIGN KEY (id_Localidad) REFERENCES Localidad(id_Localidad),
    FOREIGN KEY (id_Provincia) REFERENCES Provincia(id_Provincia),
    FOREIGN KEY (id_Pais) REFERENCES Pais(id_Pais)
);
GO

CREATE TABLE EstadoCliente (
    id_EstadoCliente INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Estado VARCHAR(20) NOT NULL
);
GO

CREATE TABLE Cliente (
    id_Cliente INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    razon_social VARCHAR(80),
    tipo_Cliente VARCHAR(20) NOT NULL,
    cuit VARCHAR(15),
    telefono VARCHAR(30),
    email VARCHAR(100),
    id_Direccion INT,
    id_EstadoCliente INT NOT NULL,
    fecha_Alta DATE NOT NULL,
    observaciones VARCHAR(200),
    FOREIGN KEY (id_Direccion) REFERENCES Direccion(id_Direccion),
    FOREIGN KEY (id_EstadoCliente) REFERENCES EstadoCliente(id_EstadoCliente)
);
GO

CREATE TABLE Rol (
    id_Rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Rol VARCHAR(30) NOT NULL,
    descripcion VARCHAR(100),
    nivel_Permiso INT NOT NULL
);
GO

CREATE TABLE Permiso (
    id_Permiso INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Permiso VARCHAR(50) NOT NULL,
    descripcion VARCHAR(100)
);
GO

CREATE TABLE RolPermiso (
    id_Rol INT NOT NULL,
    id_Permiso INT NOT NULL,
    puede_Acceder BIT NOT NULL,
    PRIMARY KEY (id_Rol, id_Permiso),
    FOREIGN KEY (id_Rol) REFERENCES Rol(id_Rol),
    FOREIGN KEY (id_Permiso) REFERENCES Permiso(id_Permiso)
);
GO

CREATE TABLE Usuario (
    id_Usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Usuario VARCHAR(50) NOT NULL,
    apellido_Usuario VARCHAR(50) NOT NULL,
    email VARCHAR(80) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    id_Rol INT NOT NULL,
    estado VARCHAR(10) NOT NULL,
    fecha_Creacion DATE NOT NULL,
    ultimo_Acceso DATE,
    FOREIGN KEY (id_Rol) REFERENCES Rol(id_Rol)
);
GO

CREATE TABLE TipoInsumo (
    id_TipoInsumo INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Tipo VARCHAR(30) NOT NULL,
    descripcion VARCHAR(100)
);
GO

CREATE TABLE Unidad_Medida (
    id_Unidad INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Unidad VARCHAR(10) NOT NULL,
    descripcion VARCHAR(50)
);
GO

CREATE TABLE Proveedor (
    id_Proveedor INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Proveedor VARCHAR(100) NOT NULL,
    cuit VARCHAR(15)
);
GO

CREATE TABLE Insumo (
    id_Insumo INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Insumo VARCHAR(80) NOT NULL,
    id_TipoInsumo INT NOT NULL,
    unidad_Medida VARCHAR(10) NOT NULL,
    stock_Actual DECIMAL(9,0) NOT NULL,
    stock_Minimo DECIMAL(9,1),
    fecha_Actualizacion DATE NOT NULL,
    id_Proveedor INT,
    estado VARCHAR(15),
    FOREIGN KEY (id_TipoInsumo) REFERENCES TipoInsumo(id_TipoInsumo),
    FOREIGN KEY (id_Proveedor) REFERENCES Proveedor(id_Proveedor)
);
GO

CREATE TABLE Orden_Compra (
    id_OrdenCompra INT IDENTITY(1,1) PRIMARY KEY,
    nro_Orden VARCHAR(15) NOT NULL,
    id_Proveedor INT NOT NULL,
    fecha_Solicitud DATE NOT NULL,
    fecha_EntregaEstimada DATE,
    estado VARCHAR(20) NOT NULL,
    total_Orden DECIMAL(9,1),
    FOREIGN KEY (id_Proveedor) REFERENCES Proveedor(id_Proveedor)
);
GO

CREATE TABLE Detalle_OrdenCompra (
    id_Detalle INT IDENTITY(1,1) PRIMARY KEY,
    id_OrdenCompra INT NOT NULL,
    id_Insumo INT NOT NULL,
    cantidad DECIMAL(9,0) NOT NULL,
    precio_Unitario DECIMAL(9,0) NOT NULL,
    subtotal DECIMAL(9,1),
    FOREIGN KEY (id_OrdenCompra) REFERENCES Orden_Compra(id_OrdenCompra),
    FOREIGN KEY (id_Insumo) REFERENCES Insumo(id_Insumo)
);
GO

CREATE TABLE Inventario_Movimiento (
    id_Movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_Insumo INT NOT NULL,
    tipo_Movimiento VARCHAR(15) NOT NULL,
    cantidad DECIMAL(9,0) NOT NULL,
    fecha_Movimiento DATE NOT NULL,
    origen VARCHAR(30) NOT NULL,
    id_OrdenCompra INT,
    id_Usuario INT,
    observacion VARCHAR(100),
    FOREIGN KEY (id_Insumo) REFERENCES Insumo(id_Insumo),
    FOREIGN KEY (id_OrdenCompra) REFERENCES Orden_Compra(id_OrdenCompra),
    FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario)
);
GO

CREATE TABLE Proyectos (
    id_Proyecto INT IDENTITY(1,1) PRIMARY KEY,
    id_Cliente INT NOT NULL,
    nombre_Proyecto VARCHAR(80) NOT NULL,
    tipo_Prenda VARCHAR(50),
    descripcion VARCHAR(200),
    prioridad CHAR(1),
    estado VARCHAR(20) NOT NULL,
    fecha_Inicio DATE NOT NULL,
    fecha_Fin DATE,
    FOREIGN KEY (id_Cliente) REFERENCES Cliente(id_Cliente)
);
GO

CREATE TABLE DetalleMaterialProyecto (
    id_Detalle INT IDENTITY(1,1) PRIMARY KEY,
    id_Proyecto INT NOT NULL,
    id_Insumo INT NOT NULL,
    id_Unidad INT NOT NULL,
    cantidad_Asignada DECIMAL(9,0) NOT NULL,
    cantidad_Utilizada DECIMAL(9,1),
    desperdicio_Estimado DECIMAL(9,1),
    FOREIGN KEY (id_Proyecto) REFERENCES Proyectos(id_Proyecto),
    FOREIGN KEY (id_Insumo) REFERENCES Insumo(id_Insumo),
    FOREIGN KEY (id_Unidad) REFERENCES Unidad_Medida(id_Unidad)
);
GO

CREATE TABLE Taller (
    id_Taller INT IDENTITY(1,1) PRIMARY KEY,
    nombre_Taller VARCHAR(80) NOT NULL,
    tipo_Taller VARCHAR(20),
    responsable VARCHAR(80),
    telefono VARCHAR(30),
    email VARCHAR(100),
    direccion VARCHAR(150),
    id_Ciudad INT NOT NULL,
    FOREIGN KEY (id_Ciudad) REFERENCES Ciudad(id_Ciudad)
);
GO

CREATE TABLE Detalle_Taller_Proyecto (
    id_Detalle_Taller INT IDENTITY(1,1) PRIMARY KEY,
    id_Taller INT NOT NULL,
    id_Proyecto INT NOT NULL,
    fecha_Asignacion DATE NOT NULL,
    estado_Taller VARCHAR(20),
    observaciones VARCHAR(200),
    FOREIGN KEY (id_Taller) REFERENCES Taller(id_Taller),
    FOREIGN KEY (id_Proyecto) REFERENCES Proyectos(id_Proyecto)
);
GO

CREATE TABLE Observacion_Proyecto (
    id_Observacion INT IDENTITY(1,1) PRIMARY KEY,
    id_Proyecto INT NOT NULL,
    id_Usuario INT NOT NULL,
    fecha DATETIME NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    FOREIGN KEY (id_Proyecto) REFERENCES Proyectos(id_Proyecto),
    FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario)
);
GO

CREATE TABLE Scrap (
    id_Scrap INT IDENTITY(1,1) PRIMARY KEY,
    id_Proyecto INT NOT NULL,
    id_Insumo INT NOT NULL,
    cantidad_Scrap DECIMAL(9,0) NOT NULL,
    motivo VARCHAR(80),
    destino VARCHAR(50),
    fecha_Registro DATETIME NOT NULL,
    FOREIGN KEY (id_Proyecto) REFERENCES Proyectos(id_Proyecto),
    FOREIGN KEY (id_Insumo) REFERENCES Insumo(id_Insumo)
);
GO

CREATE TABLE Historial_Cliente (
    id_Historial INT IDENTITY(1,1) PRIMARY KEY,
    id_Cliente INT NOT NULL,
    fecha DATE NOT NULL,
    accion VARCHAR(80) NOT NULL,
    usuario_Responsable VARCHAR(80),
    detalle VARCHAR(200),
    FOREIGN KEY (id_Cliente) REFERENCES Cliente(id_Cliente)
);
GO

CREATE TABLE Historial_Usuario (
    id_Historial INT IDENTITY(1,1) PRIMARY KEY,
    id_Usuario INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    fecha_Accion DATE NOT NULL,
    modulo VARCHAR(30),
    FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario)
);
GO



