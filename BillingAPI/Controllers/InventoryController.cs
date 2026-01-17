using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInventory()
    {
        var tenantId = GetTenantId();
        var inventory = await _inventoryService.GetInventoryAsync(tenantId);
        return Ok(ApiResponse<List<Inventory>>.SuccessResponse(inventory));
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetInventoryByProduct(int productId)
    {
        var tenantId = GetTenantId();
        var inventory = await _inventoryService.GetInventoryByProductIdAsync(productId, tenantId);
        if (inventory == null)
        {
            return NotFound(ApiResponse<Inventory?>.ErrorResponse("Inventory not found for this product"));
        }
        return Ok(ApiResponse<Inventory>.SuccessResponse(inventory));
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> AdjustInventory([FromBody] AdjustInventoryRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var inventory = await _inventoryService.UpdateInventoryAsync(
                request.ProductId,
                tenantId,
                request.Quantity,
                request.UnitCost,
                request.AddToExisting
            );
            return Ok(ApiResponse<Inventory>.SuccessResponse(inventory));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Inventory>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetStockTransactions([FromQuery] int? productId = null)
    {
        var tenantId = GetTenantId();
        var transactions = await _inventoryService.GetStockTransactionsAsync(tenantId, productId);
        return Ok(ApiResponse<List<StockTransaction>>.SuccessResponse(transactions));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class AdjustInventoryRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public bool AddToExisting { get; set; } = false;
}

