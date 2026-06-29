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
        public string? EstadoUbicacion { get; set; }
        public int? IdOrdenCompra { get; set; }
        public string? NroOrden { get; set; }
        public decimal Cantidad { get; set; }
        public DateTime FechaActualizacion { get; set; }

        /// <summary>Estado del proyecto asignado (Pendiente, En Proceso, Finalizado, Despachado, etc.)</summary>
        public string? EstadoProyecto { get; set; }

        /// <summary>Área actual del proyecto (nombre de la etapa, p.ej. "Corte", "Confección")</summary>
        public string? AreaActualProyecto { get; set; }

        /// <summary>
        /// True cuando el stock no puede ser editado manualmente porque el proyecto
        /// se encuentra en etapa Corte o posterior, o ya fue finalizado/despachado.
        /// </summary>
        public bool StockBloqueado { get; set; }

        /// <summary>Motivo del bloqueo, para mostrar al usuario.</summary>
        public string? MotivoBloqueado { get; set; }
    }
}
