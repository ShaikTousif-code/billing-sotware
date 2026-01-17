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
public class KOTController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public KOTController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetKOTs([FromQuery] int? tableId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.Set<KOT>()
            .Include(k => k.Table)
            .Include(k => k.Items)
            .Where(k => k.TenantId == tenantId);

        if (tableId.HasValue)
            query = query.Where(k => k.TableId == tableId.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(k => k.Status == status);

        var kots = await query.OrderByDescending(k => k.CreatedAt).ToListAsync();
        return Ok(kots);
    }

    [HttpPost]
    public async Task<IActionResult> CreateKOT([FromBody] KOT kot)
    {
        kot.TenantId = GetTenantId();
        kot.CreatedAt = DateTime.UtcNow;

        if (string.IsNullOrEmpty(kot.KOTNumber))
        {
            kot.KOTNumber = await GenerateKOTNumberAsync(kot.TenantId);
        }

        _context.Set<KOT>().Add(kot);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetKOTs), new { id = kot.Id }, kot);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateKOTStatus(int id, [FromBody] UpdateKOTStatusRequest request)
    {
        var tenantId = GetTenantId();
        var kot = await _context.Set<KOT>()
            .FirstOrDefaultAsync(k => k.Id == id && k.TenantId == tenantId);

        if (kot == null) return NotFound();

        kot.Status = request.Status;
        await _context.SaveChangesAsync();
        return Ok(kot);
    }

    private async Task<string> GenerateKOTNumberAsync(int tenantId)
    {
        var date = DateTime.UtcNow;
        var dateStr = date.ToString("yyyyMMdd");
        var lastKOT = await _context.Set<KOT>()
            .Where(k => k.TenantId == tenantId && k.KOTNumber.StartsWith($"KOT-{dateStr}"))
            .OrderByDescending(k => k.KOTNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastKOT != null)
        {
            var parts = lastKOT.KOTNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"KOT-{dateStr}-{nextNumber:D4}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class UpdateKOTStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

