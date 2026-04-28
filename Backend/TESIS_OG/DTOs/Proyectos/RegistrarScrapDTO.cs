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
    /// <summary>IdUbicacion destino. Si null, el servicio seed-on-demand asigna SCRP.</summary>
    public int? IdUbicacion { get; set; }
  }

  public class ScrapProyectoDTO
  {
    public int IdScrap { get; set; }
    public int IdInsumo { get; set; }
    public string NombreInsumo { get; set; } = null!;
    public decimal CantidadKg { get; set; }
    public string? Motivo { get; set; }
    public string? AreaOcurrencia { get; set; }
    public DateTime FechaRegistro { get; set; }
    public string? NombreUbicacion { get; set; }
  }
}
