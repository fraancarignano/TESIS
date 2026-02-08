using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TESIS_OG.Data;
using TESIS_OG.Services.ClienteService;
using TESIS_OG.Services.InsumoService;
using TESIS_OG.Services.OrdenCompraService;
using TESIS_OG.Services.ProyectoService;
using TESIS_OG.Services.ProyectosService;
using TESIS_OG.Services.UsuariosService;

namespace TESIS_OG
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ================= DATABASE =================
            builder.Services.AddDbContext<TamarindoDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // ================= SERVICES =================
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddRazorPages();

            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IProyectosService, ProyectoService>();
            builder.Services.AddScoped<IClienteService, ClienteService>();
            builder.Services.AddScoped<IOrdenCompraService, OrdenCompraService>();
            builder.Services.AddScoped<IInsumoService, InsumoService>();

            // ================= CORS =================
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy
                        .AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            // ================= JWT =================
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];

            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException(
                    "JWT SecretKey no configurada. Verifica appsettings.json"
                );
            }

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(secretKey)
                    )
                };
            });

            // ================= BUILD =================
            var app = builder.Build();

            // ================= PORT (RAILWAY) =================
            var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
            app.Urls.Add($"http://*:{port}");

            // ================= MIDDLEWARE =================
            if (app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection(); // HTTPS solo en dev
            }

            // Swagger siempre activo para probar en Railway
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "TESIS_OG API V1");
            });

            app.UseCors("AllowAll");
            app.UseAuthentication();
            app.UseAuthorization();

            // ================= ENDPOINT RAÍZ =================
            app.MapGet("/", () => "Backend TESIS_OG funcionando correctamente!");

            app.MapControllers();
            app.Run();
        }
    }
}
