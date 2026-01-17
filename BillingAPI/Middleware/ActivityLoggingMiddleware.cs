using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.Data;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace BillingAPI.Middleware;

public class ActivityLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public ActivityLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Execute the request first
        await _next(context);

        // Log activity after the request completes (so we can capture response status)
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantIdClaim = context.User.FindFirst("TenantId")?.Value;
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(tenantIdClaim, out var tenantId) && int.TryParse(userIdClaim, out var userId))
            {
                // Only log successful operations (2xx status codes)
                if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
                {
                    // Log activity for POST, PUT, DELETE operations
                    if (context.Request.Method is "POST" or "PUT" or "DELETE")
                    {
                        try
                        {
                            // Resolve scoped service from HttpContext
                            var activityLogService = context.RequestServices.GetRequiredService<IActivityLogService>();
                            
                            var path = context.Request.Path.Value ?? "";
                            var (entityType, entityId) = ExtractEntityInfo(path);
                            var action = MapAction(context.Request.Method);
                            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                            var userAgent = context.Request.Headers["User-Agent"].ToString();

                            // Try to extract entity name and old/new values (non-blocking)
                            var entityName = await TryGetEntityNameAsync(context.RequestServices, entityType, entityId, tenantId);
                            
                            // Extract request body for old/new values (if available)
                            string? newValues = null;
                            if (context.Request.Method is "POST" or "PUT" && context.Request.ContentLength > 0)
                            {
                                context.Request.EnableBuffering();
                                context.Request.Body.Position = 0;
                                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                                var body = await reader.ReadToEndAsync();
                                context.Request.Body.Position = 0;
                                
                                if (!string.IsNullOrEmpty(body) && body.Length < 10000) // Limit size
                                {
                                    newValues = body;
                                }
                            }

                            await activityLogService.LogActivityAsync(new ActivityLog
                            {
                                TenantId = tenantId,
                                UserId = userId,
                                Action = action,
                                EntityType = entityType,
                                EntityId = entityId,
                                EntityName = entityName,
                                NewValues = newValues,
                                IpAddress = ipAddress,
                                UserAgent = userAgent,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                        catch (Exception ex)
                        {
                            // Log error but don't fail the request
                            // Activity logging should never break the application
                            Console.WriteLine($"Error in activity logging: {ex.Message}");
                        }
                    }
                }
            }
        }
    }

    private (string entityType, int? entityId) ExtractEntityInfo(string path)
    {
        var parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        
        if (parts.Length < 2)
            return ("Unknown", null);

        // Remove "api" prefix if present
        var startIndex = parts[0].Equals("api", StringComparison.OrdinalIgnoreCase) ? 1 : 0;
        
        if (parts.Length <= startIndex)
            return ("Unknown", null);

        var entityType = parts[startIndex];
        
        // Remove plural 's' and convert kebab-case to PascalCase
        entityType = entityType.TrimEnd('s');
        entityType = ConvertKebabToPascalCase(entityType);

        // Try to extract entity ID from path (e.g., /api/invoices/123)
        int? entityId = null;
        if (parts.Length > startIndex + 1)
        {
            // Check if next part is a number
            if (int.TryParse(parts[startIndex + 1], out var id))
            {
                entityId = id;
            }
        }

        return (entityType, entityId);
    }

    private string ConvertKebabToPascalCase(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        var parts = input.Split('-', StringSplitOptions.RemoveEmptyEntries);
        return string.Join("", parts.Select(p => char.ToUpperInvariant(p[0]) + p.Substring(1).ToLowerInvariant()));
    }

    private string MapAction(string httpMethod)
    {
        return httpMethod switch
        {
            "POST" => "Create",
            "PUT" => "Update",
            "PATCH" => "Update",
            "DELETE" => "Delete",
            _ => httpMethod
        };
    }

    private async Task<string?> TryGetEntityNameAsync(IServiceProvider serviceProvider, string entityType, int? entityId, int tenantId)
    {
        if (!entityId.HasValue)
            return null;

        try
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            return entityType switch
            {
                "Invoice" => await dbContext.Invoices
                    .Where(i => i.Id == entityId.Value && i.TenantId == tenantId)
                    .Select(i => i.InvoiceNumber)
                    .FirstOrDefaultAsync(),
                "Product" => await dbContext.Products
                    .Where(p => p.Id == entityId.Value && p.TenantId == tenantId)
                    .Select(p => p.Name)
                    .FirstOrDefaultAsync(),
                "Customer" => await dbContext.Customers
                    .Where(c => c.Id == entityId.Value && c.TenantId == tenantId)
                    .Select(c => c.Name)
                    .FirstOrDefaultAsync(),
                "Payment" => await dbContext.Payments
                    .Where(p => p.Id == entityId.Value && p.TenantId == tenantId)
                    .Select(p => $"Payment #{p.Id}")
                    .FirstOrDefaultAsync(),
                _ => null
            };
        }
        catch
        {
            return null; // Fail silently
        }
    }
}

