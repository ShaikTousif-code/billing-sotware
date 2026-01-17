using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AcademicYearsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AcademicYearsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetAcademicYears()
    {
        var tenantId = GetTenantId();
        var years = await _context.AcademicYears
            .Where(ay => ay.TenantId == tenantId)
            .OrderByDescending(ay => ay.StartDate)
            .ToListAsync();

        return Ok(ApiResponse<List<AcademicYear>>.SuccessResponse(years));
    }

    [HttpGet("active")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetActiveAcademicYear()
    {
        var tenantId = GetTenantId();
        var activeYear = await _context.AcademicYears
            .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);

        return Ok(ApiResponse<AcademicYear?>.SuccessResponse(activeYear));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAcademicYear([FromBody] AcademicYear academicYear)
    {
        var tenantId = GetTenantId();

        // If setting as active, deactivate all other years
        if (academicYear.IsActive)
        {
            var existingActive = await _context.AcademicYears
                .Where(ay => ay.TenantId == tenantId && ay.IsActive)
                .ToListAsync();
            
            foreach (var year in existingActive)
            {
                year.IsActive = false;
            }
        }

        academicYear.TenantId = tenantId;
        academicYear.CreatedAt = DateTime.UtcNow;
        
        _context.AcademicYears.Add(academicYear);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAcademicYears), null,
            ApiResponse<AcademicYear>.SuccessResponse(academicYear, "Academic year created successfully"));
    }

    [HttpPut("{id}/activate")]
    public async Task<IActionResult> ActivateAcademicYear(int id)
    {
        var tenantId = GetTenantId();
        var year = await _context.AcademicYears
            .FirstOrDefaultAsync(ay => ay.Id == id && ay.TenantId == tenantId);

        if (year == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Academic year not found"));

        // Deactivate all other years
        var allYears = await _context.AcademicYears
            .Where(ay => ay.TenantId == tenantId)
            .ToListAsync();
        
        foreach (var ay in allYears)
        {
            ay.IsActive = (ay.Id == id);
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<AcademicYear>.SuccessResponse(year, "Academic year activated successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

