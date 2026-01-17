using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ClassesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetClasses([FromQuery] string? type, [FromQuery] string? academicYear)
    {
        var tenantId = GetTenantId();
        var query = _context.Classes.Where(c => c.TenantId == tenantId);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(c => c.Type == type);

        if (!string.IsNullOrEmpty(academicYear))
            query = query.Where(c => c.AcademicYear == academicYear);

        var classes = await query.OrderBy(c => c.Name).ToListAsync();
        
        // Calculate current strength for each class dynamically from active students
        foreach (var classEntity in classes)
        {
            var studentCount = await _context.Students
                .CountAsync(s => s.ClassId == classEntity.Id && s.TenantId == tenantId && s.Status == "Active");
            
            // Update the database if the count differs
            if (classEntity.CurrentStrength != studentCount)
            {
                classEntity.CurrentStrength = studentCount;
                _context.Classes.Update(classEntity);
            }
        }
        
        // Save all updates in one batch
        if (classes.Any(c => _context.Entry(c).State == Microsoft.EntityFrameworkCore.EntityState.Modified))
        {
            await _context.SaveChangesAsync();
        }
        
        return Ok(ApiResponse<List<Class>>.SuccessResponse(classes));
    }

    [HttpPost]
    public async Task<IActionResult> CreateClass([FromBody] Class classEntity)
    {
        classEntity.TenantId = GetTenantId();
        classEntity.CreatedAt = DateTime.UtcNow;
        _context.Classes.Add(classEntity);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetClasses), new { id = classEntity.Id },
            ApiResponse<Class>.SuccessResponse(classEntity, "Class created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClass(int id, [FromBody] Class classEntity)
    {
        var tenantId = GetTenantId();
        if (id != classEntity.Id || classEntity.TenantId != tenantId)
            return BadRequest(ApiResponse<Class>.ErrorResponse("Invalid class data"));

        _context.Classes.Update(classEntity);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<Class>.SuccessResponse(classEntity, "Class updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClass(int id)
    {
        var tenantId = GetTenantId();
        var classEntity = await _context.Classes
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (classEntity == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Class not found"));

        _context.Classes.Remove(classEntity);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.SuccessResponse(null, "Class deleted successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

