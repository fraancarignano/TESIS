using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class ObservacionProyecto
{
    public int IdObservacion { get; set; }

    public int IdProyecto { get; set; }

    public int IdUsuario { get; set; }

    public DateTime Fecha { get; set; }

    public string Descripcion { get; set; } = null!;

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
