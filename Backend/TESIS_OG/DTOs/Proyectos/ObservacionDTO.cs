namespace TESIS_OG.DTOs.Proyectos
{
  public class ObservacionDTO
  {
    public int IdObservacion { get; set; }
    public int IdUsuario { get; set; }
    public string? NombreUsuario { get; set; }
    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = null!;
  }
}
