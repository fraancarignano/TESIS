using System;

namespace TESIS_OG.Models;

public partial class MuestraHistorial
{
    public int IdMuestraHistorial { get; set; }

    public int IdMuestra { get; set; }

    public DateTime Fecha { get; set; }

    public string Tipo { get; set; } = null!;

    public string Comentario { get; set; } = null!;

    public int? IdUsuario { get; set; }

    public virtual Muestra IdMuestraNavigation { get; set; } = null!;

    public virtual Usuario? IdUsuarioNavigation { get; set; }
}
