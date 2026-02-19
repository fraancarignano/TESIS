using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class MaterialCalculado
{
    public int IdMaterialCalculado { get; set; }

    public int IdProyecto { get; set; }

    public int? IdProyectoPrenda { get; set; }

    public int IdInsumo { get; set; }

    public string TipoCalculo { get; set; } = null!;

    public decimal CantidadCalculada { get; set; }

    public decimal? CantidadManual { get; set; }

    public string UnidadMedida { get; set; } = null!;

    public bool? TieneStock { get; set; }

    public string? Observaciones { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual ProyectoPrendum? IdProyectoPrendaNavigation { get; set; }
}
