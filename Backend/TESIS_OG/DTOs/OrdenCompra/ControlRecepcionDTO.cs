using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.OrdenCompra
{
    /// <summary>
    /// DTO para que el Operario / Depósito confirme el control de recepción
    /// </summary>
    public class ControlRecepcionDTO
    {
        [Required]
        public int IdOrdenCompra { get; set; }

        [Required]
        public int IdUsuarioControl { get; set; }

        [Required]
        public string FechaControl { get; set; } = null!;

        public string? Observacion { get; set; }

        public List<DetalleRecepcionDTO> Detalles { get; set; } = new();
    }
}
