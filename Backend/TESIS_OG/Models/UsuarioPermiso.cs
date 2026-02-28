using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class UsuarioPermiso
{
    public int IdUsuario { get; set; }

    public int IdPermiso { get; set; }

    public bool PuedeAcceder { get; set; }

    public virtual Permiso IdPermisoNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
