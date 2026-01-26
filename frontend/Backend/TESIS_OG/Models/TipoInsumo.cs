using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class TipoInsumo
{
    public int IdTipoInsumo { get; set; }

    public string NombreTipo { get; set; } = null!;

    public string? Descripcion { get; set; }

    public virtual ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();
}
