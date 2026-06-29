using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Ubicacion
{
    public class ScrapProyectoInsumoDTO
    {
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public string? Color { get; set; }
        public string? UnidadMedida { get; set; }
        public decimal CantidadAsignada { get; set; }
        public decimal StockProyecto { get; set; }
    }

    public class ScrapTransferItemDTO
    {
        [Required]
        public int IdInsumo { get; set; }

        public decimal Cantidad { get; set; }

        [StringLength(80)]
        public string? Motivo { get; set; }
    }

    public class ScrapTransferDTO
    {
        [Required]
        public int IdProyecto { get; set; }

        public int? IdUsuario { get; set; }

        [Required]
        public List<ScrapTransferItemDTO> Items { get; set; } = new();
    }
}
