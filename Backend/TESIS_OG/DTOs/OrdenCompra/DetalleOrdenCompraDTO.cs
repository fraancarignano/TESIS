namespace TESIS_OG.DTOs.OrdenCompra
{
    public class DetalleOrdenCompraDTO
    {
        // Si IdInsumo > 0: insumo existente
        // Si IdInsumo == 0: insumo nuevo (usar campos NuevoInsumo*)
        public int IdInsumo { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }

        // Campos para insumo nuevo (solo cuando IdInsumo == 0)
        public string? NuevoNombreInsumo { get; set; }
        public int? NuevoIdTipoInsumo { get; set; }
        public string? NuevoColor { get; set; }
        public string? NuevoUnidadMedida { get; set; }

        // Campos para materiales extra de proyecto
        public int? IdProyecto { get; set; }
        public int? IdProyectoPrenda { get; set; }
        public bool EsMaterialExtra { get; set; }
    }
}