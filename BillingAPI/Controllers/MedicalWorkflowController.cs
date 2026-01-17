using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/medical-workflow")]
[Authorize]
public class MedicalWorkflowController : ControllerBase
{
    private readonly IMedicalWorkflowService _workflowService;

    public MedicalWorkflowController(IMedicalWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpPost("medical-records/{id}/complete-consultation")]
    public async Task<IActionResult> CompleteConsultation(int id)
    {
        try
        {
            var tenantId = GetTenantId();
            var medicalRecord = await _workflowService.CompleteConsultationAsync(id, tenantId);
            return Ok(ApiResponse<MedicalRecord>.SuccessResponse(medicalRecord, "Consultation completed successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error completing consultation: {ex.Message}"));
        }
    }

    [HttpPost("medical-records/{id}/generate-medicine-bill")]
    public async Task<IActionResult> GenerateMedicineBill(int id, [FromBody] GenerateMedicalBillRequest? request = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            var invoice = await _workflowService.GenerateMedicineBillAsync(id, tenantId, request, userId);
            return Ok(ApiResponse<Invoice>.SuccessResponse(invoice, "Medicine bill generated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error generating medicine bill: {ex.Message}"));
        }
    }

    [HttpPost("invoices/{id}/process-payment-and-exit")]
    public async Task<IActionResult> ProcessPaymentAndExit(int id, [FromBody] ProcessPaymentRequest request)
    {
        try
        {
            var tenantId = GetTenantId();
            var payment = await _workflowService.ProcessPaymentAndExitAsync(
                id, 
                tenantId, 
                request.Amount, 
                request.PaymentMode, 
                request.ReferenceNumber);
            
            return Ok(ApiResponse<Payment>.SuccessResponse(payment, "Payment processed and patient workflow completed successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Error processing payment: {ex.Message}"));
        }
    }

    [HttpGet("patients/{patientId}/workflow-status")]
    public async Task<IActionResult> GetPatientWorkflowStatus(int patientId)
    {
        try
        {
            var tenantId = GetTenantId();
            var status = await _workflowService.GetPatientWorkflowStatusAsync(patientId, tenantId);
            return Ok(ApiResponse<PatientWorkflowStatus>.SuccessResponse(status));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }
}

public class ProcessPaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
}
