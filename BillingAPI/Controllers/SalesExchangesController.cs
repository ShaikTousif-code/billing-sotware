using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/sales-exchanges")]
[Authorize]
public class SalesExchangesController : ControllerBase
{
    private readonly ISalesExchangeService _salesExchangeService;

    public SalesExchangesController(ISalesExchangeService salesExchangeService)
    {
        _salesExchangeService = salesExchangeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSalesExchanges([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var exchanges = await _salesExchangeService.GetSalesExchangesAsync(tenantId, fromDate, toDate);
        return Ok(ApiResponse<List<SalesExchange>>.SuccessResponse(exchanges));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSalesExchange(int id)
    {
        var tenantId = GetTenantId();
        var exchange = await _salesExchangeService.GetSalesExchangeByIdAsync(id, tenantId);
        if (exchange == null) return NotFound(ApiResponse<SalesExchange>.ErrorResponse("Sales exchange not found."));
        return Ok(ApiResponse<SalesExchange>.SuccessResponse(exchange));
    }

    [HttpGet("invoice/{invoiceId}")]
    public async Task<IActionResult> GetSalesExchangesByInvoice(int invoiceId)
    {
        var tenantId = GetTenantId();
        var exchanges = await _salesExchangeService.GetSalesExchangesByInvoiceIdAsync(invoiceId, tenantId);
        return Ok(ApiResponse<List<SalesExchange>>.SuccessResponse(exchanges));
    }

    [HttpPost]
    public async Task<IActionResult> CreateSalesExchange([FromBody] SalesExchange exchange)
    {
        exchange.TenantId = GetTenantId();
        exchange.CreatedById = GetUserId();
        try
        {
            var created = await _salesExchangeService.CreateSalesExchangeAsync(exchange);
            return CreatedAtAction(nameof(GetSalesExchange), new { id = created.Id }, 
                ApiResponse<SalesExchange>.SuccessResponse(created, "Sales exchange created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<SalesExchange>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveSalesExchange(int id)
    {
        var tenantId = GetTenantId();
        try
        {
            var approved = await _salesExchangeService.ApproveSalesExchangeAsync(id, tenantId);
            if (!approved) return NotFound(ApiResponse<object>.ErrorResponse("Sales exchange not found."));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Sales exchange approved successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/process")]
    public async Task<IActionResult> ProcessSalesExchange(int id)
    {
        var tenantId = GetTenantId();
        try
        {
            var processed = await _salesExchangeService.ProcessSalesExchangeAsync(id, tenantId);
            if (!processed) return NotFound(ApiResponse<object>.ErrorResponse("Sales exchange not found."));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Sales exchange processed successfully. Inventory updated."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("calculate-price-difference")]
    public async Task<IActionResult> CalculatePriceDifference([FromBody] SalesExchange exchange)
    {
        try
        {
            var priceDifference = await _salesExchangeService.CalculatePriceDifferenceAsync(exchange);
            return Ok(ApiResponse<PriceDifferenceResponse>.SuccessResponse(
                new PriceDifferenceResponse { PriceDifference = priceDifference },
                priceDifference > 0 
                    ? $"Customer needs to pay ₹{priceDifference:F2}" 
                    : priceDifference < 0 
                        ? $"Customer will receive ₹{Math.Abs(priceDifference):F2}" 
                        : "No price difference."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PriceDifferenceResponse>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateExchange([FromBody] ValidateExchangeRequest request)
    {
        var tenantId = GetTenantId();
        var isValid = await _salesExchangeService.ValidateExchangeAsync(
            request.InvoiceItemId, 
            request.OldSize, 
            request.OldColor, 
            request.NewSize, 
            request.NewColor, 
            tenantId);
        
        return Ok(ApiResponse<ValidateExchangeResponse>.SuccessResponse(
            new ValidateExchangeResponse { IsValid = isValid },
            isValid ? "Exchange is valid." : "Exchange is invalid."));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

public class ValidateExchangeRequest
{
    public int InvoiceItemId { get; set; }
    public string? OldSize { get; set; }
    public string? OldColor { get; set; }
    public string? NewSize { get; set; }
    public string? NewColor { get; set; }
}

public class ValidateExchangeResponse
{
    public bool IsValid { get; set; }
}

public class PriceDifferenceResponse
{
    public decimal PriceDifference { get; set; }
}

