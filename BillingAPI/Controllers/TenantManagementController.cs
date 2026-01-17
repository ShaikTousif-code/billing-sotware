using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/admin/tenants")]
[Authorize(Roles = "SuperAdmin")]
public class TenantManagementController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly ApplicationDbContext _context;
    private readonly IAuthService _authService;

    public TenantManagementController(
        ITenantService tenantService,
        ApplicationDbContext context,
        IAuthService authService)
    {
        _tenantService = tenantService;
        _context = context;
        _authService = authService;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetAllTenants()
    {
        var tenants = await _tenantService.GetAllTenantsAsync();
        return Ok(ApiResponse<List<Tenant>>.SuccessResponse(tenants));
    }

    [HttpGet("{id}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetTenant(int id)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null)
            return NotFound(ApiResponse<Tenant>.ErrorResponse("Tenant not found"));
        
        return Ok(ApiResponse<Tenant>.SuccessResponse(tenant));
    }

    [HttpPost("onboard")]
    public async Task<IActionResult> OnboardTenant([FromBody] OnboardTenantRequest request)
    {
        // Validate tenant code is unique
        var existingTenant = await _tenantService.GetTenantByCodeAsync(request.TenantCode);
        if (existingTenant != null)
            return BadRequest(ApiResponse<object>.ErrorResponse("Tenant code already exists"));

        // Create tenant
        var tenant = new Tenant
        {
            Name = request.TenantName,
            Code = request.TenantCode,
            BusinessType = request.BusinessType,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            Address = request.Address,
            GSTIN = request.GSTIN,
            UPIId = request.UPIId,
            IsActive = true,
            PlanType = request.PlanType ?? "Basic",
            CreatedAt = DateTime.UtcNow
        };

        var createdTenant = await _tenantService.CreateTenantAsync(tenant);

        // Create default tenant configuration
        var tenantConfig = new TenantConfiguration
        {
            TenantId = createdTenant.Id,
            InvoicePrefix = request.InvoicePrefix ?? "INV",
            Currency = request.Currency ?? "USD",
            EnableGST = request.EnableGST ?? false,
            EnableInventory = request.EnableInventory ?? true
        };
        _context.TenantConfigurations.Add(tenantConfig);

        // Create admin user for the tenant if provided
        if (!string.IsNullOrEmpty(request.AdminEmail) && !string.IsNullOrEmpty(request.AdminPassword))
        {
            var adminUser = new User
            {
                TenantId = createdTenant.Id,
                Email = request.AdminEmail,
                FirstName = request.AdminFirstName ?? "Admin",
                LastName = request.AdminLastName ?? "User",
                Phone = request.AdminPhone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var createdUser = await _authService.RegisterAsync(adminUser, request.AdminPassword);

            // Assign Owner role
            var ownerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Owner");
            if (ownerRole != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = createdUser.Id,
                    RoleId = ownerRole.Id
                });
            }
        }

        await _context.SaveChangesAsync();

        // Reload tenant to ensure all data is fresh
        await _context.Entry(createdTenant).ReloadAsync();

        return CreatedAtAction(nameof(GetTenant), new { id = createdTenant.Id },
            ApiResponse<Tenant>.SuccessResponse(createdTenant, "Tenant onboarded successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantRequest request)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Tenant not found"));

        tenant.Name = request.TenantName ?? tenant.Name;
        tenant.BusinessType = request.BusinessType ?? tenant.BusinessType;
        tenant.ContactEmail = request.ContactEmail ?? tenant.ContactEmail;
        tenant.ContactPhone = request.ContactPhone ?? tenant.ContactPhone;
        tenant.Address = request.Address ?? tenant.Address;
        tenant.GSTIN = request.GSTIN ?? tenant.GSTIN;
        tenant.UPIId = request.UPIId ?? tenant.UPIId;
        tenant.IsActive = request.IsActive ?? tenant.IsActive;
        tenant.PlanType = request.PlanType ?? tenant.PlanType;
        tenant.SubscriptionExpiresAt = request.SubscriptionExpiresAt ?? tenant.SubscriptionExpiresAt;

        _context.Tenants.Update(tenant);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<Tenant>.SuccessResponse(tenant, "Tenant updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeactivateTenant(int id)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Tenant not found"));

        tenant.IsActive = false;
        _context.Tenants.Update(tenant);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Tenant deactivated successfully"));
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> ActivateTenant(int id)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Tenant not found"));

        tenant.IsActive = true;
        _context.Tenants.Update(tenant);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Tenant activated successfully"));
    }
}

public class OnboardTenantRequest
{
    public string TenantName { get; set; } = string.Empty;
    public string TenantCode { get; set; } = string.Empty;
    public string? BusinessType { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public string? UPIId { get; set; }
    public string? PlanType { get; set; }
    public string? InvoicePrefix { get; set; }
    public string? Currency { get; set; }
    public bool? EnableGST { get; set; }
    public bool? EnableInventory { get; set; }
    
    // Admin user creation (optional)
    public string? AdminEmail { get; set; }
    public string? AdminPassword { get; set; }
    public string? AdminFirstName { get; set; }
    public string? AdminLastName { get; set; }
    public string? AdminPhone { get; set; }
}

public class UpdateTenantRequest
{
    public string? TenantName { get; set; }
    public string? BusinessType { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public string? UPIId { get; set; }
    public bool? IsActive { get; set; }
    public string? PlanType { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
}

