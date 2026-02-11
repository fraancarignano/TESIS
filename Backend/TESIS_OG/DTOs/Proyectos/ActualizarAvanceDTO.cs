namespace TESIS_OG.DTOs.Proyectos
{
  public class ActualizarAvanceDTO
  {
    public int IdArea { get; set; }
    public int Porcentaje { get; set; } // 0-100
    public string? Observaciones { get; set; }
  }
}
