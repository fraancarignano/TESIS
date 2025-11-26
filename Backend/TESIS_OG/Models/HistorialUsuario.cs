using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class HistorialUsuario
{
    public int IdHistorial { get; set; }

    public int IdUsuario { get; set; }

    public string Accion { get; set; } = null!;

    public DateOnly FechaAccion { get; set; }

    public string? Modulo { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
