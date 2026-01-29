// Services/ProyectoService/ProyectoService.cs
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Models;
using TESIS_OG.Services.ProyectosService;

namespace TESIS_OG.Services.ProyectoService
{
  public class ProyectoService : IProyectosService
  {
    private readonly Data.TamarindoDbContext _context;

    public ProyectoService(Data.TamarindoDbContext context)
    {
      _context = context;
    }

    public async Task<ProyectoResponseDTO?> CrearProyectoAsync(ProyectoCrearDTO proyectoDto)
    {
      try
      {
        // Generar código de proyecto
        var ultimoProyecto = await _context.Proyectos
            .OrderByDescending(p => p.IdProyecto)
            .FirstOrDefaultAsync();

        var numeroProyecto = (ultimoProyecto?.IdProyecto ?? 0) + 1;
        var codigoProyecto = $"P-{DateTime.Now.Year}-{numeroProyecto:D3}";

        // Crear proyecto
        var proyecto = new Proyecto
        {
          IdCliente = proyectoDto.IdCliente,
          NombreProyecto = proyectoDto.NombreProyecto,
          TipoPrenda = proyectoDto.TipoPrenda,
          Descripcion = proyectoDto.Descripcion,
          Prioridad = proyectoDto.Prioridad,
          Estado = proyectoDto.Estado,
          FechaInicio = proyectoDto.FechaInicio,
          FechaFin = proyectoDto.FechaFin,
          CantidadTotal = proyectoDto.CantidadTotal,
          CantidadProducida = 0,
          IdUsuarioEncargado = proyectoDto.IdUsuarioEncargado,
          TipoEstacion = proyectoDto.TipoEstacion,
          CodigoProyecto = codigoProyecto,
          AreaActual = "Gerencia y Administración",
          AvanceGerenciaAdmin = 0,
          AvanceDiseñoDesarrollo = 0,
          AvanceControlCalidad = 0,
          AvanceEtiquetadoEmpaquetado = 0,
          AvanceDepositoLogistica = 0,
          ScrapTotal = 0,
          ScrapPorcentaje = 0
        };

        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync();

        // Agregar materiales si existen
        if (proyectoDto.Materiales != null && proyectoDto.Materiales.Any())
        {
          decimal costoTotal = 0;
          foreach (var material in proyectoDto.Materiales)
          {
            var insumo = await _context.Insumos.FindAsync(material.IdInsumo);
            if (insumo != null)
            {
              var detalleMaterial = new DetalleMaterialProyecto
              {
                IdProyecto = proyecto.IdProyecto,
                IdInsumo = material.IdInsumo,
                IdUnidad = material.IdUnidad,
                CantidadAsignada = material.CantidadAsignada,
                CantidadUtilizada = 0,
                DesperdicioEstimado = material.DesperdicioEstimado
              };

              _context.DetalleMaterialProyectos.Add(detalleMaterial);

              // Calcular costo estimado (necesitarías el precio del insumo)
              // costoTotal += material.CantidadAsignada * precioUnitario;
            }
          }

          proyecto.CostoMaterialEstimado = costoTotal;
          await _context.SaveChangesAsync();
        }

        return await ObtenerProyectoPorIdAsync(proyecto.IdProyecto);
      }
      catch
      {
        return null;
      }
    }

    public async Task<List<ProyectoResponseDTO>> ObtenerTodosLosProyectosAsync()
    {
      var proyectos = await _context.Proyectos
          .Include(p => p.IdClienteNavigation)
          .Include(p => p.IdUsuarioEncargadoNavigation)
          .Include(p => p.DetalleMaterialProyectos)
              .ThenInclude(dm => dm.IdInsumoNavigation)
          .Include(p => p.ObservacionProyectos)
              .ThenInclude(o => o.IdUsuarioNavigation)
          .ToListAsync();

      return proyectos.Select(p => MapearADTO(p)).ToList();
    }

