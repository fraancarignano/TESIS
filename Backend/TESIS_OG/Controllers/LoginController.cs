using Microsoft.AspNetCore.Mvc;
using TESIS_OG.DTOs.Login;
using TESIS_OG.Services.UsuariosService;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly IAuthService _authService;

        public LoginController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Login de usuario
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Datos inválidos", errors = ModelState });

            var result = await _authService.LoginAsync(loginDto);

            if (result == null)
                return Unauthorized(new { message = "Usuario o contraseña incorrectos, o usuario inactivo" });

            return Ok(result);
        }

        /// <summary>
        /// Endpoint auxiliar para generar hash de contraseñas (solo para testing)
        /// </summary>
        [HttpPost("test-hash")]
        public IActionResult TestHash([FromBody] string password)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            return Ok(new { password, hash });
        }
    }
}