using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Muestra
{
    public int IdMuestra { get; set; }

    public int IdCliente { get; set; }

    public string NombreMuestra { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string? Prioridad { get; set; }

    public string Estado { get; set; } = null!;

    public DateOnly FechaCreacion { get; set; }

    public DateOnly? FechaEntrega { get; set; }

    public int? IdUsuarioEncargado { get; set; }

    public string? CodigoMuestra { get; set; }

    public int? IdProyectoAsignado { get; set; }

    public string? MockupUrl { get; set; }

    public bool BordadoRequerido { get; set; }

    public string? BordadoDescripcion { get; set; }

    public string? BordadoReferencia { get; set; }

    public bool EstampadoRequerido { get; set; }

    public string? EstampadoDescripcion { get; set; }

    public string? EstampadoReferencia { get; set; }

    public string? OtrosDetalle { get; set; }

    public string? PaletaRgb { get; set; }

    public virtual Cliente IdClienteNavigation { get; set; } = null!;

    public virtual Usuario? IdUsuarioEncargadoNavigation { get; set; }

    public virtual Proyecto? IdProyectoAsignadoNavigation { get; set; }

    public virtual ICollection<MuestraPrenda> MuestraPrendas { get; set; } = new List<MuestraPrenda>();

    public virtual ICollection<MuestraHistorial> MuestraHistorials { get; set; } = new List<MuestraHistorial>();
}
