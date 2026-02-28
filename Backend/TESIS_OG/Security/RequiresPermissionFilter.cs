using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TESIS_OG.Services.AuthorizationService;

namespace TESIS_OG.Security
{
    public class RequiresPermissionFilter : IAsyncActionFilter
    {
        private readonly string _modulo;
        private readonly string _accion;
        private readonly IAuthorizationService _authorizationService;
        private readonly ILogger<RequiresPermissionFilter> _logger;

        public RequiresPermissionFilter(
            string modulo,
            string accion,
            IAuthorizationService authorizationService,
            ILogger<RequiresPermissionFilter> logger)
        {
            _modulo = modulo;
            _accion = accion;
            _authorizationService = authorizationService;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var userId = ObtenerIdUsuario(context.HttpContext.User);
            if (!userId.HasValue)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "No autenticado o token inválido."
                });
                return;
            }

            var tienePermiso = await _authorizationService.TienePermiso(userId.Value, _modulo, _accion);
            if (!tienePermiso)
            {
                _logger.LogWarning(
                    "Acceso denegado. Usuario={IdUsuario}, Modulo={Modulo}, Accion={Accion}, Path={Path}",
                    userId.Value,
                    _modulo,
                    _accion,
                    context.HttpContext.Request.Path
                );

                context.Result = new ObjectResult(new
                {
                    message = "No tiene permisos para realizar esta acción."
                })
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
                return;
            }

            await next();
        }

        private static int? ObtenerIdUsuario(ClaimsPrincipal user)
        {
            var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? user.FindFirstValue("sub");

            return int.TryParse(raw, out var idUsuario) ? idUsuario : null;
        }
    }
}
