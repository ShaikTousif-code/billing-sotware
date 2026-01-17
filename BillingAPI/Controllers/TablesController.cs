using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TablesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TablesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTables()
    {
        var tenantId = GetTenantId();
        var tables = await _context.Set<Table>()
            .Where(t => t.TenantId == tenantId && t.IsActive)
            .ToListAsync();
        return Ok(tables);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTable([FromBody] Table table)
    {
        table.TenantId = GetTenantId();
        table.CreatedAt = DateTime.UtcNow;
        _context.Set<Table>().Add(table);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTables), new { id = table.Id }, table);
    }

    [HttpPost("{id}/assign-invoice")]
    public async Task<IActionResult> AssignInvoice(int id, [FromBody] AssignInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        var table = await _context.Set<Table>()
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (table == null) return NotFound();

        table.CurrentInvoiceId = request.InvoiceId;
        table.Status = "Occupied";
        await _context.SaveChangesAsync();
        return Ok(table);
    }

    [HttpPost("{id}/release")]
    public async Task<IActionResult> ReleaseTable(int id)
    {
        var tenantId = GetTenantId();
        var table = await _context.Set<Table>()
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (table == null) return NotFound();

        table.CurrentInvoiceId = null;
        table.Status = "Available";
        await _context.SaveChangesAsync();
        return Ok(table);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class AssignInvoiceRequest
{
    public int InvoiceId { get; set; }
}

