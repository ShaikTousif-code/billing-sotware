using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CostingController : ControllerBase
{
    private readonly ICostingService _costingService;

    public CostingController(ICostingService costingService)
    {
        _costingService = costingService;
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetStockCost(int productId)
    {
        var tenantId = GetTenantId();
        try
        {
            var stockCost = await _costingService.GetStockCostAsync(tenantId, productId);
            return Ok(stockCost);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("product/{productId}/details")]
    public async Task<IActionResult> GetStockCostDetails(int productId)
    {
        var tenantId = GetTenantId();
        try
        {
            var details = await _costingService.GetStockCostDetailsAsync(tenantId, productId);
            return Ok(details);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("calculate")]
    public async Task<IActionResult> CalculateCost([FromBody] CalculateCostRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var cost = await _costingService.CalculateCostAsync(
                tenantId, 
                request.ProductId, 
                request.Quantity, 
                request.CostingMethod);
            return Ok(new { cost });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class CalculateCostRequest
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string CostingMethod { get; set; } = "Average"; // Average, FIFO, LIFO
}

