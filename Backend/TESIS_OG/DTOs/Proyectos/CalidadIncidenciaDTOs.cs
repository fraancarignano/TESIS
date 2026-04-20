namespace TESIS_OG.DTOs.Proyectos;

public class CalidadIncidenciaDTO
{
    public int IdCalidadIncidencia { get; set; }
    public int IdProyecto { get; set; }
    public int? IdTaller { get; set; }
    public string? NombreTaller { get; set; }
    public int IdUsuarioRegistro { get; set; }
    public DateTime FechaDeteccion { get; set; }
    public string NombrePrenda { get; set; } = string.Empty;
    public string Talle { get; set; } = string.Empty;
    public string CriterioId { get; set; } = string.Empty;
    public string CriterioNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public string? DetalleFalla { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime? FechaEnvioTaller { get; set; }
    public DateTime? FechaReingreso { get; set; }
    public DateTime? FechaCierre { get; set; }
}

public class CalidadIncidenciaCrearDTO
{
    public int? IdTaller { get; set; }
    public string NombrePrenda { get; set; } = string.Empty;
    public string Talle { get; set; } = string.Empty;
    public string CriterioId { get; set; } = string.Empty;
    public string CriterioNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public string? DetalleFalla { get; set; }
}

public class CalidadIncidenciaActualizarEstadoDTO
{
    public string Estado { get; set; } = string.Empty;
}

public class CalidadIncidenciaResumenDTO
{
    public string NombrePrenda { get; set; } = string.Empty;
    public string Talle { get; set; } = string.Empty;
    public int CantidadTotal { get; set; }
    public int CantidadPendiente { get; set; }
    public int CantidadEnTaller { get; set; }
    public int CantidadReingresada { get; set; }
    public List<CalidadIncidenciaDetalleResumenDTO> Incidencias { get; set; } = new();
}

public class CalidadIncidenciaDetalleResumenDTO
{
    public int IdCalidadIncidencia { get; set; }
    public string CriterioNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaDeteccion { get; set; }
    public string? DetalleFalla { get; set; }
}

