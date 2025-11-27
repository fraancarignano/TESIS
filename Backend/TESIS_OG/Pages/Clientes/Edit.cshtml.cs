using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using TESIS_OG.Data;
using TESIS_OG.Models;

namespace TESIS_OG.Pages_Clientes
{
    public class EditModel : PageModel
    {
        private readonly TESIS_OG.Data.TamarindoDbContext _context;

        public EditModel(TESIS_OG.Data.TamarindoDbContext context)
        {
            _context = context;
        }

        [BindProperty]
        public Cliente Cliente { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var cliente =  await _context.Clientes.FirstOrDefaultAsync(m => m.IdCliente == id);
            if (cliente == null)
            {
                return NotFound();
            }
            Cliente = cliente;
           ViewData["IdDireccion"] = new SelectList(_context.Direccions, "IdDireccion", "IdDireccion");
           ViewData["IdEstadoCliente"] = new SelectList(_context.EstadoClientes, "IdEstadoCliente", "IdEstadoCliente");
            return Page();
        }

        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more information, see https://aka.ms/RazorPagesCRUD.
        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Attach(Cliente).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClienteExists(Cliente.IdCliente))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return RedirectToPage("./Index");
        }

        private bool ClienteExists(int id)
        {
            return _context.Clientes.Any(e => e.IdCliente == id);
        }
    }
}
