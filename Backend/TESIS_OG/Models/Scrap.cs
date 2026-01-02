using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Scrap
{
    public int IdScrap { get; set; }

    public int IdProyecto { get; set; }

    public int IdInsumo { get; set; }

    public decimal CantidadScrap { get; set; }

    public string? Motivo { get; set; }

    public string? Destino { get; set; }

    public DateTime FechaRegistro { get; set; }

    public string? AreaOcurrencia { get; set; }

    public decimal? CostoScrap { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;
}
