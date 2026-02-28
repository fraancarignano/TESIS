using Microsoft.AspNetCore.Mvc;

namespace TESIS_OG.Security
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
    public class RequiresPermissionAttribute : TypeFilterAttribute
    {
        public RequiresPermissionAttribute(string modulo, string accion)
            : base(typeof(RequiresPermissionFilter))
        {
            Arguments = new object[] { modulo, accion };
        }
    }
}
