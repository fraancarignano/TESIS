using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Models;
using TESIS_OG.Data;

namespace TESIS_OG.Services.ProyectoAuditoriaService
{
    public class ProyectoAuditoriaService : IProyectoAuditoriaService
    {
        private readonly Data.TamarindoDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ProyectoAuditoriaService(
            Data.TamarindoDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task RegistrarCambio(ProyectoAuditoriaDTO auditoria)
        {
            var registro = new ProyectoAuditoria
            {
                IdProyecto = auditoria.IdProyecto,
                IdUsuario = auditoria.IdUsuario,
                FechaHoraCambio = DateTime.Now,
                TipoOperacion = auditoria.TipoOperacion,
                EstadoAnterior = auditoria.EstadoAnterior,
                EstadoNuevo = auditoria.EstadoNuevo,
                CampoModificado = auditoria.CampoModificado,
                ValorAnterior = auditoria.ValorAnterior,
                ValorNuevo = auditoria.ValorNuevo,
                Descripcion = auditoria.Descripcion,
                DireccionIP = auditoria.DireccionIP ?? ObtenerIPCliente()
            };

            _context.ProyectoAuditorias.Add(registro);
            await _context.SaveChangesAsync();
        }

        public async Task RegistrarCambioPropiedad(
            int idProyecto,
            int? idUsuario,
            string campo,
            string valorAnterior,
            string valorNuevo,
            string? descripcion = null)
        {
            if (valorAnterior == valorNuevo)
                return;

            var auditoria = new ProyectoAuditoriaDTO
            {
                IdProyecto = idProyecto,
                IdUsuario = idUsuario,
                TipoOperacion = "UPDATE",
                CampoModificado = campo,
                ValorAnterior = valorAnterior,
                ValorNuevo = valorNuevo,
                Descripcion = descripcion ?? $"Campo '{campo}' actualizado",
                DireccionIP = ObtenerIPCliente()
            };

            await RegistrarCambio(auditoria);
        }

        public async Task RegistrarCambioEstado(
            int idProyecto,
            int? idUsuario,
            string estadoAnterior,
            string estadoNuevo)
        {
            var descripcion = $"Estado cambiado de '{estadoAnterior}' a '{estadoNuevo}'";

            if (estadoNuevo == "En Proceso")
                descripcion = "Proyecto iniciado en producción";
            else if (estadoNuevo == "Finalizado")
                descripcion = "Proyecto marcado como finalizado";
            else if (estadoNuevo == "Archivado")
                descripcion = "Proyecto archivado";

            var auditoria = new ProyectoAuditoriaDTO
            {
                IdProyecto = idProyecto,
                IdUsuario = idUsuario,
                TipoOperacion = "CHANGE_STATUS",
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = estadoNuevo,
                CampoModificado = "Estado",
                ValorAnterior = estadoAnterior,
                ValorNuevo = estadoNuevo,
                Descripcion = descripcion,
                DireccionIP = ObtenerIPCliente()
            };

            await RegistrarCambio(auditoria);
        }

        public async Task<List<ProyectoHistorialCambioDTO>> ObtenerHistorial(ProyectoHistorialRequestDTO request)
        {
            var query = _context.ProyectoAuditorias
                .Include(a => a.Proyecto)
                .Include(a => a.Usuario)
                .AsQueryable();

            if (request.IdProyecto.HasValue)
                query = query.Where(a => a.IdProyecto == request.IdProyecto.Value);

            if (request.IdUsuario.HasValue)
                query = query.Where(a => a.IdUsuario == request.IdUsuario.Value);

            if (request.FechaDesde.HasValue)
                query = query.Where(a => a.FechaHoraCambio >= request.FechaDesde.Value);

            if (request.FechaHasta.HasValue)
                query = query.Where(a => a.FechaHoraCambio <= request.FechaHasta.Value);

            if (!string.IsNullOrEmpty(request.TipoOperacion))
                query = query.Where(a => a.TipoOperacion == request.TipoOperacion);

            query = query.OrderByDescending(a => a.FechaHoraCambio);

            var skip = (request.Pagina - 1) * request.TamanoPagina;
            query = query.Skip(skip).Take(request.TamanoPagina);

            var resultado = await query.Select(a => new ProyectoHistorialCambioDTO
            {
                IdAuditoria = a.IdAuditoria,
                IdProyecto = a.IdProyecto,
                CodigoProyecto = a.Proyecto.CodigoProyecto,
                NombreProyecto = a.Proyecto.NombreProyecto,
                IdUsuario = a.IdUsuario,
                UsuarioModificador = a.Usuario != null
                    ? $"{a.Usuario.NombreUsuario} {a.Usuario.ApellidoUsuario}"
                    : "Sistema",
                FechaHoraCambio = a.FechaHoraCambio,
                TipoOperacion = a.TipoOperacion,
                EstadoAnterior = a.EstadoAnterior,
                EstadoNuevo = a.EstadoNuevo,
                CampoModificado = a.CampoModificado,
                ValorAnterior = a.ValorAnterior,
                ValorNuevo = a.ValorNuevo,
                Descripcion = a.Descripcion,
                DireccionIP = a.DireccionIP
            }).ToListAsync();

            return resultado;
        }

        public string ObtenerIPCliente()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null)
                    return "No disponible";

                var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
                if (!string.IsNullOrEmpty(forwardedFor))
                    return forwardedFor.Split(',')[0].Trim();

                return context.Connection.RemoteIpAddress?.ToString() ?? "No disponible";
            }
            catch
            {
                return "No disponible";
            }
        }
    }
}