namespace TESIS_OG.DTOs.Notificaciones
{
    public class CrearNotificacionStockDTO
    {
        public int IdInsumo { get; set; }
        public string Tipo { get; set; } = "Faltante"; // Faltante | Sobrante
        public decimal? StockActual { get; set; }
        public decimal? StockMinimo { get; set; }
        public string? Mensaje { get; set; }
    }

    public class NotificacionStockItemDTO
    {
        public int IdHistorial { get; set; }
        public int IdUsuarioEmisor { get; set; }
        public string UsuarioEmisor { get; set; } = string.Empty;
        public DateOnly Fecha { get; set; }
        public int IdInsumo { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public bool Leida { get; set; }
    }
}
