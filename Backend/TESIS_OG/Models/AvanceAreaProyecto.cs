using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class AvanceAreaProyecto
{
    public int IdAvanceArea { get; set; }

    public int IdProyecto { get; set; }

    public int IdArea { get; set; }

    public int PorcentajeAvance { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    public int? IdUsuarioRegistro { get; set; }

    public string? Observaciones { get; set; }

    public virtual AreaProduccion IdAreaNavigation { get; set; } = null!;

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual Usuario? IdUsuarioRegistroNavigation { get; set; }
}
