using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Cliente
{
    public int IdCliente { get; set; }

    public string? NombreApellido { get; set; }

    public string? RazonSocial { get; set; }

    public string TipoCliente { get; set; } = null!;

    public string? Cuit { get; set; }

    public string? Telefono { get; set; }

    public string? Email { get; set; }

    public int? IdDireccion { get; set; }

    public int IdEstadoCliente { get; set; }

    public DateOnly FechaAlta { get; set; }

    public string? Observaciones { get; set; }

    public virtual ICollection<HistorialCliente> HistorialClientes { get; set; } = new List<HistorialCliente>();

    public virtual Direccion? IdDireccionNavigation { get; set; }

    public virtual EstadoCliente IdEstadoClienteNavigation { get; set; } = null!;

    public virtual ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}
