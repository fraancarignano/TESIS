using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class ConfiguracionMaterial
{
    public int IdConfig { get; set; }

    public int IdTipoPrenda { get; set; }

    public int IdTipoInsumo { get; set; }

    public decimal CantidadPorUnidad { get; set; }

    public string UnidadMedida { get; set; } = null!;

    public string? Descripcion { get; set; }

    public virtual TipoInsumo IdTipoInsumoNavigation { get; set; } = null!;

    public virtual TipoPrendum IdTipoPrendaNavigation { get; set; } = null!;
}
