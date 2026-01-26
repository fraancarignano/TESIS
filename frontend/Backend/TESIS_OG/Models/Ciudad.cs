using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Ciudad
{
    public int IdCiudad { get; set; }

    public string NombreCiudad { get; set; } = null!;

    public int IdProvincia { get; set; }

    public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual Provincium IdProvinciaNavigation { get; set; } = null!;

    public virtual ICollection<Taller> Tallers { get; set; } = new List<Taller>();
}
