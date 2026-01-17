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
public class PriceListsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PriceListsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPriceLists()
    {
        var tenantId = GetTenantId();
        var priceLists = await _context.PriceLists
            .Include(pl => pl.Items)
            .Where(pl => pl.TenantId == tenantId && pl.IsActive)
            .ToListAsync();
        return Ok(priceLists);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPriceList(int id)
    {
        var tenantId = GetTenantId();
        var priceList = await _context.PriceLists
            .Include(pl => pl.Items)
            .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(pl => pl.Id == id && pl.TenantId == tenantId);
        
        if (priceList == null) return NotFound();
        return Ok(priceList);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePriceList([FromBody] PriceList priceList)
    {
        priceList.TenantId = GetTenantId();
        priceList.CreatedAt = DateTime.UtcNow;
        
        _context.PriceLists.Add(priceList);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPriceList), new { id = priceList.Id }, priceList);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePriceList(int id, [FromBody] PriceList priceList)
    {
        var tenantId = GetTenantId();
        if (id != priceList.Id || priceList.TenantId != tenantId)
            return BadRequest();

        _context.PriceLists.Update(priceList);
        await _context.SaveChangesAsync();
        return Ok(priceList);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePriceList(int id)
    {
        var tenantId = GetTenantId();
        var priceList = await _context.PriceLists
            .FirstOrDefaultAsync(pl => pl.Id == id && pl.TenantId == tenantId);
        
        if (priceList == null) return NotFound();
        
        priceList.IsActive = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/price/{productId}")]
    public async Task<IActionResult> GetProductPrice(int id, int productId, [FromQuery] decimal? quantity = null)
    {
        var tenantId = GetTenantId();
        var priceListItem = await _context.PriceListItems
            .Where(item => item.PriceListId == id 
                && item.ProductId == productId
                && (!quantity.HasValue || item.MinimumQuantity == null || quantity >= item.MinimumQuantity)
                && (item.ValidFrom == null || item.ValidFrom <= DateTime.UtcNow)
                && (item.ValidTo == null || item.ValidTo >= DateTime.UtcNow))
            .OrderBy(item => item.MinimumQuantity ?? 0)
            .FirstOrDefaultAsync();

        if (priceListItem == null) return NotFound();
        return Ok(new { Price = priceListItem.Price });
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

