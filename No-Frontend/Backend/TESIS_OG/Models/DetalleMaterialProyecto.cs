using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class DetalleMaterialProyecto
{
    public int IdDetalle { get; set; }

    public int IdProyecto { get; set; }

    public int IdInsumo { get; set; }

    public int IdUnidad { get; set; }

    public decimal CantidadAsignada { get; set; }

    public decimal? CantidadUtilizada { get; set; }

    public decimal? DesperdicioEstimado { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual UnidadMedidum IdUnidadNavigation { get; set; } = null!;
}
