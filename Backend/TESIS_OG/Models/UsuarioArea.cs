using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class UsuarioArea
{
    public int IdUsuario { get; set; }

    public int IdArea { get; set; }

    public virtual AreaProduccion IdAreaNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
