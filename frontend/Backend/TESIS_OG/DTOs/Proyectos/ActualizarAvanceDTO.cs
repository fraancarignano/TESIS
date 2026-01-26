namespace TESIS_OG.DTOs.Proyectos
{
  public class ActualizarAvanceDTO
  {
    public string Area { get; set; } = null!; // "gerenciaAdmin", "diseñoDesarrollo", etc.
    public int Porcentaje { get; set; } // 0-100
    public string? Observaciones { get; set; }
  }
}
