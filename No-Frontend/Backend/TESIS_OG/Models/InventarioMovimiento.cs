using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class InventarioMovimiento
{
    public int IdMovimiento { get; set; }

    public int IdInsumo { get; set; }

    public string TipoMovimiento { get; set; } = null!;

    public decimal Cantidad { get; set; }

    public DateOnly FechaMovimiento { get; set; }

    public string Origen { get; set; } = null!;

    public int? IdOrdenCompra { get; set; }

    public int? IdUsuario { get; set; }

    public string? Observacion { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual OrdenCompra? IdOrdenCompraNavigation { get; set; }

    public virtual Usuario? IdUsuarioNavigation { get; set; }
}
