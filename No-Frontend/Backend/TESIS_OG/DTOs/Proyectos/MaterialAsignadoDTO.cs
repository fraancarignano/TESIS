namespace TESIS_OG.DTOs.Proyectos
{
  public class MaterialAsignadoDTO
  {
    public int IdInsumo { get; set; }
    public int IdUnidad { get; set; }
    public decimal CantidadAsignada { get; set; }
    public decimal? DesperdicioEstimado { get; set; }
  }
}
