using System;

namespace TESIS_OG.DTOs.Insumos
{
    public class InsumoStockDTO
    {
        public int IdInsumoStock { get; set; }
        public int IdInsumo { get; set; }
        public int? IdProyecto { get; set; }
        public string? NombreProyecto { get; set; }
        public string? CodigoProyecto { get; set; }
        public int? IdUbicacion { get; set; }
        public string? CodigoUbicacion { get; set; }
        public int? IdOrdenCompra { get; set; }
        public string? NroOrden { get; set; }
        public decimal Cantidad { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }
}
