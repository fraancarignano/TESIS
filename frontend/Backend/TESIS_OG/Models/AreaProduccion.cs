using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class AreaProduccion
{
    public int IdArea { get; set; }

    public string NombreArea { get; set; } = null!;

    public int Orden { get; set; }

    public string? Descripcion { get; set; }

    public string? Estado { get; set; }

    public virtual ICollection<AvanceAreaProyecto> AvanceAreaProyectos { get; set; } = new List<AvanceAreaProyecto>();
}
