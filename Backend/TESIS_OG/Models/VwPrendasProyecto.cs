using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class VwPrendasProyecto
{
    public int IdProyecto { get; set; }

    public string NombreProyecto { get; set; } = null!;

    public int IdProyectoPrenda { get; set; }

    public string NombrePrenda { get; set; } = null!;

    public int CantidadTotal { get; set; }

    public string? Material { get; set; }

    public bool? TieneBordado { get; set; }

    public bool? TieneEstampado { get; set; }

    public string? DescripcionDiseño { get; set; }

    public int? CantidadTallesDistintos { get; set; }
}
