namespace TESIS_OG.DTOs.Proyectos
{
  public class RegistrarScrapDTO
  {
    public int IdInsumo { get; set; }
    public decimal CantidadScrap { get; set; }
    public string? Motivo { get; set; }
    public string? Destino { get; set; }
    public string? AreaOcurrencia { get; set; }
    public decimal? CostoScrap { get; set; }
  }
}
