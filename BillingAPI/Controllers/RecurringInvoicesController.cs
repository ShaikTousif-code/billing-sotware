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
public class RecurringInvoicesController : ControllerBase
{
    private readonly IRecurringInvoiceService _recurringInvoiceService;

    public RecurringInvoicesController(IRecurringInvoiceService recurringInvoiceService)
    {
        _recurringInvoiceService = recurringInvoiceService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateRecurringInvoices()
    {
        var tenantId = GetTenantId();
        var invoices = await _recurringInvoiceService.GenerateRecurringInvoicesAsync(tenantId);
        return Ok(ApiResponse<List<ContractInvoice>>.SuccessResponse(invoices, $"Generated {invoices.Count} invoice(s)"));
    }

    [HttpPost("contract/{contractId}/generate")]
    public async Task<IActionResult> GenerateContractInvoice(int contractId, [FromBody] GenerateInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        var invoice = await _recurringInvoiceService.GenerateContractInvoiceAsync(contractId, tenantId, request.Period);
        return CreatedAtAction(nameof(GenerateContractInvoice), new { id = invoice.Id },
            ApiResponse<ContractInvoice>.SuccessResponse(invoice, "Invoice generated successfully"));
    }

    [HttpGet("expiring-contracts")]
    public async Task<IActionResult> GetExpiringContracts([FromQuery] int daysAhead = 30)
    {
        var tenantId = GetTenantId();
        var contracts = await _recurringInvoiceService.GetExpiringContractsAsync(tenantId, daysAhead);
        return Ok(ApiResponse<List<ServiceContract>>.SuccessResponse(contracts));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class GenerateInvoiceRequest
{
    public string Period { get; set; } = string.Empty;
}

