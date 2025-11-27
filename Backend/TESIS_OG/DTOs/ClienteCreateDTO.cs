namespace TESIS_OG.DTOs
{
    public class ClienteCreateDTO
    {
        public string? NombreApellido { get; set; }
        public string? RazonSocial { get; set; }
        public string TipoCliente { get; set; }
        public string? Cuit { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public int? IdDireccion { get; set; }
        public int IdEstadoCliente { get; set; }
        public string? Observaciones { get; set; }
    }
}

