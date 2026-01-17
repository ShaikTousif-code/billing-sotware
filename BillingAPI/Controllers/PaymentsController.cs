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
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IValidator<Payment> _validator;

    public PaymentsController(IPaymentService paymentService, IValidator<Payment> validator)
    {
        _paymentService = paymentService;
        _validator = validator;
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments([FromQuery] int? invoiceId)
    {
        var tenantId = GetTenantId();
        var payments = await _paymentService.GetPaymentsAsync(tenantId, invoiceId);
        return Ok(payments);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] Payment payment)
    {
        payment.TenantId = GetTenantId();
        payment.CreatedById = GetUserId();
        payment.PaymentDate = DateTime.UtcNow;

        var created = await _paymentService.CreatePaymentAsync(payment);
        return CreatedAtAction(nameof(GetPayments), new { id = created.Id }, created);
    }

    [HttpPost("split")]
    public async Task<IActionResult> CreateSplitPayment([FromBody] SplitPaymentRequestDto request)
    {
        var tenantId = GetTenantId();
        try
        {
            var payment = await _paymentService.CreateSplitPaymentAsync(
                request.InvoiceId,
                tenantId,
                request.Payments
            );
            return Ok(payment);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePayment(int id)
    {
        var tenantId = GetTenantId();
        var deleted = await _paymentService.DeletePaymentAsync(id, tenantId);
        if (!deleted) return NotFound();
        return NoContent();
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

public class SplitPaymentRequestDto
{
    public int InvoiceId { get; set; }
    public List<SplitPaymentRequest> Payments { get; set; } = new();
}

