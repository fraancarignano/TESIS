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

                // Validar y resolver insumos (existentes o nuevos)
                foreach (var detalle in ordenDto.Detalles)
                {
                    if (detalle.IdInsumo == 0)
                    {
                        // Insumo nuevo: validar campos requeridos
                        if (string.IsNullOrWhiteSpace(detalle.NuevoNombreInsumo))
                            return null;
                        if (!detalle.NuevoIdTipoInsumo.HasValue || detalle.NuevoIdTipoInsumo <= 0)
                            return null;

                        var colorNorm = string.IsNullOrWhiteSpace(detalle.NuevoColor)
                            ? null
                            : detalle.NuevoColor.Trim().ToUpperInvariant();

                        // Buscar si ya existe un insumo con ese tipo + color (independiente del nombre)
                        var insumoExistente = await _context.Insumos.FirstOrDefaultAsync(i =>
                            i.IdTipoInsumo == detalle.NuevoIdTipoInsumo &&
                            (i.Color ?? "") == (colorNorm ?? ""));

                        // Si no encontró por tipo+color, buscar por nombre+color (compatibilidad)
                        if (insumoExistente == null && !string.IsNullOrWhiteSpace(detalle.NuevoNombreInsumo))
                        {
                            insumoExistente = await _context.Insumos.FirstOrDefaultAsync(i =>
                                i.NombreInsumo.ToLower() == detalle.NuevoNombreInsumo.Trim().ToLower() &&
                                (i.Color ?? "") == (colorNorm ?? ""));
                        }

                        if (insumoExistente != null)
                        {
                            // Reusar el existente
                            detalle.IdInsumo = insumoExistente.IdInsumo;
                        }
                        else
                        {
                            // Crear el insumo nuevo con stock 0
                            var nuevoInsumo = new Insumo
                            {
                                NombreInsumo = detalle.NuevoNombreInsumo.Trim(),
                                IdTipoInsumo = detalle.NuevoIdTipoInsumo.Value,
                                UnidadMedida = detalle.NuevoUnidadMedida?.Trim() ?? "Kg",
                                StockActual = 0,
                                Color = colorNorm,
                                Estado = "A designar",
                                FechaActualizacion = DateOnly.FromDateTime(DateTime.Now)
                            };
                            _context.Insumos.Add(nuevoInsumo);
                            await _context.SaveChangesAsync();
                            detalle.IdInsumo = nuevoInsumo.IdInsumo;
                        }
                    }
                    else
                    {
                        var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                        if (insumo == null) return null;
                    }

                    if (detalle.Cantidad <= 0) return null;
                    if (detalle.PrecioUnitario <= 0) return null;
                    detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;
                }

                // Ajustar total automáticamente
                var totalCalculado = ordenDto.Detalles.Sum(d => d.Subtotal);
                if (Math.Abs(totalCalculado - ordenDto.TotalOrden) > 0.01m)
                    ordenDto.TotalOrden = totalCalculado;

                // Generar código automático: OC-YYYYMMDD-XXXX
                var hoy = DateTime.Now.ToString("yyyyMMdd");
                var contadorHoy = await _context.OrdenCompras
                    .CountAsync(o => o.NroOrden.StartsWith($"OC-{hoy}-"));
                var nroOrden = $"OC-{hoy}-{(contadorHoy + 1):D4}";

                // Crear la orden de compra (estado siempre Pendiente al crear)
                var nuevaOrden = new OrdenCompra
                {
                    NroOrden = nroOrden,
                    IdProveedor = ordenDto.IdProveedor,
                    IdProyecto = ordenDto.IdProyecto,
                    Descripcion = ordenDto.Descripcion?.Trim(),
                    FechaSolicitud = ordenDto.FechaSolicitud,
                    FechaEntregaEstimada = ordenDto.FechaEntregaEstimada,
                    Estado = "Pendiente",
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
                        Subtotal = detalleDto.Subtotal,
                        IdProyecto = detalleDto.IdProyecto ?? ordenDto.IdProyecto,
                        IdProyectoPrenda = detalleDto.IdProyectoPrenda,
                        EsMaterialExtra = detalleDto.EsMaterialExtra
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
                .OrderByDescending(o => o.FechaSolicitud)
                .ToListAsync();

            var result = new List<OrdenCompraIndexDTO>();
            foreach (var o in ordenes)
            {
                try
                {
                    result.Add(await MapearOrdenAsync(o));
                }
                catch (Exception ex)
                {
                    // Log error but continue with other orders
                    Console.WriteLine($"Error mapeando orden ID {o.IdOrdenCompra}: {ex.Message}");
                    // Opcionalmente agregar un DTO parcial o simplemente saltar
                }
            }
            return result;
        }

        public async Task<OrdenCompraIndexDTO?> ObtenerOrdenPorIdAsync(int id)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.IdProveedorNavigation)
                .Include(o => o.DetalleOrdenCompras)
                    .ThenInclude(d => d.IdInsumoNavigation)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            return orden == null ? null : await MapearOrdenAsync(orden);
        }

        private async Task<OrdenCompraIndexDTO> MapearOrdenAsync(OrdenCompra o)
        {
            // Obtener cantidades recibidas por insumo desde movimientos de inventario
            var movimientos = await _context.InventarioMovimientos
                .Where(m => m.IdOrdenCompra == o.IdOrdenCompra && m.TipoMovimiento == "Entrada" && m.IdInsumo != null)
                .GroupBy(m => m.IdInsumo)
                .Select(g => new { IdInsumo = g.Key, TotalRecibido = g.Sum(m => m.Cantidad) })
                .ToListAsync();

            var recibidoMap = movimientos.ToDictionary(m => m.IdInsumo!.Value, m => m.TotalRecibido);

            string? nombreProyecto = null;
            if (o.IdProyecto.HasValue)
            {
                nombreProyecto = await _context.Proyectos
                    .Where(p => p.IdProyecto == o.IdProyecto.Value)
                    .Select(p => p.NombreProyecto)
                    .FirstOrDefaultAsync();
            }

            return new OrdenCompraIndexDTO
            {
                IdOrdenCompra = o.IdOrdenCompra,
                NroOrden = o.NroOrden,
                IdProveedor = o.IdProveedor,
                NombreProveedor = o.IdProveedorNavigation?.NombreProveedor,
                IdProyecto = o.IdProyecto,
                NombreProyecto = nombreProyecto,
                Descripcion = o.Descripcion,
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
                    NombreInsumo = d.IdInsumoNavigation?.NombreInsumo,
                    ColorInsumo = d.IdInsumoNavigation?.Color,
                    Cantidad = d.Cantidad,
                    CantidadRecibida = recibidoMap.TryGetValue(d.IdInsumo, out var rec) ? rec : 0,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Subtotal ?? 0m
                }).ToList()
            };
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
            orden.IdProyecto = ordenDto.IdProyecto;
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

        public async Task<OrdenCompraIndexDTO?> VerificarOrdenAsync(int id)
        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            // Solo se puede verificar si está Recibida
            if (orden.Estado != "Recibida") return null;

            orden.Estado = "Verificada";
            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<OrdenCompraIndexDTO?> AnularOrdenAsync(int id)        {
            var orden = await _context.OrdenCompras.FirstOrDefaultAsync(o => o.IdOrdenCompra == id);
            if (orden == null) return null;

            if (orden.Estado == "Recibida" || orden.Estado == "PendienteControl" || orden.Estado == "Anulada")
                return null;

            orden.Estado = "Anulada";
            await _context.SaveChangesAsync();
            return await ObtenerOrdenPorIdAsync(id);
        }

        public async Task<bool> EliminarOrdenCompraAsync(int id)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == id);

            if (orden == null) return false;

            // Solo se pueden eliminar órdenes anuladas
            if (orden.Estado != "Anulada") return false;

            _context.DetalleOrdenCompras.RemoveRange(orden.DetalleOrdenCompras);
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

            // 4. Actualizar el stock de cada insumo y manejar materiales extra
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

                // 5. Si es un material extra de proyecto, actualizar el MaterialCalculado
                var detalleOrden = orden.DetalleOrdenCompras.FirstOrDefault(d => d.IdInsumo == detalle.IdInsumo);
                if (detalleOrden != null && detalleOrden.IdProyecto.HasValue && detalleOrden.IdProyectoPrenda.HasValue)
                {
                    var materialCalculado = await _context.MaterialCalculados
                        .FirstOrDefaultAsync(m => 
                            m.IdProyecto == detalleOrden.IdProyecto.Value &&
                            m.IdProyectoPrenda == detalleOrden.IdProyectoPrenda.Value &&
                            m.IdInsumo == detalle.IdInsumo &&
                            m.TipoCalculo == "Extra");

                    if (materialCalculado != null)
                    {
                        // La cantidad final se resuelve en lectura como
                        // CantidadManual ?? CantidadCalculada.
                        // Para materiales extra, la recepción fija la cantidad manual recibida.
                        materialCalculado.CantidadManual = detalle.CantidadRecibida;
                        materialCalculado.TieneStock = true;
                    }
                }

                // 6. Registrar el movimiento de inventario
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

            // 7. Actualizar el estado de la orden a "Recibida"
            orden.Estado = "Recibida";

            // 8. Guardar todos los cambios
            await _context.SaveChangesAsync();

            // 9. Retornar la orden actualizada
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
                .OrderByDescending(o => o.FechaSolicitud)
                .ToListAsync();

            var result = new List<OrdenCompraIndexDTO>();
            foreach (var o in ordenes)
                result.Add(await MapearOrdenAsync(o));
            return result;
        }

        public async Task<OrdenCompraIndexDTO?> RegistrarControlRecepcionAsync(ControlRecepcionDTO dto)
        {
            var orden = await _context.OrdenCompras
                .Include(o => o.DetalleOrdenCompras)
                .FirstOrDefaultAsync(o => o.IdOrdenCompra == dto.IdOrdenCompra);

            if (orden == null) return null;

            // Solo se puede controlar si está PendienteControl
            if (orden.Estado != "PendienteControl") return null;

            // Validar detalles — cantidad 0 es válida en recontrol (significa "no llegó nada más de este insumo")
            foreach (var detalle in dto.Detalles)
            {
                var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                if (insumo == null) return null;
                if (detalle.CantidadRecibida < 0) return null;
            }

            // Actualizar stock y registrar movimientos — solo para los que tienen cantidad > 0
            var fechaControl = DateOnly.Parse(dto.FechaControl);
            foreach (var detalle in dto.Detalles.Where(d => d.CantidadRecibida > 0))
            {
                var insumo = await _context.Insumos.FirstOrDefaultAsync(i => i.IdInsumo == detalle.IdInsumo);
                if (insumo != null)
                {
                    insumo.StockActual += detalle.CantidadRecibida;
                    insumo.FechaActualizacion = DateOnly.FromDateTime(DateTime.Now);
                    // Si el insumo estaba "A designar" (recién creado por OC), activarlo
                    if (insumo.Estado == "A designar" || insumo.Estado == "Agotado")
                        insumo.Estado = "Disponible";
                }

                _context.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    IdInsumo = detalle.IdInsumo,
                    NombreInsumo = insumo?.NombreInsumo,
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
