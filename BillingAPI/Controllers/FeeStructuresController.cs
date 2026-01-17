using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/fee-structures")]
[Authorize]
public class FeeStructuresController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FeeStructuresController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetFeeStructures([FromQuery] int? classId, [FromQuery] string? academicYear, [FromQuery] bool? includeInactive)
    {
        var tenantId = GetTenantId();
        var query = _context.FeeStructures
            .Include(fs => fs.Class)
            .Include(fs => fs.FeeHead)
            .Where(fs => fs.TenantId == tenantId);

        if (classId.HasValue)
            query = query.Where(fs => fs.ClassId == classId.Value);

        if (!string.IsNullOrEmpty(academicYear))
            query = query.Where(fs => fs.AcademicYear == academicYear);

        // Filter by active status unless includeInactive is true
        if (!includeInactive.HasValue || !includeInactive.Value)
            query = query.Where(fs => fs.IsActive);

        var feeStructures = await query
            .Include(fs => fs.Installments)
            .OrderBy(fs => fs.ClassId)
            .ThenBy(fs => fs.Name)
            .ToListAsync();

        // Calculate installment info for each fee structure
        foreach (var fs in feeStructures)
        {
            var installmentCount = fs.Installments?.Count(fi => fi.IsActive) ?? 0;
            var totalInstallmentAmount = fs.Installments?.Where(fi => fi.IsActive).Sum(fi => fi.Amount) ?? 0;
            
            // Check if installments are configured
            var hasInstallments = installmentCount > 0;
            var isInstallmentBased = hasInstallments || (fs.MaxInstallments.HasValue && fs.MaxInstallments > 1);
            
            // Clear circular references
            if (fs.Class != null)
                fs.Class.FeeStructures = null;
            if (fs.FeeHead != null)
                fs.FeeHead = null;
            
            // Store installment info (we'll add these as computed properties in DTO or use anonymous type)
            // For now, we'll include installments in the response
        }

        return Ok(ApiResponse<List<FeeStructure>>.SuccessResponse(feeStructures));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFeeStructure(int id)
    {
        var tenantId = GetTenantId();
        var feeStructure = await _context.FeeStructures
            .Include(fs => fs.Class)
            .Include(fs => fs.FeeHead)
            .Include(fs => fs.Installments)
            .FirstOrDefaultAsync(fs => fs.Id == id && fs.TenantId == tenantId);

        if (feeStructure == null)
            return NotFound(ApiResponse<FeeStructure>.ErrorResponse("Fee structure not found"));

        // Clear circular references
        if (feeStructure.Class != null)
            feeStructure.Class.FeeStructures = null;

        return Ok(ApiResponse<FeeStructure>.SuccessResponse(feeStructure));
    }

    [HttpPost]
    public async Task<IActionResult> CreateFeeStructure([FromBody] FeeStructure feeStructure)
    {
        if (string.IsNullOrWhiteSpace(feeStructure.Name))
        {
            return BadRequest(ApiResponse<FeeStructure>.ErrorResponse("Fee structure name is required"));
        }

        var tenantId = GetTenantId();
        feeStructure.TenantId = tenantId;
        feeStructure.CreatedAt = DateTime.UtcNow;

        // Get active academic year if not provided
        if (string.IsNullOrEmpty(feeStructure.AcademicYear))
        {
            // First try to get from active academic year
            var activeYear = await _context.AcademicYears
                .FirstOrDefaultAsync(ay => ay.TenantId == tenantId && ay.IsActive);
            
            if (activeYear != null)
            {
                feeStructure.AcademicYear = activeYear.Name;
            }
            else if (feeStructure.ClassId.HasValue)
            {
                // If class is specified, use the class's academic year
                var classEntity = await _context.Classes
                    .FirstOrDefaultAsync(c => c.Id == feeStructure.ClassId.Value && c.TenantId == tenantId);
                
                if (classEntity != null && !string.IsNullOrEmpty(classEntity.AcademicYear))
                {
                    feeStructure.AcademicYear = classEntity.AcademicYear;
                }
                else
                {
                    feeStructure.AcademicYear = DateTime.UtcNow.Year.ToString();
                }
            }
            else
            {
                feeStructure.AcademicYear = DateTime.UtcNow.Year.ToString();
            }
        }

        _context.FeeStructures.Add(feeStructure);
        await _context.SaveChangesAsync();

        // Reload with related data
        var created = await _context.FeeStructures
            .Include(fs => fs.Class)
            .Include(fs => fs.FeeHead)
            .FirstOrDefaultAsync(fs => fs.Id == feeStructure.Id);

        return CreatedAtAction(nameof(GetFeeStructure), new { id = created.Id },
            ApiResponse<FeeStructure>.SuccessResponse(created, "Fee structure created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFeeStructure(int id, [FromBody] FeeStructure feeStructure)
    {
        var tenantId = GetTenantId();
        var existing = await _context.FeeStructures
            .Include(fs => fs.Installments)
            .FirstOrDefaultAsync(fs => fs.Id == id && fs.TenantId == tenantId);

        if (existing == null)
            return NotFound(ApiResponse<FeeStructure>.ErrorResponse("Fee structure not found"));

        existing.Name = feeStructure.Name;
        existing.ClassId = feeStructure.ClassId;
        existing.FeeHeadId = feeStructure.FeeHeadId;
        existing.FeeType = feeStructure.FeeType;
        existing.Amount = feeStructure.Amount;
        existing.Frequency = feeStructure.Frequency;
        existing.AcademicYear = feeStructure.AcademicYear;
        existing.IsMandatory = feeStructure.IsMandatory;
        existing.IsOptional = feeStructure.IsOptional;
        existing.MaxInstallments = feeStructure.MaxInstallments;
        existing.LateFeeAmount = feeStructure.LateFeeAmount;
        existing.LateFeeDays = feeStructure.LateFeeDays;
        existing.IsActive = feeStructure.IsActive;

        _context.FeeStructures.Update(existing);
        await _context.SaveChangesAsync();

        // Reload with related data
        var updated = await _context.FeeStructures
            .Include(fs => fs.Class)
            .Include(fs => fs.FeeHead)
            .FirstOrDefaultAsync(fs => fs.Id == existing.Id);

        return Ok(ApiResponse<FeeStructure>.SuccessResponse(updated, "Fee structure updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFeeStructure(int id)
    {
        var tenantId = GetTenantId();
        var feeStructure = await _context.FeeStructures
            .FirstOrDefaultAsync(fs => fs.Id == id && fs.TenantId == tenantId);

        if (feeStructure == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Fee structure not found"));

        // Check if there are any fees using this structure
        var hasFees = await _context.Fees
            .AnyAsync(f => f.FeeStructureId == id);

        if (hasFees)
        {
            // Soft delete
            feeStructure.IsActive = false;
            _context.FeeStructures.Update(feeStructure);
        }
        else
        {
            // Hard delete if no fees exist
            _context.FeeStructures.Remove(feeStructure);
        }

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Fee structure deleted successfully"));
    }

    [HttpGet("{feeStructureId}/installments")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetFeeInstallments(int feeStructureId)
    {
        var tenantId = GetTenantId();
        var feeStructure = await _context.FeeStructures
            .FirstOrDefaultAsync(fs => fs.Id == feeStructureId && fs.TenantId == tenantId);

        if (feeStructure == null)
            return NotFound(ApiResponse<List<FeeInstallment>>.ErrorResponse("Fee structure not found"));

        var installments = await _context.FeeInstallments
            .Where(fi => fi.FeeStructureId == feeStructureId)
            .OrderBy(fi => fi.InstallmentNumber)
            .ToListAsync();

        return Ok(ApiResponse<List<FeeInstallment>>.SuccessResponse(installments));
    }

    [HttpPost("{feeStructureId}/installments")]
    public async Task<IActionResult> CreateFeeInstallment(int feeStructureId, [FromBody] FeeInstallment installment)
    {
        var tenantId = GetTenantId();
        var feeStructure = await _context.FeeStructures
            .FirstOrDefaultAsync(fs => fs.Id == feeStructureId && fs.TenantId == tenantId);

        if (feeStructure == null)
            return NotFound(ApiResponse<FeeInstallment>.ErrorResponse("Fee structure not found"));

        installment.FeeStructureId = feeStructureId;
        installment.CreatedAt = DateTime.UtcNow;
        installment.IsActive = true;

        _context.FeeInstallments.Add(installment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFeeInstallments), new { feeStructureId },
            ApiResponse<FeeInstallment>.SuccessResponse(installment, "Installment created successfully"));
    }

    [HttpPost("installments/{id}/duplicate")]
    public async Task<IActionResult> DuplicateFeeInstallment(int id)
    {
        var tenantId = GetTenantId();
        var sourceInstallment = await _context.FeeInstallments
            .Include(fi => fi.FeeStructure)
            .FirstOrDefaultAsync(fi => fi.Id == id && fi.FeeStructure != null && fi.FeeStructure.TenantId == tenantId);

        if (sourceInstallment == null)
            return NotFound(ApiResponse<FeeInstallment>.ErrorResponse("Installment not found"));

        // Get the next installment number
        var maxInstallmentNumber = await _context.FeeInstallments
            .Where(fi => fi.FeeStructureId == sourceInstallment.FeeStructureId)
            .MaxAsync(fi => (int?)fi.InstallmentNumber) ?? 0;

        var duplicatedInstallment = new FeeInstallment
        {
            FeeStructureId = sourceInstallment.FeeStructureId,
            InstallmentNumber = maxInstallmentNumber + 1,
            Amount = sourceInstallment.Amount,
            DueDate = sourceInstallment.DueDate.AddMonths(1), // Default to next month, user can edit
            LateFeeAmount = sourceInstallment.LateFeeAmount,
            Description = sourceInstallment.Description + " (Copy)",
            IsActive = sourceInstallment.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.FeeInstallments.Add(duplicatedInstallment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFeeInstallments), new { feeStructureId = sourceInstallment.FeeStructureId },
            ApiResponse<FeeInstallment>.SuccessResponse(duplicatedInstallment, "Installment duplicated successfully"));
    }

    [HttpPut("installments/{id}")]
    public async Task<IActionResult> UpdateFeeInstallment(int id, [FromBody] FeeInstallment installment)
    {
        var tenantId = GetTenantId();
        var existing = await _context.FeeInstallments
            .Include(fi => fi.FeeStructure)
            .FirstOrDefaultAsync(fi => fi.Id == id && fi.FeeStructure != null && fi.FeeStructure.TenantId == tenantId);

        if (existing == null)
            return NotFound(ApiResponse<FeeInstallment>.ErrorResponse("Installment not found"));

        existing.InstallmentNumber = installment.InstallmentNumber;
        existing.Amount = installment.Amount;
        existing.DueDate = installment.DueDate;
        existing.LateFeeAmount = installment.LateFeeAmount;
        existing.Description = installment.Description;
        existing.IsActive = installment.IsActive;

        _context.FeeInstallments.Update(existing);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<FeeInstallment>.SuccessResponse(existing, "Installment updated successfully"));
    }

    [HttpDelete("installments/{id}")]
    public async Task<IActionResult> DeleteFeeInstallment(int id)
    {
        var tenantId = GetTenantId();
        var installment = await _context.FeeInstallments
            .Include(fi => fi.FeeStructure)
            .FirstOrDefaultAsync(fi => fi.Id == id && fi.FeeStructure != null && fi.FeeStructure.TenantId == tenantId);

        if (installment == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Installment not found"));

        _context.FeeInstallments.Remove(installment);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Installment deleted successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

