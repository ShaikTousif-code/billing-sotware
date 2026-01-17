using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;

namespace BillingAPI.Middleware;

/// <summary>
/// Middleware to allow SuperAdmin to bypass tenant restrictions
/// </summary>
public class SuperAdminMiddleware
{
    private readonly RequestDelegate _next;

    public SuperAdminMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var isSuperAdmin = context.User.IsInRole("SuperAdmin");
            
            if (isSuperAdmin)
            {
                // SuperAdmin can access all tenants
                // Set a flag in context to indicate SuperAdmin access
                context.Items["IsSuperAdmin"] = true;
                
                // Get SYSTEM tenant ID for reference
                var systemTenant = await dbContext.Tenants
                    .FirstOrDefaultAsync(t => t.Code == "SYSTEM");
                
                if (systemTenant != null)
                {
                    context.Items["SystemTenantId"] = systemTenant.Id;
                }
            }
        }

        await _next(context);
    }
}

