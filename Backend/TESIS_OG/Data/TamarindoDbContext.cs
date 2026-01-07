using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Models;

namespace TESIS_OG.Data;

public partial class TamarindoDbContext : DbContext
{
    public TamarindoDbContext()
    {
    }

    public TamarindoDbContext(DbContextOptions<TamarindoDbContext> options)
        : base(options)
    {
    }
    public virtual DbSet<AreaProduccion> AreaProduccions { get; set; }
    public virtual DbSet<AvanceAreaProyecto> AvanceAreaProyectos { get; set; }

    public virtual DbSet<Ciudad> Ciudads { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<DetalleMaterialProyecto> DetalleMaterialProyectos { get; set; }

    public virtual DbSet<DetalleOrdenCompra> DetalleOrdenCompras { get; set; }

    public virtual DbSet<DetalleTallerProyecto> DetalleTallerProyectos { get; set; }

    public virtual DbSet<Direccion> Direccions { get; set; }

    public virtual DbSet<EstadoCliente> EstadoClientes { get; set; }

    public virtual DbSet<HistorialCliente> HistorialClientes { get; set; }

    public virtual DbSet<HistorialUsuario> HistorialUsuarios { get; set; }

    public virtual DbSet<Insumo> Insumos { get; set; }

    public virtual DbSet<InventarioMovimiento> InventarioMovimientos { get; set; }

    public virtual DbSet<ObservacionProyecto> ObservacionProyectos { get; set; }

    public virtual DbSet<OrdenCompra> OrdenCompras { get; set; }

    public virtual DbSet<Pai> Pais { get; set; }

    public virtual DbSet<Permiso> Permisos { get; set; }

    public virtual DbSet<Proveedor> Proveedors { get; set; }

    public virtual DbSet<Provincium> Provincia { get; set; }

    public virtual DbSet<Proyecto> Proyectos { get; set; }

    public virtual DbSet<Rol> Rols { get; set; }

    public virtual DbSet<RolPermiso> RolPermisos { get; set; }

    public virtual DbSet<Scrap> Scraps { get; set; }

    public virtual DbSet<Taller> Tallers { get; set; }

    public virtual DbSet<TipoInsumo> TipoInsumos { get; set; }

    public virtual DbSet<UnidadMedidum> UnidadMedida { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

//  protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
//      => optionsBuilder.UseSqlServer("Server=DESKTOP-VVVV704\\SERVIDOR3;Database=TamarindoDB_Dev;Integrated Security=True;TrustServerCertificate=True;");

  protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

    modelBuilder.Entity<AreaProduccion>(entity =>
    {
      // Esto es lo que resuelve el error del mensaje original
      entity.HasKey(e => e.IdArea).HasName("PK__AreaProd__2FC141AAE659E0BB");

      entity.ToTable("AreaProduccion");

      entity.Property(e => e.IdArea).HasColumnName("IdArea");

      entity.Property(e => e.NombreArea)
          .HasMaxLength(100)
          .IsUnicode(false)
          .HasColumnName("NombreArea");

      entity.Property(e => e.Descripcion)
          .HasMaxLength(255)
          .IsUnicode(false)
          .HasColumnName("Descripcion");

      entity.Property(e => e.Estado)
          .HasMaxLength(20)
          .IsUnicode(false)
          .HasColumnName("Estado");

      entity.Property(e => e.Orden).HasColumnName("Orden");
    });

    modelBuilder.Entity<AvanceAreaProyecto>(entity =>
    {
      entity.HasKey(e => e.IdAvanceArea).HasName("PK__AvanceAr__9DF91CFC2A177CDD");
      entity.ToTable("AvanceAreaProyecto");

      entity.Property(e => e.IdAvanceArea).HasColumnName("IdAvanceArea");
      entity.Property(e => e.IdProyecto).HasColumnName("IdProyecto");
      entity.Property(e => e.IdArea).HasColumnName("IdArea");
      entity.Property(e => e.PorcentajeAvance).HasColumnName("PorcentajeAvance").HasColumnType("decimal(5, 2)");
      entity.Property(e => e.FechaActualizacion).HasColumnName("FechaActualizacion");
      entity.Property(e => e.IdUsuarioRegistro).HasColumnName("IdUsuarioRegistro");
      entity.Property(e => e.Observaciones).HasColumnName("Observaciones").IsUnicode(false);
    });

    modelBuilder.Entity<Ciudad>(entity =>
        {
            entity.HasKey(e => e.IdCiudad).HasName("PK__Ciudad__0640366C18C83610");

            entity.ToTable("Ciudad");

            entity.Property(e => e.IdCiudad).HasColumnName("id_Ciudad");
            entity.Property(e => e.IdProvincia).HasColumnName("id_Provincia");
            entity.Property(e => e.NombreCiudad)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Ciudad");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Ciudads)
                .HasForeignKey(d => d.IdProvincia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Ciudad__id_Provi__29572725");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.IdCliente).HasName("PK__Cliente__378C7054F1AA058E");

            entity.ToTable("Cliente");

            entity.Property(e => e.IdCliente).HasColumnName("id_Cliente");
            entity.Property(e => e.Apellido)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("apellido");
            entity.Property(e => e.CodigoPostal)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("codigo_postal");
            entity.Property(e => e.CuitCuil)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("cuit_cuil");
            entity.Property(e => e.Direccion)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("direccion");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.FechaAlta).HasColumnName("fecha_Alta");
            entity.Property(e => e.IdCiudad).HasColumnName("id_Ciudad");
            entity.Property(e => e.IdEstadoCliente).HasColumnName("id_EstadoCliente");
            entity.Property(e => e.IdProvincia).HasColumnName("id_Provincia");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.NumeroDocumento)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("numero_documento");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("observaciones");
            entity.Property(e => e.RazonSocial)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("razon_social");
            entity.Property(e => e.Telefono)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("telefono");
            entity.Property(e => e.TipoCliente)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tipo_Cliente");
            entity.Property(e => e.TipoDocumento)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tipo_documento");

            entity.HasOne(d => d.IdCiudadNavigation).WithMany(p => p.Clientes)
                .HasForeignKey(d => d.IdCiudad)
                .HasConstraintName("FK_Cliente_Ciudad");

            entity.HasOne(d => d.IdEstadoClienteNavigation).WithMany(p => p.Clientes)
                .HasForeignKey(d => d.IdEstadoCliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Cliente__id_Esta__33D4B598");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Clientes)
                .HasForeignKey(d => d.IdProvincia)
                .HasConstraintName("FK_Cliente_Provincia");
        });

        modelBuilder.Entity<DetalleMaterialProyecto>(entity =>
        {
            entity.HasKey(e => e.IdDetalle).HasName("PK__DetalleM__8BEB6E74BB6AF949");

            entity.ToTable("DetalleMaterialProyecto");

            entity.Property(e => e.IdDetalle).HasColumnName("id_Detalle");
            entity.Property(e => e.CantidadAsignada)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("cantidad_Asignada");
            entity.Property(e => e.CantidadUtilizada)
                .HasColumnType("decimal(9, 1)")
                .HasColumnName("cantidad_Utilizada");
            entity.Property(e => e.DesperdicioEstimado)
                .HasColumnType("decimal(9, 1)")
                .HasColumnName("desperdicio_Estimado");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdUnidad).HasColumnName("id_Unidad");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.DetalleMaterialProyectos)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DetalleMa__id_In__59FA5E80");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.DetalleMaterialProyectos)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DetalleMa__id_Pr__59063A47");

            entity.HasOne(d => d.IdUnidadNavigation).WithMany(p => p.DetalleMaterialProyectos)
                .HasForeignKey(d => d.IdUnidad)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DetalleMa__id_Un__5AEE82B9");
        });

        modelBuilder.Entity<DetalleOrdenCompra>(entity =>
        {
            entity.HasKey(e => e.IdDetalle).HasName("PK__Detalle___8BEB6E74F5A5BE00");

            entity.ToTable("Detalle_OrdenCompra");

            entity.Property(e => e.IdDetalle).HasColumnName("id_Detalle");
            entity.Property(e => e.Cantidad)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("cantidad");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdOrdenCompra).HasColumnName("id_OrdenCompra");
            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("precio_Unitario");
            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(9, 1)")
                .HasColumnName("subtotal");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.DetalleOrdenCompras)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Detalle_O__id_In__4E88ABD4");

            entity.HasOne(d => d.IdOrdenCompraNavigation).WithMany(p => p.DetalleOrdenCompras)
                .HasForeignKey(d => d.IdOrdenCompra)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Detalle_O__id_Or__4D94879B");
        });

        modelBuilder.Entity<DetalleTallerProyecto>(entity =>
        {
            entity.HasKey(e => e.IdDetalleTaller).HasName("PK__Detalle___21F588418C40007E");

            entity.ToTable("Detalle_Taller_Proyecto");

            entity.Property(e => e.IdDetalleTaller).HasColumnName("id_Detalle_Taller");
            entity.Property(e => e.EstadoTaller)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("estado_Taller");
            entity.Property(e => e.FechaAsignacion).HasColumnName("fecha_Asignacion");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdTaller).HasColumnName("id_Taller");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("observaciones");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.DetalleTallerProyectos)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Detalle_T__id_Pr__619B8048");

            entity.HasOne(d => d.IdTallerNavigation).WithMany(p => p.DetalleTallerProyectos)
                .HasForeignKey(d => d.IdTaller)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Detalle_T__id_Ta__60A75C0F");
        });

        modelBuilder.Entity<Direccion>(entity =>
        {
            entity.HasKey(e => e.IdDireccion).HasName("PK__Direccio__B8A2BC7D662BFEFD");

            entity.ToTable("Direccion");

            entity.Property(e => e.IdDireccion).HasColumnName("id_Direccion");
            entity.Property(e => e.Calle)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("calle");
            entity.Property(e => e.CodigoPostal)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("codigo_Postal");
            entity.Property(e => e.IdCiudad).HasColumnName("id_Ciudad");
            entity.Property(e => e.IdPais).HasColumnName("id_Pais");
            entity.Property(e => e.IdProvincia).HasColumnName("id_Provincia");
            entity.Property(e => e.Numero)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("numero");

            entity.HasOne(d => d.IdCiudadNavigation).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.IdCiudad)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Direccion__id_Ci__2C3393D0");

            entity.HasOne(d => d.IdPaisNavigation).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.IdPais)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Direccion__id_Pa__2E1BDC42");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.IdProvincia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Direccion__id_Pr__2D27B809");
        });

        modelBuilder.Entity<EstadoCliente>(entity =>
        {
            entity.HasKey(e => e.IdEstadoCliente).HasName("PK__EstadoCl__E7A651C901643474");

            entity.ToTable("EstadoCliente");

            entity.Property(e => e.IdEstadoCliente).HasColumnName("id_EstadoCliente");
            entity.Property(e => e.NombreEstado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("nombre_Estado");
        });

        modelBuilder.Entity<HistorialCliente>(entity =>
        {
            entity.HasKey(e => e.IdHistorial).HasName("PK__Historia__51E84F64FA7249BC");

            entity.ToTable("Historial_Cliente");

            entity.Property(e => e.IdHistorial).HasColumnName("id_Historial");
            entity.Property(e => e.Accion)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("accion");
            entity.Property(e => e.Detalle)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("detalle");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.IdCliente).HasColumnName("id_Cliente");
            entity.Property(e => e.UsuarioResponsable)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("usuario_Responsable");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.HistorialClientes)
                .HasForeignKey(d => d.IdCliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Historial__id_Cl__6C190EBB");
        });

        modelBuilder.Entity<HistorialUsuario>(entity =>
        {
            entity.HasKey(e => e.IdHistorial).HasName("PK__Historia__51E84F647125E7CC");

            entity.ToTable("Historial_Usuario");

            entity.Property(e => e.IdHistorial).HasColumnName("id_Historial");
            entity.Property(e => e.Accion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("accion");
            entity.Property(e => e.FechaAccion).HasColumnName("fecha_Accion");
            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.Modulo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("modulo");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.HistorialUsuarios)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Historial__id_Us__6EF57B66");
        });

        modelBuilder.Entity<Insumo>(entity =>
        {
            entity.HasKey(e => e.IdInsumo).HasName("PK__Insumo__F8E4E9DD03E91CBC");

            entity.ToTable("Insumo");

            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.Estado)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.FechaActualizacion).HasColumnName("fecha_Actualizacion");
            entity.Property(e => e.IdProveedor).HasColumnName("id_Proveedor");
            entity.Property(e => e.IdTipoInsumo).HasColumnName("id_TipoInsumo");
            entity.Property(e => e.NombreInsumo)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("nombre_Insumo");
            entity.Property(e => e.StockActual)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("stock_Actual");
            entity.Property(e => e.StockMinimo)
                .HasColumnType("decimal(9, 1)")
                .HasColumnName("stock_Minimo");
            entity.Property(e => e.UnidadMedida)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("unidad_Medida");

            entity.HasOne(d => d.IdProveedorNavigation).WithMany(p => p.Insumos)
                .HasForeignKey(d => d.IdProveedor)
                .HasConstraintName("FK__Insumo__id_Prove__47DBAE45");

            entity.HasOne(d => d.IdTipoInsumoNavigation).WithMany(p => p.Insumos)
                .HasForeignKey(d => d.IdTipoInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Insumo__id_TipoI__46E78A0C");
        });

        modelBuilder.Entity<InventarioMovimiento>(entity =>
        {
            entity.HasKey(e => e.IdMovimiento).HasName("PK__Inventar__BE8A588CBB3D84D0");

            entity.ToTable("Inventario_Movimiento");

            entity.Property(e => e.IdMovimiento).HasColumnName("id_Movimiento");
            entity.Property(e => e.Cantidad)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("cantidad");
            entity.Property(e => e.FechaMovimiento).HasColumnName("fecha_Movimiento");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdOrdenCompra).HasColumnName("id_OrdenCompra");
            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.Observacion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("observacion");
            entity.Property(e => e.Origen)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("origen");
            entity.Property(e => e.TipoMovimiento)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("tipo_Movimiento");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Inventari__id_In__5165187F");

            entity.HasOne(d => d.IdOrdenCompraNavigation).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.IdOrdenCompra)
                .HasConstraintName("FK__Inventari__id_Or__52593CB8");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("FK__Inventari__id_Us__534D60F1");
        });

        modelBuilder.Entity<ObservacionProyecto>(entity =>
        {
            entity.HasKey(e => e.IdObservacion).HasName("PK__Observac__492EC2325D9FA4B5");

            entity.ToTable("Observacion_Proyecto");

            entity.Property(e => e.IdObservacion).HasColumnName("id_Observacion");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.Fecha)
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.ObservacionProyectos)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Observaci__id_Pr__6477ECF3");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.ObservacionProyectos)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Observaci__id_Us__656C112C");
        });

        modelBuilder.Entity<OrdenCompra>(entity =>
        {
            entity.HasKey(e => e.IdOrdenCompra).HasName("PK__Orden_Co__D38A93C1D1489182");

            entity.ToTable("Orden_Compra");

            entity.Property(e => e.IdOrdenCompra).HasColumnName("id_OrdenCompra");
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.FechaEntregaEstimada).HasColumnName("fecha_EntregaEstimada");
            entity.Property(e => e.FechaSolicitud).HasColumnName("fecha_Solicitud");
            entity.Property(e => e.IdProveedor).HasColumnName("id_Proveedor");
            entity.Property(e => e.NroOrden)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("nro_Orden");
            entity.Property(e => e.TotalOrden)
                .HasColumnType("decimal(9, 1)")
                .HasColumnName("total_Orden");

            entity.HasOne(d => d.IdProveedorNavigation).WithMany(p => p.OrdenCompras)
                .HasForeignKey(d => d.IdProveedor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Orden_Com__id_Pr__4AB81AF0");
        });

        modelBuilder.Entity<Pai>(entity =>
        {
            entity.HasKey(e => e.IdPais).HasName("PK__Pais__2A3B9774B35B3A3C");

            entity.Property(e => e.IdPais).HasColumnName("id_Pais");
            entity.Property(e => e.NombrePais)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Pais");
        });

        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.HasKey(e => e.IdPermiso).HasName("PK__Permiso__ED14A36FB46222B2");

            entity.ToTable("Permiso");

            entity.Property(e => e.IdPermiso).HasColumnName("id_Permiso");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.NombrePermiso)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Permiso");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.HasKey(e => e.IdProveedor).HasName("PK__Proveedo__53B6E1A54FBDD3A3");

            entity.ToTable("Proveedor");

            entity.Property(e => e.IdProveedor).HasColumnName("id_Proveedor");
            entity.Property(e => e.Cuit)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("cuit");
            entity.Property(e => e.NombreProveedor)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("nombre_Proveedor");
        });

        modelBuilder.Entity<Provincium>(entity =>
        {
            entity.HasKey(e => e.IdProvincia).HasName("PK__Provinci__C83EC1944C8CEF0F");

            entity.Property(e => e.IdProvincia).HasColumnName("id_Provincia");
            entity.Property(e => e.IdPais).HasColumnName("id_Pais");
            entity.Property(e => e.NombreProvincia)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Provincia");

            entity.HasOne(d => d.IdPaisNavigation).WithMany(p => p.Provincia)
                .HasForeignKey(d => d.IdPais)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Provincia__id_Pa__267ABA7A");
        });

    modelBuilder.Entity<Proyecto>(entity =>
    {
      entity.HasKey(e => e.IdProyecto).HasName("PK__Proyecto__2544884CB2E93B2C");

      entity.ToTable("Proyectos");

      entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");

      entity.Property(e => e.IdCliente).HasColumnName("id_Cliente");

      entity.Property(e => e.NombreProyecto)
          .HasMaxLength(80)
          .IsUnicode(false)
          .HasColumnName("nombre_Proyecto");

      entity.Property(e => e.TipoPrenda)
          .HasMaxLength(50)
          .IsUnicode(false)
          .HasColumnName("tipo_Prenda");

      entity.Property(e => e.Descripcion)
          .HasMaxLength(200)
          .IsUnicode(false)
          .HasColumnName("descripcion");

      entity.Property(e => e.Prioridad)
          .HasMaxLength(1)
          .IsUnicode(false)
          .IsFixedLength()
          .HasColumnName("prioridad");

      entity.Property(e => e.Estado)
          .HasMaxLength(20)
          .IsUnicode(false)
          .HasColumnName("estado");

      entity.Property(e => e.FechaInicio).HasColumnName("fecha_Inicio");
      entity.Property(e => e.FechaFin).HasColumnName("fecha_Fin");
      entity.Property(e => e.CantidadTotal).HasColumnName("CantidadTotal");
      entity.Property(e => e.CantidadProducida).HasColumnName("CantidadProducida");
      entity.Property(e => e.IdUsuarioEncargado).HasColumnName("IdUsuarioEncargado");

      entity.Property(e => e.TipoEstacion)
          .HasMaxLength(50)
          .IsUnicode(false)
          .HasColumnName("TipoEstacion");

      entity.Property(e => e.CodigoProyecto)
          .HasMaxLength(20)
          .IsUnicode(false)
          .HasColumnName("CodigoProyecto");

      entity.Property(e => e.AreaActual)
          .HasMaxLength(100)
          .IsUnicode(false)
          .HasColumnName("AreaActual");

      entity.Property(e => e.AvanceGerenciaAdmin).HasColumnName("AvanceGerenciaAdmin");
      entity.Property(e => e.AvanceDiseñoDesarrollo).HasColumnName("AvanceDiseñoDesarrollo");
      entity.Property(e => e.AvanceControlCalidad).HasColumnName("AvanceControlCalidad");
      entity.Property(e => e.AvanceEtiquetadoEmpaquetado).HasColumnName("AvanceEtiquetadoEmpaquetado");
      entity.Property(e => e.AvanceDepositoLogistica).HasColumnName("AvanceDepositoLogistica");

      entity.Property(e => e.CostoMaterialEstimado)
          .HasColumnType("decimal(10, 2)")
          .HasColumnName("CostoMaterialEstimado");

      entity.Property(e => e.ScrapTotal)
          .HasColumnType("decimal(10, 2)")
          .HasColumnName("ScrapTotal");

      entity.Property(e => e.ScrapPorcentaje)
          .HasColumnType("decimal(5, 2)")
          .HasColumnName("ScrapPorcentaje");

      // ✅ Relación con Cliente
      entity.HasOne(d => d.IdClienteNavigation)
          .WithMany(p => p.Proyectos)
          .HasForeignKey(d => d.IdCliente)
          .OnDelete(DeleteBehavior.ClientSetNull)
          .HasConstraintName("FK__Proyectos__id_Cl__6A30C649");

      // ✅ Relación con Usuario Encargado
      // ESTO ES CRÍTICO: Mapear con la colección Proyectos de Usuario
      entity.HasOne(d => d.IdUsuarioEncargadoNavigation)
          .WithMany(p => p.Proyectos)  // ← Usa la colección que está en Usuario.cs
          .HasForeignKey(d => d.IdUsuarioEncargado)
          .OnDelete(DeleteBehavior.Restrict)
          .HasConstraintName("FK_Proyecto_UsuarioEncargado");
    });

    modelBuilder.Entity<Rol>(entity =>
        {
            entity.HasKey(e => e.IdRol).HasName("PK__Rol__76482FD262C3FB13");

            entity.ToTable("Rol");

            entity.Property(e => e.IdRol).HasColumnName("id_Rol");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.NivelPermiso).HasColumnName("nivel_Permiso");
            entity.Property(e => e.NombreRol)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("nombre_Rol");
        });

        modelBuilder.Entity<RolPermiso>(entity =>
        {
            entity.HasKey(e => new { e.IdRol, e.IdPermiso }).HasName("PK__RolPermi__989965E41540AF67");

            entity.ToTable("RolPermiso");

            entity.Property(e => e.IdRol).HasColumnName("id_Rol");
            entity.Property(e => e.IdPermiso).HasColumnName("id_Permiso");
            entity.Property(e => e.PuedeAcceder).HasColumnName("puede_Acceder");

            entity.HasOne(d => d.IdPermisoNavigation).WithMany(p => p.RolPermisos)
                .HasForeignKey(d => d.IdPermiso)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RolPermis__id_Pe__3B75D760");

            entity.HasOne(d => d.IdRolNavigation).WithMany(p => p.RolPermisos)
                .HasForeignKey(d => d.IdRol)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RolPermis__id_Ro__3A81B327");
        });

        modelBuilder.Entity<Scrap>(entity =>
        {
            entity.HasKey(e => e.IdScrap).HasName("PK__Scrap__FF2402A0D0105EF4");

            entity.ToTable("Scrap");

            entity.Property(e => e.IdScrap).HasColumnName("id_Scrap");
            entity.Property(e => e.CantidadScrap)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("cantidad_Scrap");
            entity.Property(e => e.Destino)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("destino");
            entity.Property(e => e.FechaRegistro)
                .HasColumnType("datetime")
                .HasColumnName("fecha_Registro");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.Motivo)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("motivo");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.Scraps)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Scrap__id_Insumo__693CA210");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Scraps)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Scrap__id_Proyec__68487DD7");
        });

        modelBuilder.Entity<Taller>(entity =>
        {
            entity.HasKey(e => e.IdTaller).HasName("PK__Taller__1C7B56B3A6230829");

            entity.ToTable("Taller");

            entity.Property(e => e.IdTaller).HasColumnName("id_Taller");
            entity.Property(e => e.Direccion)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("direccion");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.IdCiudad).HasColumnName("id_Ciudad");
            entity.Property(e => e.NombreTaller)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("nombre_Taller");
            entity.Property(e => e.Responsable)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("responsable");
            entity.Property(e => e.Telefono)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("telefono");
            entity.Property(e => e.TipoTaller)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tipo_Taller");

            entity.HasOne(d => d.IdCiudadNavigation).WithMany(p => p.Tallers)
                .HasForeignKey(d => d.IdCiudad)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Taller__id_Ciuda__5DCAEF64");
        });

        modelBuilder.Entity<TipoInsumo>(entity =>
        {
            entity.HasKey(e => e.IdTipoInsumo).HasName("PK__TipoInsu__C0898F9DEE469FCF");

            entity.ToTable("TipoInsumo");

            entity.Property(e => e.IdTipoInsumo).HasColumnName("id_TipoInsumo");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.NombreTipo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("nombre_Tipo");
        });

        modelBuilder.Entity<UnidadMedidum>(entity =>
        {
            entity.HasKey(e => e.IdUnidad).HasName("PK__Unidad_M__06C7482528B4DB05");

            entity.ToTable("Unidad_Medida");

            entity.Property(e => e.IdUnidad).HasColumnName("id_Unidad");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.NombreUnidad)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("nombre_Unidad");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.IdUsuario).HasName("PK__Usuario__8E901EAA0E3B1D31");

            entity.ToTable("Usuario");

            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.ApellidoUsuario)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("apellido_Usuario");
            entity.Property(e => e.Contraseña)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("contraseña");
            entity.Property(e => e.Email)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.Estado)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_Creacion");
            entity.Property(e => e.IdRol).HasColumnName("id_Rol");
            entity.Property(e => e.NombreUsuario)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Usuario");
            entity.Property(e => e.UltimoAcceso).HasColumnName("ultimo_Acceso");

            entity.HasOne(d => d.IdRolNavigation).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.IdRol)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Usuario__id_Rol__3E52440B");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
