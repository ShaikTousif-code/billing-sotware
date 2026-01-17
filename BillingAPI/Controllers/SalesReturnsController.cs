using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/sales-returns")]
[Authorize]
public class SalesReturnsController : ControllerBase
{
    private readonly ISalesReturnService _salesReturnService;

    public SalesReturnsController(ISalesReturnService salesReturnService)
    {
        _salesReturnService = salesReturnService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSalesReturns([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var returns = await _salesReturnService.GetSalesReturnsAsync(tenantId, fromDate, toDate);
        return Ok(ApiResponse<List<SalesReturn>>.SuccessResponse(returns));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSalesReturn(int id)
    {
        var tenantId = GetTenantId();
        var salesReturn = await _salesReturnService.GetSalesReturnByIdAsync(id, tenantId);
        if (salesReturn == null) return NotFound(ApiResponse<SalesReturn>.ErrorResponse("Sales return not found."));
        return Ok(ApiResponse<SalesReturn>.SuccessResponse(salesReturn));
    }

    [HttpGet("invoice/{invoiceId}")]
    public async Task<IActionResult> GetSalesReturnsByInvoice(int invoiceId)
    {
        var tenantId = GetTenantId();
        var returns = await _salesReturnService.GetSalesReturnsByInvoiceIdAsync(invoiceId, tenantId);
        return Ok(ApiResponse<List<SalesReturn>>.SuccessResponse(returns));
    }

    [HttpPost]
    public async Task<IActionResult> CreateSalesReturn([FromBody] SalesReturn salesReturn)
    {
        salesReturn.TenantId = GetTenantId();
        salesReturn.CreatedById = GetUserId();
        try
        {
            var created = await _salesReturnService.CreateSalesReturnAsync(salesReturn);
            return CreatedAtAction(nameof(GetSalesReturn), new { id = created.Id }, 
                ApiResponse<SalesReturn>.SuccessResponse(created, "Sales return created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<SalesReturn>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveSalesReturn(int id)
    {
        var tenantId = GetTenantId();
        try
        {
            var approved = await _salesReturnService.ApproveSalesReturnAsync(id, tenantId);
            if (!approved) return NotFound(ApiResponse<object>.ErrorResponse("Sales return not found."));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Sales return approved successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/process")]
    public async Task<IActionResult> ProcessSalesReturn(int id)
    {
        var tenantId = GetTenantId();
        try
        {
            var processed = await _salesReturnService.ProcessSalesReturnAsync(id, tenantId);
            if (!processed) return NotFound(ApiResponse<object>.ErrorResponse("Sales return not found."));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Sales return processed successfully. Inventory updated and credit note created."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateReturn([FromBody] ValidateReturnRequest request)
    {
        var tenantId = GetTenantId();
        var isValid = await _salesReturnService.ValidateReturnAsync(
            request.InvoiceItemId, 
            request.Quantity, 
            request.Size, 
            request.Color, 
            tenantId);
        
        return Ok(ApiResponse<ValidateReturnResponse>.SuccessResponse(
            new ValidateReturnResponse { IsValid = isValid },
            isValid ? "Return is valid." : "Return is invalid."));
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

public class ValidateReturnRequest
{
    public int InvoiceItemId { get; set; }
    public decimal Quantity { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
}

public class ValidateReturnResponse
{
    public bool IsValid { get; set; }
}

