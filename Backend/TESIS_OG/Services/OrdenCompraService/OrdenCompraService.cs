using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.OrdenCompra;
using TESIS_OG.Models;

namespace TESIS_OG.Services.OrdenCompraService
{
    public class OrdenCompraService : IOrdenCompraService
    {
        private readonly Data.TamarindoDbContext _context;

        public OrdenCompraService(Data.TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<OrdenCompraIndexDTO?> CrearOrdenCompraAsync(OrdenCompraCreateDTO ordenDto)
        {
            try
            {
                // Validar que el proveedor exista
                var proveedorExiste = await _context.Proveedors
                    .AnyAsync(p => p.IdProveedor == ordenDto.IdProveedor);
                if (!proveedorExiste) return null;

                // Validar que todos los insumos existan y tengan stock suficiente
                foreach (var detalle in ordenDto.Detalles)
                {
                    var insumo = await _context.Insumos
                        .FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);

                    if (insumo == null) return null;

                    // Validación: cantidad debe ser mayor a 0
                    if (detalle.Cantidad <= 0) return null;

                    // Validación: precio unitario debe ser mayor a 0
                    if (detalle.PrecioUnitario <= 0) return null;

                    // Calcular subtotal
                    detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;
                }

                // Validar que el total coincida
                var totalCalculado = ordenDto.Detalles.Sum(d => d.Subtotal);
                if (Math.Abs(totalCalculado - ordenDto.TotalOrden) > 0.01m)
                {
                    // Ajustar el total automáticamente
                    ordenDto.TotalOrden = totalCalculado;
                }

                // Crear la orden de compra
                var nuevaOrden = new OrdenCompra
                {
                    NroOrden = ordenDto.NroOrden,
                    IdProveedor = ordenDto.IdProveedor,
                    FechaSolicitud = ordenDto.FechaSolicitud,
                    FechaEntregaEstimada = ordenDto.FechaEntregaEstimada,
                    Estado = ordenDto.Estado,
                    TotalOrden = ordenDto.TotalOrden
                };

                _context.OrdenCompras.Add(nuevaOrden);
                await _context.SaveChangesAsync();

                // Crear los detalles
                foreach (var detalleDto in ordenDto.Detalles)
                {
                    var detalle = new DetalleOrdenCompra
                    {
                        IdOrdenCompra = nuevaOrden.IdOrdenCompra,
                        IdInsumo = detalleDto.IdInsumo,
                        Cantidad = detalleDto.Cantidad,
                        PrecioUnitario = detalleDto.PrecioUnitario,
                        Subtotal = detalleDto.Subtotal
                    };

                    _context.DetalleOrdenCompras.Add(detalle);
                }

                await _context.SaveChangesAsync();

                return await ObtenerOrdenPorIdAsync(nuevaOrden.IdOrdenCompra);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en CrearOrdenCompraAsync: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                throw;
            }
        }

        public async Task<List<OrdenCompraIndexDTO>> ObtenerTodasLasOrdenesAsync()
        {
            var ordenes = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .Select(o => new OrdenCompraIndexDTO
                {
                    IdOrdenCompra = o.IdOrdenCompra,
                    NroOrden = o.NroOrden,
                    IdProveedor = o.IdProveedor,
                    NombreProveedor = o.IdProveedorNavigation.NombreProveedor,
                    FechaSolicitud = o.FechaSolicitud,
                    FechaEntregaEstimada = o.FechaEntregaEstimada,
                    Estado = o.Estado,
                    TotalOrden = o.TotalOrden ?? 0m,
                    Detalles = o.DetalleOrdenCompras.Select(d => new DetalleOrdenCompraIndexDTO
                    {
                        IdDetalle = d.IdDetalle,
                        IdInsumo = d.IdInsumo,
                        NombreInsumo = d.IdInsumoNavigation.NombreInsumo,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        Subtotal = d.Subtotal ?? 0m
                    }).ToList()
                })
                .OrderByDescending(o => o.FechaSolicitud)
                .ToListAsync();

            return ordenes;
        }

