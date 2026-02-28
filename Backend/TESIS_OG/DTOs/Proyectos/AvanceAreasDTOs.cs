namespace TESIS_OG.DTOs.Proyectos
{
    public class ProyectoAvanceAreaDTO
    {
        public int IdProyecto { get; set; }
        public int IdArea { get; set; }
        public string Area { get; set; } = string.Empty;
        public string Estado { get; set; } = "Pendiente";
        public int PorcentajeAvance { get; set; }
        public int? IdUsuarioCompleto { get; set; }
        public DateTime? FechaCompletado { get; set; }
        public string? Observaciones { get; set; }
    }

    public class CompletarAreaRequestDTO
    {
        public string? Observaciones { get; set; }
    }
}
