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

    // ============================================================
    // DTOs para solicitudes de material por proyecto
    // ============================================================

    public class CrearSolicitudMaterialDTO
    {
        public int IdProyecto { get; set; }
        public string NombreProyecto { get; set; } = null!;
        public List<SolicitudMaterialItemDTO> Materiales { get; set; } = new();
    }

    public class SolicitudMaterialItemDTO
    {
        public int? IdTipoInsumo { get; set; }
        public string? NombreTipoInsumo { get; set; }
        public string? ColorSolicitado { get; set; }
        public decimal? CantidadEstimada { get; set; }
        public string? UnidadMedida { get; set; }
        public string? Mensaje { get; set; }
    }

    public class SolicitudMaterialResponseDTO
    {
        public int IdSolicitud { get; set; }
        public int IdProyecto { get; set; }
        public string NombreProyecto { get; set; } = null!;
        public string? NombreTipoInsumo { get; set; }
        public string? ColorSolicitado { get; set; }
        public decimal? CantidadEstimada { get; set; }
        public string? UnidadMedida { get; set; }
        public string? Mensaje { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public string UsuarioEmisor { get; set; } = string.Empty;
        public DateOnly FechaSolicitud { get; set; }
        public DateOnly? FechaAtendida { get; set; }
    }
}
