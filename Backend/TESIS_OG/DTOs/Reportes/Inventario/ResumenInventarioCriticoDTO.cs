namespace TESIS_OG.DTOs.Reportes.Inventario
{
  public class ResumenInventarioCriticoDTO
  {
    public int TotalInsumosMonitoreados { get; set; }
    public int InsumosCriticos { get; set; }
    public int InsumosAgotados { get; set; }
    public int InsumosBajos { get; set; }
    public int InsumosAlerta { get; set; }
    public decimal PorcentajeCriticidad { get; set; }
    public List<InventarioCriticoDTO> Insumos { get; set; } = new();
  }
}
