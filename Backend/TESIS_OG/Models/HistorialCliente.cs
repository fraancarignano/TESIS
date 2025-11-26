using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class HistorialCliente
{
    public int IdHistorial { get; set; }

    public int IdCliente { get; set; }

    public DateOnly Fecha { get; set; }

    public string Accion { get; set; } = null!;

    public string? UsuarioResponsable { get; set; }

    public string? Detalle { get; set; }

    public virtual Cliente IdClienteNavigation { get; set; } = null!;
}
