using System;

namespace TESIS_OG.Models;

public partial class ProyectoDiseno
{
    public int IdDiseno { get; set; }

    public int IdProyecto { get; set; }

    public int IdPrenda { get; set; }

    public string? ImagenLogo { get; set; }

    public string? DescripcionLogo { get; set; }

    public string? ImagenMockup { get; set; }

    public string? DescripcionMockup { get; set; }

    public int? IdUsuarioCreacion { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public int? IdUsuarioModificacion { get; set; }

    public DateTime? FechaModificacion { get; set; }

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual ProyectoPrendum IdPrendaNavigation { get; set; } = null!;
}
