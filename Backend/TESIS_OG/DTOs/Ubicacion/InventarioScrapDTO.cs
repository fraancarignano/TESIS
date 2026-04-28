namespace TESIS_OG.DTOs.Ubicacion
{
    public class InventarioScrapDTO
    {
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public decimal CantidadTotalKg { get; set; }
        public int CantidadProyectos { get; set; }
        public DateTime UltimoRegistro { get; set; }
    }
}
