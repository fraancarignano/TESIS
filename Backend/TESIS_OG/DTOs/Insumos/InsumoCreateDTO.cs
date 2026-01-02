namespace TESIS_OG.DTOs.Insumos
{
  public class InsumoCreateDTO
  {
    public string NombreInsumo { get; set; } = null!;
    public int IdTipoInsumo { get; set; }
    public string UnidadMedida { get; set; } = null!;
    public decimal StockActual { get; set; }
    public decimal? StockMinimo { get; set; }
    public int? IdProveedor { get; set; }
    public string? Estado { get; set; } = "Disponible";
  }
}
