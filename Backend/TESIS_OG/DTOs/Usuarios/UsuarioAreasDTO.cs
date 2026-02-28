namespace TESIS_OG.DTOs.Usuarios
{
    public class AreaAsignadaDTO
    {
        public int IdArea { get; set; }
        public string NombreArea { get; set; } = string.Empty;
    }

    public class UsuarioAreasDTO
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public List<AreaAsignadaDTO> Areas { get; set; } = new();
    }

    public class AsignarAreaRequestDTO
    {
        public int IdArea { get; set; }
    }
}
