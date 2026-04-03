namespace Tesis.DTOs.ProyectoDiseno;

public class ProyectoDisenoDetalleDto
{
    public int IdProyecto { get; set; }
    public bool Completado { get; set; }
    public string EstadoArea { get; set; } = "Pendiente";
    public DateTime? FechaCompletado { get; set; }
    public string? ObservacionesGenerales { get; set; }
    public List<ProyectoDisenoPrendaDetalleDto> Prendas { get; set; } = [];
}

public class ProyectoDisenoPrendaDetalleDto
{
    public int IdDiseno { get; set; }
    public int IdPrenda { get; set; }
    public string? ImagenLogo { get; set; }
    public string? DescripcionLogo { get; set; }
    public string? ImagenMockup { get; set; }
    public string? DescripcionMockup { get; set; }
}
