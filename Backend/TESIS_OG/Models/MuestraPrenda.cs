using System;

namespace TESIS_OG.Models;

public partial class MuestraPrenda
{
    public int IdMuestraPrenda { get; set; }

    public int IdMuestra { get; set; }

    public int IdTipoPrenda { get; set; }

    public int IdTipoInsumoMaterial { get; set; }

    public string? ColorTela { get; set; }

    public bool TieneBordado { get; set; }

    public bool TieneEstampado { get; set; }

    public string? DescripcionDiseno { get; set; }

    public virtual Muestra IdMuestraNavigation { get; set; } = null!;

    public virtual TipoPrendum IdTipoPrendaNavigation { get; set; } = null!;

    public virtual TipoInsumo? IdTipoInsumoMaterialNavigation { get; set; }
}
