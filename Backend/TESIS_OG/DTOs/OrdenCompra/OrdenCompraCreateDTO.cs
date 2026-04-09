namespace TESIS_OG.DTOs.OrdenCompra
{
    public class OrdenCompraCreateDTO
    {
        // NroOrden se genera automáticamente, no se recibe del cliente
        public int IdProveedor { get; set; }
        public string? Descripcion { get; set; }
        public DateOnly FechaSolicitud { get; set; }
        public DateOnly? FechaEntregaEstimada { get; set; }
        // Estado siempre es "Pendiente" al crear
        public decimal TotalOrden { get; set; }

        // Lista de detalles (insumos)
        public List<DetalleOrdenCompraDTO> Detalles { get; set; } = new List<DetalleOrdenCompraDTO>();
    }
}