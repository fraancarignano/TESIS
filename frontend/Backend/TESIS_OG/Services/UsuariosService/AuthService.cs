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
        private readonly Data.TamarindoDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(Data.TamarindoDbContext context, IConfiguration configuration)
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
                NombreUsuario = $"{usuario.NombreUsuario} {usuario.ApellidoUsuario}",
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

        public async Task<LoginResponseDTO?> RegistrarUsuarioAsync(UsuarioCreateDto usuarioDto)
        {
            // Verificar si el nombre de usuario ya existe
            var existeUsuario = await _context.Usuarios
                .AnyAsync(u => u.NombreUsuario == usuarioDto.NombreUsuario);

            if (existeUsuario)
                return null; // Usuario duplicado

            // Verificar si el email ya existe
            var existeEmail = await _context.Usuarios
                .AnyAsync(u => u.Email == usuarioDto.Email);

            if (existeEmail)
                return null; // Email duplicado

            // ⬅️ CAMBIO: Buscar el rol por nombre
            var rol = await _context.Rols
                .FirstOrDefaultAsync(r => r.NombreRol == usuarioDto.NombreRol);

            if (rol == null)
                return null; // Rol no encontrado

            // Hashear la contraseña
            var contraseñaHash = BCrypt.Net.BCrypt.HashPassword(usuarioDto.Contraseña);

            // Crear el nuevo usuario
            var nuevoUsuario = new Usuario
            {
                NombreUsuario = usuarioDto.NombreUsuario,
                ApellidoUsuario = usuarioDto.ApellidoUsuario,
                Email = usuarioDto.Email,
                Contraseña = contraseñaHash,
                IdRol = rol.IdRol, 
                Estado = "Activo",
                FechaCreacion = DateOnly.FromDateTime(DateTime.Now),
                UltimoAcceso = null
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return new LoginResponseDTO
            {
                IdUsuario = nuevoUsuario.IdUsuario,
                NombreUsuario = nuevoUsuario.NombreUsuario,
                ApellidoUsuario = nuevoUsuario.ApellidoUsuario,
                Email = nuevoUsuario.Email,
                IdRol = nuevoUsuario.IdRol,
                Estado = nuevoUsuario.Estado,
                FechaCreacion = nuevoUsuario.FechaCreacion,
                UltimoAcceso = nuevoUsuario.UltimoAcceso
            };
        }
        public async Task<List<UsuarioListDTO>> ObtenerTodosLosUsuariosAsync()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.IdRolNavigation)  // ⬅️ Incluir el rol para obtener el nombre
                .Select(u => new UsuarioListDTO
                {
                    IdUsuario = u.IdUsuario,
                    NombreUsuario = u.NombreUsuario,
                    ApellidoUsuario = u.ApellidoUsuario,
                    Email = u.Email,
                    NombreRol = u.IdRolNavigation.NombreRol,
                    Estado = u.Estado,
                    FechaCreacion = u.FechaCreacion,
                    UltimoAcceso = u.UltimoAcceso
                })
                .OrderByDescending(u => u.FechaCreacion)  // ⬅️ Más recientes primero
                .ToListAsync();

            return usuarios;
        }

        public async Task<LoginResponseDTO?> ObtenerUsuarioPorIdAsync(int id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.IdRolNavigation)
                .FirstOrDefaultAsync(u => u.IdUsuario == id);

            if (usuario == null)
                return null;

            return new LoginResponseDTO
            {
                IdUsuario = usuario.IdUsuario,
                NombreUsuario = usuario.NombreUsuario,
                ApellidoUsuario = usuario.ApellidoUsuario,
                Email = usuario.Email,
                IdRol = usuario.IdRol,
                Estado = usuario.Estado,
                FechaCreacion = usuario.FechaCreacion,
                UltimoAcceso = usuario.UltimoAcceso
            };
        }
    }
}
