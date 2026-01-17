using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;
using System.Linq;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GRNController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GRNController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetGRNs([FromQuery] int? purchaseOrderId)
    {
        var tenantId = GetTenantId();
        var query = _context.Set<GRN>()
            .Include(g => g.PurchaseOrder)
            .Include(g => g.Items)
            .Where(g => g.TenantId == tenantId);

        if (purchaseOrderId.HasValue)
            query = query.Where(g => g.PurchaseOrderId == purchaseOrderId.Value);

        var grns = await query.OrderByDescending(g => g.GRNDate).ToListAsync();
        return Ok(grns);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGRN([FromBody] GRN grn)
    {
        grn.TenantId = GetTenantId();
        grn.CreatedById = GetUserId();
        grn.GRNDate = DateTime.UtcNow;

        if (string.IsNullOrEmpty(grn.GRNNumber))
        {
            grn.GRNNumber = await GenerateGRNNumberAsync(grn.TenantId);
        }

        grn.TotalAmount = grn.Items.Sum(i => i.TotalAmount);

        _context.Set<GRN>().Add(grn);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetGRNs), new { id = grn.Id }, grn);
    }

    [HttpPost("{id}/receive")]
    public async Task<IActionResult> ReceiveGRN(int id)
    {
        var tenantId = GetTenantId();
        var grn = await _context.Set<GRN>()
            .Include(g => g.Items)
            .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId);

        if (grn == null) return NotFound();

        grn.Status = "Received";

        // Update inventory
        foreach (var item in grn.Items)
        {
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(inv => inv.TenantId == tenantId && inv.ProductId == item.ProductId);

            if (inventory != null)
            {
                inventory.Quantity += (int)item.ReceivedQuantity;
                inventory.LastUpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.Inventories.Add(new Inventory
                {
                    TenantId = tenantId,
                    ProductId = item.ProductId,
                    Quantity = (int)item.ReceivedQuantity,
                    LastUpdatedAt = DateTime.UtcNow
                });
            }

            // Create batch if batch number provided
            if (!string.IsNullOrEmpty(item.BatchNumber))
            {
                _context.Batches.Add(new Batch
                {
                    TenantId = tenantId,
                    ProductId = item.ProductId,
                    BatchNumber = item.BatchNumber,
                    Quantity = (int)item.ReceivedQuantity,
                    UnitCost = item.UnitPrice,
                    // PurchaseDate not available in Batch model, using CreatedAt default
                    ExpiryDate = item.ExpiryDate,
                    IsExpired = false
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "GRN received and inventory updated" });
    }

    private async Task<string> GenerateGRNNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastGRN = await _context.Set<GRN>()
            .Where(g => g.TenantId == tenantId && g.GRNNumber.StartsWith($"GRN-{year}"))
            .OrderByDescending(g => g.GRNNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastGRN != null)
        {
            var parts = lastGRN.GRNNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"GRN-{year}-{nextNumber:D6}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

