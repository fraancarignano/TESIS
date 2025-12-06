using System.ComponentModel.DataAnnotations;

namespace TESIS_OG.DTOs.Clientes
{
    public class ClienteEditDTO
    {
        public string TipoCliente { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public int IdEstadoCliente { get; set; }
        public string? Observaciones { get; set; }

        // Campos para Persona Física
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? TipoDocumento { get; set; }
        public string? NumeroDocumento { get; set; }

        // Campos para Persona Jurídica
        public string? RazonSocial { get; set; }
        public string? CuitCuil { get; set; }

        public int? IdCiudad { get; set; }
        public int? IdProvincia { get; set; }
        public string? Direccion { get; set; }
        public string? CodigoPostal { get; set; }
    }
}