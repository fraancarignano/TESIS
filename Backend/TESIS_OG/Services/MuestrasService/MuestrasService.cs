using Microsoft.EntityFrameworkCore;
using System;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Muestras;
using TESIS_OG.Models;

namespace TESIS_OG.Services.MuestrasService
{
    public class MuestrasService : IMuestrasService
    {
        private readonly TamarindoDbContext _context;

        public MuestrasService(TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<MuestraDetalleDTO?> CrearMuestraAsync(MuestraCrearDTO dto)
        {
            await ValidarReferenciasAsync(dto);

            var muestra = new Muestra
            {
                IdCliente = dto.IdCliente,
                NombreMuestra = dto.NombreMuestra.Trim(),
                Descripcion = dto.Descripcion?.Trim(),
                Prioridad = dto.Prioridad,
                Estado = dto.Estado,
                FechaCreacion = dto.FechaCreacion,
                FechaEntrega = dto.FechaEntrega,
                IdUsuarioEncargado = dto.IdUsuarioEncargado,
                MockupUrl = dto.MockupUrl,
                BordadoRequerido = dto.BordadoRequerido,
                BordadoDescripcion = dto.BordadoDescripcion?.Trim(),
                BordadoReferencia = dto.BordadoReferencia,
                EstampadoRequerido = dto.EstampadoRequerido,
                EstampadoDescripcion = dto.EstampadoDescripcion?.Trim(),
                EstampadoReferencia = dto.EstampadoReferencia,
                OtrosDetalle = dto.OtrosDetalle?.Trim(),
                PaletaRgb = dto.PaletaRgb,
                CodigoMuestra = !string.IsNullOrWhiteSpace(dto.CodigoMuestra) 
                    ? dto.CodigoMuestra.Trim() 
                    : $"MUE-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}"
            };

            foreach (var prendaDto in dto.Prendas)
            {
                muestra.MuestraPrendas.Add(new MuestraPrenda
                {
                    IdTipoPrenda = prendaDto.IdTipoPrenda,
                    IdTipoInsumoMaterial = prendaDto.IdTipoInsumoMaterial,
                    ColorTela = prendaDto.ColorTela?.Trim(),
                    TieneBordado = prendaDto.TieneBordado,
                    TieneEstampado = prendaDto.TieneEstampado,
                    DescripcionDiseno = prendaDto.DescripcionDiseno?.Trim()
                });
            }

            // Historial de creacion
            muestra.MuestraHistorials.Add(new MuestraHistorial
            {
                Fecha = DateTime.UtcNow,
                Tipo = "Creacion",
                Comentario = "Muestra creada"
            });

            _context.Muestras.Add(muestra);
            await _context.SaveChangesAsync();

            return await ObtenerMuestraPorIdAsync(muestra.IdMuestra);
        }

        public async Task<List<MuestraDetalleDTO>> ObtenerMuestrasAsync()
        {
            var muestras = await _context.Muestras
                .Include(m => m.IdClienteNavigation)
                .Include(m => m.MuestraPrendas)
                    .ThenInclude(mp => mp.IdTipoPrendaNavigation)
                .Include(m => m.MuestraPrendas)
                    .ThenInclude(mp => mp.IdTipoInsumoMaterialNavigation)
                .AsNoTracking()
                .ToListAsync();

            return muestras.Select(MapToDetalle).ToList();
        }

        public async Task<MuestraDetalleDTO?> ObtenerMuestraPorIdAsync(int id)
        {
            var muestra = await _context.Muestras
                .Include(m => m.IdClienteNavigation)
                .Include(m => m.MuestraPrendas)
                    .ThenInclude(mp => mp.IdTipoPrendaNavigation)
                .Include(m => m.MuestraPrendas)
                    .ThenInclude(mp => mp.IdTipoInsumoMaterialNavigation)
                .Include(m => m.MuestraHistorials)
                    .ThenInclude(h => h.IdUsuarioNavigation)
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.IdMuestra == id);

            return muestra == null ? null : MapToDetalle(muestra);
        }

