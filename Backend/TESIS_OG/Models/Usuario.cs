using System;
using System.Collections.Generic;

namespace TESIS_OG.Models;

public partial class Usuario
{
    public int IdUsuario { get; set; }

    public string NombreUsuario { get; set; } = null!;

    public string ApellidoUsuario { get; set; } = null!;

    public string UsuarioIngreso { get; set; } = null!;

    public string Contrasena { get; set; } = null!;

    public int IdRol { get; set; }

    public string Estado { get; set; } = null!;

    public DateOnly FechaCreacion { get; set; }

    public DateOnly? UltimoAcceso { get; set; }

    public virtual ICollection<AvanceAreaProyecto> AvanceAreaProyectos { get; set; } = new List<AvanceAreaProyecto>();

    public virtual ICollection<HistorialUsuario> HistorialUsuarios { get; set; } = new List<HistorialUsuario>();

    public virtual Rol IdRolNavigation { get; set; } = null!;

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();

    public virtual ICollection<ObservacionProyecto> ObservacionProyectos { get; set; } = new List<ObservacionProyecto>();

    public virtual ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();

    public virtual ICollection<UsuarioArea> UsuarioAreas { get; set; } = new List<UsuarioArea>();

    public virtual ICollection<UsuarioPermiso> UsuarioPermisos { get; set; } = new List<UsuarioPermiso>();
}
