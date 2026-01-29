namespace TESIS_OG.DTOs.Proyectos
{
  public class ProyectoCrearDTO
  {
    public int IdCliente { get; set; }
    public string NombreProyecto { get; set; } = null!;
    public string? TipoPrenda { get; set; }
    public string? Descripcion { get; set; }
    public string? Prioridad { get; set; } // "alta", "media", "baja"
    public string Estado { get; set; } = "pendiente";
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }

    // Campos nuevos
    public int? CantidadTotal { get; set; }
    public int? IdUsuarioEncargado { get; set; }
    public string? TipoEstacion { get; set; }

    // Lista de materiales a asignar
    public List<MaterialAsignadoDTO>? Materiales { get; set; }
  }
}