        public async Task<MuestraDetalleDTO?> ActualizarMuestraAsync(int id, MuestraActualizarDTO dto)
        {
            var muestra = await _context.Muestras.FirstOrDefaultAsync(m => m.IdMuestra == id);
            if (muestra == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.NombreMuestra)) muestra.NombreMuestra = dto.NombreMuestra.Trim();
            if (dto.Descripcion != null) muestra.Descripcion = dto.Descripcion.Trim();
            if (dto.Prioridad != null) muestra.Prioridad = dto.Prioridad;
            if (dto.Estado != null) muestra.Estado = dto.Estado;
            if (dto.FechaEntrega.HasValue) muestra.FechaEntrega = dto.FechaEntrega;
            if (dto.IdUsuarioEncargado.HasValue) muestra.IdUsuarioEncargado = dto.IdUsuarioEncargado;
            if (dto.MockupUrl != null) muestra.MockupUrl = dto.MockupUrl;
            if (dto.BordadoRequerido.HasValue) muestra.BordadoRequerido = dto.BordadoRequerido.Value;
            if (dto.BordadoDescripcion != null) muestra.BordadoDescripcion = dto.BordadoDescripcion.Trim();
            if (dto.BordadoReferencia != null) muestra.BordadoReferencia = dto.BordadoReferencia;
            if (dto.EstampadoRequerido.HasValue) muestra.EstampadoRequerido = dto.EstampadoRequerido.Value;
            if (dto.EstampadoDescripcion != null) muestra.EstampadoDescripcion = dto.EstampadoDescripcion.Trim();
            if (dto.EstampadoReferencia != null) muestra.EstampadoReferencia = dto.EstampadoReferencia;
            if (dto.OtrosDetalle != null) muestra.OtrosDetalle = dto.OtrosDetalle.Trim();
            if (dto.PaletaRgb != null) muestra.PaletaRgb = dto.PaletaRgb;
            if (dto.IdProyectoAsignado.HasValue) muestra.IdProyectoAsignado = dto.IdProyectoAsignado;

            if (!string.IsNullOrWhiteSpace(dto.ComentarioActualizacion))
            {
                _context.MuestraHistorials.Add(new MuestraHistorial
                {
                    IdMuestra = muestra.IdMuestra,
                    Fecha = DateTime.UtcNow,
                    Tipo = "Actualizacion",
                    Comentario = dto.ComentarioActualizacion.Trim()
                });
            }

            await _context.SaveChangesAsync();
            return await ObtenerMuestraPorIdAsync(id);
        }

