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
                        "- El email no esté duplicado",
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

        // <summary>
        /// Obtener todos los usuarios
        /// </summary>
        [HttpGet("usuarios")]
        public async Task<IActionResult> ObtenerUsuarios()
        {
            var usuarios = await _authService.ObtenerTodosLosUsuariosAsync();
            return Ok(usuarios);
        }

        /// <summary>
        /// Obtener un usuario por ID
        /// </summary>
        [HttpGet("usuarios/{id}")]
        public async Task<IActionResult> ObtenerUsuarioPorId(int id)
        {
            var usuario = await _authService.ObtenerUsuarioPorIdAsync(id);

            if (usuario == null)
                return NotFound(new { message = $"Usuario con ID {id} no encontrado" });

            return Ok(usuario);
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