namespace TESIS_OG.DTOs.Insumos
{
  public class InsumoEditDTO
  {
    public string NombreInsumo { get; set; } = null!;
    public int IdTipoInsumo { get; set; }
    public string UnidadMedida { get; set; } = null!;
    public decimal StockActual { get; set; }
    public decimal? StockMinimo { get; set; }
    public int? IdProveedor { get; set; }
    public int? IdUbicacion { get; set; }
    public string? Estado { get; set; }
    public string? Color { get; set; }
    public string? TipoTela { get; set; }
    public decimal? PrecioUnitario { get; set; }
  }
}
