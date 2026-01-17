using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/fee-heads")]
[Authorize]
public class FeeHeadsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FeeHeadsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetFeeHeads()
    {
        try
        {
            var tenantId = GetTenantId();
            var feeHeads = await _context.FeeHeads
                .Where(fh => fh.TenantId == tenantId && fh.IsActive)
                .OrderBy(fh => fh.DisplayOrder)
                .ThenBy(fh => fh.Name)
                .ToListAsync();

            return Ok(ApiResponse<List<FeeHead>>.SuccessResponse(feeHeads));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<FeeHead>>.ErrorResponse($"An error occurred while fetching fee heads: {ex.Message}"));
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateFeeHead([FromBody] FeeHead feeHead)
    {
        if (string.IsNullOrWhiteSpace(feeHead.Name))
        {
            return BadRequest(ApiResponse<FeeHead>.ErrorResponse("Fee head name is required"));
        }

        var tenantId = GetTenantId();
        
        // Check if code already exists
        if (!string.IsNullOrWhiteSpace(feeHead.Code))
        {
            var existing = await _context.FeeHeads
                .FirstOrDefaultAsync(fh => fh.TenantId == tenantId && fh.Code == feeHead.Code);
            
            if (existing != null)
            {
                return BadRequest(ApiResponse<FeeHead>.ErrorResponse("Fee head code already exists"));
            }
        }

        feeHead.TenantId = tenantId;
        feeHead.IsActive = true;
        feeHead.CreatedAt = DateTime.UtcNow;
        
        _context.FeeHeads.Add(feeHead);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFeeHeads), null,
            ApiResponse<FeeHead>.SuccessResponse(feeHead, "Fee head created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFeeHead(int id, [FromBody] FeeHead feeHead)
    {
        var tenantId = GetTenantId();
        var existing = await _context.FeeHeads
            .FirstOrDefaultAsync(fh => fh.Id == id && fh.TenantId == tenantId);

        if (existing == null)
            return NotFound(ApiResponse<FeeHead>.ErrorResponse("Fee head not found"));

        existing.Name = feeHead.Name;
        existing.Code = feeHead.Code;
        existing.Description = feeHead.Description;
        existing.IsOptional = feeHead.IsOptional;
        existing.IsActive = feeHead.IsActive;
        existing.DisplayOrder = feeHead.DisplayOrder;

        _context.FeeHeads.Update(existing);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<FeeHead>.SuccessResponse(existing, "Fee head updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFeeHead(int id)
    {
        var tenantId = GetTenantId();
        var feeHead = await _context.FeeHeads
            .FirstOrDefaultAsync(fh => fh.Id == id && fh.TenantId == tenantId);

        if (feeHead == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Fee head not found"));

        // Soft delete
        feeHead.IsActive = false;
        _context.FeeHeads.Update(feeHead);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Fee head deleted successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

