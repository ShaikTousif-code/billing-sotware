using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Validators;
using FluentValidation;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IValidator<Invoice> _validator;

    public InvoicesController(IInvoiceService invoiceService, IValidator<Invoice> validator)
    {
        _invoiceService = invoiceService;
        _validator = validator;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var invoices = await _invoiceService.GetInvoicesAsync(tenantId, fromDate, toDate);
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvoice(int id)
    {
        var tenantId = GetTenantId();
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id, tenantId);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] Invoice invoice)
    {
        var validationResult = await _validator.ValidateAsync(invoice);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Invoice>.ErrorResponse("Validation failed", errors));
        }

        invoice.TenantId = GetTenantId();
        invoice.CreatedById = GetUserId();
        var created = await _invoiceService.CreateInvoiceAsync(invoice);
        return CreatedAtAction(nameof(GetInvoice), new { id = created.Id }, 
            ApiResponse<Invoice>.SuccessResponse(created, "Invoice created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInvoice(int id, [FromBody] Invoice invoice)
    {
        var tenantId = GetTenantId();
        if (id != invoice.Id || invoice.TenantId != tenantId)
            return BadRequest();

        var updated = await _invoiceService.UpdateInvoiceAsync(invoice);
        return Ok(updated);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelInvoice(int id, [FromBody] CancelInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        var cancelled = await _invoiceService.CancelInvoiceAsync(id, tenantId, request.Reason);
        if (!cancelled) return NotFound();
        return Ok(new { message = "Invoice cancelled successfully" });
    }

    [HttpPost("{id}/hold")]
    public async Task<IActionResult> HoldInvoice(int id)
    {
        var tenantId = GetTenantId();
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id, tenantId);
        if (invoice == null) return NotFound();

        invoice.Status = "Hold";
        await _invoiceService.UpdateInvoiceAsync(invoice);
        return Ok(new { message = "Invoice put on hold" });
    }

    [HttpPost("{id}/resume")]
    public async Task<IActionResult> ResumeInvoice(int id)
    {
        var tenantId = GetTenantId();
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id, tenantId);
        if (invoice == null) return NotFound();

        if (invoice.Status == "Hold")
        {
            invoice.Status = "Draft";
            await _invoiceService.UpdateInvoiceAsync(invoice);
            return Ok(new { message = "Invoice resumed" });
        }

        return BadRequest(new { message = "Invoice is not on hold" });
    }

    [HttpPost("{id}/duplicate")]
    public async Task<IActionResult> DuplicateInvoice(int id)
    {
        var tenantId = GetTenantId();
        var originalInvoice = await _invoiceService.GetInvoiceByIdAsync(id, tenantId);
        if (originalInvoice == null) return NotFound();

        var duplicateInvoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceDate = DateTime.UtcNow,
            CustomerId = originalInvoice.CustomerId,
            CustomerName = originalInvoice.CustomerName,
            Status = "Draft",
            CreatedById = GetUserId(),
            Items = originalInvoice.Items.Select(item => new InvoiceItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountAmount = item.DiscountAmount,
                TaxRate = item.TaxRate,
                TaxAmount = item.TaxAmount,
                TotalAmount = item.TotalAmount
            }).ToList()
        };

        var created = await _invoiceService.CreateInvoiceAsync(duplicateInvoice);
        return Ok(created);
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

public class CancelInvoiceRequest
{
    public string Reason { get; set; } = string.Empty;
}

