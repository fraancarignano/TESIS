using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;

namespace TESIS_OG
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddDbContext<TamarindoDbContext>(options =>
                 options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            // --- AGREGA ESTA LÍNEA ---
            builder.Services.AddRazorPages();
            // -------------------------


            var app = builder.Build();


            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseAuthorization();
            // --- AGREGA ESTAS LÍNEAS ---
            app.UseStaticFiles(); // Para que cargue el CSS y estilos
            app.MapRazorPages();  // Para que funcionen las rutas /Clientes
                                  // ---------------------------
            app.MapControllers();

            app.Run();


        }
    }
}
