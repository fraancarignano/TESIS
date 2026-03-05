-- =====================================================================
-- CATÁLOGO DE PERMISOS DEL SISTEMA
-- Ejecutar una sola vez sobre la BD existente.
-- No modifica el esquema: INSERT en tabla Permiso ya existente.
-- =====================================================================

-- Limpiar permisos existentes (opcional, comentar si ya hay datos que no se quieren perder)
-- DELETE FROM UsuarioPermiso;
-- DELETE FROM RolPermiso;
-- DELETE FROM Permiso;

-- Insertar catálogo de permisos solo si no existen
IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Proyectos.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Proyectos.Ver', 'Consultar lista de proyectos');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Proyectos.Crear')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Proyectos.Crear', 'Crear nuevos proyectos');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Proyectos.Editar')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Proyectos.Editar', 'Editar proyectos existentes');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Inventario.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Inventario.Ver', 'Consultar inventario');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Inventario.GestionInsumos')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Inventario.GestionInsumos', 'Gestión de insumos (alta/baja/modificación)');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Inventario.Transferir')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Inventario.Transferir', 'Transferir insumos entre ubicaciones');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Inventario.Historial')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Inventario.Historial', 'Ver historial de movimientos');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Inventario.Recepcionar')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Inventario.Recepcionar', 'Control de recepción de órdenes de compra');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Clientes.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Clientes.Ver', 'Ver lista de clientes');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Ubicaciones.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Ubicaciones.Ver', 'Ver ubicaciones de depósito');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Reportes.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Reportes.Ver', 'Acceder al módulo de reportes');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'Usuarios.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('Usuarios.Ver', 'Ver usuarios internos');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'OrdenesCompra.Ver')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('OrdenesCompra.Ver', 'Ver órdenes de compra');

IF NOT EXISTS (SELECT 1 FROM Permiso WHERE nombre_Permiso = 'OrdenesCompra.Crear')
INSERT INTO Permiso (nombre_Permiso, descripcion) VALUES ('OrdenesCompra.Crear', 'Crear órdenes de compra');

GO

-- Verificar resultado
SELECT id_Permiso, nombre_Permiso, descripcion FROM Permiso ORDER BY nombre_Permiso;
GO
