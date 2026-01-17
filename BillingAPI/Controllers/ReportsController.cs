using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesReport([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        var report = await _reportService.GetSalesReportAsync(tenantId, fromDate, toDate);
        return Ok(report);
    }

    [HttpGet("product-sales")]
    public async Task<IActionResult> GetProductSalesReport([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        var report = await _reportService.GetProductSalesReportAsync(tenantId, fromDate, toDate);
        return Ok(report);
    }

    [HttpGet("stock-summary")]
    public async Task<IActionResult> GetStockSummary()
    {
        var tenantId = GetTenantId();
        var report = await _reportService.GetStockSummaryAsync(tenantId);
        return Ok(report);
    }

    [HttpGet("customer-ledger/{customerId}")]
    public async Task<IActionResult> GetCustomerLedger(int customerId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        try
        {
            var report = await _reportService.GetCustomerLedgerAsync(tenantId, customerId, fromDate, toDate);
            return Ok(report);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("tax-summary")]
    public async Task<IActionResult> GetTaxSummary([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        var report = await _reportService.GetTaxSummaryAsync(tenantId, fromDate, toDate);
        return Ok(report);
    }

    [HttpGet("profit-loss")]
    public async Task<IActionResult> GetProfitLoss([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        var report = await _reportService.GetProfitLossReportAsync(tenantId, fromDate, toDate);
        return Ok(report);
    }

    [HttpGet("payment-mode")]
    public async Task<IActionResult> GetPaymentModeReport([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();
        var report = await _reportService.GetPaymentModeReportAsync(tenantId, fromDate, toDate);
        return Ok(report);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

