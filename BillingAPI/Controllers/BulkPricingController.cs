using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BulkPricingController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BulkPricingController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBulkPricing([FromQuery] int? productId, [FromQuery] string? customerType)
    {
        var tenantId = GetTenantId();
        var query = _context.BulkPricings
            .Include(bp => bp.Product)
            .Include(bp => bp.CustomerGroup)
            .Where(bp => bp.TenantId == tenantId && bp.IsActive);

        if (productId.HasValue)
        {
            query = query.Where(bp => bp.ProductId == productId.Value);
        }

        if (!string.IsNullOrEmpty(customerType))
        {
            query = query.Where(bp => bp.CustomerType == customerType);
        }

        var bulkPricing = await query.OrderBy(bp => bp.MinQuantity).ToListAsync();
        return Ok(ApiResponse<List<BulkPricing>>.SuccessResponse(bulkPricing));
    }

    [HttpPost]
    public async Task<IActionResult> CreateBulkPricing([FromBody] BulkPricing bulkPricing)
    {
        bulkPricing.TenantId = GetTenantId();
        bulkPricing.CreatedAt = DateTime.UtcNow;
        bulkPricing.UpdatedAt = DateTime.UtcNow;

        _context.BulkPricings.Add(bulkPricing);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBulkPricing), new { id = bulkPricing.Id },
            ApiResponse<BulkPricing>.SuccessResponse(bulkPricing, "Bulk pricing created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBulkPricing(int id, [FromBody] BulkPricing bulkPricing)
    {
        var tenantId = GetTenantId();
        var existing = await _context.BulkPricings
            .FirstOrDefaultAsync(bp => bp.Id == id && bp.TenantId == tenantId);

        if (existing == null)
            return NotFound(ApiResponse<BulkPricing>.ErrorResponse("Bulk pricing not found"));

        existing.MinQuantity = bulkPricing.MinQuantity;
        existing.MaxQuantity = bulkPricing.MaxQuantity;
        existing.UnitPrice = bulkPricing.UnitPrice;
        existing.DiscountPercentage = bulkPricing.DiscountPercentage;
        existing.IsActive = bulkPricing.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<BulkPricing>.SuccessResponse(existing, "Bulk pricing updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBulkPricing(int id)
    {
        var tenantId = GetTenantId();
        var bulkPricing = await _context.BulkPricings
            .FirstOrDefaultAsync(bp => bp.Id == id && bp.TenantId == tenantId);

        if (bulkPricing == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Bulk pricing not found"));

        bulkPricing.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Bulk pricing deleted successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

