using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerGroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CustomerGroupsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomerGroups()
    {
        var tenantId = GetTenantId();
        var groups = await _context.CustomerGroups
            .Where(g => g.TenantId == tenantId && g.IsActive)
            .ToListAsync();
        return Ok(ApiResponse<List<CustomerGroup>>.SuccessResponse(groups));
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomerGroup([FromBody] CustomerGroup group)
    {
        group.TenantId = GetTenantId();
        group.CreatedAt = DateTime.UtcNow;
        
        _context.CustomerGroups.Add(group);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCustomerGroups), new { id = group.Id }, 
            ApiResponse<CustomerGroup>.SuccessResponse(group, "Customer group created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomerGroup(int id, [FromBody] CustomerGroup group)
    {
        var tenantId = GetTenantId();
        if (id != group.Id || group.TenantId != tenantId)
            return BadRequest(ApiResponse<CustomerGroup>.ErrorResponse("Invalid customer group data"));

        _context.CustomerGroups.Update(group);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<CustomerGroup>.SuccessResponse(group, "Customer group updated successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

