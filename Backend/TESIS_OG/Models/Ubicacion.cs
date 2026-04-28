using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Ubicacion
{
    public int IdUbicacion { get; set; }

    public string Codigo { get; set; } = null!;

    public string? Nombre { get; set; }

    /// <summary>Tipo de ubicación: 'Rack' | 'Despacho' | 'Scrap' | 'Virtual' | 'Otro'</summary>
    public string? Tipo { get; set; }

    public int Rack { get; set; }

    public int Division { get; set; }

    public int Espacio { get; set; }

    public string? Descripcion { get; set; }

    public virtual ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();
    public virtual ICollection<InsumoStock> InsumoStocks { get; set; } = new List<InsumoStock>();
    public virtual ICollection<Despacho> Despachos { get; set; } = new List<Despacho>();
    public virtual ICollection<Scrap> Scraps { get; set; } = new List<Scrap>();
}
