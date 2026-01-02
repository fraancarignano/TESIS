namespace TESIS_OG.DTOs.Insumos
{
  public class InsumoSearchDTO
  {
    public string? NombreInsumo { get; set; }
    public int? IdTipoInsumo { get; set; }
    public string? UnidadMedida { get; set; }
    public int? IdProveedor { get; set; }
    public string? Estado { get; set; }
    public bool? SoloStockBajo { get; set; } // Para filtrar insumos con stock bajo
  }
}
