using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.DTOs.Proyectos;
using TESIS_OG.Data;

namespace TESIS_OG.Services.ProyectoValidacionService
{
    public class ProyectoValidacionService : IProyectoValidacionService
    {
        private readonly TamarindoDbContext _context;

        public ProyectoValidacionService(TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<ProyectoValidacionEdicionDTO> ValidarEdicion(int idProyecto)
        {
            var proyecto = await _context.Proyectos
                .FirstOrDefaultAsync(p => p.IdProyecto == idProyecto);

            if (proyecto == null)
            {
                return new ProyectoValidacionEdicionDTO
                {
                    IdProyecto = idProyecto,
                    EstadoActual = "No encontrado",
                    EsEditable = false,
                    PermiteEdicionCompleta = false,
                    Mensaje = "Proyecto no encontrado"
                };
            }

            var esEditable = EsEditable(proyecto.Estado);
            var permiteCompleta = PermiteEdicionCompleta(proyecto.Estado);

            return new ProyectoValidacionEdicionDTO
            {
                IdProyecto = idProyecto,
                EstadoActual = proyecto.Estado,
                EsEditable = esEditable,
                PermiteEdicionCompleta = permiteCompleta,
                CamposEditables = ObtenerCamposEditables(proyecto.Estado),
                CamposBloqueados = ObtenerCamposBloqueados(proyecto.Estado),
                Mensaje = GenerarMensaje(proyecto.Estado, esEditable, permiteCompleta)
            };
        }

        public bool EsEditable(string estado)
        {
            return estado switch
            {
                "Finalizado" => false,
                "Archivado" => false,
                "Cancelado" => false,
                _ => true
            };
        }

        public bool PermiteEdicionCompleta(string estado)
        {
            return estado == "Pendiente";
        }

        public List<string> ObtenerCamposEditables(string estado)
        {
            return estado switch
            {
                "Pendiente" => new List<string>
                {
                    "IdCliente", "NombreProyecto", "Descripcion", "Prioridad",
                    "Estado", "FechaInicio", "FechaFin", "IdUsuarioEncargado",
                    "Prendas", "Talles", "MaterialesBase", "MaterialesManuales"
                },
                "En Proceso" => new List<string>
                {
                    "NombreProyecto", "Descripcion", "Prioridad", "Estado",
                    "FechaFin", "IdUsuarioEncargado", "MaterialesManuales"
                },
                "Pausado" => new List<string>
                {
                    "NombreProyecto", "Descripcion", "Prioridad", "Estado",
                    "FechaFin", "IdUsuarioEncargado"
                },
                _ => new List<string>()
            };
        }

        public List<string> ObtenerCamposBloqueados(string estado)
        {
            var todosLosCampos = new List<string>
            {
                "IdCliente", "NombreProyecto", "Descripcion", "Prioridad",
                "Estado", "FechaInicio", "FechaFin", "IdUsuarioEncargado",
                "Prendas", "Talles", "MaterialesBase", "MaterialesManuales"
            };

            var editables = ObtenerCamposEditables(estado);
            return todosLosCampos.Except(editables).ToList();
        }

        private string GenerarMensaje(string estado, bool esEditable, bool permiteEdicionCompleta)
        {
            if (!esEditable)
            {
                return $"El proyecto está en estado '{estado}' y no puede ser editado. Solo se puede visualizar.";
            }

            if (permiteEdicionCompleta)
            {
                return "El proyecto está en estado 'Pendiente'. Puedes editar todos los campos, incluyendo prendas, talles y materiales.";
            }

            return $"El proyecto está en estado '{estado}'. Solo puedes editar: nombre, descripción, prioridad, estado, fecha fin, encargado y materiales manuales.";
        }
    }

    public static class EstadoProyecto
    {
        public const string Pendiente = "Pendiente";
        public const string EnProceso = "En Proceso";
        public const string Finalizado = "Finalizado";
        public const string Cancelado = "Cancelado";
        public const string Pausado = "Pausado";
        public const string Archivado = "Archivado";

        public static List<string> ObtenerTodos()
        {
            return new List<string>
            {
                Pendiente, EnProceso, Finalizado, Cancelado, Pausado, Archivado
            };
        }

        public static bool EsValido(string estado)
        {
            return ObtenerTodos().Contains(estado);
        }
    }
}