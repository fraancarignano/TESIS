namespace TESIS_OG.DTOs.OrdenCompra
{
    public class OrdenCompraCreateDTO
    {
        public string NroOrden { get; set; } = null!;
        public int IdProveedor { get; set; }
        public DateOnly FechaSolicitud { get; set; }
        public DateOnly? FechaEntregaEstimada { get; set; }
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Aprobada, Recibida, Cancelada
        public decimal TotalOrden { get; set; }

        // Lista de detalles (insumos)
        public List<DetalleOrdenCompraDTO> Detalles { get; set; } = new List<DetalleOrdenCompraDTO>();
    }
}