        public async Task<OrdenCompraIndexDTO?> ObtenerOrdenPorIdAsync(int id)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .Where(o => o.IdOrdenCompra == id)
                .Select(o => new OrdenCompraIndexDTO
                {
                    IdOrdenCompra = o.IdOrdenCompra,
                    NroOrden = o.NroOrden,
                    IdProveedor = o.IdProveedor,
                    NombreProveedor = o.IdProveedorNavigation.NombreProveedor,
                    FechaSolicitud = o.FechaSolicitud,
                    FechaEntregaEstimada = o.FechaEntregaEstimada,
                    Estado = o.Estado,
                    TotalOrden = o.TotalOrden ?? 0m,
                    Detalles = o.DetalleOrdenCompras.Select(d => new DetalleOrdenCompraIndexDTO
                    {
                        IdDetalle = d.IdDetalle,
                        IdInsumo = d.IdInsumo,
                        NombreInsumo = d.IdInsumoNavigation.NombreInsumo,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        Subtotal = d.Subtotal ?? 0m
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            return orden;
        }

        public async Task<OrdenCompraIndexDTO?> ActualizarOrdenCompraAsync(int id, OrdenCompraEditDTO ordenDto)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            if (orden == null) return null;

            // Validar que el proveedor exista
            var proveedorExiste = await _context.Proveedors
                .AnyAsync(p => p.IdProveedor == ordenDto.IdProveedor);
            if (!proveedorExiste) return null;

            // Actualizar la orden
            orden.NroOrden = ordenDto.NroOrden;
            orden.IdProveedor = ordenDto.IdProveedor;
            orden.FechaSolicitud = ordenDto.FechaSolicitud;
            orden.FechaEntregaEstimada = ordenDto.FechaEntregaEstimada;
            orden.Estado = ordenDto.Estado;
            orden.TotalOrden = ordenDto.TotalOrden;

            // Eliminar detalles anteriores
            _context.DetalleOrdenCompras.RemoveRange(orden.DetalleOrdenCompras);

            // Agregar nuevos detalles
            foreach (var detalleDto in ordenDto.Detalles)
            {
                var detalle = new DetalleOrdenCompra
                {
                    IdOrdenCompra = orden.IdOrdenCompra,
                    IdInsumo = detalleDto.IdInsumo,
                    Cantidad = detalleDto.Cantidad,
                    PrecioUnitario = detalleDto.PrecioUnitario,
                    Subtotal = detalleDto.Subtotal
                };

                _context.DetalleOrdenCompras.Add(detalle);
            }

            await _context.SaveChangesAsync();

            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<bool> EliminarOrdenCompraAsync(int id)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            if (orden == null) return false;

            // Eliminar detalles primero
            _context.DetalleOrdenCompras.RemoveRange(orden.DetalleOrdenCompras);

            // Eliminar orden
            _context.OrdenCompras.Remove(orden);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<OrdenCompraIndexDTO?> RegistrarRecepcionAsync(OrdenCompraReceiveDTO recepcionDto)
        {
            // 1. Buscar la orden de compra
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == recepcionDto.IdOrdenCompra);

            if (orden == null) return null;

            // 2. Validar que la orden esté en estado válido para recibir
            if (orden.Estado == "Recibida" || orden.Estado == "Cancelada")
            {
                return null; // No se puede recibir una orden ya recibida o cancelada
            }

            // 3. Validar que todos los insumos existan
            foreach (var detalle in recepcionDto.Detalles)
            {
                var insumo = await _context.Insumos
                    .FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);

                if (insumo == null) return null;

                if (detalle.CantidadRecibida <= 0) return null;
            }

            // 4. Actualizar el stock de cada insumo
            foreach (var detalle in recepcionDto.Detalles)
            {
                var insumo = await _context.Insumos
                    .FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);

                if (insumo != null)
                {
                    // Incrementar el stock
                    insumo.StockActual += detalle.CantidadRecibida;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                }

                // 5. Registrar el movimiento de inventario
                var movimiento = new InventarioMovimiento
                {
                    IdInsumo = detalle.IdInsumo,
                    IdOrdenCompra = orden.IdOrdenCompra,
                    TipoMovimiento = "Entrada",
                    Cantidad = detalle.CantidadRecibida,
                    FechaMovimiento = DateOnly.Parse(recepcionDto.FechaRecepcion),
                    Origen = "Recepción de Orden de Compra",
                    Observacion = detalle.ObservacionDetalle ?? recepcionDto.Observacion,
                    IdUsuario = recepcionDto.IdUsuario
                };

                _context.InventarioMovimientos.Add(movimiento);
            }

            // 6. Actualizar el estado de la orden a "Recibida"
            orden.Estado = "Recibida";

            // 7. Guardar todos los cambios
            await _context.SaveChangesAsync();

            // 8. Retornar la orden actualizada
            return await ObtenerOrdenPorIdAsync(orden.IdOrdenCompra);
        }

