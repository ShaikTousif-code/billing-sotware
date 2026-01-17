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
public class InstitutionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public InstitutionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetInstitution()
    {
        var tenantId = GetTenantId();
        var institution = await _context.Institutions
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && i.IsActive);

        if (institution == null)
        {
            // Return empty institution if not found
            return Ok(ApiResponse<Institution?>.SuccessResponse(null));
        }

        return Ok(ApiResponse<Institution>.SuccessResponse(institution));
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateInstitution([FromBody] Institution institution)
    {
        var tenantId = GetTenantId();
        
        var existing = await _context.Institutions
            .FirstOrDefaultAsync(i => i.TenantId == tenantId);

        if (existing != null)
        {
            // Update existing
            existing.Name = institution.Name;
            existing.Address = institution.Address;
            existing.City = institution.City;
            existing.State = institution.State;
            existing.Pincode = institution.Pincode;
            existing.Phone = institution.Phone;
            existing.Email = institution.Email;
            existing.Website = institution.Website;
            existing.LogoUrl = institution.LogoUrl;
            existing.RegistrationNumber = institution.RegistrationNumber;
            existing.UDISE = institution.UDISE;
            existing.UpdatedAt = DateTime.UtcNow;
            
            _context.Institutions.Update(existing);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Institution>.SuccessResponse(existing, "Institution updated successfully"));
        }
        else
        {
            // Create new
            institution.TenantId = tenantId;
            institution.IsActive = true;
            institution.CreatedAt = DateTime.UtcNow;
            
            _context.Institutions.Add(institution);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetInstitution), null,
                ApiResponse<Institution>.SuccessResponse(institution, "Institution created successfully"));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

