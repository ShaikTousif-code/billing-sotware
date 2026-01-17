using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PermissionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPermissions()
    {
        var permissions = await _context.Permissions.OrderBy(p => p.Category).ThenBy(p => p.Name).ToListAsync();
        return Ok(permissions);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles.OrderBy(r => r.Name).ToListAsync();
        return Ok(roles);
    }

    [HttpGet("role-permissions")]
    public async Task<IActionResult> GetRolePermissions()
    {
        var rolePermissions = await _context.RolePermissions
            .Include(rp => rp.Permission)
            .Include(rp => rp.Role)
            .Select(rp => new
            {
                roleId = rp.RoleId,
                permissionId = rp.PermissionId,
                hasPermission = true
            })
            .ToListAsync();
        return Ok(rolePermissions);
    }

    [HttpPost("role-permissions/bulk-update")]
    public async Task<IActionResult> BulkUpdateRolePermissions([FromBody] List<RolePermissionUpdate> updates)
    {
        foreach (var update in updates)
        {
            var existing = await _context.RolePermissions
                .FirstOrDefaultAsync(rp => rp.RoleId == update.RoleId && rp.PermissionId == update.PermissionId);

            if (update.HasPermission)
            {
                if (existing == null)
                {
                    _context.RolePermissions.Add(new RolePermission
                    {
                        RoleId = update.RoleId,
                        PermissionId = update.PermissionId
                    });
                }
            }
            else
            {
                if (existing != null)
                {
                    _context.RolePermissions.Remove(existing);
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Permissions updated successfully" });
    }
}

public class RolePermissionUpdate
{
    public int RoleId { get; set; }
    public int PermissionId { get; set; }
    public bool HasPermission { get; set; }
}

