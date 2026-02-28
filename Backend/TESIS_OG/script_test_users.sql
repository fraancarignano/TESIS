-- =======================================================
-- SCRIPT PARA CREAR USUARIOS DE PRUEBA
-- =======================================================

-- Asegurarse de que existan los roles necesarios si no existen.
-- NOTA: Los IDs de los roles asumen una estructura básica. Por favor ajustarlos si tu BD tiene otros IDs.
-- Se asume:
-- 1 = Admin/Gerente/Dueño
-- 2 = Supervisor
-- 3 = Operario
-- 4 = Deposito

-- 1. Crear Usuario: Alan Herrera (Admin - Rol 1)
IF NOT EXISTS (SELECT * FROM Usuario WHERE NombreUsuario = 'alanski')
BEGIN
    INSERT INTO Usuario (NombreUsuario, ApellidoUsuario, nombreIngreso, Contrasena, id_Rol, estado, fecha_Creacion)
    VALUES ('Alan', 'Herrera', 'alan@test.com', '123456', 1, 'Activo', GETDATE());
END
ELSE
BEGIN
    UPDATE Usuario SET id_Rol = 1 WHERE NombreUsuario = 'alanski';
END
GO

-- 2. Crear Usuario: Franco (Operario - Rol 3)
IF NOT EXISTS (SELECT * FROM Usuario WHERE NombreUsuario = 'franco')
BEGIN
    INSERT INTO Usuario (NombreUsuario, ApellidoUsuario, nombreIngreso, Contrasena, id_Rol, estado, fecha_Creacion)
    VALUES ('Franco', 'Operario', 'franco@test.com', '123456', 3, 'Activo', GETDATE());
END
ELSE
BEGIN
    UPDATE Usuario SET id_Rol = 3 WHERE NombreUsuario = 'franco';
END
GO

-- Asignar Franco al área de 'Corte'. 
-- NOTA: Validar el ID del área 'Corte' en la tabla AreaProduccion. Asumimos ID = 2 para este ejemplo, pero buscamos por el nombre.
DECLARE @IdUsuarioFranco INT = (SELECT id_Usuario FROM Usuario WHERE NombreUsuario = 'franco');
DECLARE @IdAreaCorte INT = (SELECT IdArea FROM AreaProduccion WHERE NombreArea LIKE '%Corte%');

IF @IdUsuarioFranco IS NOT NULL AND @IdAreaCorte IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM UsuarioArea WHERE id_Usuario = @IdUsuarioFranco AND id_Area = @IdAreaCorte)
    BEGIN
        INSERT INTO UsuarioArea (id_Usuario, id_Area) VALUES (@IdUsuarioFranco, @IdAreaCorte);
    END
END
GO

-- 3. Crear Usuario: Octa (Deposito - Rol 4)
IF NOT EXISTS (SELECT * FROM Usuario WHERE NombreUsuario = 'octa')
BEGIN
    INSERT INTO Usuario (NombreUsuario, ApellidoUsuario, nombreIngreso, Contrasena, id_Rol, estado, fecha_Creacion)
    VALUES ('Octa', 'Deposito', 'octa@test.com', '123456', 4, 'Activo', GETDATE());
END
ELSE
BEGIN
    UPDATE Usuario SET id_Rol = 4 WHERE NombreUsuario = 'octa';
END
GO

-- Mensaje de finalización
PRINT 'Usuarios Alan (Admin), Franco (Operario - Corte) y Octa (Deposito) creados/verificados correctamente.';
GO
