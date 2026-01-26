namespace TESIS_OG.DTOs.Clientes
{
    public class ClienteSearchDTO
    {
        public string? TipoCliente { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? RazonSocial { get; set; }
        public string? NumeroDocumento { get; set; }
        public string? CuitCuil { get; set; }
        public string? Email { get; set; }
        public int? IdEstadoCliente { get; set; }
        public int? IdCiudad { get; set; }  
        public int? IdProvincia { get; set; }
        public string? CodigoPostal { get; set; }
    }
}