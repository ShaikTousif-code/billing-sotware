using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Services;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/fee-assignment")]
[Authorize]
public class FeeAssignmentController : ControllerBase
{
    private readonly IFeeAssignmentService _feeAssignmentService;
    private readonly ApplicationDbContext _context;

    public FeeAssignmentController(IFeeAssignmentService feeAssignmentService, ApplicationDbContext context)
    {
        _feeAssignmentService = feeAssignmentService;
        _context = context;
    }

    [HttpPost("student/{studentId}")]
    public async Task<IActionResult> AssignFeesToStudent(int studentId, [FromBody] AssignFeesRequest? request = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var academicYear = request?.AcademicYear ?? await GetActiveAcademicYearAsync(tenantId);
            
            var fees = await _feeAssignmentService.AssignFeesToStudentAsync(studentId, tenantId, academicYear);
            
            if (fees.Count == 0)
            {
                return Ok(ApiResponse<object>.SuccessResponse(new { Fees = fees, Count = 0 }, 
                    "No fees assigned. Please ensure fee structures are defined for this student's class and academic year."));
            }
            
            return Ok(ApiResponse<object>.SuccessResponse(new { Fees = fees, Count = fees.Count }, 
                $"Successfully assigned {fees.Count} fee(s) to student"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error assigning fees: {ex.Message}"));
        }
    }

    [HttpPost("class/{classId}")]
    public async Task<IActionResult> AssignFeesToClass(int classId, [FromBody] AssignFeesRequest? request = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var academicYear = request?.AcademicYear ?? await GetActiveAcademicYearAsync(tenantId);
            
            var fees = await _feeAssignmentService.AssignFeesToClassAsync(classId, tenantId, academicYear);
            
            if (fees.Count == 0)
            {
                return Ok(ApiResponse<object>.SuccessResponse(new { Fees = fees, Count = 0 }, 
                    "No fees assigned. Please ensure fee structures are defined for this class and academic year."));
            }
            
            return Ok(ApiResponse<object>.SuccessResponse(new { Fees = fees, Count = fees.Count }, 
                $"Successfully assigned {fees.Count} fee(s) to class"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error assigning fees: {ex.Message}"));
        }
    }

    [HttpPost("apply-late-fees")]
    public async Task<IActionResult> ApplyLateFees()
    {
        try
        {
            var tenantId = GetTenantId();
            await _feeAssignmentService.ApplyLateFeesAsync(tenantId);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Late fees applied successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error applying late fees: {ex.Message}"));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private async Task<string> GetActiveAcademicYearAsync(int tenantId)
    {
        var activeYear = await _context.AcademicYears
            .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);
        
        if (activeYear != null)
            return activeYear.Name;
        
        // Fallback: try to get academic year from classes
        var classWithYear = await _context.Classes
            .Where(c => c.TenantId == tenantId && !string.IsNullOrEmpty(c.AcademicYear))
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();
        
        if (classWithYear != null && !string.IsNullOrEmpty(classWithYear.AcademicYear))
            return classWithYear.AcademicYear;
        
        // Last resort: use current year
        return DateTime.UtcNow.Year.ToString();
    }
}

public class AssignFeesRequest
{
    public string? AcademicYear { get; set; }
}

