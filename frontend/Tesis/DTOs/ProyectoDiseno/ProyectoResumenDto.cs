namespace Tesis.DTOs.ProyectoDiseno;

public class ProyectoResumenDto
{
    public int IdProyecto { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string NombreProyecto { get; set; } = string.Empty;
    public string? Prioridad { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public bool AreaCompletada { get; set; }
    public string EstadoArea { get; set; } = "Pendiente";
    public List<ProyectoResumenPrendaDto> Prendas { get; set; } = [];
}

public class ProyectoResumenPrendaDto
{
    public int IdProyectoPrenda { get; set; }
    public string TipoPrenda { get; set; } = string.Empty;
    public string? MaterialBase { get; set; }
    public int CantidadTotal { get; set; }
    public bool TieneBordado { get; set; }
    public bool TieneEstampado { get; set; }
    public string? DescripcionDiseno { get; set; }
    public List<ProyectoResumenTalleDto> Talles { get; set; } = [];
}

public class ProyectoResumenTalleDto
{
    public int IdTalle { get; set; }
    public string NombreTalle { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}
