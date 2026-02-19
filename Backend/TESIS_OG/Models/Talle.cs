using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Talle
{
    public int IdTalle { get; set; }

    public string NombreTalle { get; set; } = null!;

    public int Orden { get; set; }

    public string? Categoria { get; set; }

    public string? Estado { get; set; }

    public virtual ICollection<PrendaTalle> PrendaTalles { get; set; } = new List<PrendaTalle>();
}
