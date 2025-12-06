using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Cliente
{
    public int IdCliente { get; set; }

    public string? RazonSocial { get; set; }

    public string TipoCliente { get; set; } = null!;

    public string? CuitCuil { get; set; }

    public string? Telefono { get; set; }

    public string? Email { get; set; }

    public int IdEstadoCliente { get; set; }

    public DateOnly FechaAlta { get; set; }

    public string? Observaciones { get; set; }

    public string? Nombre { get; set; }

    public string? Apellido { get; set; }

    public string? TipoDocumento { get; set; }

    public string? NumeroDocumento { get; set; }

    public int? IdCiudad { get; set; }

    public int? IdProvincia { get; set; }

    public string? Direccion { get; set; }

    public string? CodigoPostal { get; set; }

    public virtual ICollection<HistorialCliente> HistorialClientes { get; set; } = new List<HistorialCliente>();

    public virtual Ciudad? IdCiudadNavigation { get; set; }

    public virtual EstadoCliente IdEstadoClienteNavigation { get; set; } = null!;

    public virtual Provincium? IdProvinciaNavigation { get; set; }

    public virtual ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}
