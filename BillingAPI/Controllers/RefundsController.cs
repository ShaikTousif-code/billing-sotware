using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RefundsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RefundsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRefunds([FromQuery] int? invoiceId, [FromQuery] int? creditNoteId)
    {
        var tenantId = GetTenantId();
        var query = _context.Refunds.Where(r => r.TenantId == tenantId);

        if (invoiceId.HasValue)
            query = query.Where(r => r.InvoiceId == invoiceId.Value);
        if (creditNoteId.HasValue)
            query = query.Where(r => r.CreditNoteId == creditNoteId.Value);

        var refunds = await query.OrderByDescending(r => r.RefundDate).ToListAsync();
        return Ok(refunds);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRefund([FromBody] Refund refund)
    {
        refund.TenantId = GetTenantId();
        refund.CreatedById = GetUserId();
        refund.RefundDate = DateTime.UtcNow;

        if (string.IsNullOrEmpty(refund.RefundNumber))
        {
            refund.RefundNumber = await GenerateRefundNumberAsync(refund.TenantId);
        }

        _context.Refunds.Add(refund);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRefunds), new { id = refund.Id }, refund);
    }

    [HttpPost("{id}/process")]
    public async Task<IActionResult> ProcessRefund(int id)
    {
        var tenantId = GetTenantId();
        var refund = await _context.Refunds
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);

        if (refund == null) return NotFound();

        refund.Status = "Processed";
        refund.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Refund processed successfully" });
    }

    private async Task<string> GenerateRefundNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastRefund = await _context.Refunds
            .Where(r => r.TenantId == tenantId && r.RefundNumber.StartsWith($"REF-{year}"))
            .OrderByDescending(r => r.RefundNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastRefund != null)
        {
            var parts = lastRefund.RefundNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"REF-{year}-{nextNumber:D6}";
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

