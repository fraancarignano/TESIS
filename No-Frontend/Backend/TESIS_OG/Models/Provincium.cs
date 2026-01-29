using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Provincium
{
    public int IdProvincia { get; set; }

    public string NombreProvincia { get; set; } = null!;

    public int IdPais { get; set; }

    public virtual ICollection<Ciudad> Ciudads { get; set; } = new List<Ciudad>();

    public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual Pai IdPaisNavigation { get; set; } = null!;
}
