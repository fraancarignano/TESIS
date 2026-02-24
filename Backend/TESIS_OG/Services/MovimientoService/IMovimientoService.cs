using System.Collections.Generic;
using System.Threading.Tasks;
using TESIS_OG.DTOs.Movimientos;

namespace TESIS_OG.Services.MovimientoService
{
    public interface IMovimientoService
    {
        Task<List<MovimientoIndexDTO>> ObtenerMovimientosAsync(MovimientoSearchDTO filtros);
    }
}
