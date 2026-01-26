using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class RolPermiso
{
    public int IdRol { get; set; }

    public int IdPermiso { get; set; }

    public bool PuedeAcceder { get; set; }

    public virtual Permiso IdPermisoNavigation { get; set; } = null!;

    public virtual Rol IdRolNavigation { get; set; } = null!;
}
