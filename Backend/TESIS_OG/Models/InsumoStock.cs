using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class InsumoStock
{
    public int IdInsumoStock { get; set; }

    public int IdInsumo { get; set; }

    public int? IdProyecto { get; set; }

    public int? IdUbicacion { get; set; }

    public int? IdOrdenCompra { get; set; }

    public decimal Cantidad { get; set; }

    public DateTime FechaActualizacion { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual Proyecto? IdProyectoNavigation { get; set; }

    public virtual Ubicacion? IdUbicacionNavigation { get; set; }

    public virtual OrdenCompra? IdOrdenCompraNavigation { get; set; }
}
