CREATE TABLE UsuarioArea (
    id_Usuario INT NOT NULL,
    id_Area INT NOT NULL,
    CONSTRAINT PK_UsuarioArea PRIMARY KEY (id_Usuario, id_Area),
    CONSTRAINT FK_UsuarioArea_Usuario FOREIGN KEY (id_Usuario) REFERENCES Usuario (id_Usuario),
    CONSTRAINT FK_UsuarioArea_AreaProduccion FOREIGN KEY (id_Area) REFERENCES AreaProduccion (IdArea)
);
GO

CREATE TABLE UsuarioPermiso (
    id_Usuario INT NOT NULL,
    id_Permiso INT NOT NULL,
    puede_Acceder BIT NOT NULL,
    CONSTRAINT PK_UsuarioPermiso PRIMARY KEY (id_Usuario, id_Permiso),
    CONSTRAINT FK_UsuarioPermiso_Usuario FOREIGN KEY (id_Usuario) REFERENCES Usuario (id_Usuario),
    CONSTRAINT FK_UsuarioPermiso_Permiso FOREIGN KEY (id_Permiso) REFERENCES Permiso (id_Permiso)
);
GO
