using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Ubicacion
{
    public int IdUbicacion { get; set; }

    public string Codigo { get; set; } = null!;

    public int Rack { get; set; }

    public int Division { get; set; }

    public int Espacio { get; set; }

    public string? Descripcion { get; set; }

    public virtual ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();
}
