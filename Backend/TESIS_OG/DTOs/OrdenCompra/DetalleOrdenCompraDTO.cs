namespace TESIS_OG.DTOs.OrdenCompra
{
    public class DetalleOrdenCompraDTO
    {
        public int IdInsumo { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}