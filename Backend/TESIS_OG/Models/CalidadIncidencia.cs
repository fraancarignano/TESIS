using System;

namespace TESIS_OG.Models;

public partial class CalidadIncidencia
{
    public int IdCalidadIncidencia { get; set; }

    public int IdProyecto { get; set; }

    public int? IdTaller { get; set; }

    public int IdUsuarioRegistro { get; set; }

    public DateTime FechaDeteccion { get; set; }

    public string NombrePrenda { get; set; } = null!;

    public string Talle { get; set; } = null!;

    public string CriterioId { get; set; } = null!;

    public string CriterioNombre { get; set; } = null!;

    public int Cantidad { get; set; }

    public string? DetalleFalla { get; set; }

    public string Estado { get; set; } = null!;

    public DateTime? FechaEnvioTaller { get; set; }

    public DateTime? FechaReingreso { get; set; }

    public DateTime? FechaCierre { get; set; }

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual Taller? IdTallerNavigation { get; set; }

    public virtual Usuario IdUsuarioRegistroNavigation { get; set; } = null!;
}

