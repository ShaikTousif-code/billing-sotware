using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/fees")]
[Authorize]
public class FeesController : ControllerBase
{
    private readonly IFeeService _feeService;
    private readonly ILogger<FeesController> _logger;

    public FeesController(IFeeService feeService, ILogger<FeesController> logger)
    {
        _feeService = feeService;
        _logger = logger;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetFees([FromQuery] int? studentId, [FromQuery] string? status)
    {
        try
        {
            var tenantId = GetTenantId();
            var fees = await _feeService.GetFeesAsync(tenantId, studentId, status);
            return Ok(ApiResponse<List<Fee>>.SuccessResponse(fees));
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            _logger.LogError(ex, "Error fetching fees for tenant {TenantId}, studentId: {StudentId}, status: {Status}", 
                GetTenantId(), studentId, status);
            return StatusCode(500, ApiResponse<List<Fee>>.ErrorResponse($"An error occurred while fetching fees: {ex.Message}"));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFee(int id)
    {
        var tenantId = GetTenantId();
        var fee = await _feeService.GetFeeByIdAsync(id, tenantId);
        if (fee == null)
            return NotFound(ApiResponse<Fee>.ErrorResponse("Fee not found"));
        
        return Ok(ApiResponse<Fee>.SuccessResponse(fee));
    }

    [HttpGet("payment/{id}")]
    public async Task<IActionResult> GetFeePayment(int id)
    {
        var tenantId = GetTenantId();
        var payment = await _feeService.GetFeePaymentByIdAsync(id, tenantId);
        if (payment == null)
            return NotFound(ApiResponse<FeePayment>.ErrorResponse("Payment not found"));

        return Ok(ApiResponse<FeePayment>.SuccessResponse(payment));
    }

    [HttpPost]
    public async Task<IActionResult> CreateFee([FromBody] Fee fee)
    {
        fee.TenantId = GetTenantId();
        var created = await _feeService.CreateFeeAsync(fee);
        return CreatedAtAction(nameof(GetFee), new { id = created.Id },
            ApiResponse<Fee>.SuccessResponse(created, "Fee created successfully"));
    }

    [HttpPost("generate-class-fees")]
    public async Task<IActionResult> GenerateClassFees([FromBody] GenerateClassFeesRequest request)
    {
        var tenantId = GetTenantId();
        var fees = await _feeService.GenerateFeesForClassAsync(request.ClassId, tenantId, request.Term ?? "");
        return Ok(ApiResponse<List<Fee>>.SuccessResponse(fees, $"Generated {fees.Count} fees"));
    }

    [HttpPost("payment")]
    public async Task<IActionResult> RecordPayment([FromBody] FeePayment payment)
    {
        payment.TenantId = GetTenantId();
        payment.CreatedById = GetUserId();
        var created = await _feeService.RecordFeePaymentAsync(payment);
        return CreatedAtAction(nameof(GetFee), new { id = payment.FeeId },
            ApiResponse<FeePayment>.SuccessResponse(created, "Payment recorded successfully"));
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

public class GenerateClassFeesRequest
{
    public int ClassId { get; set; }
    public string? Term { get; set; }
}

