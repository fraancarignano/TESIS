using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.DTOs.Reportes;
using TESIS_OG.Models;

namespace TESIS_OG.Data;

public partial class TamarindoDbContext : DbContext
{
    public TamarindoDbContext(DbContextOptions<TamarindoDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AreaProduccion> AreaProduccions { get; set; }

    public virtual DbSet<AvanceAreaProyecto> AvanceAreaProyectos { get; set; }

    public virtual DbSet<Ciudad> Ciudads { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<ConfiguracionMaterial> ConfiguracionMaterials { get; set; }

    public virtual DbSet<DetalleMaterialProyecto> DetalleMaterialProyectos { get; set; }

    public virtual DbSet<DetalleOrdenCompra> DetalleOrdenCompras { get; set; }

    public virtual DbSet<DetalleTallerProyecto> DetalleTallerProyectos { get; set; }

    public virtual DbSet<Direccion> Direccions { get; set; }

    public virtual DbSet<EstadoCliente> EstadoClientes { get; set; }

    public virtual DbSet<HistorialCliente> HistorialClientes { get; set; }

    public virtual DbSet<HistorialUsuario> HistorialUsuarios { get; set; }

    public virtual DbSet<Insumo> Insumos { get; set; }

    public virtual DbSet<InventarioMovimiento> InventarioMovimientos { get; set; }

    public virtual DbSet<MaterialCalculado> MaterialCalculados { get; set; }

    public virtual DbSet<ObservacionProyecto> ObservacionProyectos { get; set; }

    public virtual DbSet<OrdenCompra> OrdenCompras { get; set; }

    public virtual DbSet<Pai> Pais { get; set; }

    public virtual DbSet<Permiso> Permisos { get; set; }

    public virtual DbSet<PrendaTalle> PrendaTalles { get; set; }

    public virtual DbSet<Proveedor> Proveedors { get; set; }

    public virtual DbSet<Provincium> Provincia { get; set; }

    public virtual DbSet<Proyecto> Proyectos { get; set; }

    public virtual DbSet<ProyectoPrendum> ProyectoPrenda { get; set; }

    public virtual DbSet<Rol> Rols { get; set; }

    public virtual DbSet<RolPermiso> RolPermisos { get; set; }

    public virtual DbSet<Scrap> Scraps { get; set; }

    public virtual DbSet<Talle> Talles { get; set; }

    public virtual DbSet<Taller> Tallers { get; set; }

    public virtual DbSet<TipoInsumo> TipoInsumos { get; set; }

    public virtual DbSet<TipoPrendum> TipoPrenda { get; set; }

    public virtual DbSet<UnidadMedidum> UnidadMedida { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }
    public virtual DbSet<ProyectoAuditoria> ProyectoAuditorias { get; set; }
    public virtual DbSet<Ubicacion> Ubicacions { get; set; }
    public virtual DbSet<InsumoStock> InsumoStocks { get; set; }
    public virtual DbSet<ReporteClientesTemporadaItemDTO> ReporteClientesTemporadaItems { get; set; }
    public virtual DbSet<UsuarioArea> UsuarioAreas { get; set; }
    public virtual DbSet<UsuarioPermiso> UsuarioPermisos { get; set; }

    public virtual DbSet<VwMaterialesProyecto> VwMaterialesProyectos { get; set; }

    public virtual DbSet<VwPrendasProyecto> VwPrendasProyectos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AreaProduccion>(entity =>
        {
            entity.HasKey(e => e.IdArea).HasName("PK__AreaProd__2FC141AABA79283D");

            entity.ToTable("AreaProduccion");

            entity.HasIndex(e => e.NombreArea, "UQ__AreaProd__D5E8EEB507C7BDAF").IsUnique();

            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Activo");
            entity.Property(e => e.NombreArea)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<AvanceAreaProyecto>(entity =>
        {
            entity.HasKey(e => e.IdAvanceArea).HasName("PK__AvanceAr__9DF91CFC6F0443E1");

            entity.ToTable("AvanceAreaProyecto");

            entity.Property(e => e.FechaActualizacion)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(d => d.IdAreaNavigation).WithMany(p => p.AvanceAreaProyectos)
                .HasForeignKey(d => d.IdArea)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AvanceArea_Area");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.AvanceAreaProyectos)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AvanceArea_Proyecto");

            entity.HasOne(d => d.IdUsuarioRegistroNavigation).WithMany(p => p.AvanceAreaProyectos)
                .HasForeignKey(d => d.IdUsuarioRegistro)
                .HasConstraintName("FK_AvanceArea_Usuario");
        });

        modelBuilder.Entity<Ciudad>(entity =>
        {
            entity.HasKey(e => e.IdCiudad).HasName("PK__Ciudad__0640366C8580B7D2");

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
                .HasConstraintName("FK__Ciudad__id_Provi__08B54D69");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.IdCliente).HasName("PK__Cliente__378C7054D4AC596F");

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
                .HasConstraintName("FK__Cliente__id_Esta__09A971A2");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Clientes)
                .HasForeignKey(d => d.IdProvincia)
                .HasConstraintName("FK_Cliente_Provincia");
        });

        modelBuilder.Entity<ConfiguracionMaterial>(entity =>
        {
            entity.HasKey(e => e.IdConfig).HasName("PK__Configur__A57107560161B030");

            entity.ToTable("ConfiguracionMaterial");

            entity.Property(e => e.IdConfig).HasColumnName("id_Config");
            entity.Property(e => e.CantidadPorUnidad)
                .HasColumnType("decimal(7, 3)")
                .HasColumnName("cantidad_Por_Unidad");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.IdTipoInsumo).HasColumnName("id_TipoInsumo");
            entity.Property(e => e.IdTipoPrenda).HasColumnName("id_TipoPrenda");
            entity.Property(e => e.UnidadMedida)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("unidad_Medida");

            entity.HasOne(d => d.IdTipoInsumoNavigation).WithMany(p => p.ConfiguracionMaterials)
                .HasForeignKey(d => d.IdTipoInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Configura__id_Ti__7C1A6C5A");

            entity.HasOne(d => d.IdTipoPrendaNavigation).WithMany(p => p.ConfiguracionMaterials)
                .HasForeignKey(d => d.IdTipoPrenda)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Configura__id_Ti__7B264821");
        });

        modelBuilder.Entity<DetalleMaterialProyecto>(entity =>
        {
            entity.HasKey(e => e.IdDetalle).HasName("PK__DetalleM__8BEB6E7453D88CD3");

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
                .HasConstraintName("FK__DetalleMa__id_In__0E6E26BF");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.DetalleMaterialProyectos)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DetalleMa__id_Pr__0F624AF8");

            entity.HasOne(d => d.IdUnidadNavigation).WithMany(p => p.DetalleMaterialProyectos)
                .HasForeignKey(d => d.IdUnidad)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DetalleMa__id_Un__10566F31");
        });

