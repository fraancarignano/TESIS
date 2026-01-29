using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class EstadoCliente
{
    public int IdEstadoCliente { get; set; }

    public string NombreEstado { get; set; } = null!;

    public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();
}
