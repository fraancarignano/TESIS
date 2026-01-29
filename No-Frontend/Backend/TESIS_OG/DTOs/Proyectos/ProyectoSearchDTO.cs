namespace TESIS_OG.DTOs.Proyectos
{
  public class ProyectoSearchDTO
  {
    public string? NombreProyecto { get; set; }
    public int? IdCliente { get; set; }
    public string? Estado { get; set; }
    public string? Prioridad { get; set; }
    public DateOnly? FechaDesde { get; set; }
    public DateOnly? FechaHasta { get; set; }
    public string? TipoPrenda { get; set; }
  }
}
