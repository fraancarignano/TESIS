namespace TESIS_OG.DTOs.OrdenCompra
{
    public class OrdenCompraEditDTO
    {
        public int IdOrdenCompra { get; set; }
        public string NroOrden { get; set; } = null!;
        public int IdProveedor { get; set; }
        public DateOnly FechaSolicitud { get; set; }
        public DateOnly? FechaEntregaEstimada { get; set; }
        public string Estado { get; set; } = null!;
        public decimal TotalOrden { get; set; }

        public List<DetalleOrdenCompraDTO> Detalles { get; set; } = new List<DetalleOrdenCompraDTO>();
    }
}