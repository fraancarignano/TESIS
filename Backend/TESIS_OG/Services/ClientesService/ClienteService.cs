using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.DTOs.Clientes;
using TESIS_OG.Models;

namespace TESIS_OG.Services.ClienteService
{
    public class ClienteService : IClienteService
    {
        private readonly Data.TamarindoDbContext _context;

        public ClienteService(Data.TamarindoDbContext context)
        {
            _context = context;
        }

        public async Task<ClienteIndexDTO?> CrearClienteAsync(ClienteCreateDTO clienteDto)
        {
            // Validaciones de negocio según el tipo
            if (clienteDto.TipoDocumento == "DNI")
            {
                if (string.IsNullOrEmpty(clienteDto.TipoDocumento))
                    return null;

                // Verificar documento duplicado
                if (!string.IsNullOrEmpty(clienteDto.NumeroDocumento))
                {
                    var existeDocumento = await _context.Clientes
                        .AnyAsync(c => c.NumeroDocumento == clienteDto.NumeroDocumento);
                    if (existeDocumento) return null;
                }
            }
            else if (clienteDto.TipoDocumento == "CUIT/CUIL")
            {
                if (string.IsNullOrEmpty(clienteDto.TipoDocumento))
                    return null;

                // Verificar CUIT duplicado
                if (!string.IsNullOrEmpty(clienteDto.CuitCuil))
                {
                    var existeCuit = await _context.Clientes
                        .AnyAsync(c => c.CuitCuil == clienteDto.CuitCuil);
                    if (existeCuit) return null;
                }
            }

            // Verificar que el estado exista
            var estadoExiste = await _context.EstadoClientes
                .AnyAsync(e => e.IdEstadoCliente == clienteDto.IdEstadoCliente);
            if (!estadoExiste) return null;

            // ⭐ Validar Ciudad si se proporciona
            if (clienteDto.IdCiudad.HasValue)
            {
                var ciudadExiste = await _context.Ciudads
                    .AnyAsync(c => c.IdCiudad == clienteDto.IdCiudad.Value);
                if (!ciudadExiste) return null;
            }

            // ⭐ Validar Provincia si se proporciona
            if (clienteDto.IdProvincia.HasValue)
            {
                var provinciaExiste = await _context.Provincia
                    .AnyAsync(p => p.IdProvincia == clienteDto.IdProvincia.Value);
                if (!provinciaExiste) return null;
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
                Direccion = clienteDto.Direccion, 
                CodigoPostal = clienteDto.CodigoPostal,
                IdCiudad = clienteDto.IdCiudad, 
                IdProvincia = clienteDto.IdProvincia, 
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
                .Include(c => c.IdCiudadNavigation)
                .Include(c => c.IdProvinciaNavigation)
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
                    Direccion = c.Direccion,
                    CodigoPostal = c.CodigoPostal,

                    // ✅ AGREGÁ ESTOS DOS
                    IdCiudad = c.IdCiudad,
                    IdProvincia = c.IdProvincia,

                    NombreCiudad = c.IdCiudadNavigation != null ? c.IdCiudadNavigation.NombreCiudad : null,
                    NombreProvincia = c.IdProvinciaNavigation != null ? c.IdProvinciaNavigation.NombreProvincia : null,
                    IdEstadoCliente = c.IdEstadoCliente,
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
                .Include(c => c.IdCiudadNavigation) // ⭐
                .Include(c => c.IdProvinciaNavigation) // ⭐
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
                    Direccion = c.Direccion,
                    CodigoPostal = c.CodigoPostal,

                    IdCiudad = c.IdCiudad,
                    IdProvincia = c.IdProvincia,

                    NombreCiudad = c.IdCiudadNavigation != null ? c.IdCiudadNavigation.NombreCiudad : null,
                    NombreProvincia = c.IdProvinciaNavigation != null ? c.IdProvinciaNavigation.NombreProvincia : null,
                    IdEstadoCliente = c.IdEstadoCliente,
                    NombreEstado = c.IdEstadoClienteNavigation.NombreEstado,
                    FechaAlta = c.FechaAlta
                })
                .FirstOrDefaultAsync();

            return cliente;
        }

        public async Task<ClienteIndexDTO?> ActualizarClienteAsync(int id, ClienteEditDTO clienteDto)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return null;

