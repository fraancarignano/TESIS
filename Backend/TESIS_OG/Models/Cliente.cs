using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations; // Necesario para las validaciones
using System.ComponentModel.DataAnnotations.Schema;

namespace TESIS_OG.Models;

[Table("Clientes")] // Asegura el mapeo correcto
public partial class Cliente
{
    [Key]
    public int IdCliente { get; set; }

    [Display(Name = "Nombre y Apellido")]
    [StringLength(80, ErrorMessage = "El nombre no puede superar los 80 caracteres.")]
    public string? NombreApellido { get; set; }

    [Display(Name = "Razón Social")]
    [StringLength(80, ErrorMessage = "La razón social no puede superar los 80 caracteres.")]
    public string? RazonSocial { get; set; }

    [Required(ErrorMessage = "El tipo de cliente es obligatorio.")]
    [Display(Name = "Tipo de Cliente")]
    public string TipoCliente { get; set; } = null!;

    [Required(ErrorMessage = "El CUIT es obligatorio.")]
    [StringLength(15, ErrorMessage = "El CUIT no puede superar los 15 caracteres.")]
    public string? Cuit { get; set; }

    [DataType(DataType.PhoneNumber)]
    [Display(Name = "Teléfono")]
    [StringLength(30)]
    public string? Telefono { get; set; }

    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de email inválido.")]
    [StringLength(100)]
    public string? Email { get; set; }

    [Display(Name = "Dirección")]
    public int? IdDireccion { get; set; }

    [Display(Name = "Estado")]
    public int IdEstadoCliente { get; set; }

    [DataType(DataType.Date)]
    [Display(Name = "Fecha de Alta")]
    public DateOnly FechaAlta { get; set; }

    [DataType(DataType.MultilineText)]
    [StringLength(200)]
    public string? Observaciones { get; set; }

    // --- PROPIEDADES DE NAVEGACIÓN (NO TOCAR) ---
    // Estas líneas permiten que el sistema sepa qué proyectos e historial pertenecen a este cliente

    public virtual ICollection<HistorialCliente> HistorialClientes { get; set; } = new List<HistorialCliente>();

    public virtual Direccion? IdDireccionNavigation { get; set; }

    public virtual EstadoCliente IdEstadoClienteNavigation { get; set; } = null!;

    public virtual ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}
