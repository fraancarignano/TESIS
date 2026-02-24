using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DbContextApp = TESIS_OG.Data.TamarindoDbContext;
using TESIS_OG.DTOs.Talleres;

namespace TESIS_OG.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TallerController : ControllerBase
{
    private readonly DbContextApp _context;

    public TallerController(DbContextApp context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CrearTaller([FromBody] TallerCreateDTO tallerDto)
    {
        if (!await UbicacionValidaAsync(tallerDto.IdProvincia, tallerDto.IdCiudad))
            return BadRequest(new { message = "La provincia/ciudad indicada no es valida o no corresponde entre si" });

        var nombreTaller = tallerDto.NombreTaller.Trim();
        var existeNombre = await _context.Tallers.AnyAsync(t => t.NombreTaller == nombreTaller);
        if (existeNombre)
            return BadRequest(new { message = "Ya existe un taller con ese nombre" });

        var taller = new Models.Taller
        {
            NombreTaller = nombreTaller,
            TipoTaller = LimpiarTexto(tallerDto.TipoTaller),
            Responsable = LimpiarTexto(tallerDto.Responsable),
            Telefono = LimpiarTexto(tallerDto.Telefono),
            Email = LimpiarTexto(tallerDto.Email),
            Direccion = LimpiarTexto(tallerDto.Direccion),
            IdCiudad = tallerDto.IdCiudad
        };

        _context.Tallers.Add(taller);
        await _context.SaveChangesAsync();

        var creado = await ObtenerTallerIndexPorIdAsync(taller.IdTaller);
        return CreatedAtAction(nameof(ObtenerTallerPorId), new { id = taller.IdTaller }, creado);
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTalleres()
    {
        var talleres = await _context.Tallers
            .Include(t => t.IdCiudadNavigation)
                .ThenInclude(c => c.IdProvinciaNavigation)
            .Select(t => new TallerIndexDTO
            {
                IdTaller = t.IdTaller,
                NombreTaller = t.NombreTaller,
                TipoTaller = t.TipoTaller,
                Responsable = t.Responsable,
                Telefono = t.Telefono,
                Email = t.Email,
                Direccion = t.Direccion,
                IdCiudad = t.IdCiudad,
                IdProvincia = t.IdCiudadNavigation.IdProvincia,
                NombreCiudad = t.IdCiudadNavigation.NombreCiudad,
                NombreProvincia = t.IdCiudadNavigation.IdProvinciaNavigation.NombreProvincia,
                CantidadProyectosAsignados = t.DetalleTallerProyectos.Count,
                FechaUltimaAsignacion = t.DetalleTallerProyectos
                    .OrderByDescending(d => d.FechaAsignacion)
                    .Select(d => (DateOnly?)d.FechaAsignacion)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(talleres);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerTallerPorId(int id)
    {
        var taller = await ObtenerTallerIndexPorIdAsync(id);
        if (taller == null)
            return NotFound(new { message = $"Taller con ID {id} no encontrado" });

        return Ok(taller);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarTaller(int id, [FromBody] TallerEditDTO tallerDto)
    {
        var taller = await _context.Tallers.FirstOrDefaultAsync(t => t.IdTaller == id);
        if (taller == null)
            return NotFound(new { message = $"Taller con ID {id} no encontrado" });

        if (!await UbicacionValidaAsync(tallerDto.IdProvincia, tallerDto.IdCiudad))
            return BadRequest(new { message = "La provincia/ciudad indicada no es valida o no corresponde entre si" });

        var nombreTaller = tallerDto.NombreTaller.Trim();
        var existeNombreEnOtro = await _context.Tallers.AnyAsync(t => t.IdTaller != id && t.NombreTaller == nombreTaller);
        if (existeNombreEnOtro)
            return BadRequest(new { message = "Ya existe otro taller con ese nombre" });

        taller.NombreTaller = nombreTaller;
        taller.TipoTaller = LimpiarTexto(tallerDto.TipoTaller);
        taller.Responsable = LimpiarTexto(tallerDto.Responsable);
        taller.Telefono = LimpiarTexto(tallerDto.Telefono);
        taller.Email = LimpiarTexto(tallerDto.Email);
        taller.Direccion = LimpiarTexto(tallerDto.Direccion);
        taller.IdCiudad = tallerDto.IdCiudad;

        await _context.SaveChangesAsync();

        var actualizado = await ObtenerTallerIndexPorIdAsync(id);
        return Ok(actualizado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarTaller(int id)
    {
        var taller = await _context.Tallers.FirstOrDefaultAsync(t => t.IdTaller == id);
        if (taller == null)
            return NotFound(new { message = $"Taller con ID {id} no encontrado" });

        var tieneProyectos = await _context.DetalleTallerProyectos.AnyAsync(d => d.IdTaller == id);
        if (tieneProyectos)
            return BadRequest(new { message = "No se puede eliminar el taller porque tiene proyectos asignados" });

        _context.Tallers.Remove(taller);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Taller eliminado exitosamente" });
    }

    [HttpGet("{id}/proyectos")]
    public async Task<IActionResult> ObtenerProyectosDelTaller(int id)
    {
        var existeTaller = await _context.Tallers.AnyAsync(t => t.IdTaller == id);
        if (!existeTaller)
            return NotFound(new { message = $"Taller con ID {id} no encontrado" });

        var proyectos = await _context.DetalleTallerProyectos
            .Where(d => d.IdTaller == id)
            .GroupBy(d => d.IdProyectoNavigation.IdProyecto)
            .Select(g => g
                .OrderByDescending(d => d.FechaAsignacion)
                .Select(d => new
                {
                    d.IdProyectoNavigation.IdProyecto,
                    d.IdProyectoNavigation.CodigoProyecto,
                    d.IdProyectoNavigation.NombreProyecto,
                    d.IdProyectoNavigation.Estado,
                    FechaInicio = d.IdProyectoNavigation.FechaInicio,
                    FechaFin = d.IdProyectoNavigation.FechaFin,
                    CantidadTotal = d.IdProyectoNavigation.CantidadTotal ?? 0,
                    IdCliente = d.IdProyectoNavigation.IdCliente,
                    ClienteNombre = !string.IsNullOrWhiteSpace(d.IdProyectoNavigation.IdClienteNavigation.RazonSocial)
                        ? d.IdProyectoNavigation.IdClienteNavigation.RazonSocial
                        : (d.IdProyectoNavigation.IdClienteNavigation.Nombre + " " + d.IdProyectoNavigation.IdClienteNavigation.Apellido).Trim(),
                    IdUsuarioEncargado = d.IdProyectoNavigation.IdUsuarioEncargado,
                    NombreEncargado = d.IdProyectoNavigation.IdUsuarioEncargadoNavigation != null
                        ? (d.IdProyectoNavigation.IdUsuarioEncargadoNavigation.NombreUsuario + " " + d.IdProyectoNavigation.IdUsuarioEncargadoNavigation.ApellidoUsuario).Trim()
                        : null
                })
                .FirstOrDefault())
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpPost("{idTaller}/proyectos/{idProyecto}")]
    public async Task<IActionResult> AsignarProyectoATaller(int idTaller, int idProyecto)
    {
        var tallerExiste = await _context.Tallers.AnyAsync(t => t.IdTaller == idTaller);
        if (!tallerExiste)
            return NotFound(new { message = $"Taller con ID {idTaller} no encontrado" });

        var proyectoExiste = await _context.Proyectos.AnyAsync(p => p.IdProyecto == idProyecto);
        if (!proyectoExiste)
            return NotFound(new { message = $"Proyecto con ID {idProyecto} no encontrado" });

        var asignacionesActuales = await _context.DetalleTallerProyectos
            .Where(d => d.IdProyecto == idProyecto)
            .ToListAsync();

        if (asignacionesActuales.Count > 0)
            _context.DetalleTallerProyectos.RemoveRange(asignacionesActuales);

        var nuevaAsignacion = new Models.DetalleTallerProyecto
        {
            IdTaller = idTaller,
            IdProyecto = idProyecto,
            FechaAsignacion = DateOnly.FromDateTime(DateTime.Today),
            EstadoTaller = "Asignado"
        };

        _context.DetalleTallerProyectos.Add(nuevaAsignacion);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Taller asignado al proyecto correctamente" });
    }

    private async Task<TallerIndexDTO?> ObtenerTallerIndexPorIdAsync(int id)
    {
        return await _context.Tallers
            .Include(t => t.IdCiudadNavigation)
                .ThenInclude(c => c.IdProvinciaNavigation)
            .Where(t => t.IdTaller == id)
            .Select(t => new TallerIndexDTO
            {
                IdTaller = t.IdTaller,
                NombreTaller = t.NombreTaller,
                TipoTaller = t.TipoTaller,
                Responsable = t.Responsable,
                Telefono = t.Telefono,
                Email = t.Email,
                Direccion = t.Direccion,
                IdCiudad = t.IdCiudad,
                IdProvincia = t.IdCiudadNavigation.IdProvincia,
                NombreCiudad = t.IdCiudadNavigation.NombreCiudad,
                NombreProvincia = t.IdCiudadNavigation.IdProvinciaNavigation.NombreProvincia,
                CantidadProyectosAsignados = t.DetalleTallerProyectos.Count,
                FechaUltimaAsignacion = t.DetalleTallerProyectos
                    .OrderByDescending(d => d.FechaAsignacion)
                    .Select(d => (DateOnly?)d.FechaAsignacion)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();
    }

    private async Task<bool> UbicacionValidaAsync(int? idProvincia, int idCiudad)
    {
        var ciudad = await _context.Ciudads
            .Where(c => c.IdCiudad == idCiudad)
            .Select(c => new { c.IdProvincia })
            .FirstOrDefaultAsync();

        if (ciudad == null)
            return false;

        if (!idProvincia.HasValue)
            return true;

        var provinciaExiste = await _context.Provincia.AnyAsync(p => p.IdProvincia == idProvincia.Value);
        if (!provinciaExiste)
            return false;

        return ciudad.IdProvincia == idProvincia.Value;
    }

    private static string? LimpiarTexto(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        return valor.Trim();
    }
}
