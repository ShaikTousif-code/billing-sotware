using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertsController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStockAlerts()
    {
        var tenantId = GetTenantId();
        var alerts = await _alertService.GetLowStockAlertsAsync(tenantId);
        return Ok(alerts);
    }

    [HttpGet("expiry")]
    public async Task<IActionResult> GetExpiryAlerts([FromQuery] int daysAhead = 30)
    {
        var tenantId = GetTenantId();
        var alerts = await _alertService.GetExpiryAlertsAsync(tenantId, daysAhead);
        return Ok(alerts);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

