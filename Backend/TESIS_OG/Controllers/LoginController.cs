using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Login;
using TESIS_OG.Services.UsuariosService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<LoginController> _logger;
        private readonly TamarindoDbContext _context;

        public LoginController(IAuthService authService, TamarindoDbContext context, ILogger<LoginController> logger)
        {
            _authService = authService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Login de usuario
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto)
        {
            _logger.LogInformation("Intento de login para usuario: {Usuario}", loginDto.NombreUsuario);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Datos de login inválidos para usuario: {Usuario}", loginDto.NombreUsuario);
                return BadRequest(new { message = "Datos inválidos", errors = ModelState });
            }

            var result = await _authService.LoginAsync(loginDto);

            if (result == null)
            {
                _logger.LogWarning("Login fallido para usuario: {Usuario}. Credenciales incorrectas o usuario inactivo.", loginDto.NombreUsuario);
                return Unauthorized(new { message = "Usuario o contraseña incorrectos, o usuario inactivo" });
            }

            _logger.LogInformation("Login exitoso para usuario: {Usuario}", loginDto.NombreUsuario);
            return Ok(result);
        }

        /// <summary>
        /// Registrar nuevo usuario (solo para administradores)
        /// </summary>
        [HttpPost("registrar")]
        public async Task<IActionResult> RegistrarUsuario([FromBody] UsuarioCreateDto usuarioDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Datos inválidos", errors = ModelState });

            var result = await _authService.RegistrarUsuarioAsync(usuarioDto);

            if (result == null)
                return BadRequest(new
                {
                    message = "No se pudo registrar el usuario. Verifica que:",
                    detalles = new[]
                     {
                        "- El nombre de usuario no esté duplicado",
                        "- El usuario de ingreso no esté duplicado",
                        "- El rol exista (ej: 'Administrador', 'Operador', 'Supervisor')"
                     }
                });

            return CreatedAtAction(nameof(RegistrarUsuario), new { id = result.IdUsuario }, result);
        }

        /// <summary>
        /// Obtener lista de roles disponibles
        /// </summary>
        [HttpGet("roles")]
        public async Task<IActionResult> ObtenerRoles()
        {
            var roles = await _context.Rols
                .Select(r => new { r.IdRol, r.NombreRol })
                .ToListAsync();

            return Ok(roles);
        }

        /// <summary>
        /// Obtener subroles/permiso disponibles
        /// </summary>
        [HttpGet("permisos")]
        public async Task<IActionResult> ObtenerPermisos()
        {
            var permisos = await _context.Permisos
                .Select(p => new { p.IdPermiso, p.NombrePermiso })
                .ToListAsync();

            return Ok(permisos);
        }

        // <summary>
        /// Obtener todos los usuarios
        /// </summary>
        [HttpGet("usuarios")]
        public async Task<IActionResult> ObtenerUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.IdRolNavigation)
                .Select(u => new UsuarioInternoIndexDTO
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.NombreUsuario,
                    Apellido = u.ApellidoUsuario,
                    NombreUsuarioIngreso = u.UsuarioIngreso,
                    IdRol = u.IdRol,
                    NombreRol = u.IdRolNavigation.NombreRol,
                    Estado = u.Estado,
                    FechaCreacion = u.FechaCreacion,
                    UltimoAcceso = u.UltimoAcceso
                })
                .OrderByDescending(u => u.FechaCreacion)
                .ToListAsync();
            return Ok(usuarios);
        }

        /// <summary>
        /// Obtener un usuario por ID
        /// </summary>
        [HttpGet("usuarios/{id}")]
        public async Task<IActionResult> ObtenerUsuarioPorId(int id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.IdRolNavigation)
                .Where(u => u.IdUsuario == id)
                .Select(u => new UsuarioInternoIndexDTO
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.NombreUsuario,
                    Apellido = u.ApellidoUsuario,
                    NombreUsuarioIngreso = u.UsuarioIngreso,
                    IdRol = u.IdRol,
                    NombreRol = u.IdRolNavigation.NombreRol,
                    Estado = u.Estado,
                    FechaCreacion = u.FechaCreacion,
                    UltimoAcceso = u.UltimoAcceso
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound(new { message = $"Usuario con ID {id} no encontrado" });

            return Ok(usuario);
        }

        /// <summary>
        /// Crear usuario interno
        /// </summary>
        [HttpPost("usuarios")]
        public async Task<IActionResult> CrearUsuarioInterno([FromBody] UsuarioInternoCreateDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre) ||
                string.IsNullOrWhiteSpace(dto.Apellido) ||
                string.IsNullOrWhiteSpace(dto.NombreUsuarioIngreso) ||
                string.IsNullOrWhiteSpace(dto.Contrasena))
            {
                return BadRequest(new { message = "Nombre, apellido, usuario y contraseña son obligatorios." });
            }

            var rol = await _context.Rols.FirstOrDefaultAsync(r => r.IdRol == dto.IdRol);
            if (rol == null) return BadRequest(new { message = "Rol inválido." });

            var username = dto.NombreUsuarioIngreso.Trim();

            var existeUsername = await _context.Usuarios.AnyAsync(u =>
                u.UsuarioIngreso == username || u.NombreUsuario == username);
            if (existeUsername)
            {
                return BadRequest(new { message = "El nombre de usuario ya existe." });
            }

            var nuevoUsuario = new Models.Usuario
            {
                NombreUsuario = dto.Nombre.Trim(),
                ApellidoUsuario = dto.Apellido.Trim(),
                UsuarioIngreso = username,
                Contrasena = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena.Trim()),
                IdRol = dto.IdRol,
                Estado = "Activo",
                FechaCreacion = DateOnly.FromDateTime(DateTime.Now),
                UltimoAcceso = null
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            _context.HistorialUsuarios.Add(new Models.HistorialUsuario
            {
                IdUsuario = nuevoUsuario.IdUsuario,
                Accion = "ALTA_USUARIO_INTERNO",
                Modulo = "Usuarios Internos",
                FechaAccion = DateOnly.FromDateTime(DateTime.Now)
            });
            await _context.SaveChangesAsync();

            return Ok(new UsuarioInternoIndexDTO
            {
                IdUsuario = nuevoUsuario.IdUsuario,
                Nombre = nuevoUsuario.NombreUsuario,
                Apellido = nuevoUsuario.ApellidoUsuario,
                NombreUsuarioIngreso = nuevoUsuario.UsuarioIngreso,
                IdRol = rol.IdRol,
                NombreRol = rol.NombreRol,
                Estado = nuevoUsuario.Estado,
                FechaCreacion = nuevoUsuario.FechaCreacion,
                UltimoAcceso = nuevoUsuario.UltimoAcceso
            });
        }

        /// <summary>
        /// Actualizar usuario interno
        /// </summary>
        [HttpPut("usuarios/{id}")]
        public async Task<IActionResult> ActualizarUsuarioInterno(int id, [FromBody] UsuarioInternoUpdateDTO dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            var rol = await _context.Rols.FirstOrDefaultAsync(r => r.IdRol == dto.IdRol);
            if (rol == null) return BadRequest(new { message = "Rol inválido." });

            var username = dto.NombreUsuarioIngreso.Trim();
            var existeUsername = await _context.Usuarios.AnyAsync(u =>
                u.IdUsuario != id && (u.UsuarioIngreso == username || u.NombreUsuario == username));
            if (existeUsername)
            {
                return BadRequest(new { message = "El nombre de usuario ya existe." });
            }

            usuario.NombreUsuario = dto.Nombre.Trim();
            usuario.ApellidoUsuario = dto.Apellido.Trim();
            usuario.UsuarioIngreso = username;
            usuario.IdRol = dto.IdRol;
            usuario.Estado = string.IsNullOrWhiteSpace(dto.Estado) ? "Activo" : dto.Estado.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Contrasena))
            {
                usuario.Contrasena = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena.Trim());
            }

            _context.HistorialUsuarios.Add(new Models.HistorialUsuario
            {
                IdUsuario = usuario.IdUsuario,
                Accion = "MODIFICACION_USUARIO_INTERNO",
                Modulo = "Usuarios Internos",
                FechaAccion = DateOnly.FromDateTime(DateTime.Now)
            });

            await _context.SaveChangesAsync();

            return Ok(new UsuarioInternoIndexDTO
            {
                IdUsuario = usuario.IdUsuario,
                Nombre = usuario.NombreUsuario,
                Apellido = usuario.ApellidoUsuario,
                NombreUsuarioIngreso = usuario.UsuarioIngreso,
                IdRol = rol.IdRol,
                NombreRol = rol.NombreRol,
                Estado = usuario.Estado,
                FechaCreacion = usuario.FechaCreacion,
                UltimoAcceso = usuario.UltimoAcceso
            });
        }

        /// <summary>
        /// Baja lógica de usuario interno
        /// </summary>
        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> BorrarUsuarioInterno(int id)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            usuario.Estado = "Inactivo";
            _context.HistorialUsuarios.Add(new Models.HistorialUsuario
            {
                IdUsuario = usuario.IdUsuario,
                Accion = "BAJA_USUARIO_INTERNO",
                Modulo = "Usuarios Internos",
                FechaAccion = DateOnly.FromDateTime(DateTime.Now)
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario desactivado correctamente." });
        }

        /// <summary>
        /// Auditoría de usuario interno
        /// </summary>
        [HttpGet("usuarios/{id}/auditoria")]
        public async Task<IActionResult> ObtenerAuditoriaUsuario(int id)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            var eventos = await _context.HistorialUsuarios
                .Where(h => h.IdUsuario == id)
                .OrderByDescending(h => h.FechaAccion)
                .Select(h => new UsuarioAuditoriaEventoDTO
                {
                    Accion = h.Accion,
                    Modulo = h.Modulo,
                    FechaAccion = h.FechaAccion
                })
                .ToListAsync();

            var auditoria = new UsuarioAuditoriaDTO
            {
                IdUsuario = usuario.IdUsuario,
                FechaCreacion = usuario.FechaCreacion,
                UltimoAcceso = usuario.UltimoAcceso,
                Eventos = eventos
            };

            return Ok(auditoria);
        }

    }
}

        ///// <summary>
        ///// Endpoint auxiliar para generar hash de contraseñas (solo para testing)
        ///// </summary>
        //[HttpPost("test-hash")]
        //public IActionResult TestHash([FromBody] string password)
        //{
        //    var hash = BCrypt.Net.BCrypt.HashPassword(password);
        //    return Ok(new { password, hash });
        //}
