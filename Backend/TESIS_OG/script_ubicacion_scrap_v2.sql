-- =============================================
-- MIGRACIÓN: Normalización de Ubicacion y Scrap
-- =============================================

-- 1. Extender tabla Ubicacion con Nombre y Tipo
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Ubicacion' AND COLUMN_NAME = 'Nombre')
BEGIN
    ALTER TABLE Ubicacion ADD Nombre NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Ubicacion' AND COLUMN_NAME = 'Tipo')
BEGIN
    ALTER TABLE Ubicacion ADD Tipo NVARCHAR(50) NULL;
END

GO

-- 2. Poblar el campo Tipo basado en los códigos existentes (Retrocompatibilidad)
UPDATE Ubicacion SET Tipo = 'Despacho' WHERE codigo LIKE 'DES%' AND Tipo IS NULL;
UPDATE Ubicacion SET Tipo = 'Rack'     WHERE codigo LIKE 'RCK%' AND Tipo IS NULL;
UPDATE Ubicacion SET Tipo = 'Scrap'    WHERE codigo LIKE 'SCRP%' AND Tipo IS NULL;
UPDATE Ubicacion SET Tipo = 'Rack'     WHERE Tipo IS NULL; -- Por defecto para los demás

-- 3. Poblar el campo Nombre (Usa la descripcion si existe, sino el codigo)
UPDATE Ubicacion 
SET Nombre = COALESCE(NULLIF(LTRIM(RTRIM(descripcion)), ''), codigo)
WHERE Nombre IS NULL;

GO

-- 4. Normalizar la tabla Scrap para que apunte a una Ubicacion física
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Scrap' AND COLUMN_NAME = 'IdUbicacion')
BEGIN
    ALTER TABLE Scrap ADD IdUbicacion INT NULL;
    
    -- Usamos el FK hacia id_Ubicacion según confirmaste
    ALTER TABLE Scrap ADD CONSTRAINT FK_Scrap_Ubicacion
        FOREIGN KEY (IdUbicacion) REFERENCES Ubicacion(id_Ubicacion);
END

GO

-- 5. Crear la ubicación virtual de SCRAP si no existe
IF NOT EXISTS (SELECT 1 FROM Ubicacion WHERE Tipo = 'Scrap' OR codigo = 'SCRP-01')
BEGIN
    INSERT INTO Ubicacion (codigo, Nombre, Tipo, rack, division, espacio, descripcion)
    VALUES ('SCRP-01', 'Depósito de Scrap', 'Scrap', 0, 0, 0, 'Área general de remanentes de tela');
END