    public async Task<ProyectoResponseDTO?> ObtenerProyectoPorIdAsync(int id)
    {
      var proyecto = await _context.Proyectos
          .Include(p => p.IdClienteNavigation)
          .Include(p => p.IdUsuarioEncargadoNavigation)
          .Include(p => p.DetalleMaterialProyectos)
              .ThenInclude(dm => dm.IdInsumoNavigation)
          .Include(p => p.DetalleMaterialProyectos)
              .ThenInclude(dm => dm.IdUnidadNavigation)
          .Include(p => p.ObservacionProyectos)
              .ThenInclude(o => o.IdUsuarioNavigation)
          .FirstOrDefaultAsync(p => p.IdProyecto == id);

      return proyecto == null ? null : MapearADTO(proyecto);
    }

    public async Task<ProyectoResponseDTO?> ActualizarProyectoAsync(int id, ProyectoEditarDTO proyectoDto)
    {
      var proyecto = await _context.Proyectos.FindAsync(id);
      if (proyecto == null) return null;

      // Actualizar solo los campos que vienen en el DTO
      if (proyectoDto.NombreProyecto != null)
        proyecto.NombreProyecto = proyectoDto.NombreProyecto;
      if (proyectoDto.TipoPrenda != null)
        proyecto.TipoPrenda = proyectoDto.TipoPrenda;
      if (proyectoDto.Descripcion != null)
        proyecto.Descripcion = proyectoDto.Descripcion;
      if (proyectoDto.Prioridad != null)
        proyecto.Prioridad = proyectoDto.Prioridad;
      if (proyectoDto.Estado != null)
        proyecto.Estado = proyectoDto.Estado;
      if (proyectoDto.FechaInicio != null)
        proyecto.FechaInicio = proyectoDto.FechaInicio.Value;
      if (proyectoDto.FechaFin != null)
        proyecto.FechaFin = proyectoDto.FechaFin;
      if (proyectoDto.CantidadTotal != null)
        proyecto.CantidadTotal = proyectoDto.CantidadTotal;
      if (proyectoDto.CantidadProducida != null)
        proyecto.CantidadProducida = proyectoDto.CantidadProducida;
      if (proyectoDto.IdUsuarioEncargado != null)
        proyecto.IdUsuarioEncargado = proyectoDto.IdUsuarioEncargado;
      if (proyectoDto.TipoEstacion != null)
        proyecto.TipoEstacion = proyectoDto.TipoEstacion;
      if (proyectoDto.AreaActual != null)
        proyecto.AreaActual = proyectoDto.AreaActual;

      // Actualizar avances si vienen
      if (proyectoDto.AvanceGerenciaAdmin != null)
        proyecto.AvanceGerenciaAdmin = proyectoDto.AvanceGerenciaAdmin;
      if (proyectoDto.AvanceDiseñoDesarrollo != null)
        proyecto.AvanceDiseñoDesarrollo = proyectoDto.AvanceDiseñoDesarrollo;
      if (proyectoDto.AvanceControlCalidad != null)
        proyecto.AvanceControlCalidad = proyectoDto.AvanceControlCalidad;
      if (proyectoDto.AvanceEtiquetadoEmpaquetado != null)
        proyecto.AvanceEtiquetadoEmpaquetado = proyectoDto.AvanceEtiquetadoEmpaquetado;
      if (proyectoDto.AvanceDepositoLogistica != null)
        proyecto.AvanceDepositoLogistica = proyectoDto.AvanceDepositoLogistica;

      await _context.SaveChangesAsync();
      return await ObtenerProyectoPorIdAsync(id);
    }

    public async Task<bool> EliminarProyectoAsync(int id)
    {
      var proyecto = await _context.Proyectos.FindAsync(id);
      if (proyecto == null) return false;

      // Archivar en lugar de eliminar
      proyecto.Estado = "archivado";
      await _context.SaveChangesAsync();
      return true;
    }

