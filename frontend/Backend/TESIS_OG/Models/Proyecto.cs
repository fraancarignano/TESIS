using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Proyecto
{
    public int IdProyecto { get; set; }

    public int IdCliente { get; set; }

    public string NombreProyecto { get; set; } = null!;

    public string? TipoPrenda { get; set; }

    public string? Descripcion { get; set; }

    public string? Prioridad { get; set; }

    public string Estado { get; set; } = null!;

    public DateOnly FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    public int? CantidadTotal { get; set; }

    public int? CantidadProducida { get; set; }

    public int? IdUsuarioEncargado { get; set; }

    public string? TipoEstacion { get; set; }

    public string? CodigoProyecto { get; set; }

    public string? AreaActual { get; set; }

    public int? AvanceGerenciaAdmin { get; set; }

    public int? AvanceDiseñoDesarrollo { get; set; }

    public int? AvanceControlCalidad { get; set; }

    public int? AvanceEtiquetadoEmpaquetado { get; set; }

    public int? AvanceDepositoLogistica { get; set; }

    public decimal? CostoMaterialEstimado { get; set; }

    public decimal? ScrapTotal { get; set; }

    public decimal? ScrapPorcentaje { get; set; }

    public virtual ICollection<AvanceAreaProyecto> AvanceAreaProyectos { get; set; } = new List<AvanceAreaProyecto>();

    public virtual ICollection<DetalleMaterialProyecto> DetalleMaterialProyectos { get; set; } = new List<DetalleMaterialProyecto>();

    public virtual ICollection<DetalleTallerProyecto> DetalleTallerProyectos { get; set; } = new List<DetalleTallerProyecto>();

    public virtual Cliente IdClienteNavigation { get; set; } = null!;

    public virtual Usuario? IdUsuarioEncargadoNavigation { get; set; }

    public virtual ICollection<ObservacionProyecto> ObservacionProyectos { get; set; } = new List<ObservacionProyecto>();

    public virtual ICollection<Scrap> Scraps { get; set; } = new List<Scrap>();
}
