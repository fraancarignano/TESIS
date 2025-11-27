using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using TESIS_OG.Data;
using TESIS_OG.Models;

namespace TESIS_OG.Pages_Clientes
{
    public class CreateModel : PageModel
    {
        private readonly TESIS_OG.Data.TamarindoDbContext _context;

        public CreateModel(TESIS_OG.Data.TamarindoDbContext context)
        {
            _context = context;
        }

        public IActionResult OnGet()
        {
        ViewData["IdDireccion"] = new SelectList(_context.Direccions, "IdDireccion", "IdDireccion");
        ViewData["IdEstadoCliente"] = new SelectList(_context.EstadoClientes, "IdEstadoCliente", "IdEstadoCliente");
            return Page();
        }

        [BindProperty]
        public Cliente Cliente { get; set; } = default!;

        // For more information, see https://aka.ms/RazorPagesCRUD.
        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Clientes.Add(Cliente);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