    public async Task<List<ProyectoResponseDTO>> BuscarProyectosAsync(ProyectoSearchDTO filtros)
    {
      var query = _context.Proyectos
          .Include(p => p.IdClienteNavigation)
          .Include(p => p.IdUsuarioEncargadoNavigation)
          .AsQueryable();

      if (!string.IsNullOrEmpty(filtros.NombreProyecto))
        query = query.Where(p => p.NombreProyecto.Contains(filtros.NombreProyecto));

      if (filtros.IdCliente != null)
        query = query.Where(p => p.IdCliente == filtros.IdCliente);

      if (!string.IsNullOrEmpty(filtros.Estado))
        query = query.Where(p => p.Estado == filtros.Estado);

      if (!string.IsNullOrEmpty(filtros.Prioridad))
        query = query.Where(p => p.Prioridad == filtros.Prioridad);

      if (filtros.FechaDesde != null)
        query = query.Where(p => p.FechaInicio >= filtros.FechaDesde);

      if (filtros.FechaHasta != null)
        query = query.Where(p => p.FechaInicio <= filtros.FechaHasta);

      if (!string.IsNullOrEmpty(filtros.TipoPrenda))
        query = query.Where(p => p.TipoPrenda != null && p.TipoPrenda.Contains(filtros.TipoPrenda));

      var proyectos = await query.ToListAsync();
      return proyectos.Select(p => MapearADTO(p)).ToList();
    }

    public async Task<List<ProyectoResponseDTO>> ObtenerProyectosPorEstadoAsync(string estado)
    {
      var proyectos = await _context.Proyectos
          .Include(p => p.IdClienteNavigation)
          .Include(p => p.IdUsuarioEncargadoNavigation)
          .Where(p => p.Estado == estado)
          .ToListAsync();

      return proyectos.Select(p => MapearADTO(p)).ToList();
    }

    public async Task<bool> AgregarMaterialesAsync(int idProyecto, List<MaterialAsignadoDTO> materiales)
    {
      try
      {
        foreach (var material in materiales)
        {
          var detalleMaterial = new DetalleMaterialProyecto
          {
            IdProyecto = idProyecto,
            IdInsumo = material.IdInsumo,
            IdUnidad = material.IdUnidad,
            CantidadAsignada = material.CantidadAsignada,
            CantidadUtilizada = 0,
            DesperdicioEstimado = material.DesperdicioEstimado
          };

          _context.DetalleMaterialProyectos.Add(detalleMaterial);
        }

        await _context.SaveChangesAsync();
        return true;
      }
      catch
      {
        return false;
      }
    }

    public async Task<bool> ActualizarAvanceAsync(int idProyecto, ActualizarAvanceDTO avanceDto)
    {
      var proyecto = await _context.Proyectos.FindAsync(idProyecto);
      if (proyecto == null) return false;

      // Actualizar el avance según el área
      switch (avanceDto.Area.ToLower())
      {
        case "gerenciaadmin":
          proyecto.AvanceGerenciaAdmin = avanceDto.Porcentaje;
          break;
        case "diseñodesarrollo":
          proyecto.AvanceDiseñoDesarrollo = avanceDto.Porcentaje;
          break;
        case "controlcalidad":
          proyecto.AvanceControlCalidad = avanceDto.Porcentaje;
          break;
        case "etiquetadoempaquetado":
          proyecto.AvanceEtiquetadoEmpaquetado = avanceDto.Porcentaje;
          break;
        case "depositologistica":
          proyecto.AvanceDepositoLogistica = avanceDto.Porcentaje;
          break;
        default:
          return false;
      }

      // Guardar en historial si existe la tabla AvanceAreaProyecto
      // TODO: Implementar cuando se necesite el historial

      await _context.SaveChangesAsync();
      return true;
    }

    public async Task<bool> RegistrarScrapAsync(int idProyecto, RegistrarScrapDTO scrapDto)
    {
      try
      {
        var scrap = new Scrap
        {
          IdProyecto = idProyecto,
          IdInsumo = scrapDto.IdInsumo,
          CantidadScrap = scrapDto.CantidadScrap,
          Motivo = scrapDto.Motivo,
          Destino = scrapDto.Destino,
          FechaRegistro = DateTime.Now
        };

        _context.Scraps.Add(scrap);

        // Actualizar totales del proyecto
        var proyecto = await _context.Proyectos.FindAsync(idProyecto);
        if (proyecto != null)
        {
          proyecto.ScrapTotal = (proyecto.ScrapTotal ?? 0) + (scrapDto.CostoScrap ?? 0);

          // Calcular porcentaje
          if (proyecto.CostoMaterialEstimado > 0)
          {
            proyecto.ScrapPorcentaje = (proyecto.ScrapTotal / proyecto.CostoMaterialEstimado) * 100;
          }
        }

        await _context.SaveChangesAsync();
        return true;
      }
      catch
      {
        return false;
      }
    }

