using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Proveedores
{
    public class ProveedorCreateDTO
    {
        [Required(ErrorMessage = "La razon social es obligatoria")]
        [StringLength(100, ErrorMessage = "La razon social no puede superar los 100 caracteres")]
        public string NombreProveedor { get; set; } = null!;

        [Required(ErrorMessage = "El CUIT es obligatorio")]
        [StringLength(15, ErrorMessage = "El CUIT no puede superar los 15 caracteres")]
        public string Cuit { get; set; } = null!;

        [StringLength(30, ErrorMessage = "El telefono no puede superar los 30 caracteres")]
        public string? Telefono { get; set; }

        [StringLength(100, ErrorMessage = "El email no puede superar los 100 caracteres")]
        [EmailAddress(ErrorMessage = "Email invalido")]
        public string? Email { get; set; }

        [StringLength(150, ErrorMessage = "La direccion no puede superar los 150 caracteres")]
        public string? Direccion { get; set; }

        public int? IdCiudad { get; set; }

        public int? IdProvincia { get; set; }

        [StringLength(200, ErrorMessage = "Las observaciones no pueden superar los 200 caracteres")]
        public string? Observaciones { get; set; }
    }
}
