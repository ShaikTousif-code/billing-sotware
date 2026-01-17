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
[Route("api/admin/users")]
[Authorize(Roles = "SuperAdmin")]
public class UserManagementController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuthService _authService;
    private readonly ITenantService _tenantService;

    public UserManagementController(
        ApplicationDbContext context,
        IAuthService authService,
        ITenantService tenantService)
    {
        _context = context;
        _authService = authService;
        _tenantService = tenantService;
    }

    /// <summary>
    /// Get all users across all tenants (with optional filtering)
    /// </summary>
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetAllUsers([FromQuery] int? tenantId, [FromQuery] bool? isActive)
    {
        var query = _context.Users
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (tenantId.HasValue)
        {
            query = query.Where(u => u.TenantId == tenantId.Value);
        }

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
                TenantId = u.TenantId,
                TenantName = u.Tenant != null ? u.Tenant.Name : "Unknown",
                TenantCode = u.Tenant != null ? u.Tenant.Code : "Unknown",
                Roles = u.UserRoles.Select(ur => ur.Role != null ? ur.Role.Name : "").Where(r => !string.IsNullOrEmpty(r)).ToList()
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResponse(users));
    }

    /// <summary>
    /// Get a specific user by ID
    /// </summary>
    [HttpGet("{id}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var userDto = new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Phone,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt,
            TenantId = user.TenantId,
            TenantName = user.Tenant != null ? user.Tenant.Name : "Unknown",
            TenantCode = user.Tenant != null ? user.Tenant.Code : "Unknown",
            Roles = user.UserRoles.Select(ur => ur.Role != null ? ur.Role.Name : "").Where(r => !string.IsNullOrEmpty(r)).ToList()
        };

        return Ok(ApiResponse<object>.SuccessResponse(userDto));
    }

    /// <summary>
    /// Create a new user in a specific tenant
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserManagementRequest request)
    {
        // Validate tenant exists
        var tenant = await _tenantService.GetTenantByIdAsync(request.TenantId);
        if (tenant == null)
            return BadRequest(ApiResponse<object>.ErrorResponse("Tenant not found"));

        // Check if email already exists in this tenant
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.TenantId == request.TenantId);
        if (existingUser != null)
            return BadRequest(ApiResponse<object>.ErrorResponse("User with this email already exists in this tenant"));

        // Create user
        var user = new User
        {
            TenantId = request.TenantId,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            IsActive = request.IsActive ?? true,
            CreatedAt = DateTime.UtcNow
        };

        var createdUser = await _authService.RegisterAsync(user, request.Password);

        // Assign roles
        if (request.RoleIds != null && request.RoleIds.Any())
        {
            foreach (var roleId in request.RoleIds)
            {
                var role = await _context.Roles.FindAsync(roleId);
                if (role != null)
                {
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = createdUser.Id,
                        RoleId = roleId
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        // Reload user with relations
        await _context.Entry(createdUser)
            .Reference(u => u.Tenant)
            .LoadAsync();
        await _context.Entry(createdUser)
            .Collection(u => u.UserRoles)
            .Query()
            .Include(ur => ur.Role)
            .LoadAsync();

        var userDto = new
        {
            createdUser.Id,
            createdUser.Email,
            createdUser.FirstName,
            createdUser.LastName,
            createdUser.Phone,
            createdUser.IsActive,
            createdUser.CreatedAt,
            TenantId = createdUser.TenantId,
            TenantName = createdUser.Tenant != null ? createdUser.Tenant.Name : "Unknown",
            TenantCode = createdUser.Tenant != null ? createdUser.Tenant.Code : "Unknown",
            Roles = createdUser.UserRoles.Select(ur => ur.Role != null ? ur.Role.Name : "").Where(r => !string.IsNullOrEmpty(r)).ToList()
        };

        return CreatedAtAction(nameof(GetUser), new { id = createdUser.Id },
            ApiResponse<object>.SuccessResponse(userDto, "User created successfully"));
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserManagementRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        // Update basic fields
        if (!string.IsNullOrEmpty(request.FirstName))
            user.FirstName = request.FirstName;
        if (!string.IsNullOrEmpty(request.LastName))
            user.LastName = request.LastName;
        if (request.Phone != null)
            user.Phone = request.Phone;
        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        // Update tenant if provided
        if (request.TenantId.HasValue)
        {
            var tenant = await _tenantService.GetTenantByIdAsync(request.TenantId.Value);
            if (tenant == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("Tenant not found"));
            user.TenantId = request.TenantId.Value;
        }

        // Update password if provided
        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = HashPassword(request.Password);
        }

        // Update roles if provided
        if (request.RoleIds != null)
        {
            // Remove existing roles
            var existingRoles = _context.UserRoles.Where(ur => ur.UserId == id);
            _context.UserRoles.RemoveRange(existingRoles);

            // Add new roles
            foreach (var roleId in request.RoleIds)
            {
                var role = await _context.Roles.FindAsync(roleId);
                if (role != null)
                {
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = id,
                        RoleId = roleId
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        // Reload user with relations
        await _context.Entry(user)
            .Reference(u => u.Tenant)
            .LoadAsync();
        await _context.Entry(user)
            .Collection(u => u.UserRoles)
            .Query()
            .Include(ur => ur.Role)
            .LoadAsync();

        var userDto = new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Phone,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt,
            TenantId = user.TenantId,
            TenantName = user.Tenant != null ? user.Tenant.Name : "Unknown",
            TenantCode = user.Tenant != null ? user.Tenant.Code : "Unknown",
            Roles = user.UserRoles.Select(ur => ur.Role != null ? ur.Role.Name : "").Where(r => !string.IsNullOrEmpty(r)).ToList()
        };

        return Ok(ApiResponse<object>.SuccessResponse(userDto, "User updated successfully"));
    }

    /// <summary>
    /// Deactivate a user
    /// </summary>
    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        user.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "User deactivated successfully"));
    }

    /// <summary>
    /// Activate a user
    /// </summary>
    [HttpPost("{id}/activate")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        user.IsActive = true;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "User activated successfully"));
    }

    /// <summary>
    /// Delete a user (soft delete by deactivating)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        // Prevent deleting super admin
        var isSuperAdmin = await _context.UserRoles
            .Include(ur => ur.Role)
            .AnyAsync(ur => ur.UserId == id && ur.Role != null && ur.Role.Name == "SuperAdmin");
        
        if (isSuperAdmin)
            return BadRequest(ApiResponse<object>.ErrorResponse("Cannot delete SuperAdmin user"));

        // Soft delete by deactivating
        user.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "User deleted successfully"));
    }

    /// <summary>
    /// Get all roles available in the system
    /// </summary>
    [HttpGet("roles")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetAllRoles()
    {
        var roles = await _context.Roles
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Description
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResponse(roles));
    }

    private string HashPassword(string password)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

public class CreateUserManagementRequest
{
    public int TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool? IsActive { get; set; }
    public List<int>? RoleIds { get; set; }
}

public class UpdateUserManagementRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public bool? IsActive { get; set; }
    public int? TenantId { get; set; }
    public string? Password { get; set; }
    public List<int>? RoleIds { get; set; }
}