    public async Task<bool> AgregarObservacionAsync(int idProyecto, AgregarObservacionDTO observacionDto)
    {
      try
      {
        var observacion = new ObservacionProyecto
        {
          IdProyecto = idProyecto,
          IdUsuario = observacionDto.IdUsuario,
          Fecha = DateTime.Now,
          Descripcion = observacionDto.Descripcion
        };

        _context.ObservacionProyectos.Add(observacion);
        await _context.SaveChangesAsync();
        return true;
      }
      catch
      {
        return false;
      }
    }

    public async Task<bool> CambiarEstadoAsync(int idProyecto, string nuevoEstado)
    {
      var proyecto = await _context.Proyectos.FindAsync(idProyecto);
      if (proyecto == null) return false;

      proyecto.Estado = nuevoEstado;
      await _context.SaveChangesAsync();
      return true;
    }

    // Método privado para mapear entidad a DTO
    private ProyectoResponseDTO MapearADTO(Proyecto proyecto)
    {
      return new ProyectoResponseDTO
      {
        IdProyecto = proyecto.IdProyecto,
        IdCliente = proyecto.IdCliente,
        ClienteNombre = proyecto.IdClienteNavigation?.Nombre ?? proyecto.IdClienteNavigation?.RazonSocial,
        NombreProyecto = proyecto.NombreProyecto,
        TipoPrenda = proyecto.TipoPrenda,
        Descripcion = proyecto.Descripcion,
        Prioridad = proyecto.Prioridad,
        Estado = proyecto.Estado,
        FechaInicio = proyecto.FechaInicio,
        FechaFin = proyecto.FechaFin,
        CantidadTotal = proyecto.CantidadTotal,
        CantidadProducida = proyecto.CantidadProducida,
        IdUsuarioEncargado = proyecto.IdUsuarioEncargado,
        NombreEncargado = proyecto.IdUsuarioEncargadoNavigation != null
              ? $"{proyecto.IdUsuarioEncargadoNavigation.NombreUsuario} {proyecto.IdUsuarioEncargadoNavigation.ApellidoUsuario}"
              : null,
        TipoEstacion = proyecto.TipoEstacion,
        CodigoProyecto = proyecto.CodigoProyecto,
        AreaActual = proyecto.AreaActual,
        AvanceGerenciaAdmin = proyecto.AvanceGerenciaAdmin,
        AvanceDiseñoDesarrollo = proyecto.AvanceDiseñoDesarrollo,
        AvanceControlCalidad = proyecto.AvanceControlCalidad,
        AvanceEtiquetadoEmpaquetado = proyecto.AvanceEtiquetadoEmpaquetado,
        AvanceDepositoLogistica = proyecto.AvanceDepositoLogistica,
        CostoMaterialEstimado = proyecto.CostoMaterialEstimado,
        ScrapTotal = proyecto.ScrapTotal,
        ScrapPorcentaje = proyecto.ScrapPorcentaje,
        Materiales = proyecto.DetalleMaterialProyectos?.Select(dm => new MaterialProyectoDTO
        {
          IdDetalle = dm.IdDetalle,
          IdInsumo = dm.IdInsumo,
          NombreInsumo = dm.IdInsumoNavigation?.NombreInsumo,
          IdUnidad = dm.IdUnidad,
          UnidadMedida = dm.IdUnidadNavigation?.NombreUnidad,
          CantidadAsignada = dm.CantidadAsignada,
          CantidadUtilizada = dm.CantidadUtilizada,
          DesperdicioEstimado = dm.DesperdicioEstimado
        }).ToList(),
        Observaciones = proyecto.ObservacionProyectos?.Select(o => new ObservacionDTO
        {
          IdObservacion = o.IdObservacion,
          IdUsuario = o.IdUsuario,
          NombreUsuario = o.IdUsuarioNavigation != null
                ? $"{o.IdUsuarioNavigation.NombreUsuario} {o.IdUsuarioNavigation.ApellidoUsuario}"
                : null,
          Fecha = o.Fecha,
          Descripcion = o.Descripcion
        }).ToList()
      };
    }
  }
}
