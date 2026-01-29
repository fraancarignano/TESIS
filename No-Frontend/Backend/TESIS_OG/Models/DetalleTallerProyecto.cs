using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class DetalleTallerProyecto
{
    public int IdDetalleTaller { get; set; }

    public int IdTaller { get; set; }

    public int IdProyecto { get; set; }

    public DateOnly FechaAsignacion { get; set; }

    public string? EstadoTaller { get; set; }

    public string? Observaciones { get; set; }

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual Taller IdTallerNavigation { get; set; } = null!;
}
