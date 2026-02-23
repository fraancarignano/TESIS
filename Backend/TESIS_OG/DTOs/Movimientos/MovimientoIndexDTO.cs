using System;

namespace TESIS_OG.DTOs.Movimientos
{
    public class MovimientoIndexDTO
    {
        public int IdMovimiento { get; set; }
        public int? IdInsumo { get; set; }
        public string? NombreInsumo { get; set; }
        public string TipoMovimiento { get; set; } = null!;
        public decimal Cantidad { get; set; }
        public string UnidadesDetalle { get; set; } = null!; // Ej: "+ 5 unidades" o "10 mts"
        public DateOnly FechaMovimiento { get; set; }
        public string? Usuario { get; set; }
        public string Origen { get; set; } = null!;
        public string? Destino { get; set; }
        public string? Observacion { get; set; }
    }

    public class MovimientoSearchDTO
    {
        public DateOnly? FechaDesde { get; set; }
        public DateOnly? FechaHasta { get; set; }
        public string? TerminoBusqueda { get; set; } // Nombre del insumo o tipo
    }
}
