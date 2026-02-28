namespace TESIS_OG.DTOs.Usuarios
{
    public class PermisoEfectivoItemDTO
    {
        public int IdPermiso { get; set; }
        public string NombrePermiso { get; set; } = string.Empty;
        public string Modulo { get; set; } = string.Empty;
        public string Accion { get; set; } = string.Empty;
    }

    public class PermisosEfectivosDTO
    {
        public int IdUsuario { get; set; }
        public int IdRol { get; set; }
        public string NombreRol { get; set; } = string.Empty;
        public bool EsAdmin { get; set; }
        public bool EsSupervisor { get; set; }
        public bool EsOperario { get; set; }
        public bool EsDeposito { get; set; }
        public List<string> AreasAsignadas { get; set; } = new();
        public List<PermisoEfectivoItemDTO> Permisos { get; set; } = new();
    }
}
