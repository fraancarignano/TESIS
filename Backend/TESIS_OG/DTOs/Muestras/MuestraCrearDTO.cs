using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Muestras
{
    public class MuestraCrearDTO
    {
        [Required(ErrorMessage = "El cliente es obligatorio")]
        public int IdCliente { get; set; }

        [Required(ErrorMessage = "El nombre de la muestra es obligatorio")]
        [StringLength(80, ErrorMessage = "El nombre no puede exceder 80 caracteres")]
        public string NombreMuestra { get; set; } = null!;

        [StringLength(300, ErrorMessage = "La descripción no puede exceder 300 caracteres")]
        public string? Descripcion { get; set; }

        [StringLength(10, ErrorMessage = "La prioridad debe ser: alta, media o baja")]
        public string? Prioridad { get; set; }

        public string Estado { get; set; } = "Pendiente";

        [Required(ErrorMessage = "La fecha de creación es obligatoria")]
        public DateOnly FechaCreacion { get; set; }

        public DateOnly? FechaEntrega { get; set; }

        public int? IdUsuarioEncargado { get; set; }

        [Required(ErrorMessage = "El mockup es obligatorio")]
        [StringLength(500)]
        public string MockupUrl { get; set; } = null!;

        public bool BordadoRequerido { get; set; }

        [StringLength(400)]
        public string? BordadoDescripcion { get; set; }

        [StringLength(500)]
        public string? BordadoReferencia { get; set; }

        public bool EstampadoRequerido { get; set; }

        [StringLength(400)]
        public string? EstampadoDescripcion { get; set; }

        [StringLength(500)]
        public string? EstampadoReferencia { get; set; }

        [StringLength(500)]
        public string? OtrosDetalle { get; set; }

        [StringLength(50)]
        public string? PaletaRgb { get; set; }

        [Required(ErrorMessage = "Debe agregar al menos una prenda")]
        [MinLength(1, ErrorMessage = "Debe agregar al menos una prenda")]
        public List<MuestraPrendaCrearDTO> Prendas { get; set; } = new();
    }

    public class MuestraPrendaCrearDTO
    {
        [Required]
        public int IdTipoPrenda { get; set; }

        [Required]
        public int IdTipoInsumoMaterial { get; set; }

        [StringLength(80)]
        public string? ColorTela { get; set; }

        public bool TieneBordado { get; set; }

        public bool TieneEstampado { get; set; }

        [StringLength(400)]
        public string? DescripcionDiseno { get; set; }
    }
}
