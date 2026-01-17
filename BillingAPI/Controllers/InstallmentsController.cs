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
public class InstallmentsController : ControllerBase
{
    private readonly IInstallmentService _installmentService;

    public InstallmentsController(IInstallmentService installmentService)
    {
        _installmentService = installmentService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateInstallmentPlan([FromBody] InstallmentPlan plan)
    {
        plan.TenantId = GetTenantId();
        var created = await _installmentService.CreateInstallmentPlanAsync(plan);
        return CreatedAtAction(nameof(GetInstallmentPlan), new { id = created.Id },
            ApiResponse<InstallmentPlan>.SuccessResponse(created, "Installment plan created successfully"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInstallmentPlan(int id)
    {
        var tenantId = GetTenantId();
        var plan = await _installmentService.GetInstallmentPlanByIdAsync(id, tenantId);
        if (plan == null)
            return NotFound(ApiResponse<InstallmentPlan>.ErrorResponse("Installment plan not found"));
        
        return Ok(ApiResponse<InstallmentPlan>.SuccessResponse(plan));
    }

    [HttpGet]
    public async Task<IActionResult> GetInstallmentPlans([FromQuery] int? studentId)
    {
        var tenantId = GetTenantId();
        var plans = await _installmentService.GetInstallmentPlansAsync(tenantId, studentId);
        return Ok(ApiResponse<List<InstallmentPlan>>.SuccessResponse(plans));
    }

    [HttpPost("{id}/payment")]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] InstallmentPaymentRequest request)
    {
        var installment = await _installmentService.RecordInstallmentPaymentAsync(
            id, request.Amount, request.PaymentMode, request.TransactionId);
        return Ok(ApiResponse<Installment>.SuccessResponse(installment, "Payment recorded successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelPlan(int id)
    {
        var tenantId = GetTenantId();
        var cancelled = await _installmentService.CancelInstallmentPlanAsync(id, tenantId);
        if (!cancelled)
            return NotFound(ApiResponse<object>.ErrorResponse("Installment plan not found"));
        
        return Ok(ApiResponse<object>.SuccessResponse(null, "Installment plan cancelled"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class InstallmentPaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
}

