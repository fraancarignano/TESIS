using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class UnidadMedidum
{
    public int IdUnidad { get; set; }

    public string NombreUnidad { get; set; } = null!;

    public string? Descripcion { get; set; }

    public virtual ICollection<DetalleMaterialProyecto> DetalleMaterialProyectos { get; set; } = new List<DetalleMaterialProyecto>();
}
