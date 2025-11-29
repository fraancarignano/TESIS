namespace TESIS_OG.DTOs.Clientes
{
    public class ClienteIndexDTO
    {
        public int IdCliente { get; set; }
        public string? NombreApellido { get; set; }
        public string? RazonSocial { get; set; }
        public string TipoCliente { get; set; }
        public string? Cuit { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public DateOnly FechaAlta { get; set; }
        public int IdEstadoCliente { get; set; }
    }
}