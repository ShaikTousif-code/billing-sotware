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
public class WarehousesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WarehousesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetWarehouses()
    {
        var tenantId = GetTenantId();
        var warehouses = await _context.Warehouses
            .Where(w => w.TenantId == tenantId && w.IsActive)
            .ToListAsync();
        return Ok(warehouses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetWarehouse(int id)
    {
        var tenantId = GetTenantId();
        var warehouse = await _context.Warehouses
            .Include(w => w.Inventories)
            .ThenInclude(inv => inv.Product)
            .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
        
        if (warehouse == null) return NotFound();
        return Ok(warehouse);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWarehouse([FromBody] Warehouse warehouse)
    {
        warehouse.TenantId = GetTenantId();
        warehouse.CreatedAt = DateTime.UtcNow;
        
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] Warehouse warehouse)
    {
        var tenantId = GetTenantId();
        if (id != warehouse.Id || warehouse.TenantId != tenantId)
            return BadRequest();

        _context.Warehouses.Update(warehouse);
        await _context.SaveChangesAsync();
        return Ok(warehouse);
    }

    [HttpGet("{id}/inventory")]
    public async Task<IActionResult> GetWarehouseInventory(int id)
    {
        var tenantId = GetTenantId();
        var inventory = await _context.WarehouseInventories
            .Include(inv => inv.Product)
            .Where(inv => inv.WarehouseId == id)
            .ToListAsync();
        
        return Ok(inventory);
    }

    [HttpPost("{id}/inventory")]
    public async Task<IActionResult> UpdateWarehouseInventory(int id, [FromBody] WarehouseInventory inventory)
    {
        var tenantId = GetTenantId();
        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
        
        if (warehouse == null) return NotFound();

        var existing = await _context.WarehouseInventories
            .FirstOrDefaultAsync(inv => inv.WarehouseId == id && inv.ProductId == inventory.ProductId);

        if (existing == null)
        {
            inventory.WarehouseId = id;
            inventory.LastUpdatedAt = DateTime.UtcNow;
            _context.WarehouseInventories.Add(inventory);
        }
        else
        {
            existing.Quantity = inventory.Quantity;
            existing.AverageCost = inventory.AverageCost;
            existing.LastUpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(inventory);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

