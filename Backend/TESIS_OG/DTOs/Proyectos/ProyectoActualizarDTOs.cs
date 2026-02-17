using System;
using System.Collections.Generic;

namespace TESIS_OG.DTOs.Proyectos
{
    // ========================================
    // DTOs DE AUDITORÍA
    // ========================================

    public class ProyectoAuditoriaDTO
    {
        public int IdProyecto { get; set; }
        public int? IdUsuario { get; set; }
        public string TipoOperacion { get; set; } = null!;
        public string? EstadoAnterior { get; set; }
        public string? EstadoNuevo { get; set; }
        public string? CampoModificado { get; set; }
        public string? ValorAnterior { get; set; }
        public string? ValorNuevo { get; set; }
        public string? Descripcion { get; set; }
        public string? DireccionIP { get; set; }
    }

    public class ProyectoHistorialCambioDTO
    {
        public int IdAuditoria { get; set; }
        public int IdProyecto { get; set; }
        public string CodigoProyecto { get; set; } = null!;
        public string NombreProyecto { get; set; } = null!;
        public int? IdUsuario { get; set; }
        public string UsuarioModificador { get; set; } = null!;
        public DateTime FechaHoraCambio { get; set; }
        public string TipoOperacion { get; set; } = null!;
        public string? EstadoAnterior { get; set; }
        public string? EstadoNuevo { get; set; }
        public string? CampoModificado { get; set; }
        public string? ValorAnterior { get; set; }
        public string? ValorNuevo { get; set; }
        public string? Descripcion { get; set; }
        public string? DireccionIP { get; set; }
    }

    public class ProyectoHistorialRequestDTO
    {
        public int? IdProyecto { get; set; }
        public int? IdUsuario { get; set; }
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }
        public string? TipoOperacion { get; set; }
        public int Pagina { get; set; } = 1;
        public int TamanoPagina { get; set; } = 20;
    }

    // ========================================
    // DTOs DE VALIDACIÓN
    // ========================================

    public class ProyectoValidacionEdicionDTO
    {
        public int IdProyecto { get; set; }
        public string EstadoActual { get; set; } = null!;
        public bool EsEditable { get; set; }
        public bool PermiteEdicionCompleta { get; set; }
        public List<string> CamposEditables { get; set; } = new();
        public List<string> CamposBloqueados { get; set; } = new();
        public string Mensaje { get; set; } = null!;
    }

    // ========================================
    // DTOs DE ACTUALIZACIÓN
    // ========================================

    public class MaterialManualActualizadoDTO
    {
        public int? IdMaterial { get; set; }
        public int IdInsumo { get; set; }
        public decimal Cantidad { get; set; }
        public string UnidadMedida { get; set; } = null!;
        public string? Observaciones { get; set; }
        public string Operacion { get; set; } = "ADD"; // ADD, UPDATE, DELETE
    }

    public class ProyectoActualizarCompletoDTO
    {
        public int IdCliente { get; set; }
        public string NombreProyecto { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Prioridad { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public DateTime? FechaFin { get; set; }
        public int? IdUsuarioEncargado { get; set; }
        public List<ProyectoPrendaCrearDTO>? Prendas { get; set; }
        public List<MaterialManualActualizadoDTO>? MaterialesManuales { get; set; }
    }
}