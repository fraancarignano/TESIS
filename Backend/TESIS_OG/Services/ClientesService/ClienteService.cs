using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Clientes;
using TESIS_OG.Models;

namespace TESIS_OG.Services.ClienteService
{
    public class ClienteService : IClienteService
    {
        private readonly TamarindoDbContext _context;

        public ClienteService(TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<ClienteIndexDTO?> CrearClienteAsync(ClienteCreateDTO clienteDto)
        {
            // Validaciones de negocio según el tipo
            if (clienteDto.TipoCliente == "Persona Fisica")
            {
                // Validar campos obligatorios para Persona Física
                if (string.IsNullOrEmpty(clienteDto.Nombre) || string.IsNullOrEmpty(clienteDto.Apellido))
                {
                    return null; // Faltan datos requeridos
                }

                // Verificar documento duplicado
                if (!string.IsNullOrEmpty(clienteDto.NumeroDocumento))
                {
                    var existeDocumento = await _context.Clientes
                        .AnyAsync(c => c.NumeroDocumento == clienteDto.NumeroDocumento);

                    if (existeDocumento)
                        return null; // Documento duplicado
                }
            }
            else if (clienteDto.TipoCliente == "Persona Juridica")
            {
                // Validar campos obligatorios para Persona Jurídica
                if (string.IsNullOrEmpty(clienteDto.RazonSocial))
                {
                    return null; // Falta Razón Social
                }

                // Verificar CUIT duplicado
                if (!string.IsNullOrEmpty(clienteDto.CuitCuil))
                {
                    var existeCuit = await _context.Clientes
                        .AnyAsync(c => c.CuitCuil == clienteDto.CuitCuil);

                    if (existeCuit)
                        return null; // CUIT duplicado
                }
            }

            // Verificar que el estado exista
            var estadoExiste = await _context.EstadoClientes
                .AnyAsync(e => e.IdEstadoCliente == clienteDto.IdEstadoCliente);

            if (!estadoExiste)
                return null; // Estado no válido

            // Si tiene dirección, verificar que exista
            if (clienteDto.IdDireccion.HasValue)
            {
                var direccionExiste = await _context.Direccions
                    .AnyAsync(d => d.IdDireccion == clienteDto.IdDireccion.Value);

                if (!direccionExiste)
                    return null; // Dirección no válida
            }

            // Crear el cliente
            var nuevoCliente = new Cliente
            {
                TipoCliente = clienteDto.TipoCliente,
                Nombre = clienteDto.Nombre,
                Apellido = clienteDto.Apellido,
                TipoDocumento = clienteDto.TipoDocumento,
                NumeroDocumento = clienteDto.NumeroDocumento,
                RazonSocial = clienteDto.RazonSocial,
                CuitCuil = clienteDto.CuitCuil,
                Telefono = clienteDto.Telefono,
                Email = clienteDto.Email,
                Ciudad = clienteDto.Ciudad,
                Provincia = clienteDto.Provincia,
                IdDireccion = clienteDto.IdDireccion,
                IdEstadoCliente = clienteDto.IdEstadoCliente,
                FechaAlta = DateOnly.FromDateTime(DateTime.Now),
                Observaciones = clienteDto.Observaciones
            };

            _context.Clientes.Add(nuevoCliente);
            await _context.SaveChangesAsync();

            return await ObtenerClientePorIdAsync(nuevoCliente.IdCliente);
        }

        public async Task<List<ClienteIndexDTO>> ObtenerTodosLosClientesAsync()
        {
            var clientes = await _context.Clientes
                .Include(c => c.IdEstadoClienteNavigation)
                .Select(c => new ClienteIndexDTO
                {
                    IdCliente = c.IdCliente,
                    TipoCliente = c.TipoCliente,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    RazonSocial = c.RazonSocial,
                    NumeroDocumento = c.NumeroDocumento,
                    CuitCuil = c.CuitCuil,
                    Telefono = c.Telefono,
                    Email = c.Email,
                    Ciudad = c.Ciudad,
                    Provincia = c.Provincia,
                    NombreEstado = c.IdEstadoClienteNavigation.NombreEstado,
                    FechaAlta = c.FechaAlta
                })
                .OrderByDescending(c => c.FechaAlta)
                .ToListAsync();

            return clientes;
        }

        public async Task<ClienteIndexDTO?> ObtenerClientePorIdAsync(int id)
        {
            var cliente = await _context.Clientes
                .Include(c => c.IdEstadoClienteNavigation)
                .Where(c => c.IdCliente == id)
                .Select(c => new ClienteIndexDTO
                {
                    IdCliente = c.IdCliente,
                    TipoCliente = c.TipoCliente,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    RazonSocial = c.RazonSocial,
                    NumeroDocumento = c.NumeroDocumento,
                    CuitCuil = c.CuitCuil,
                    Telefono = c.Telefono,
                    Email = c.Email,
                    Ciudad = c.Ciudad,
                    Provincia = c.Provincia,
                    NombreEstado = c.IdEstadoClienteNavigation.NombreEstado,
                    FechaAlta = c.FechaAlta
                })
                .FirstOrDefaultAsync();

            return cliente;
        }

        public async Task<ClienteIndexDTO?> ActualizarClienteAsync(int id, ClienteEditDTO clienteDto)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
                return null;

            // Validaciones según el tipo
            if (clienteDto.TipoCliente == "Persona Fisica")
            {
                if (string.IsNullOrEmpty(clienteDto.Nombre) || string.IsNullOrEmpty(clienteDto.Apellido))
                    return null;

                // Verificar documento duplicado (excepto el mismo cliente)
                if (!string.IsNullOrEmpty(clienteDto.NumeroDocumento))
                {
                    var existeDocumento = await _context.Clientes
                        .AnyAsync(c => c.NumeroDocumento == clienteDto.NumeroDocumento && c.IdCliente != id);

                    if (existeDocumento)
                        return null;
                }
            }
            else if (clienteDto.TipoCliente == "Persona Juridica")
            {
                if (string.IsNullOrEmpty(clienteDto.RazonSocial))
                    return null;

                // Verificar CUIT duplicado (excepto el mismo cliente)
                if (!string.IsNullOrEmpty(clienteDto.CuitCuil))
                {
                    var existeCuit = await _context.Clientes
                        .AnyAsync(c => c.CuitCuil == clienteDto.CuitCuil && c.IdCliente != id);

                    if (existeCuit)
                        return null;
                }
            }

            // Actualizar campos
            cliente.TipoCliente = clienteDto.TipoCliente;
            cliente.Nombre = clienteDto.Nombre;
            cliente.Apellido = clienteDto.Apellido;
            cliente.TipoDocumento = clienteDto.TipoDocumento;
            cliente.NumeroDocumento = clienteDto.NumeroDocumento;
            cliente.RazonSocial = clienteDto.RazonSocial;
            cliente.CuitCuil = clienteDto.CuitCuil;
            cliente.Telefono = clienteDto.Telefono;
            cliente.Email = clienteDto.Email;
            cliente.Ciudad = clienteDto.Ciudad;
            cliente.Provincia = clienteDto.Provincia;
            cliente.IdDireccion = clienteDto.IdDireccion;
            cliente.IdEstadoCliente = clienteDto.IdEstadoCliente;
            cliente.Observaciones = clienteDto.Observaciones;

            await _context.SaveChangesAsync();

            return await ObtenerClientePorIdAsync(id);
        }

