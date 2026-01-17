using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;

namespace BillingAPI.Middleware;

public class PermissionAuthorizationMiddleware
{
    private readonly RequestDelegate _next;

    public PermissionAuthorizationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        var endpoint = context.GetEndpoint();
        var permissionAttribute = endpoint?.Metadata.GetMetadata<RequirePermissionAttribute>();

        if (permissionAttribute != null && context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                var hasPermission = await CheckPermissionAsync(dbContext, userId, permissionAttribute.Permission);
                
                if (!hasPermission)
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("Forbidden: You don't have permission to perform this action.");
                    return;
                }
            }
        }

        await _next(context);
    }

    private async Task<bool> CheckPermissionAsync(ApplicationDbContext context, int userId, string requiredPermission)
    {
        var userRoles = await context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();

        if (!userRoles.Any()) return false;

        var hasPermission = await context.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => userRoles.Contains(rp.RoleId) && rp.Permission.Name == requiredPermission)
            .AnyAsync();

        // If no specific permission found, check if user has Owner role (full access)
        if (!hasPermission)
        {
            var isOwner = await context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.UserId == userId && ur.Role!.Name == "Owner")
                .AnyAsync();
            
            return isOwner;
        }

        return hasPermission;
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute
{
    public string Permission { get; }

    public RequirePermissionAttribute(string permission)
    {
        Permission = permission;
    }
}

