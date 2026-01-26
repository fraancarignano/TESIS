using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Direccion
{
    public int IdDireccion { get; set; }

    public string Calle { get; set; } = null!;

    public string? Numero { get; set; }

    public string? CodigoPostal { get; set; }

    public int IdCiudad { get; set; }

    public int IdProvincia { get; set; }

    public int IdPais { get; set; }

    public virtual Ciudad IdCiudadNavigation { get; set; } = null!;

    public virtual Pai IdPaisNavigation { get; set; } = null!;

    public virtual Provincium IdProvinciaNavigation { get; set; } = null!;
}
