using Microsoft.EntityFrameworkCore;

namespace Tesis.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Aquí irán tus DbSet cuando tengas modelos
        // Ejemplo: public DbSet<Usuario> Usuarios { get; set; }
    }
}
