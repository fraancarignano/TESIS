using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Pai
{
    public int IdPais { get; set; }

    public string NombrePais { get; set; } = null!;

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual ICollection<Provincium> Provincia { get; set; } = new List<Provincium>();
}
