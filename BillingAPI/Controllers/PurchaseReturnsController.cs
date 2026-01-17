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
public class PurchaseReturnsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PurchaseReturnsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPurchaseReturns([FromQuery] int? purchaseOrderId)
    {
        var tenantId = GetTenantId();
        var query = _context.PurchaseReturns
            .Include(pr => pr.PurchaseOrder)
            .Include(pr => pr.Items)
            .Where(pr => pr.TenantId == tenantId);

        if (purchaseOrderId.HasValue)
            query = query.Where(pr => pr.PurchaseOrderId == purchaseOrderId.Value);

        var returns = await query.OrderByDescending(pr => pr.ReturnDate).ToListAsync();
        return Ok(returns);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePurchaseReturn([FromBody] PurchaseReturn purchaseReturn)
    {
        purchaseReturn.TenantId = GetTenantId();
        purchaseReturn.CreatedById = GetUserId();
        purchaseReturn.ReturnDate = DateTime.UtcNow;

        if (string.IsNullOrEmpty(purchaseReturn.ReturnNumber))
        {
            purchaseReturn.ReturnNumber = await GenerateReturnNumberAsync(purchaseReturn.TenantId);
        }

        purchaseReturn.TotalAmount = purchaseReturn.Items.Sum(i => i.TotalAmount);

        _context.PurchaseReturns.Add(purchaseReturn);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPurchaseReturns), new { id = purchaseReturn.Id }, purchaseReturn);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveReturn(int id)
    {
        var tenantId = GetTenantId();
        var purchaseReturn = await _context.PurchaseReturns
            .Include(pr => pr.Items)
            .FirstOrDefaultAsync(pr => pr.Id == id && pr.TenantId == tenantId);

        if (purchaseReturn == null) return NotFound();

        purchaseReturn.Status = "Approved";
        
        // Update inventory
        foreach (var item in purchaseReturn.Items)
        {
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(inv => inv.TenantId == tenantId && inv.ProductId == item.ProductId);

            if (inventory != null)
            {
                inventory.Quantity -= (int)item.Quantity;
                inventory.LastUpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Return approved and inventory updated" });
    }

    private async Task<string> GenerateReturnNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastReturn = await _context.PurchaseReturns
            .Where(pr => pr.TenantId == tenantId && pr.ReturnNumber.StartsWith($"PR-{year}"))
            .OrderByDescending(pr => pr.ReturnNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReturn != null)
        {
            var parts = lastReturn.ReturnNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"PR-{year}-{nextNumber:D6}";
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

