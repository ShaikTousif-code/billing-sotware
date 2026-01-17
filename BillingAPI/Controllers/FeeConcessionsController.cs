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
public class FeeConcessionsController : ControllerBase
{
    private readonly IFeeConcessionService _feeConcessionService;

    public FeeConcessionsController(IFeeConcessionService feeConcessionService)
    {
        _feeConcessionService = feeConcessionService;
    }

    [HttpPost]
    public async Task<IActionResult> RequestConcession([FromBody] FeeConcession concession)
    {
        try
        {
            concession.TenantId = GetTenantId();
            concession.RequestedById = GetUserId();
            var created = await _feeConcessionService.RequestConcessionAsync(concession);
            return CreatedAtAction(nameof(GetConcession), new { id = created.Id },
                ApiResponse<FeeConcession>.SuccessResponse(created, "Concession request submitted successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<FeeConcession>.ErrorResponse($"An error occurred while creating concession: {ex.Message}"));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConcession(int id)
    {
        var tenantId = GetTenantId();
        var concession = await _feeConcessionService.GetConcessionByIdAsync(id, tenantId);
        if (concession == null)
            return NotFound(ApiResponse<FeeConcession>.ErrorResponse("Concession not found"));
        
        return Ok(ApiResponse<FeeConcession>.SuccessResponse(concession));
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetConcessions([FromQuery] int? studentId, [FromQuery] string? status)
    {
        try
        {
            var tenantId = GetTenantId();
            var concessions = await _feeConcessionService.GetConcessionsAsync(tenantId, studentId, status);
            
            // Clear circular references
            foreach (var concession in concessions)
            {
                if (concession.Student != null)
                {
                    concession.Student.Fees = null;
                    concession.Student.FeePayments = null;
                }
                if (concession.Fee != null)
                {
                    concession.Fee.Payments = null;
                }
                if (concession.RequestedBy != null)
                {
                    // Clear navigation properties if any
                }
                if (concession.ApprovedBy != null)
                {
                    // Clear navigation properties if any
                }
            }
            
            return Ok(ApiResponse<List<FeeConcession>>.SuccessResponse(concessions));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<FeeConcession>>.ErrorResponse($"An error occurred while fetching concessions: {ex.Message}"));
        }
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveConcession(int id, [FromBody] ApprovalRequest? request)
    {
        try
        {
            var tenantId = GetTenantId();
            var approved = await _feeConcessionService.ApproveConcessionAsync(id, GetUserId(), tenantId, request?.Notes);
            if (!approved)
                return NotFound(ApiResponse<object>.ErrorResponse("Concession not found"));
            
            return Ok(ApiResponse<object>.SuccessResponse(null, "Concession approved"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"An error occurred while approving concession: {ex.Message}"));
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectConcession(int id, [FromBody] RejectionRequest? request)
    {
        try
        {
            var tenantId = GetTenantId();
            var rejected = await _feeConcessionService.RejectConcessionAsync(id, tenantId, request?.Reason);
            if (!rejected)
                return NotFound(ApiResponse<object>.ErrorResponse("Concession not found"));
            
            return Ok(ApiResponse<object>.SuccessResponse(null, "Concession rejected"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"An error occurred while rejecting concession: {ex.Message}"));
        }
    }

    [HttpPost("{id}/apply-to-fee/{feeId}")]
    public async Task<IActionResult> ApplyToFee(int id, int feeId)
    {
        var tenantId = GetTenantId();
        await _feeConcessionService.ApplyConcessionToFeeAsync(id, feeId, tenantId);
        return Ok(ApiResponse<object>.SuccessResponse(null, "Concession applied to fee"));
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

public class ApprovalRequest
{
    public string? Notes { get; set; }
}

public class RejectionRequest
{
    public string? Reason { get; set; }
}

