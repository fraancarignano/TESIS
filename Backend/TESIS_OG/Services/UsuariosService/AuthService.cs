using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Login;
using TESIS_OG.Models;

namespace TESIS_OG.Services.UsuariosService
{
    public class AuthService : IAuthService
    {
        private readonly TamarindoDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(TamarindoDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<LoginResponseDTO?> LoginAsync(LoginDTO loginDto)
        {
            // Buscar usuario por nombre de usuario
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.NombreUsuario == loginDto.NombreUsuario);

            if (usuario == null)
                return null;

            // Verificar contraseña
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Contraseña, usuario.Contraseña))
                return null;

            // Verificar estado activo
            if (usuario.Estado != "Activo")
                return null;

            // Actualizar último acceso
            usuario.UltimoAcceso = DateOnly.FromDateTime(DateTime.Now);
            await _context.SaveChangesAsync();

            // Generar token JWT
            var token = GenerateJwtToken(usuario.IdUsuario, usuario.NombreUsuario);

            return new LoginResponseDTO
            {
                Token = token,
                IdUsuario = usuario.IdUsuario,
                NombreCompleto = $"{usuario.NombreUsuario} {usuario.ApellidoUsuario}",
                Email = usuario.Email
            };
        }

        public string GenerateJwtToken(int idUsuario, string nombreUsuario)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, idUsuario.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, nombreUsuario),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpirationMinutes"])),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}