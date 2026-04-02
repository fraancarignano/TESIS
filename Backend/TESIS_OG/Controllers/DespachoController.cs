using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Despachos;
using TESIS_OG.Models;
using TESIS_OG.Security;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace TESIS_OG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DespachoController : ControllerBase
    {
        private readonly TamarindoDbContext _context;

        public DespachoController(TamarindoDbContext context)
        {
            _context = context;
        }

        // GET: api/Despacho
        [HttpGet]
        [RequiresPermission("Despachos", "Ver")]
        public async Task<ActionResult<IEnumerable<DespachoDTO>>> GetDespachos()
        {
            var despachos = await _context.Despachos
                .Include(d => d.IdProyectoNavigation)
                    .ThenInclude(p => p.IdClienteNavigation)
                .Include(d => d.IdUbicacionNavigation)
                .OrderByDescending(d => d.FechaCreacion)
                .ToListAsync();

            return Ok(despachos.Select(d => new DespachoDTO
            {
                IdDespacho = d.IdDespacho,
                IdProyecto = d.IdProyecto,
                NombreProyecto = d.IdProyectoNavigation.NombreProyecto,
                Cliente = d.IdProyectoNavigation.IdClienteNavigation.RazonSocial ?? d.IdProyectoNavigation.IdClienteNavigation.Nombre,
                CodigoDespacho = d.CodigoDespacho,
                IdUbicacion = d.IdUbicacion,
                CodigoUbicacion = d.IdUbicacionNavigation?.Codigo,
                Estado = d.Estado,
                Observaciones = d.Observaciones,
                FechaCreacion = d.FechaCreacion,
                FechaDespacho = d.FechaDespacho
            }));
        }

        // GET: api/Despacho/5
        [HttpGet("{id}")]
        [RequiresPermission("Despachos", "Ver")]
        public async Task<ActionResult<DespachoDTO>> GetDespacho(int id)
        {
            var d = await _context.Despachos
                .Include(d => d.IdProyectoNavigation)
                    .ThenInclude(p => p.IdClienteNavigation)
                .Include(d => d.IdUbicacionNavigation)
                .FirstOrDefaultAsync(x => x.IdDespacho == id);

            if (d == null) return NotFound();

            return new DespachoDTO
            {
                IdDespacho = d.IdDespacho,
                IdProyecto = d.IdProyecto,
                NombreProyecto = d.IdProyectoNavigation.NombreProyecto,
                Cliente = d.IdProyectoNavigation.IdClienteNavigation.RazonSocial ?? d.IdProyectoNavigation.IdClienteNavigation.Nombre,
                CodigoDespacho = d.CodigoDespacho,
                IdUbicacion = d.IdUbicacion,
                CodigoUbicacion = d.IdUbicacionNavigation?.Codigo,
                Estado = d.Estado,
                Observaciones = d.Observaciones,
                FechaCreacion = d.FechaCreacion,
                FechaDespacho = d.FechaDespacho
            };
        }

        // GET: api/Despacho/codigo/DSP-1234
        [HttpGet("codigo/{codigo}")]
        // Public / Read-Only endpoint for QR
        public async Task<ActionResult<object>> GetDespachoByCodigo(string codigo)
        {
            var d = await _context.Despachos
                .Include(d => d.IdProyectoNavigation)
                    .ThenInclude(p => p.IdClienteNavigation)
                .Include(d => d.IdProyectoNavigation)
                    .ThenInclude(p => p.ProyectoPrenda)
                        .ThenInclude(pp => pp.IdTipoPrendaNavigation)
                .Include(d => d.IdUbicacionNavigation)
                .FirstOrDefaultAsync(x => x.CodigoDespacho == codigo);

            if (d == null) return NotFound(new { message = "Despacho no encontrado." });

            var prendas = d.IdProyectoNavigation.ProyectoPrenda.Select(pp => new {
                Tipo = pp.IdTipoPrendaNavigation?.NombrePrenda,
                Cantidad = pp.CantidadTotal
            }).ToList();

            return Ok(new
            {
                d.IdDespacho,
                d.CodigoDespacho,
                d.Estado,
                d.Observaciones,
                d.FechaCreacion,
                Ubicacion = d.IdUbicacionNavigation?.Codigo,
                Proyecto = new {
                    d.IdProyectoNavigation.IdProyecto,
                    d.IdProyectoNavigation.NombreProyecto,
                    d.IdProyectoNavigation.CodigoProyecto,
                    d.IdProyectoNavigation.CantidadTotal
                },
                Cliente = new {
                    Nombre = d.IdProyectoNavigation.IdClienteNavigation.RazonSocial ?? d.IdProyectoNavigation.IdClienteNavigation.Nombre,
                    Email = d.IdProyectoNavigation.IdClienteNavigation.Email,
                    Telefono = d.IdProyectoNavigation.IdClienteNavigation.Telefono
                },
                Prendas = prendas
            });
        }

        // POST: api/Despacho
        [HttpPost]
        [RequiresPermission("Proyectos", "CompletarArea")] 
        public async Task<ActionResult<DespachoDTO>> CreateDespacho(CreateDespachoDTO createDto)
        {
            var proyecto = await _context.Proyectos.FindAsync(createDto.IdProyecto);
            if (proyecto == null) return NotFound("Proyecto no encontrado");

            // Avoid duplicates
            var existing = await _context.Despachos.AnyAsync(d => d.IdProyecto == createDto.IdProyecto);
            if (existing) return BadRequest("El proyecto ya tiene un despacho generado.");

            var uniqueId = Guid.NewGuid().ToString().Substring(0, 4).ToUpper();
            var randomCode = $"DSP-{proyecto.IdProyecto}-{uniqueId}";

            var despacho = new Despacho
            {
                IdProyecto = createDto.IdProyecto,
                CodigoDespacho = randomCode,
                Estado = "Listo para Despacho",
                FechaCreacion = DateTime.Now,
                Observaciones = createDto.Observaciones
            };

            _context.Despachos.Add(despacho);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDespacho), new { id = despacho.IdDespacho }, new { Codigo = randomCode });
        }

        // PUT: api/Despacho/5/ubicacion
        [HttpPut("{id}/ubicacion")]
        [RequiresPermission("Despachos", "Gestionar")]
        public async Task<IActionResult> UpdateUbicacion(int id, AsignarUbicacionDTO dto)
        {
            var despacho = await _context.Despachos.FindAsync(id);
            if (despacho == null) return NotFound();

            var ubi = await _context.Ubicacions.FindAsync(dto.IdUbicacion);
            if (ubi == null) return BadRequest("Ubicación no válida.");

            despacho.IdUbicacion = dto.IdUbicacion;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Despacho/5/despachar
        [HttpPut("{id}/despachar")]
        [RequiresPermission("Despachos", "Gestionar")]
        public async Task<IActionResult> MarcarDespachado(int id)
        {
            var despacho = await _context.Despachos
                .Include(d => d.IdProyectoNavigation)
                .FirstOrDefaultAsync(d => d.IdDespacho == id);

            if (despacho == null) return NotFound();

            despacho.Estado = "Despachado";
            despacho.FechaDespacho = DateTime.Now;

            if (despacho.IdProyectoNavigation != null)
            {
                despacho.IdProyectoNavigation.Estado = "Despachado";
                // Optionally log an observation or history
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
