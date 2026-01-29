using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class DetalleOrdenCompra
{
    public int IdDetalle { get; set; }

    public int IdOrdenCompra { get; set; }

    public int IdInsumo { get; set; }

    public decimal Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal? Subtotal { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual OrdenCompra IdOrdenCompraNavigation { get; set; } = null!;
}