        public async Task<bool> EliminarClienteAsync(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
                return false;

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ClienteIndexDTO>> BuscarClientesAsync(ClienteSearchDTO filtros)
        {
            var query = _context.Clientes
                .Include(c => c.IdEstadoClienteNavigation)
                .AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(filtros.TipoCliente))
                query = query.Where(c => c.TipoCliente == filtros.TipoCliente);

            if (!string.IsNullOrEmpty(filtros.Nombre))
                query = query.Where(c => c.Nombre!.Contains(filtros.Nombre));

            if (!string.IsNullOrEmpty(filtros.RazonSocial))
                query = query.Where(c => c.RazonSocial!.Contains(filtros.RazonSocial));

            if (!string.IsNullOrEmpty(filtros.NumeroDocumento))
                query = query.Where(c => c.NumeroDocumento == filtros.NumeroDocumento);

            if (!string.IsNullOrEmpty(filtros.CuitCuil))
                query = query.Where(c => c.CuitCuil == filtros.CuitCuil);

            if (!string.IsNullOrEmpty(filtros.Email))
                query = query.Where(c => c.Email!.Contains(filtros.Email));

            if (filtros.IdEstadoCliente.HasValue)
                query = query.Where(c => c.IdEstadoCliente == filtros.IdEstadoCliente.Value);

            if (!string.IsNullOrEmpty(filtros.Ciudad))
                query = query.Where(c => c.Ciudad!.Contains(filtros.Ciudad));

            if (!string.IsNullOrEmpty(filtros.Provincia))
                query = query.Where(c => c.Provincia!.Contains(filtros.Provincia));

            var clientes = await query
                .Select(c => new ClienteIndexDTO
                {
                    IdCliente = c.IdCliente,
                    TipoCliente = c.TipoCliente,
                    Nombre = c.Nombre,
                    Apellido = c.Apellido,
                    RazonSocial = c.RazonSocial,
                    NumeroDocumento = c.NumeroDocumento,
                    CuitCuil = c.CuitCuil,
                    Telefono = c.Telefono,
                    Email = c.Email,
                    Ciudad = c.Ciudad,
                    Provincia = c.Provincia,
                    NombreEstado = c.IdEstadoClienteNavigation.NombreEstado,
                    FechaAlta = c.FechaAlta
                })
                .OrderByDescending(c => c.FechaAlta)
                .ToListAsync();

            return clientes;
        }
    }
}