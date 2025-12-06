namespace TESIS_OG.DTOs.Clientes
{
    public class ClienteIndexDTO
    {
        public int IdCliente { get; set; }
        public string TipoCliente { get; set; } = null!;

        // Mostrar nombre según el tipo
        public string NombreCompleto
        {
            get
            {
                    return $"{Nombre} {Apellido}";
                    
            }
        }

        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? RazonSocial { get; set; }
        public string? NumeroDocumento { get; set; }
        public string? CuitCuil { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Ciudad { get; set; }
        public string? Provincia { get; set; }
        public string? NombreEstado { get; set; }
        public DateOnly FechaAlta { get; set; }
    }
}