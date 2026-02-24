using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Talleres;

public class TallerEditDTO
{
    [Required(ErrorMessage = "El nombre del taller es obligatorio")]
    [StringLength(80, ErrorMessage = "El nombre no puede superar los 80 caracteres")]
    public string NombreTaller { get; set; } = null!;

    [StringLength(20, ErrorMessage = "El tipo no puede superar los 20 caracteres")]
    public string? TipoTaller { get; set; }

    [StringLength(80, ErrorMessage = "El responsable no puede superar los 80 caracteres")]
    public string? Responsable { get; set; }

    [StringLength(20, ErrorMessage = "El telefono no puede superar los 20 caracteres")]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "Email invalido")]
    [StringLength(80, ErrorMessage = "El email no puede superar los 80 caracteres")]
    public string? Email { get; set; }

    [StringLength(120, ErrorMessage = "La direccion no puede superar los 120 caracteres")]
    public string? Direccion { get; set; }

    [Required(ErrorMessage = "Debe seleccionar una ciudad")]
    public int IdCiudad { get; set; }

    public int? IdProvincia { get; set; }
}
