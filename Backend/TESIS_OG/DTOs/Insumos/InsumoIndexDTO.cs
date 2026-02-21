namespace TESIS_OG.DTOs.Insumos
{
  public class InsumoIndexDTO
  {
    public int IdInsumo { get; set; }
    public string NombreInsumo { get; set; } = null!;
    public int IdTipoInsumo { get; set; }
    public string? NombreTipoInsumo { get; set; }
    public string UnidadMedida { get; set; } = null!;
    public decimal StockActual { get; set; }
    public decimal? StockMinimo { get; set; }
    public DateOnly FechaActualizacion { get; set; }
    public int? IdProveedor { get; set; }
    public string? NombreProveedor { get; set; }
    public string? CuitProveedor { get; set; }
    public string? Estado { get; set; }
    public int? IdUbicacion { get; set; }
    public string? CodigoUbicacion { get; set; }
        
    public List<ProyectoAsignadoDTO>? ProyectosAsignados { get; set; }

    // Propiedad calculada para saber si el stock está bajo
    public bool StockBajo => StockMinimo.HasValue && StockActual < StockMinimo.Value;
  }
}
