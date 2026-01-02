namespace TESIS_OG.DTOs.Proyectos
{
  public class MaterialProyectoDTO
  {
    public int IdDetalle { get; set; }
    public int IdInsumo { get; set; }
    public string? NombreInsumo { get; set; }
    public int IdUnidad { get; set; }
    public string? UnidadMedida { get; set; }
    public decimal CantidadAsignada { get; set; }
    public decimal? CantidadUtilizada { get; set; }
    public decimal? DesperdicioEstimado { get; set; }
  }
}
