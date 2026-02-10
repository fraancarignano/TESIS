using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class TipoPrendum
{
    public int IdTipoPrenda { get; set; }

    public string NombrePrenda { get; set; } = null!;

    public string? Descripcion { get; set; }

    public decimal? LongitudCosturaMetros { get; set; }

    public string? Estado { get; set; }

    public virtual ICollection<ConfiguracionMaterial> ConfiguracionMaterials { get; set; } = new List<ConfiguracionMaterial>();

    public virtual ICollection<ProyectoPrendum> ProyectoPrenda { get; set; } = new List<ProyectoPrendum>();
}
