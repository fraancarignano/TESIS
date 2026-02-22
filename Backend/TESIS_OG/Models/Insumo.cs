using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Insumo
{
    public int IdInsumo { get; set; }

    public string NombreInsumo { get; set; } = null!;

    public int IdTipoInsumo { get; set; }

    public string UnidadMedida { get; set; } = null!;

    public decimal StockActual { get; set; }

    public decimal? StockMinimo { get; set; }

    public DateOnly FechaActualizacion { get; set; }

    public int? IdProveedor { get; set; }

    public string? Estado { get; set; }

    public string? Color { get; set; }

    public string? TipoTela { get; set; }

    public decimal? RatioKgUnidad { get; set; }

    public int? IdUbicacion { get; set; }

    public virtual ICollection<DetalleMaterialProyecto> DetalleMaterialProyectos { get; set; } = new List<DetalleMaterialProyecto>();

    public virtual ICollection<DetalleOrdenCompra> DetalleOrdenCompras { get; set; } = new List<DetalleOrdenCompra>();

    public virtual Proveedor? IdProveedorNavigation { get; set; }

    public virtual TipoInsumo IdTipoInsumoNavigation { get; set; } = null!;

    public virtual Ubicacion? IdUbicacionNavigation { get; set; }

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();

    public virtual ICollection<MaterialCalculado> MaterialCalculados { get; set; } = new List<MaterialCalculado>();
    public virtual ICollection<InsumoStock> InsumoStocks { get; set; } = new List<InsumoStock>();
    public virtual ICollection<Scrap> Scraps { get; set; } = new List<Scrap>();
}
