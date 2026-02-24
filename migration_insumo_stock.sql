CREATE TABLE [dbo].[Insumo_Stock] (
    [id_Insumo_Stock]   INT             IDENTITY (1, 1) NOT NULL,
    [id_Insumo]         INT             NOT NULL,
    [id_Proyecto]       INT             NULL,
    [id_Ubicacion]      INT             NULL,
    [id_OrdenCompra]    INT             NULL,
    [cantidad]          DECIMAL (18, 2) NOT NULL,
    [fecha_Actualizacion] DATETIME        NOT NULL DEFAULT (GETDATE()),
    PRIMARY KEY CLUSTERED ([id_Insumo_Stock] ASC),
    CONSTRAINT [FK_InsumoStock_Insumo] FOREIGN KEY ([id_Insumo]) REFERENCES [dbo].[Insumo] ([id_Insumo]),
    CONSTRAINT [FK_InsumoStock_Proyecto] FOREIGN KEY ([id_Proyecto]) REFERENCES [dbo].[Proyectos] ([id_Proyecto]),
    CONSTRAINT [FK_InsumoStock_Ubicacion] FOREIGN KEY ([id_Ubicacion]) REFERENCES [dbo].[Ubicacion] ([id_Ubicacion]),
    CONSTRAINT [FK_InsumoStock_OrdenCompra] FOREIGN KEY ([id_OrdenCompra]) REFERENCES [dbo].[Orden_Compra] ([id_OrdenCompra])
);
GO
