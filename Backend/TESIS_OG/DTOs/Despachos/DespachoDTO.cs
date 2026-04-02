using System;

namespace TESIS_OG.DTOs.Despachos;

public class DespachoDTO
{
    public int IdDespacho { get; set; }
    public int IdProyecto { get; set; }
    public string NombreProyecto { get; set; } = null!;
    public string Cliente { get; set; } = null!;
    public string CodigoDespacho { get; set; } = null!;
    public int? IdUbicacion { get; set; }
    public string? CodigoUbicacion { get; set; }
    public string Estado { get; set; } = null!;
    public string? Observaciones { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaDespacho { get; set; }
}

public class CreateDespachoDTO
{
    public int IdProyecto { get; set; }
    public string? Observaciones { get; set; }
}

public class AsignarUbicacionDTO
{
    public int IdUbicacion { get; set; }
}
