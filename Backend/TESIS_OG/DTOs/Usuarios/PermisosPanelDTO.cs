namespace TESIS_OG.DTOs.Usuarios
{
    public class PermisoItemDTO
    {
        public int IdPermiso { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        /// <summary>Estado efectivo del permiso para el usuario (override o fallback de rol).</summary>
        public bool Habilitado { get; set; }
        /// <summary>True si hay un override explícito en UsuarioPermiso para este usuario.</summary>
        public bool TieneOverride { get; set; }
    }

    public class ModuloPermisosDTO
    {
        public string Modulo { get; set; } = string.Empty;
        public List<PermisoItemDTO> Permisos { get; set; } = new();
    }

    public class PermisosPanelResponse
    {
        public int IdUsuario { get; set; }
        public List<ModuloPermisosDTO> Modulos { get; set; } = new();
    }

    public class GuardarPermisoItemDTO
    {
        public int IdPermiso { get; set; }
        public bool PuedeAcceder { get; set; }
    }

    public class GuardarPermisosRequest
    {
        public List<GuardarPermisoItemDTO> Permisos { get; set; } = new();
    }
}
