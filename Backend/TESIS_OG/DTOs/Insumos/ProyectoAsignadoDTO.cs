namespace TESIS_OG.DTOs.Insumos
{
    public class ProyectoAsignadoDTO
    {
        public int IdProyecto { get; set; }
        public string NombreProyecto { get; set; } = null!;
        public string CodigoProyecto { get; set; } = null!;
        public decimal Cantidad { get; set; }
        public string UnidadMedida { get; set; } = null!;
        public string TipoCalculo { get; set; } = null!; // Auto o Manual
        public string? NombrePrenda { get; set; }
    }
}