        // ==================== CONTROL DE RECEPCIÓN ====================

        public async Task<OrdenCompraIndexDTO?> HabilitarControlAsync(int id, HabilitarControlDTO dto)
        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            // Solo se puede habilitar si está Pendiente o Aprobada
            if (orden.Estado == "PendienteControl" || orden.Estado == "Recibida" || orden.Estado == "Cancelada")
                return null;

            orden.Estado = "PendienteControl";
            orden.FechaHabilitacionControl = DateOnly.FromDateTime(DateTime.Now);

            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<List<OrdenCompraIndexDTO>> ObtenerOrdenesPendienteControlAsync()
        {
            var ordenes = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .Where(o => o.Estado == "PendienteControl")
                .Select(o => new OrdenCompraIndexDTO
                {
                    IdOrdenCompra = o.IdOrdenCompra,
                    NroOrden = o.NroOrden,
                    IdProveedor = o.IdProveedor,
                    NombreProveedor = o.IdProveedorNavigation.NombreProveedor,
                    FechaSolicitud = o.FechaSolicitud,
                    FechaEntregaEstimada = o.FechaEntregaEstimada,
                    Estado = o.Estado,
                    TotalOrden = o.TotalOrden ?? 0m,
                    FechaHabilitacionControl = o.FechaHabilitacionControl,
                    FechaRecepcionControl = o.FechaRecepcionControl,
                    ObservacionControl = o.ObservacionControl,
                    Detalles = o.DetalleOrdenCompras.Select(d => new DetalleOrdenCompraIndexDTO
                    {
                        IdDetalle = d.IdDetalle,
                        IdInsumo = d.IdInsumo,
                        NombreInsumo = d.IdInsumoNavigation.NombreInsumo,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        Subtotal = d.Subtotal ?? 0m
                    }).ToList()
                })
                .OrderByDescending(o => o.FechaSolicitud)
                .ToListAsync();

            return ordenes;
        }

        public async Task<OrdenCompraIndexDTO?> RegistrarControlRecepcionAsync(ControlRecepcionDTO dto)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == dto.IdOrdenCompra);

            if (orden == null) return null;

            // Solo se puede controlar si está PendienteControl
            if (orden.Estado != "PendienteControl") return null;

            // Validar detalles
            foreach (var detalle in dto.Detalles)
            {
                var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                if (insumo == null) return null;
                if (detalle.CantidadRecibida <= 0) return null;
            }

            // Actualizar stock y registrar movimientos
            var fechaControl = DateOnly.Parse(dto.FechaControl);
            foreach (var detalle in dto.Detalles)
            {
                var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                if (insumo != null)
                {
                    insumo.StockActual += detalle.CantidadRecibida;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                }

                _context.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    IdInsumo = detalle.IdInsumo,
                    IdOrdenCompra = orden.IdOrdenCompra,
                    TipoMovimiento = "Entrada",
                    Cantidad = detalle.CantidadRecibida,
                    FechaMovimiento = fechaControl,
                    Origen = "Control Recepción de Orden de Compra",
                    Observacion = detalle.ObservacionDetalle ?? dto.Observacion,
                    IdUsuario = dto.IdUsuarioControl
                });
            }

            // Actualizar estado de la orden
            orden.Estado = "Recibida";
            orden.FechaRecepcionControl = fechaControl;
            orden.IdUsuarioControl = dto.IdUsuarioControl;
            orden.ObservacionControl = dto.Observacion;

            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(orden.IdOrdenCompra);
        }

        public async Task<OrdenCompraIndexDTO?> RecalcularRecepcionAsync(int id)
        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            // Solo se puede recalcular si está Recibida
            if (orden.Estado != "Recibida") return null;

            orden.Estado = "PendienteControl";
            orden.FechaRecepcionControl = null;

            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }
    }
}