        public async Task<bool> AsignarMuestraAProyectoAsync(int idMuestra, int idProyecto)
        {
            var muestra = await _context.Muestras.FirstOrDefaultAsync(m => m.IdMuestra == idMuestra);
            if (muestra == null) return false;

            muestra.IdProyectoAsignado = idProyecto;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AceptarMuestraAsync(int idMuestra, string? comentario)
        {
            var muestra = await _context.Muestras.FirstOrDefaultAsync(m => m.IdMuestra == idMuestra);
            if (muestra == null) return false;

            muestra.Estado = "Aprobada";

            _context.MuestraHistorials.Add(new MuestraHistorial
            {
                IdMuestra = muestra.IdMuestra,
                Fecha = DateTime.UtcNow,
                Tipo = "Aprobacion",
                Comentario = !string.IsNullOrWhiteSpace(comentario) ? comentario.Trim() : "Muestra aprobada"
            });

            await _context.SaveChangesAsync();

            // Sincronizar automaticamente con diseno si hay proyecto asignado
            if (muestra.IdProyectoAsignado.HasValue)
            {
                try { await SincronizarMuestraConDisenoAsync(idMuestra); }
                catch { /* No bloquear la aprobacion */ }
            }

            return true;
        }

        public async Task<bool> RechazarMuestraAsync(int idMuestra, string comentario)
        {
            var muestra = await _context.Muestras.FirstOrDefaultAsync(m => m.IdMuestra == idMuestra);
            if (muestra == null) return false;

            muestra.Estado = "Rechazada";

            _context.MuestraHistorials.Add(new MuestraHistorial
            {
                IdMuestra = muestra.IdMuestra,
                Fecha = DateTime.UtcNow,
                Tipo = "Rechazo",
                Comentario = comentario.Trim()
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool ok, string mensaje)> SincronizarMuestraConDisenoAsync(int idMuestra)
        {
            var muestra = await _context.Muestras
                .Include(m => m.MuestraPrendas)
                .FirstOrDefaultAsync(m => m.IdMuestra == idMuestra);

            if (muestra == null)
                return (false, "Muestra no encontrada");

            if (!muestra.IdProyectoAsignado.HasValue)
                return (false, "La muestra no tiene un proyecto asignado");

            var idProyecto = muestra.IdProyectoAsignado.Value;

            var prendasProyecto = await _context.ProyectoPrenda
                .Where(p => p.IdProyecto == idProyecto)
                .ToListAsync();

            if (!prendasProyecto.Any())
                return (false, "El proyecto no tiene prendas registradas");

            var disenosExistentes = await _context.ProyectoDisenos
                .Where(d => d.IdProyecto == idProyecto)
                .ToListAsync();

            int sincronizados = 0;

            foreach (var prendaProyecto in prendasProyecto)
            {
                var prendaMuestra = muestra.MuestraPrendas
                    .FirstOrDefault(pm => pm.IdTipoPrenda == prendaProyecto.IdTipoPrenda);

                var disenoExistente = disenosExistentes
                    .FirstOrDefault(d => d.IdPrenda == prendaProyecto.IdProyectoPrenda);

                var mockupUrl = muestra.MockupUrl;
                var descripcionMockup = !string.IsNullOrWhiteSpace(muestra.OtrosDetalle) ? muestra.OtrosDetalle : null;

                string? imagenLogo = null;
                string? descripcionLogo = null;
                if (prendaMuestra?.TieneBordado == true)
                {
                    imagenLogo = !string.IsNullOrWhiteSpace(muestra.BordadoReferencia) ? muestra.BordadoReferencia : null;
                    descripcionLogo = !string.IsNullOrWhiteSpace(muestra.BordadoDescripcion) ? muestra.BordadoDescripcion : null;
                }

                // Actualizar flags en prenda del proyecto
                if (prendaMuestra != null)
                {
                    prendaProyecto.TieneBordado = prendaMuestra.TieneBordado;
                    prendaProyecto.TieneEstampado = prendaMuestra.TieneEstampado;
                    if (!string.IsNullOrWhiteSpace(prendaMuestra.DescripcionDiseno))
                        prendaProyecto.DescripcionDiseno = prendaMuestra.DescripcionDiseno;
                }

                if (disenoExistente != null)
                {
                    if (!string.IsNullOrWhiteSpace(mockupUrl)) disenoExistente.ImagenMockup = mockupUrl;
                    if (!string.IsNullOrWhiteSpace(descripcionMockup)) disenoExistente.DescripcionMockup = descripcionMockup;
                    if (!string.IsNullOrWhiteSpace(imagenLogo)) disenoExistente.ImagenLogo = imagenLogo;
                    if (!string.IsNullOrWhiteSpace(descripcionLogo)) disenoExistente.DescripcionLogo = descripcionLogo;
                    disenoExistente.FechaModificacion = DateTime.UtcNow;
                }
                else
                {
                    _context.ProyectoDisenos.Add(new ProyectoDiseno
                    {
                        IdProyecto = idProyecto,
                        IdPrenda = prendaProyecto.IdProyectoPrenda,
                        ImagenMockup = mockupUrl,
                        DescripcionMockup = descripcionMockup,
                        ImagenLogo = imagenLogo,
                        DescripcionLogo = descripcionLogo,
                        FechaCreacion = DateTime.UtcNow
                    });
                }

                sincronizados++;
            }

            _context.MuestraHistorials.Add(new MuestraHistorial
            {
                IdMuestra = idMuestra,
                Fecha = DateTime.UtcNow,
                Tipo = "SincDiseno",
                Comentario = $"Datos sincronizados con diseno del proyecto #{idProyecto} ({sincronizados} prendas)"
            });

            await _context.SaveChangesAsync();
            return (true, $"Diseno sincronizado correctamente ({sincronizados} prendas actualizadas)");
        }

        private static MuestraDetalleDTO MapToDetalle(Muestra muestra)
        {
            return new MuestraDetalleDTO
            {
                IdMuestra = muestra.IdMuestra,
                IdCliente = muestra.IdCliente,
                NombreCliente = muestra.IdClienteNavigation?.RazonSocial
                    ?? $"{muestra.IdClienteNavigation?.Nombre} {muestra.IdClienteNavigation?.Apellido}".Trim(),
                NombreMuestra = muestra.NombreMuestra,
                Descripcion = muestra.Descripcion,
                Prioridad = muestra.Prioridad,
                Estado = muestra.Estado,
                FechaCreacion = muestra.FechaCreacion,
                FechaEntrega = muestra.FechaEntrega,
                IdUsuarioEncargado = muestra.IdUsuarioEncargado,
                CodigoMuestra = muestra.CodigoMuestra,
                IdProyectoAsignado = muestra.IdProyectoAsignado,
                MockupUrl = muestra.MockupUrl,
                BordadoRequerido = muestra.BordadoRequerido,
                BordadoDescripcion = muestra.BordadoDescripcion,
                BordadoReferencia = muestra.BordadoReferencia,
                EstampadoRequerido = muestra.EstampadoRequerido,
                EstampadoDescripcion = muestra.EstampadoDescripcion,
                EstampadoReferencia = muestra.EstampadoReferencia,
                OtrosDetalle = muestra.OtrosDetalle,
                PaletaRgb = muestra.PaletaRgb,
                Prendas = muestra.MuestraPrendas.Select(p => new MuestraPrendaDTO
                {
                    IdMuestraPrenda = p.IdMuestraPrenda,
                    IdTipoPrenda = p.IdTipoPrenda,
                    NombrePrenda = p.IdTipoPrendaNavigation?.NombrePrenda,
                    IdTipoInsumoMaterial = p.IdTipoInsumoMaterial,
                    NombreMaterial = p.IdTipoInsumoMaterialNavigation?.NombreTipo,
                    ColorTela = p.ColorTela,
                    TieneBordado = p.TieneBordado,
                    TieneEstampado = p.TieneEstampado,
                    DescripcionDiseno = p.DescripcionDiseno
                }).ToList(),
                Historial = muestra.MuestraHistorials
                    .OrderByDescending(h => h.Fecha)
                    .Select(h => new MuestraHistorialDTO
                    {
                        IdHistorial = h.IdMuestraHistorial,
                        Fecha = h.Fecha,
                        Tipo = h.Tipo,
                        Comentario = h.Comentario,
                        IdUsuario = h.IdUsuario,
                        NombreUsuario = h.IdUsuarioNavigation != null
                            ? $"{h.IdUsuarioNavigation.NombreUsuario} {h.IdUsuarioNavigation.ApellidoUsuario}".Trim()
                            : null
                    }).ToList()
            };
        }

        private async Task ValidarReferenciasAsync(MuestraCrearDTO dto)
        {
            var clienteExiste = await _context.Clientes.AnyAsync(c => c.IdCliente == dto.IdCliente);
            if (!clienteExiste)
                throw new ArgumentException($"El cliente con ID {dto.IdCliente} no existe");

            if (dto.IdUsuarioEncargado.HasValue)
            {
                var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == dto.IdUsuarioEncargado.Value);
                if (!usuarioExiste)
                    throw new ArgumentException($"El usuario con ID {dto.IdUsuarioEncargado.Value} no existe");
            }

            var tipoPrendaIds = dto.Prendas.Select(p => p.IdTipoPrenda).Distinct().ToList();
            if (tipoPrendaIds.Count > 0)
            {
                var existentes = await _context.TipoPrenda
                    .Where(t => tipoPrendaIds.Contains(t.IdTipoPrenda))
                    .Select(t => t.IdTipoPrenda)
                    .ToListAsync();
                var faltantes = tipoPrendaIds.Except(existentes).ToList();
                if (faltantes.Count > 0)
                    throw new ArgumentException($"Tipo de prenda inexistente: {string.Join(", ", faltantes)}");
            }

            var tipoInsumoIds = dto.Prendas.Select(p => p.IdTipoInsumoMaterial).Distinct().ToList();
            if (tipoInsumoIds.Count > 0)
            {
                var existentes = await _context.TipoInsumos
                    .Where(i => tipoInsumoIds.Contains(i.IdTipoInsumo))
                    .Select(i => i.IdTipoInsumo)
                    .ToListAsync();
                var faltantes = tipoInsumoIds.Except(existentes).ToList();
                if (faltantes.Count > 0)
                    throw new ArgumentException($"Tipo de material inexistente: {string.Join(", ", faltantes)}");
            }
        }
    }
}
