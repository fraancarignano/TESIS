using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Proveedor
{
    public int IdProveedor { get; set; }

    public string NombreProveedor { get; set; } = null!;

    public string? Cuit { get; set; }

    public virtual ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();

    public virtual ICollection<OrdenCompra> OrdenCompras { get; set; } = new List<OrdenCompra>();
}
