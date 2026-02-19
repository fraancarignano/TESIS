USE TamarindoDB;
GO

IF COL_LENGTH('Proveedor', 'id_Provincia') IS NULL
BEGIN
    ALTER TABLE Proveedor ADD id_Provincia INT NULL;
END
GO

IF COL_LENGTH('Proveedor', 'id_Ciudad') IS NULL
BEGIN
    ALTER TABLE Proveedor ADD id_Ciudad INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Proveedor_Provincia'
)
BEGIN
    ALTER TABLE Proveedor
    ADD CONSTRAINT FK_Proveedor_Provincia
    FOREIGN KEY (id_Provincia) REFERENCES Provincia(id_Provincia);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Proveedor_Ciudad'
)
BEGIN
    ALTER TABLE Proveedor
    ADD CONSTRAINT FK_Proveedor_Ciudad
    FOREIGN KEY (id_Ciudad) REFERENCES Ciudad(id_Ciudad);
END
GO
