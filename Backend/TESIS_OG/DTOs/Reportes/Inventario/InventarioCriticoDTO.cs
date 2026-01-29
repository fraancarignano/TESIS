public class InventarioCriticoDTO
{
    public int IdInsumo { get; set; }
    public string NombreInsumo { get; set; } = string.Empty;
    public string TipoInsumo { get; set; } = string.Empty;
    public decimal StockActual { get; set; }
    public decimal StockMinimo { get; set; }
    public string UnidadMedida { get; set; } = string.Empty;
    public DateTime UltimaActualizacion { get; set; }
    public string NivelCriticidad { get; set; } = string.Empty;
    public int? DiasRestantes { get; set; }  // ← Nullable porque puede ser NULL
}
