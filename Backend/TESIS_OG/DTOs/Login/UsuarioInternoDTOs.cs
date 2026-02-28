namespace TESIS_OG.DTOs.Login
{
    public class UsuarioInternoIndexDTO
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = null!;
        public string Apellido { get; set; } = null!;
        public string NombreUsuarioIngreso { get; set; } = null!;
        public int IdRol { get; set; }
        public string NombreRol { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public DateOnly FechaCreacion { get; set; }
        public DateOnly? UltimoAcceso { get; set; }
    }

    public class UsuarioInternoCreateDTO
    {
        public string Nombre { get; set; } = null!;
        public string Apellido { get; set; } = null!;
        public string NombreUsuarioIngreso { get; set; } = null!;
        public string Contrasena { get; set; } = null!;
        public int IdRol { get; set; }
    }

    public class UsuarioInternoUpdateDTO
    {
        public string Nombre { get; set; } = null!;
        public string Apellido { get; set; } = null!;
        public string NombreUsuarioIngreso { get; set; } = null!;
        public string? Contrasena { get; set; }
        public int IdRol { get; set; }
        public string Estado { get; set; } = "Activo";
    }

    public class UsuarioAuditoriaEventoDTO
    {
        public string Accion { get; set; } = null!;
        public string? Modulo { get; set; }
        public DateOnly FechaAccion { get; set; }
    }

    public class UsuarioAuditoriaDTO
    {
        public int IdUsuario { get; set; }
        public DateOnly FechaCreacion { get; set; }
        public DateOnly? UltimoAcceso { get; set; }
        public List<UsuarioAuditoriaEventoDTO> Eventos { get; set; } = new();
    }
}
