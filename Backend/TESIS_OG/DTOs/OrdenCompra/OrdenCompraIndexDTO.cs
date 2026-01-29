namespace TESIS_OG.DTOs.OrdenCompra
{
    public class OrdenCompraIndexDTO
    {
        public int IdOrdenCompra { get; set; }
        public string NroOrden { get; set; } = null!;
        public int IdProveedor { get; set; }
        public string? NombreProveedor { get; set; }
        public DateOnly FechaSolicitud { get; set; }
        public DateOnly? FechaEntregaEstimada { get; set; }
        public string Estado { get; set; } = null!;
        public decimal TotalOrden { get; set; }

        // Lista de detalles
        public List<DetalleOrdenCompraIndexDTO>? Detalles { get; set; }
    }

    public class DetalleOrdenCompraIndexDTO
    {
        public int IdDetalle { get; set; }
        public int IdInsumo { get; set; }
        public string? NombreInsumo { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}