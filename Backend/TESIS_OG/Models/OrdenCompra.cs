using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class OrdenCompra
{
    public int IdOrdenCompra { get; set; }

    public string NroOrden { get; set; } = null!;

    public int IdProveedor { get; set; }

    public DateOnly FechaSolicitud { get; set; }

    public DateOnly? FechaEntregaEstimada { get; set; }

    public string Estado { get; set; } = null!;

    public decimal? TotalOrden { get; set; }

    // Control de Recepción
    public DateOnly? FechaHabilitacionControl { get; set; }
    public DateOnly? FechaRecepcionControl { get; set; }
    public int? IdUsuarioControl { get; set; }
    public string? ObservacionControl { get; set; }

    public virtual ICollection<DetalleOrdenCompra> DetalleOrdenCompras { get; set; } = new List<DetalleOrdenCompra>();

    public virtual Proveedor IdProveedorNavigation { get; set; } = null!;

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();

    public virtual ICollection<InsumoStock> InsumoStocks { get; set; } = new List<InsumoStock>();
}
