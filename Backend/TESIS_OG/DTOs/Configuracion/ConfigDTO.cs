using System;
using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Configuracion
{
    // ===================================================
    // DTOs PARA CONFIGURACIÓN DE MATERIALES
    // ===================================================

    public class ConfiguracionMaterialDTO
    {
        public int IdConfig { get; set; }
        public int IdTipoPrenda { get; set; }
        public string NombrePrenda { get; set; } = null!;
        public int IdTipoInsumo { get; set; }
        public string NombreTipoInsumo { get; set; } = null!;
        public decimal CantidadPorUnidad { get; set; }
        public string UnidadMedida { get; set; } = null!;
        public string? Descripcion { get; set; }
    }

    public class ConfiguracionMaterialCrearDTO
    {
        [Required(ErrorMessage = "Debe seleccionar el tipo de prenda")]
        public int IdTipoPrenda { get; set; }

        [Required(ErrorMessage = "Debe seleccionar el tipo de material")]
        public int IdTipoInsumo { get; set; }

        [Required(ErrorMessage = "Debe especificar la cantidad por unidad")]
        [Range(0.001, double.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public decimal CantidadPorUnidad { get; set; }

        [Required(ErrorMessage = "Debe especificar la unidad de medida")]
        [StringLength(10)]
        public string UnidadMedida { get; set; } = null!;

        [StringLength(200)]
        public string? Descripcion { get; set; }
    }

    // ===================================================
    // DTOs PARA CÁLCULO DE MATERIALES
    // ===================================================

    public class CalculoMaterialesRequestDTO
    {
        [Required]
        public List<PrendaParaCalculoDTO> Prendas { get; set; } = new();

        public List<MaterialManualParaCalculoDTO>? MaterialesManuales { get; set; }
    }

    public class PrendaParaCalculoDTO
    {
        public int IdTipoPrenda { get; set; }
        public int IdTipoInsumoMaterial { get; set; }
        public int CantidadTotal { get; set; }
    }

    public class MaterialManualParaCalculoDTO
    {
        public int IdInsumo { get; set; }
        public decimal Cantidad { get; set; }
    }

    public class CalculoMaterialesResponseDTO
    {
        public List<MaterialCalculadoPreviewDTO> MaterialesCalculados { get; set; } = new();
        public List<AlertaCalculoDTO> Alertas { get; set; } = new();
        public bool PuedeCrearse { get; set; }
    }

    public class MaterialCalculadoPreviewDTO
    {
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public string TipoInsumo { get; set; } = null!;
        public string TipoCalculo { get; set; } = null!;
        public decimal CantidadNecesaria { get; set; }
        public string UnidadMedida { get; set; } = null!;
        public decimal StockActual { get; set; }
        public bool TieneStockSuficiente { get; set; }
        public decimal? Faltante { get; set; }
    }

    public class AlertaCalculoDTO
    {
        public string Tipo { get; set; } = null!; // "SinStock", "StockInsuficiente", "Advertencia"
        public string Mensaje { get; set; } = null!;
        public string? IdInsumo { get; set; }
        public string? NombreInsumo { get; set; }
    }

    // ===================================================
    // DTOs PARA INICIALIZACIÓN DEL FORMULARIO
    // ===================================================

    public class FormularioProyectoInicializacionDTO
    {
        // Catálogos necesarios para el formulario
        public List<ClienteSimpleDTO> Clientes { get; set; } = new();
        public List<TipoPrendaSimpleDTO> TiposPrenda { get; set; } = new();
        public List<TalleSimpleDTO> Talles { get; set; } = new();
        public List<TipoInsumoSimpleDTO> TiposInsumo { get; set; } = new();
        public List<InsumoParaFormularioDTO> Insumos { get; set; } = new();
        public List<UsuarioSimpleDTO> Usuarios { get; set; } = new();
        public List<string> Prioridades { get; set; } = new() { "alta", "media", "baja" };
    }

    public class ClienteSimpleDTO
    {
        public int IdCliente { get; set; }
        public string NombreCompleto { get; set; } = null!;
        public string TipoCliente { get; set; } = null!;
        public string? Email { get; set; }
    }

    public class TipoPrendaSimpleDTO
    {
        public int IdTipoPrenda { get; set; }
        public string NombrePrenda { get; set; } = null!;
        public decimal? LongitudCosturaMetros { get; set; }
    }

    public class TalleSimpleDTO
    {
        public int IdTalle { get; set; }
        public string NombreTalle { get; set; } = null!;
        public int Orden { get; set; }
        public string? Categoria { get; set; }
    }

    public class TipoInsumoSimpleDTO
    {
        public int IdTipoInsumo { get; set; }
        public string NombreTipo { get; set; } = null!;
        public string Categoria { get; set; } = null!; // Tela, Hilo, Accesorio
    }

    public class InsumoParaFormularioDTO
    {
        public int IdInsumo { get; set; }
        public string NombreInsumo { get; set; } = null!;
        public int IdTipoInsumo { get; set; }
        public string NombreTipoInsumo { get; set; } = null!;
        public string Categoria { get; set; } = null!; // Tela, Hilo, Accesorio
        public string UnidadMedida { get; set; } = null!;
        public decimal StockActual { get; set; }

        // Campos específicos de telas
        public string? Color { get; set; }
        public string? TipoTela { get; set; }
        public decimal? RatioKgUnidad { get; set; }
    }

    public class UsuarioSimpleDTO
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = null!;
        public string ApellidoUsuario { get; set; } = null!;
        public string NombreCompleto { get; set; } = null!;
    }

    // ===================================================
    // DTOs PARA VALIDACIONES
    // ===================================================

    public class ValidarTallesRequestDTO
    {
        [Required]
        public int CantidadTotal { get; set; }

        [Required]
        [MinLength(1)]
        public List<TalleValidacionDTO> Talles { get; set; } = new();
    }

    public class TalleValidacionDTO
    {
        public int IdTalle { get; set; }
        public int Cantidad { get; set; }
    }

    public class ValidarTallesResponseDTO
    {
        public bool EsValido { get; set; }
        public int CantidadTotal { get; set; }
        public int SumaTalles { get; set; }
        public int Diferencia { get; set; }
        public string? Mensaje { get; set; }
    }
}