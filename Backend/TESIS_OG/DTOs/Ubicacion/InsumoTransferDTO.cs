using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Ubicacion
{
    public class InsumoTransferDTO
    {
        [Required]
        public int IdOrdenCompra { get; set; }

        [Required]
        public List<int> IdsInsumos { get; set; } = new List<int>();

        [Required]
        public int IdUbicacionDestino { get; set; }
        public int? IdProyecto { get; set; }
        public int? IdUsuario { get; set; }
    }
}
