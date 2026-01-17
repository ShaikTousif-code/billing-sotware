using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerPurchaseHistoryController : ControllerBase
{
    private readonly ICustomerPurchaseHistoryService _service;

    public CustomerPurchaseHistoryController(ICustomerPurchaseHistoryService service)
    {
        _service = service;
    }

    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetPurchaseHistory(int customerId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        try
        {
            var history = await _service.GetPurchaseHistoryAsync(tenantId, customerId, fromDate, toDate);
            return Ok(history);
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

