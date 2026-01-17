using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _loyaltyService;

    public LoyaltyController(ILoyaltyService loyaltyService)
    {
        _loyaltyService = loyaltyService;
    }

    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetLoyaltyPoints(int customerId)
    {
        var points = await _loyaltyService.GetLoyaltyPointsAsync(customerId);
        return Ok(ApiResponse<decimal>.SuccessResponse(points));
    }

    [HttpGet("customer/{customerId}/transactions")]
    public async Task<IActionResult> GetLoyaltyTransactions(int customerId)
    {
        var tenantId = GetTenantId();
        var transactions = await _loyaltyService.GetLoyaltyTransactionsAsync(tenantId, customerId);
        return Ok(ApiResponse<List<BillingAPI.Models.LoyaltyTransaction>>.SuccessResponse(transactions));
    }

    [HttpPost("customer/{customerId}/redeem")]
    public async Task<IActionResult> RedeemLoyaltyPoints(int customerId, [FromBody] RedeemLoyaltyPointsRequest request)
    {
        var tenantId = GetTenantId();
        var success = await _loyaltyService.RedeemLoyaltyPointsAsync(tenantId, customerId, request.Points, request.InvoiceId);
        
        if (!success)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Insufficient loyalty points"));
        }

        return Ok(ApiResponse<object>.SuccessResponse(null, "Loyalty points redeemed successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class RedeemLoyaltyPointsRequest
{
    public decimal Points { get; set; }
    public int InvoiceId { get; set; }
}

