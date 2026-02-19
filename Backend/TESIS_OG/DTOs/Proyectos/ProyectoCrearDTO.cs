//namespace TESIS_OG.DTOs.Proyectos
//{
//  public class ProyectoCrearDTO
//  {
//    public int IdCliente { get; set; }
//    public string NombreProyecto { get; set; } = null!;
//    public string? TipoPrenda { get; set; }
//    public string? Descripcion { get; set; }
//    public string? Prioridad { get; set; } // "alta", "media", "baja"
//    public string Estado { get; set; } = "pendiente";
//    public DateOnly FechaInicio { get; set; }
//    public DateOnly? FechaFin { get; set; }

//    // Campos nuevos
//    public int? CantidadTotal { get; set; }
//    public int? IdUsuarioEncargado { get; set; }
//    public string? TipoEstacion { get; set; }

//    // Lista de materiales a asignar
//    public List<MaterialAsignadoDTO>? Materiales { get; set; }
//  }
//}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Proyectos
{
    // ===================================================
    // DTO PRINCIPAL PARA CREAR PROYECTO (NUEVO)
    // ===================================================

    public class ProyectoCrearDTO
    {
        [Required(ErrorMessage = "El cliente es obligatorio")]
        public int IdCliente { get; set; }

        [Required(ErrorMessage = "El nombre del proyecto es obligatorio")]
        [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres")]
        public string NombreProyecto { get; set; } = null!;

        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        public string? Descripcion { get; set; }

        [StringLength(10, ErrorMessage = "La prioridad debe ser: alta, media o baja")]
        public string? Prioridad { get; set; } // "alta", "media", "baja"

        public string Estado { get; set; } = "Pendiente";

        [Required(ErrorMessage = "La fecha de inicio es obligatoria")]
        public DateOnly FechaInicio { get; set; }

        public DateOnly? FechaFin { get; set; } // Fecha límite

        public int? IdUsuarioEncargado { get; set; }

        // ========== NUEVO: PRENDAS DEL PROYECTO ==========
        [Required(ErrorMessage = "Debe agregar al menos una prenda")]
        [MinLength(1, ErrorMessage = "Debe agregar al menos una prenda")]
        public List<ProyectoPrendaCrearDTO> Prendas { get; set; } = new();

        // ========== NUEVO: MATERIALES MANUALES ==========
        // Hilos y accesorios que se agregan manualmente
        public List<MaterialManualDTO>? MaterialesManuales { get; set; }
    }

    // ===================================================
    // DTO PARA CADA PRENDA DEL PROYECTO
    // ===================================================

    public class ProyectoPrendaCrearDTO
    {
        [Required(ErrorMessage = "Debe seleccionar el tipo de prenda")]
        public int IdTipoPrenda { get; set; }

        [Required(ErrorMessage = "Debe seleccionar el material")]
        public int IdTipoInsumoMaterial { get; set; } // Tipo de tela (Algodón, Lycra, etc)

        [Required(ErrorMessage = "Debe especificar la cantidad total")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int CantidadTotal { get; set; }

        public bool TieneBordado { get; set; } = false;

        public bool TieneEstampado { get; set; } = false;

        [StringLength(500, ErrorMessage = "La descripción del diseno no puede exceder 500 caracteres")]
        public string? DescripcionDiseno { get; set; }

        public int? Orden { get; set; }

        // ========== DISTRIBUCIÓN POR TALLES ==========
        [Required(ErrorMessage = "Debe especificar la distribución por talles")]
        [MinLength(1, ErrorMessage = "Debe seleccionar al menos un talle")]
        public List<PrendaTalleCrearDTO> Talles { get; set; } = new();
    }

    // ===================================================
    // DTO PARA DISTRIBUCIÓN POR TALLES
    // ===================================================

    public class PrendaTalleCrearDTO
    {
        [Required(ErrorMessage = "Debe seleccionar el talle")]
        public int IdTalle { get; set; }

        [Required(ErrorMessage = "Debe especificar la cantidad")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
    }

    // ===================================================
    // DTO PARA MATERIALES MANUALES (HILOS, ACCESORIOS)
    // ===================================================

    public class MaterialManualDTO
    {
        [Required(ErrorMessage = "Debe seleccionar el insumo")]
        public int IdInsumo { get; set; }

        [Required(ErrorMessage = "Debe especificar la cantidad")]
        [Range(0.01, double.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public decimal Cantidad { get; set; }

        [Required(ErrorMessage = "Debe especificar la unidad de medida")]
        [StringLength(10)]
        public string UnidadMedida { get; set; } = null!;

        [StringLength(500)]
        public string? Observaciones { get; set; }
    }

    // ===================================================
    // DTO DE RESPUESTA: PROYECTO COMPLETO
    // ===================================================

    public class ProyectoDetalleDTO
    {
        public int IdProyecto { get; set; }
        public string CodigoProyecto { get; set; } = null!;
        public int IdCliente { get; set; }
        public string NombreCliente { get; set; } = null!;
        public string NombreProyecto { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? Prioridad { get; set; }
        public string Estado { get; set; } = null!;
        public DateOnly FechaInicio { get; set; }
        public DateOnly? FechaFin { get; set; }
        public int? CantidadTotal { get; set; }
        public int? CantidadProducida { get; set; }
        public int? IdUsuarioEncargado { get; set; }
        public string? NombreUsuarioEncargado { get; set; }
        public bool EsMultiPrenda { get; set; }

        // Prendas del proyecto
        public List<ProyectoPrendaDTO> Prendas { get; set; } = new();

        // Materiales calculados
        public List<MaterialCalculadoResponseDTO> Materiales { get; set; } = new();

        // Alertas de stock
        public List<string> AlertasStock { get; set; } = new();
    }

    // ===================================================
    // DTO: PRENDA DEL PROYECTO (RESPONSE)
    // ===================================================

    public class ProyectoPrendaDTO
    {
        public int IdProyectoPrenda { get; set; }
        public int IdTipoPrenda { get; set; }
        public string NombrePrenda { get; set; } = null!;
        public int? IdTipoInsumoMaterial { get; set; }
        public string? NombreMaterial { get; set; }
        public int CantidadTotal { get; set; }
        public bool TieneBordado { get; set; }
        public bool TieneEstampado { get; set; }
        public string? DescripcionDiseno { get; set; }

        // Distribución por talles
        public List<PrendaTalleDTO> Talles { get; set; } = new();
    }

    // ===================================================
    // DTO: TALLE DE PRENDA (RESPONSE)
    // ===================================================

    public class PrendaTalleDTO
    {
        public int IdPrendaTalle { get; set; }
        public int IdTalle { get; set; }
        public string NombreTalle { get; set; } = null!;
        public int Cantidad { get; set; }
    }

    // ===================================================
    // DTO: MATERIAL CALCULADO (RESPONSE)
    // ===================================================

    public class MaterialCalculadoResponseDTO
    {
        public int IdMaterialCalculado { get; set; }
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public string TipoInsumo { get; set; } = null!;
        public string TipoCalculo { get; set; } = null!; // "Auto" o "Manual"
        public decimal CantidadCalculada { get; set; }
        public decimal? CantidadManual { get; set; }
        public decimal CantidadFinal { get; set; } // La que se va a usar
        public string UnidadMedida { get; set; } = null!;
        public decimal StockActual { get; set; }
        public bool TieneStock { get; set; }
        public string? Observaciones { get; set; }

        // Info adicional
        public int? IdProyectoPrenda { get; set; }
        public string? NombrePrenda { get; set; } // Si es material específico de una prenda
    }

    // ===================================================
    // DTOs PARA CATÁLOGOS (SELECT DROPDOWNS)
    // ===================================================

    public class TipoPrendaDTO
    {
        public int IdTipoPrenda { get; set; }
        public string NombrePrenda { get; set; } = null!;
        public string? Descripcion { get; set; }
        public decimal? LongitudCosturaMetros { get; set; }
        public string? Estado { get; set; }
    }

    public class TalleDTO
    {
        public int IdTalle { get; set; }
        public string NombreTalle { get; set; } = null!;
        public int Orden { get; set; }
        public string? Categoria { get; set; } // Adulto, Nino, Bebé
        public string? Estado { get; set; }
    }

    public class TipoInsumoDTO
    {
        public int IdTipoInsumo { get; set; }
        public string NombreTipo { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? Categoria { get; set; } // Tela, Hilo, Accesorio (derivado del nombre)
    }

    public class InsumoSimpleDTO
    {
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public int IdTipoInsumo { get; set; }
        public string NombreTipoInsumo { get; set; } = null!;
        public string UnidadMedida { get; set; } = null!;
        public decimal StockActual { get; set; }
        public decimal? StockMinimo { get; set; }
        public string? Estado { get; set; }

        // Campos nuevos para telas
        public string? Color { get; set; }
        public string? TipoTela { get; set; }
        public decimal? RatioKgUnidad { get; set; }
    }

    // ===================================================
    // DTO PARA ACTUALIZAR PROYECTO
    // ===================================================

    public class ProyectoActualizarDTO
    {
        public int IdProyecto { get; set; }
        public string? NombreProyecto { get; set; }
        public string? Descripcion { get; set; }
        public string? Prioridad { get; set; }
        public string? Estado { get; set; }
        public DateOnly? FechaFin { get; set; }
        public int? IdUsuarioEncargado { get; set; }

        // NO se pueden modificar las prendas una vez creado el proyecto
        // Solo materiales manuales
        public List<MaterialManualDTO>? MaterialesManualesActualizados { get; set; }
    }

    // ===================================================
    // DTO PARA VALIDACIÓN DE STOCK ANTES DE CREAR
    // ===================================================

    public class ValidacionStockDTO
    {
        public bool TieneStockSuficiente { get; set; }
        public List<AlertaStockDTO> Alertas { get; set; } = new();
    }

    public class AlertaStockDTO
    {
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public decimal CantidadRequerida { get; set; }
        public decimal StockActual { get; set; }
        public decimal Faltante { get; set; }
        public string UnidadMedida { get; set; } = null!;
        public string Severidad { get; set; } = "Warning"; // Warning, Error
    }

    // ===================================================
    // DTO LEGACY: Para mantener compatibilidad
    // ===================================================

    public class MaterialAsignadoDTO
    {
        public int IdInsumo { get; set; }
        public int IdUnidad { get; set; }
        public decimal CantidadAsignada { get; set; }
        public decimal? DesperdicioEstimado { get; set; }
    }
}

