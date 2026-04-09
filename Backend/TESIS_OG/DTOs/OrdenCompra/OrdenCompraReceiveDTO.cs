using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.OrdenCompra
{
    /// <summary>
    /// DTO para registrar la recepción de una orden de compra
    /// </summary>
    public class OrdenCompraReceiveDTO
    {
        [Required(ErrorMessage = "El ID de la orden es requerido")]
        public int IdOrdenCompra { get; set; }

        [Required(ErrorMessage = "La fecha de recepción es requerida")]
        public string FechaRecepcion { get; set; } = null!;

        public string? Observacion { get; set; }

        [Required(ErrorMessage = "El ID del usuario es requerido")]
        public int IdUsuario { get; set; }

        /// <summary>
        /// Lista de insumos recibidos con sus cantidades
        /// Permite recepción parcial si es necesario
        /// </summary>
        public List<DetalleRecepcionDTO> Detalles { get; set; } = new List<DetalleRecepcionDTO>();
    }

    public class DetalleRecepcionDTO
    {
        [Required]
        public int IdInsumo { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "La cantidad no puede ser negativa")]
        public decimal CantidadRecibida { get; set; }

        public string? ObservacionDetalle { get; set; }
    }
}