            // Validaciones según el tipo
            if (clienteDto.TipoCliente == "Persona Fisica")
            {
                if (string.IsNullOrEmpty(clienteDto.Nombre) || string.IsNullOrEmpty(clienteDto.Apellido))
                    return null;

                if (!string.IsNullOrEmpty(clienteDto.NumeroDocumento))
                {
                    var existeDocumento = await _context.Clientes
                        .AnyAsync(c => c.NumeroDocumento == clienteDto.NumeroDocumento && c.IdCliente != id);
                    if (existeDocumento) return null;
                }
            }
            else if (clienteDto.TipoCliente == "Persona Juridica")
            {
                if (string.IsNullOrEmpty(clienteDto.RazonSocial))
                    return null;

                if (!string.IsNullOrEmpty(clienteDto.CuitCuil))
                {
                    var existeCuit = await _context.Clientes
                        .AnyAsync(c => c.CuitCuil == clienteDto.CuitCuil && c.IdCliente != id);
                    if (existeCuit) return null;
                }
            }

            // ⭐ Validar Ciudad si se proporciona
            if (clienteDto.IdCiudad.HasValue)
            {
                var ciudadExiste = await _context.Ciudads
                    .AnyAsync(c => c.IdCiudad == clienteDto.IdCiudad.Value);
                if (!ciudadExiste) return null;
            }

            // ⭐ Validar Provincia si se proporciona
            if (clienteDto.IdProvincia.HasValue)
            {
                var provinciaExiste = await _context.Provincia
                    .AnyAsync(p => p.IdProvincia == clienteDto.IdProvincia.Value);
                if (!provinciaExiste) return null;
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
            cliente.Direccion = clienteDto.Direccion; 
            cliente.CodigoPostal = clienteDto.CodigoPostal;
            cliente.IdCiudad = clienteDto.IdCiudad; 
            cliente.IdProvincia = clienteDto.IdProvincia; 
            cliente.IdEstadoCliente = clienteDto.IdEstadoCliente;
            cliente.Observaciones = clienteDto.Observaciones;

            await _context.SaveChangesAsync();

            return await ObtenerClientePorIdAsync(id);
        }

        public async Task<bool> EliminarClienteAsync(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return false;

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ClienteIndexDTO>> BuscarClientesAsync(ClienteSearchDTO filtros)
        {
            var query = _context.Clientes
                .Include(c => c.IdEstadoClienteNavigation)
                .Include(c => c.IdCiudadNavigation) 
                .Include(c => c.IdProvinciaNavigation) 
                .AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(filtros.TipoCliente))
                query = query.Where(c => c.TipoCliente == filtros.TipoCliente);

            if (!string.IsNullOrEmpty(filtros.Nombre))
                query = query.Where(c => c.Nombre!.Contains(filtros.Nombre));

            if (!string.IsNullOrEmpty(filtros.Apellido)) // ⭐ Agregado
                query = query.Where(c => c.Apellido!.Contains(filtros.Apellido));

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

            if (!string.IsNullOrEmpty(filtros.CodigoPostal))
                query = query.Where(c => c.CodigoPostal == filtros.CodigoPostal);

            if (filtros.IdCiudad.HasValue)
                query = query.Where(c => c.IdCiudad == filtros.IdCiudad.Value);

            if (filtros.IdProvincia.HasValue)
                query = query.Where(c => c.IdProvincia == filtros.IdProvincia.Value);

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
                    Direccion = c.Direccion,
                    CodigoPostal = c.CodigoPostal,

                    IdCiudad = c.IdCiudad,
                    IdProvincia = c.IdProvincia,

                    NombreCiudad = c.IdCiudadNavigation != null ? c.IdCiudadNavigation.NombreCiudad : null,
                    NombreProvincia = c.IdProvinciaNavigation != null ? c.IdProvinciaNavigation.NombreProvincia : null,
                    IdEstadoCliente = c.IdEstadoCliente,
                    NombreEstado = c.IdEstadoClienteNavigation.NombreEstado,
                    FechaAlta = c.FechaAlta
                })
                .OrderByDescending(c => c.FechaAlta)
                .ToListAsync();

            return clientes;
        }
    }
}
