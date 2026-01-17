using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/medical-codes")]
[Authorize]
public class MedicalCodesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MedicalCodesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("icd10")]
    public async Task<IActionResult> GetICD10Codes([FromQuery] string? search, [FromQuery] string? category)
    {
        var query = _context.ICD10Codes.Where(c => c.IsActive);

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c =>
                c.Code.Contains(search) ||
                c.Description.Contains(search));
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(c => c.Category == category);
        }

        var codes = await query
            .OrderBy(c => c.Code)
            .Take(100)
            .ToListAsync();

        return Ok(ApiResponse<List<ICD10Code>>.SuccessResponse(codes));
    }

    [HttpGet("icd10/{code}")]
    public async Task<IActionResult> GetICD10Code(string code)
    {
        var icdCode = await _context.ICD10Codes
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

        if (icdCode == null)
            return NotFound(ApiResponse<ICD10Code>.ErrorResponse("ICD-10 code not found"));

        return Ok(ApiResponse<ICD10Code>.SuccessResponse(icdCode));
    }

    [HttpGet("cpt")]
    public async Task<IActionResult> GetCPTCodes([FromQuery] string? search, [FromQuery] string? category)
    {
        var query = _context.CPTCodes.Where(c => c.IsActive);

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c =>
                c.Code.Contains(search) ||
                c.Description.Contains(search));
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(c => c.Category == category);
        }

        var codes = await query
            .OrderBy(c => c.Code)
            .Take(100)
            .ToListAsync();

        return Ok(ApiResponse<List<CPTCode>>.SuccessResponse(codes));
    }

    [HttpGet("cpt/{code}")]
    public async Task<IActionResult> GetCPTCode(string code)
    {
        var cptCode = await _context.CPTCodes
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

        if (cptCode == null)
            return NotFound(ApiResponse<CPTCode>.ErrorResponse("CPT code not found"));

        return Ok(ApiResponse<CPTCode>.SuccessResponse(cptCode));
    }

    [HttpPost("icd10")]
    public async Task<IActionResult> CreateICD10Code([FromBody] ICD10Code code)
    {
        _context.ICD10Codes.Add(code);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetICD10Code), new { code = code.Code },
            ApiResponse<ICD10Code>.SuccessResponse(code, "ICD-10 code created successfully"));
    }

    [HttpPost("cpt")]
    public async Task<IActionResult> CreateCPTCode([FromBody] CPTCode code)
    {
        _context.CPTCodes.Add(code);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCPTCode), new { code = code.Code },
            ApiResponse<CPTCode>.SuccessResponse(code, "CPT code created successfully"));
    }
}

