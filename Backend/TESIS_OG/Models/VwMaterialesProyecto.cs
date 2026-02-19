using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class VwMaterialesProyecto
{
    public int IdProyecto { get; set; }

    public string NombreProyecto { get; set; } = null!;

    public int IdInsumo { get; set; }

    public string NombreInsumo { get; set; } = null!;

    public string TipoInsumo { get; set; } = null!;

    public string TipoCalculo { get; set; } = null!;

    public decimal CantidadCalculada { get; set; }

    public decimal? CantidadManual { get; set; }

    public decimal CantidadFinal { get; set; }

    public string UnidadMedida { get; set; } = null!;

    public decimal StockActual { get; set; }

    public string EstadoStock { get; set; } = null!;

    public bool? TieneStock { get; set; }

    public string? Observaciones { get; set; }
}
