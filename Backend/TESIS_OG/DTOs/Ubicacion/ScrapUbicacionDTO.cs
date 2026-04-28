namespace TESIS_OG.DTOs.Ubicacion
{
    /// <summary>
    /// Proyección de un registro de Scrap para mostrar en el submódulo
    /// Scrap dentro del módulo Ubicaciones.
    /// </summary>
    public class ScrapUbicacionDTO
    {
        public int IdScrap { get; set; }
        public int IdProyecto { get; set; }
        public string? CodigoProyecto { get; set; }
        public string? NombreProyecto { get; set; }
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public decimal CantidadKg { get; set; }
        public string? Motivo { get; set; }
        public string? AreaOcurrencia { get; set; }
        public DateTime FechaRegistro { get; set; }
    }
}
