using Microsoft.EntityFrameworkCore;
using Tesis.Models;

namespace Tesis.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Proyecto> Proyectos => Set<Proyecto>();
        public DbSet<Cliente> Clientes => Set<Cliente>();
        public DbSet<ProyectoPrenda> ProyectoPrendas => Set<ProyectoPrenda>();
        public DbSet<PrendaTalle> PrendaTalles => Set<PrendaTalle>();
        public DbSet<Talle> Talles => Set<Talle>();
        public DbSet<ProyectoDiseno> ProyectoDisenos => Set<ProyectoDiseno>();
        public DbSet<AvanceAreaProyecto> AvanceAreaProyectos => Set<AvanceAreaProyecto>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProyectoDiseno>()
                .HasIndex(x => new { x.IdProyecto, x.IdPrenda });
        }
    }
}
