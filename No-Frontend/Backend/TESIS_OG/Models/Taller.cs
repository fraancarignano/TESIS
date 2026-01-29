using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Taller
{
    public int IdTaller { get; set; }

    public string NombreTaller { get; set; } = null!;

    public string? TipoTaller { get; set; }

    public string? Responsable { get; set; }

    public string? Telefono { get; set; }

    public string? Email { get; set; }

    public string? Direccion { get; set; }

    public int IdCiudad { get; set; }

    public virtual ICollection<DetalleTallerProyecto> DetalleTallerProyectos { get; set; } = new List<DetalleTallerProyecto>();

    public virtual Ciudad IdCiudadNavigation { get; set; } = null!;
}
