using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class ProyectoPrendum
{
    public int IdProyectoPrenda { get; set; }

    public int IdProyecto { get; set; }

    public int IdTipoPrenda { get; set; }

    public int? IdTipoInsumoMaterial { get; set; }

    public int CantidadTotal { get; set; }

    public bool? TieneBordado { get; set; }

    public bool? TieneEstampado { get; set; }

    public string? DescripcionDiseno { get; set; }

    public int? Orden { get; set; }

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual TipoInsumo? IdTipoInsumoMaterialNavigation { get; set; }

    public virtual TipoPrendum IdTipoPrendaNavigation { get; set; } = null!;

    public virtual ICollection<MaterialCalculado> MaterialCalculados { get; set; } = new List<MaterialCalculado>();

    public virtual ICollection<PrendaTalle> PrendaTalles { get; set; } = new List<PrendaTalle>();
}
