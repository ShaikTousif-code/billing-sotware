using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/bundle-products")]
[Authorize]
public class BundleProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BundleProductsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBundleProducts()
    {
        var tenantId = GetTenantId();
        var bundles = await _context.BundleProducts
            .Include(b => b.Items)
            .ThenInclude(i => i.Product)
            .Where(b => b.TenantId == tenantId && b.IsActive)
            .ToListAsync();
        return Ok(ApiResponse<List<BundleProduct>>.SuccessResponse(bundles));
    }

    [HttpPost]
    public async Task<IActionResult> CreateBundleProduct([FromBody] BundleProduct bundle)
    {
        bundle.TenantId = GetTenantId();
        bundle.CreatedAt = DateTime.UtcNow;
        
        _context.BundleProducts.Add(bundle);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBundleProducts), new { id = bundle.Id }, 
            ApiResponse<BundleProduct>.SuccessResponse(bundle, "Bundle product created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBundleProduct(int id, [FromBody] BundleProduct bundle)
    {
        var tenantId = GetTenantId();
        if (id != bundle.Id || bundle.TenantId != tenantId)
            return BadRequest(ApiResponse<BundleProduct>.ErrorResponse("Invalid bundle product data"));

        _context.BundleProducts.Update(bundle);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<BundleProduct>.SuccessResponse(bundle, "Bundle product updated successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

