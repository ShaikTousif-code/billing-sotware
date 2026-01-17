using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;

namespace BillingAPI.Helpers;

/// <summary>
/// Helper class for tenant-related operations
/// </summary>
public static class TenantHelper
{
    /// <summary>
    /// Get the tenant ID from the current user context
    /// Returns null for SuperAdmin to allow cross-tenant access
    /// </summary>
    public static int? GetTenantId(HttpContext context)
    {
        // Check if user is SuperAdmin
        if (context.User.IsInRole("SuperAdmin"))
        {
            // SuperAdmin can access all tenants, return null to bypass tenant filtering
            return null;
        }

        // For regular users, get tenant ID from claims or context items
        var tenantIdClaim = context.User.FindFirst("TenantId")?.Value;
        if (int.TryParse(tenantIdClaim, out var tenantId))
        {
            return tenantId;
        }

        // Fallback to context items
        if (context.Items.TryGetValue("TenantId", out var tenantIdObj) && tenantIdObj is int tid)
        {
            return tid;
        }

        return null;
    }

    /// <summary>
    /// Check if the current user is a SuperAdmin
    /// </summary>
    public static bool IsSuperAdmin(HttpContext context)
    {
        return context.User.IsInRole("SuperAdmin");
    }

    /// <summary>
    /// Get the user ID from the current context
    /// </summary>
    public static int? GetUserId(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }
}