        modelBuilder.Entity<DetalleOrdenCompra>(entity =>
        {
            entity.HasKey(e => e.IdDetalle).HasName("PK__Detalle___8BEB6E740F0F21FB");

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
                .HasConstraintName("FK__Detalle_O__id_In__0A9D95DB");

            entity.HasOne(d => d.IdOrdenCompraNavigation).WithMany(p => p.DetalleOrdenCompras)
                .HasForeignKey(d => d.IdOrdenCompra)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Detalle_O__id_Or__0B91BA14");
        });

        modelBuilder.Entity<DetalleTallerProyecto>(entity =>
        {
            entity.HasKey(e => e.IdDetalleTaller).HasName("PK__Detalle___21F58841EEE08549");

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
                .HasConstraintName("FK__Detalle_T__id_Pr__0C85DE4D");

            entity.HasOne(d => d.IdTallerNavigation).WithMany(p => p.DetalleTallerProyectos)
                .HasForeignKey(d => d.IdTaller)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Detalle_T__id_Ta__0D7A0286");
        });

        modelBuilder.Entity<Direccion>(entity =>
        {
            entity.HasKey(e => e.IdDireccion).HasName("PK__Direccio__B8A2BC7D526553A4");

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
                .HasConstraintName("FK__Direccion__id_Ci__114A936A");

            entity.HasOne(d => d.IdPaisNavigation).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.IdPais)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Direccion__id_Pa__123EB7A3");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.IdProvincia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Direccion__id_Pr__1332DBDC");
        });

        modelBuilder.Entity<EstadoCliente>(entity =>
        {
            entity.HasKey(e => e.IdEstadoCliente).HasName("PK__EstadoCl__E7A651C96AFA4585");

            entity.ToTable("EstadoCliente");

            entity.Property(e => e.IdEstadoCliente).HasColumnName("id_EstadoCliente");
            entity.Property(e => e.NombreEstado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("nombre_Estado");
        });

        modelBuilder.Entity<HistorialCliente>(entity =>
        {
            entity.HasKey(e => e.IdHistorial).HasName("PK__Historia__51E84F64EF3B76C0");

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
                .HasConstraintName("FK__Historial__id_Cl__14270015");
        });

        modelBuilder.Entity<HistorialUsuario>(entity =>
        {
            entity.HasKey(e => e.IdHistorial).HasName("PK__Historia__51E84F6483A59B84");

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
                .HasConstraintName("FK__Historial__id_Us__151B244E");
        });

        modelBuilder.Entity<Insumo>(entity =>
        {
            entity.HasKey(e => e.IdInsumo).HasName("PK__Insumo__F8E4E9DDFD439996");

            entity.ToTable("Insumo");

            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.Color)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("color");
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
            entity.Property(e => e.RatioKgUnidad)
                .HasColumnType("decimal(5, 3)")
                .HasColumnName("ratio_Kg_Unidad");
            entity.Property(e => e.StockActual)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("stock_Actual");
            entity.Property(e => e.StockMinimo)
                .HasColumnType("decimal(9, 1)")
                .HasColumnName("stock_Minimo");
            entity.Property(e => e.TipoTela)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("tipo_Tela");
            entity.Property(e => e.UnidadMedida)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("unidad_Medida");

            entity.HasOne(d => d.IdProveedorNavigation).WithMany(p => p.Insumos)
                .HasForeignKey(d => d.IdProveedor)
                .HasConstraintName("FK__Insumo__id_Prove__160F4887");

            entity.HasOne(d => d.IdTipoInsumoNavigation).WithMany(p => p.Insumos)
                .HasForeignKey(d => d.IdTipoInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Insumo__id_TipoI__17036CC0");

            entity.HasOne(d => d.IdUbicacionNavigation).WithMany(p => p.Insumos)
                .HasForeignKey(d => d.IdUbicacion)
                .HasConstraintName("FK_Insumo_Ubicacion");
        });

        modelBuilder.Entity<InventarioMovimiento>(entity =>
        {
            entity.HasKey(e => e.IdMovimiento).HasName("PK__Inventar__BE8A588CF648CF1C");

            entity.ToTable("Inventario_Movimiento");

            entity.Property(e => e.IdMovimiento).HasColumnName("id_Movimiento");
            entity.Property(e => e.Cantidad)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("cantidad");
            entity.Property(e => e.FechaMovimiento).HasColumnName("fecha_Movimiento");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.NombreInsumo)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("nombre_insumo");
            entity.Property(e => e.IdOrdenCompra).HasColumnName("id_OrdenCompra");
            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.Observacion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("observacion");
            entity.Property(e => e.Origen)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("origen");
            entity.Property(e => e.Destino)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("destino");
            entity.Property(e => e.TipoMovimiento)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("tipo_Movimiento");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__Inventari__id_In__17F790F9");

            entity.HasOne(d => d.IdOrdenCompraNavigation).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.IdOrdenCompra)
                .HasConstraintName("FK__Inventari__id_Or__18EBB532");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("FK__Inventari__id_Us__19DFD96B");
        });

        modelBuilder.Entity<MaterialCalculado>(entity =>
        {
            entity.HasKey(e => e.IdMaterialCalculado).HasName("PK__Material__B16B41094B3CE804");

            entity.ToTable("MaterialCalculado");

            entity.HasIndex(e => e.IdProyecto, "IX_MaterialCalculado_Proyecto");

            entity.Property(e => e.IdMaterialCalculado).HasColumnName("id_MaterialCalculado");
            entity.Property(e => e.CantidadCalculada)
                .HasColumnType("decimal(9, 2)")
                .HasColumnName("cantidad_Calculada");
            entity.Property(e => e.CantidadManual)
                .HasColumnType("decimal(9, 2)")
                .HasColumnName("cantidad_Manual");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdProyectoPrenda).HasColumnName("id_ProyectoPrenda");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("observaciones");
            entity.Property(e => e.TieneStock)
                .HasDefaultValue(true)
                .HasColumnName("tiene_Stock");
            entity.Property(e => e.TipoCalculo)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tipo_Calculo");
            entity.Property(e => e.UnidadMedida)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("unidad_Medida");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.MaterialCalculados)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__MaterialC__id_In__0C50D423");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.MaterialCalculados)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__MaterialC__id_Pr__0A688BB1");

            entity.HasOne(d => d.IdProyectoPrendaNavigation).WithMany(p => p.MaterialCalculados)
                .HasForeignKey(d => d.IdProyectoPrenda)
                .HasConstraintName("FK__MaterialC__id_Pr__0B5CAFEA");
        });

        modelBuilder.Entity<ObservacionProyecto>(entity =>
        {
            entity.HasKey(e => e.IdObservacion).HasName("PK__Observac__492EC232D5D72C2D");

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
                .HasConstraintName("FK__Observaci__id_Pr__1AD3FDA4");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.ObservacionProyectos)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Observaci__id_Us__1BC821DD");
        });

        modelBuilder.Entity<OrdenCompra>(entity =>
        {
            entity.HasKey(e => e.IdOrdenCompra).HasName("PK__Orden_Co__D38A93C127B6CBDD");

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
                .HasConstraintName("FK__Orden_Com__id_Pr__1CBC4616");
        });

        modelBuilder.Entity<Pai>(entity =>
        {
            entity.HasKey(e => e.IdPais).HasName("PK__Pais__2A3B9774B054E953");

            entity.Property(e => e.IdPais).HasColumnName("id_Pais");
            entity.Property(e => e.NombrePais)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Pais");
        });

        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.HasKey(e => e.IdPermiso).HasName("PK__Permiso__ED14A36F659BA23B");

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

        modelBuilder.Entity<PrendaTalle>(entity =>
        {
            entity.HasKey(e => e.IdPrendaTalle).HasName("PK__PrendaTa__37E004FDC6BE1BB0");

            entity.ToTable("PrendaTalle");

            entity.HasIndex(e => e.IdProyectoPrenda, "IX_PrendaTalle_ProyectoPrenda");

            entity.Property(e => e.IdPrendaTalle).HasColumnName("id_PrendaTalle");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.IdProyectoPrenda).HasColumnName("id_ProyectoPrenda");
            entity.Property(e => e.IdTalle).HasColumnName("id_Talle");

            entity.HasOne(d => d.IdProyectoPrendaNavigation).WithMany(p => p.PrendaTalles)
                .HasForeignKey(d => d.IdProyectoPrenda)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PrendaTal__id_Pr__05A3D694");

            entity.HasOne(d => d.IdTalleNavigation).WithMany(p => p.PrendaTalles)
                .HasForeignKey(d => d.IdTalle)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PrendaTal__id_Ta__0697FACD");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.HasKey(e => e.IdProveedor).HasName("PK__Proveedo__53B6E1A5BE514769");

            entity.ToTable("Proveedor");

            entity.Property(e => e.IdProveedor).HasColumnName("id_Proveedor");
            entity.Property(e => e.Cuit)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("cuit");
            entity.Property(e => e.Direccion)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("direccion");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.FechaAlta).HasColumnName("fecha_Alta");
            entity.Property(e => e.IdCiudad).HasColumnName("id_Ciudad");
            entity.Property(e => e.IdProvincia).HasColumnName("id_Provincia");
            entity.Property(e => e.NombreProveedor)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("nombre_Proveedor");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("observaciones");
            entity.Property(e => e.Telefono)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("telefono");

            entity.HasOne(d => d.IdCiudadNavigation).WithMany(p => p.Proveedors)
                .HasForeignKey(d => d.IdCiudad)
                .HasConstraintName("FK_Proveedor_Ciudad");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Proveedors)
                .HasForeignKey(d => d.IdProvincia)
                .HasConstraintName("FK_Proveedor_Provincia");
        });

        modelBuilder.Entity<Provincium>(entity =>
        {
            entity.HasKey(e => e.IdProvincia).HasName("PK__Provinci__C83EC1948F3FA25D");

            entity.Property(e => e.IdProvincia).HasColumnName("id_Provincia");
            entity.Property(e => e.IdPais).HasColumnName("id_Pais");
            entity.Property(e => e.NombreProvincia)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Provincia");

            entity.HasOne(d => d.IdPaisNavigation).WithMany(p => p.Provincia)
                .HasForeignKey(d => d.IdPais)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Provincia__id_Pa__1DB06A4F");
        });

        modelBuilder.Entity<Proyecto>(entity =>
        {
            entity.HasKey(e => e.IdProyecto).HasName("PK__Proyecto__2544884CC3151243");

            entity.HasIndex(e => e.CodigoProyecto, "UQ_CodigoProyecto").IsUnique();

            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.AreaActual)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasDefaultValue("Gerencia y Administración");
            entity.Property(e => e.AvanceControlCalidad).HasDefaultValue(0);
            entity.Property(e => e.AvanceDepositoLogistica).HasDefaultValue(0);
            entity.Property(e => e.AvanceDisenoDesarrollo).HasDefaultValue(0);
            entity.Property(e => e.AvanceEtiquetadoEmpaquetado).HasDefaultValue(0);
            entity.Property(e => e.AvanceGerenciaAdmin).HasDefaultValue(0);
            entity.Property(e => e.CantidadProducida).HasDefaultValue(0);
            entity.Property(e => e.CodigoProyecto)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.CostoMaterialEstimado).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.EsMultiPrenda)
                .HasDefaultValue(false)
                .HasColumnName("es_MultiPrenda");
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.FechaFin).HasColumnName("fecha_Fin");
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_Inicio");
            entity.Property(e => e.IdCliente).HasColumnName("id_Cliente");
            entity.Property(e => e.NombreProyecto)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("nombre_Proyecto");
            entity.Property(e => e.Prioridad)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("prioridad");
            entity.Property(e => e.ScrapPorcentaje)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(5, 2)");
            entity.Property(e => e.ScrapTotal)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(10, 2)");
            entity.Property(e => e.TipoEstacion)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TipoPrendaLegacy)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("tipo_Prenda_Legacy");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.Proyectos)
                .HasForeignKey(d => d.IdCliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Proyectos__id_Cl__1EA48E88");

            entity.HasOne(d => d.IdUsuarioEncargadoNavigation).WithMany(p => p.Proyectos)
                .HasForeignKey(d => d.IdUsuarioEncargado)
                .HasConstraintName("FK_Proyecto_UsuarioEncargado");
        });

        modelBuilder.Entity<ProyectoPrendum>(entity =>
        {
            entity.HasKey(e => e.IdProyectoPrenda).HasName("PK__Proyecto__B4428B2F238DD834");

            entity.HasIndex(e => e.IdProyecto, "IX_ProyectoPrenda_Proyecto");

            entity.Property(e => e.IdProyectoPrenda).HasColumnName("id_ProyectoPrenda");
            entity.Property(e => e.CantidadTotal).HasColumnName("cantidad_Total");
            entity.Property(e => e.DescripcionDiseno)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("descripcion_Diseno");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdTipoInsumoMaterial).HasColumnName("id_TipoInsumo_Material");
            entity.Property(e => e.IdTipoPrenda).HasColumnName("id_TipoPrenda");
            entity.Property(e => e.Orden).HasColumnName("orden");
            entity.Property(e => e.TieneBordado)
                .HasDefaultValue(false)
                .HasColumnName("tiene_Bordado");
            entity.Property(e => e.TieneEstampado)
                .HasDefaultValue(false)
                .HasColumnName("tiene_Estampado");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.ProyectoPrenda)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ProyectoP__id_Pr__00DF2177");

            entity.HasOne(d => d.IdTipoInsumoMaterialNavigation).WithMany(p => p.ProyectoPrenda)
                .HasForeignKey(d => d.IdTipoInsumoMaterial)
                .HasConstraintName("FK__ProyectoP__id_Ti__02C769E9");

            entity.HasOne(d => d.IdTipoPrendaNavigation).WithMany(p => p.ProyectoPrenda)
                .HasForeignKey(d => d.IdTipoPrenda)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ProyectoP__id_Ti__01D345B0");
        });

        modelBuilder.Entity<Rol>(entity =>
        {
            entity.HasKey(e => e.IdRol).HasName("PK__Rol__76482FD2A76C0E6A");

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
            entity.HasKey(e => new { e.IdRol, e.IdPermiso }).HasName("PK__RolPermi__989965E47620E5AB");

            entity.ToTable("RolPermiso");

            entity.Property(e => e.IdRol).HasColumnName("id_Rol");
            entity.Property(e => e.IdPermiso).HasColumnName("id_Permiso");
            entity.Property(e => e.PuedeAcceder).HasColumnName("puede_Acceder");

            entity.HasOne(d => d.IdPermisoNavigation).WithMany(p => p.RolPermisos)
                .HasForeignKey(d => d.IdPermiso)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RolPermis__id_Pe__1F98B2C1");

            entity.HasOne(d => d.IdRolNavigation).WithMany(p => p.RolPermisos)
                .HasForeignKey(d => d.IdRol)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RolPermis__id_Ro__208CD6FA");
        });

        modelBuilder.Entity<Scrap>(entity =>
        {
            entity.HasKey(e => e.IdScrap).HasName("PK__Scrap__FF2402A0499398BA");

            entity.ToTable("Scrap");

            entity.Property(e => e.IdScrap).HasColumnName("id_Scrap");
            entity.Property(e => e.AreaOcurrencia)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.CantidadScrap)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("cantidad_Scrap");
            entity.Property(e => e.CostoScrap).HasColumnType("decimal(10, 2)");
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
                .HasConstraintName("FK__Scrap__id_Insumo__2180FB33");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Scraps)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Scrap__id_Proyec__22751F6C");
        });

        modelBuilder.Entity<Talle>(entity =>
        {
            entity.HasKey(e => e.IdTalle).HasName("PK__Talle__B43E6D011A0B93FA");

            entity.ToTable("Talle");

            entity.Property(e => e.IdTalle).HasColumnName("id_Talle");
            entity.Property(e => e.Categoria)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("categoria");
            entity.Property(e => e.Estado)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValue("Activo")
                .HasColumnName("estado");
            entity.Property(e => e.NombreTalle)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("nombre_Talle");
            entity.Property(e => e.Orden).HasColumnName("orden");
        });

        modelBuilder.Entity<Taller>(entity =>
        {
            entity.HasKey(e => e.IdTaller).HasName("PK__Taller__1C7B56B3F0935104");

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
                .HasConstraintName("FK__Taller__id_Ciuda__236943A5");
        });

        modelBuilder.Entity<TipoInsumo>(entity =>
        {
            entity.HasKey(e => e.IdTipoInsumo).HasName("PK__TipoInsu__C0898F9D13926F40");

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

        modelBuilder.Entity<TipoPrendum>(entity =>
        {
            entity.HasKey(e => e.IdTipoPrenda).HasName("PK__TipoPren__355BD324A9C13EEA");

            entity.Property(e => e.IdTipoPrenda).HasColumnName("id_TipoPrenda");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.Estado)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasDefaultValue("Activo")
                .HasColumnName("estado");
            entity.Property(e => e.LongitudCosturaMetros)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("longitud_Costura_Metros");
            entity.Property(e => e.NombrePrenda)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Prenda");
        });

        modelBuilder.Entity<Ubicacion>(entity =>
        {
            entity.HasKey(e => e.IdUbicacion).HasName("PK_Ubicacion");

            entity.ToTable("Ubicacion");

            entity.HasIndex(e => e.Codigo, "UQ_Ubicacion_Codigo").IsUnique();

            entity.Property(e => e.IdUbicacion).HasColumnName("id_Ubicacion");
            entity.Property(e => e.Codigo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("codigo");
            entity.Property(e => e.Rack).HasColumnName("rack");
            entity.Property(e => e.Division).HasColumnName("division");
            entity.Property(e => e.Espacio).HasColumnName("espacio");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("descripcion");
        });

        modelBuilder.Entity<UnidadMedidum>(entity =>
        {
            entity.HasKey(e => e.IdUnidad).HasName("PK__Unidad_M__06C748258040E0AB");

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
            entity.HasKey(e => e.IdUsuario).HasName("PK__Usuario__8E901EAA8DFE2877");

            entity.ToTable("Usuario");

            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.ApellidoUsuario)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("apellido_Usuario");
            entity.Property(e => e.Contrasena)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("contrasena");
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
                .HasConstraintName("FK__Usuario__id_Rol__245D67DE");
        });

        modelBuilder.Entity<VwMaterialesProyecto>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_MaterialesProyecto");

            entity.Property(e => e.CantidadCalculada)
                .HasColumnType("decimal(9, 2)")
                .HasColumnName("cantidad_Calculada");
            entity.Property(e => e.CantidadFinal)
                .HasColumnType("decimal(9, 2)")
                .HasColumnName("cantidad_Final");
            entity.Property(e => e.CantidadManual)
                .HasColumnType("decimal(9, 2)")
                .HasColumnName("cantidad_Manual");
            entity.Property(e => e.EstadoStock)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("estado_Stock");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.NombreInsumo)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("nombre_Insumo");
            entity.Property(e => e.NombreProyecto)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("nombre_Proyecto");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("observaciones");
            entity.Property(e => e.StockActual)
                .HasColumnType("decimal(9, 0)")
                .HasColumnName("stock_Actual");
            entity.Property(e => e.TieneStock).HasColumnName("tiene_Stock");
            entity.Property(e => e.TipoCalculo)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tipo_Calculo");
            entity.Property(e => e.TipoInsumo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("tipo_Insumo");
            entity.Property(e => e.UnidadMedida)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("unidad_Medida");
        });

        modelBuilder.Entity<VwPrendasProyecto>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_PrendasProyecto");

            entity.Property(e => e.CantidadTallesDistintos).HasColumnName("cantidad_Talles_Distintos");
            entity.Property(e => e.CantidadTotal).HasColumnName("cantidad_Total");
            entity.Property(e => e.DescripcionDiseno)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("descripcion_Diseno");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdProyectoPrenda).HasColumnName("id_ProyectoPrenda");
            entity.Property(e => e.Material)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("material");
            entity.Property(e => e.NombrePrenda)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_Prenda");
            entity.Property(e => e.NombreProyecto)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("nombre_Proyecto");
            entity.Property(e => e.TieneBordado).HasColumnName("tiene_Bordado");
            entity.Property(e => e.TieneEstampado).HasColumnName("tiene_Estampado");
        });

        modelBuilder.Entity<InsumoStock>(entity =>
        {
            entity.HasKey(e => e.IdInsumoStock);

            entity.ToTable("Insumo_Stock");

            entity.Property(e => e.IdInsumoStock).HasColumnName("id_Insumo_Stock");
            entity.Property(e => e.IdInsumo).HasColumnName("id_Insumo");
            entity.Property(e => e.IdProyecto).HasColumnName("id_Proyecto");
            entity.Property(e => e.IdUbicacion).HasColumnName("id_Ubicacion");
            entity.Property(e => e.IdOrdenCompra).HasColumnName("id_OrdenCompra");
            entity.Property(e => e.Cantidad).HasColumnType("decimal(18, 2)").HasColumnName("cantidad");
            entity.Property(e => e.FechaActualizacion).HasColumnType("datetime").HasColumnName("fecha_Actualizacion");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.InsumoStocks)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InsumoStock_Insumo");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InsumoStocks)
                .HasForeignKey(d => d.IdProyecto)
                .HasConstraintName("FK_InsumoStock_Proyecto");

            entity.HasOne(d => d.IdUbicacionNavigation).WithMany(p => p.InsumoStocks)
                .HasForeignKey(d => d.IdUbicacion)
                .HasConstraintName("FK_InsumoStock_Ubicacion");

            entity.HasOne(d => d.IdOrdenCompraNavigation).WithMany(p => p.InsumoStocks)
                .HasForeignKey(d => d.IdOrdenCompra)
                .HasConstraintName("FK_InsumoStock_OrdenCompra");
        });

        modelBuilder.Entity<ReporteClientesTemporadaItemDTO>(entity =>
        {
            entity.HasNoKey();
            entity.ToView(null);
        });

        modelBuilder.Entity<UsuarioArea>(entity =>
        {
            entity.HasKey(e => new { e.IdUsuario, e.IdArea }).HasName("PK_UsuarioArea");

            entity.ToTable("UsuarioArea");

            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.IdArea).HasColumnName("id_Area");

            entity.HasOne(d => d.IdAreaNavigation).WithMany(p => p.UsuarioAreas)
                .HasForeignKey(d => d.IdArea)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioArea_AreaProduccion");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.UsuarioAreas)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioArea_Usuario");
        });

        modelBuilder.Entity<UsuarioPermiso>(entity =>
        {
            entity.HasKey(e => new { e.IdUsuario, e.IdPermiso }).HasName("PK_UsuarioPermiso");

            entity.ToTable("UsuarioPermiso");

            entity.Property(e => e.IdUsuario).HasColumnName("id_Usuario");
            entity.Property(e => e.IdPermiso).HasColumnName("id_Permiso");
            entity.Property(e => e.PuedeAcceder).HasColumnName("puede_Acceder");

            entity.HasOne(d => d.IdPermisoNavigation).WithMany(p => p.UsuarioPermisos)
                .HasForeignKey(d => d.IdPermiso)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioPermiso_Permiso");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.UsuarioPermisos)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioPermiso_Usuario");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}


