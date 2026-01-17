using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;
using BillingAPI.DTOs;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITenantService _tenantService;
    private readonly ApplicationDbContext _context;

    public AuthController(IAuthService authService, ITenantService tenantService, ApplicationDbContext context)
    {
        _authService = authService;
        _tenantService = tenantService;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            Tenant? tenant = null;
            int? tenantId = null;

            // If tenant code is provided, use it (for backward compatibility and super admin)
            if (!string.IsNullOrEmpty(request.TenantCode))
            {
                if (request.TenantCode.ToUpper() == "SYSTEM")
                {
                    // Super admin login - check for SYSTEM tenant
                    tenant = await _tenantService.GetTenantByCodeAsync("SYSTEM");
                    if (tenant != null)
                    {
                        tenantId = tenant.Id;
                    }
                }
                else
                {
                    // Regular tenant login with tenant code
                    tenant = await _tenantService.GetTenantByCodeAsync(request.TenantCode);
                    if (tenant == null || !tenant.IsActive)
                    {
                        return Unauthorized(new { message = "Invalid tenant code" });
                    }
                    tenantId = tenant.Id;
                }
            }
            else
            {
                // No tenant code provided - find user by email first, then get their tenant
                var userWithTenant = await _context.Users
                    .Include(u => u.Tenant)
                    .Where(u => u.Email == request.Email && u.IsActive)
                    .ToListAsync();

                if (userWithTenant.Count == 0)
                {
                    return Unauthorized(new { message = "Invalid credentials" });
                }

                if (userWithTenant.Count > 1)
                {
                    // User exists in multiple tenants - need tenant code
                    return Unauthorized(new { 
                        message = "User exists in multiple tenants. Please provide tenant code.",
                        requiresTenantCode = true 
                    });
                }

                var foundUser = userWithTenant.First();
                tenant = foundUser.Tenant;
                tenantId = foundUser.TenantId;

                if (tenant == null || !tenant.IsActive)
                {
                    return Unauthorized(new { message = "Tenant is not active" });
                }
            }

            var (token, user) = await _authService.LoginAsync(request.Email, request.Password, tenantId);
            
            // Get user roles
            var userRoles = user.UserRoles?.Select(ur => ur.Role?.Name ?? "").Where(r => !string.IsNullOrEmpty(r)).ToList() ?? new List<string>();
            var isSuperAdmin = userRoles.Contains("SuperAdmin");
            
            return Ok(new 
            { 
                token, 
                tenantId = user.TenantId, 
                tenantName = tenant?.Name ?? "System",
                tenantCode = tenant?.Code ?? "SYSTEM",
                businessType = tenant?.BusinessType ?? "System",
                userRoles = userRoles,
                userEmail = user.Email,
                userName = $"{user.FirstName} {user.LastName}".Trim(),
                isSuperAdmin = isSuperAdmin
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var tenantId = int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
        
        var user = new User
        {
            TenantId = tenantId,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone
        };

        var createdUser = await _authService.RegisterAsync(user, request.Password);
        return Ok(new { userId = createdUser.Id, email = createdUser.Email });
    }

    [HttpGet("users")]
    [Authorize]
    public async Task<IActionResult> GetUsers([FromQuery] bool? isActive)
    {
        var tenantId = GetTenantId();
        
        var query = _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.TenantId == tenantId);

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var users = await query
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Phone,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt,
                Roles = u.UserRoles.Select(ur => ur.Role != null ? ur.Role.Name : "").Where(r => !string.IsNullOrEmpty(r)).ToList()
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResponse(users));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class LoginRequest
{
    public string? TenantCode { get; set; } // Optional - will be determined from user email if not provided
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
}

