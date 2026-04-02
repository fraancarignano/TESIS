using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Despacho
{
    public int IdDespacho { get; set; }

    public int IdProyecto { get; set; }

    public string CodigoDespacho { get; set; } = null!;

    public int? IdUbicacion { get; set; }

    public string Estado { get; set; } = null!;

    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaDespacho { get; set; }

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual Ubicacion? IdUbicacionNavigation { get; set; }
}
