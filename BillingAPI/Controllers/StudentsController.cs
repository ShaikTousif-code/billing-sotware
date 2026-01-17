using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Validators;
using FluentValidation;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/students")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly IValidator<Student> _validator;

    public StudentsController(IStudentService studentService, IValidator<Student> validator)
    {
        _studentService = studentService;
        _validator = validator;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetStudents([FromQuery] int? classId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var students = await _studentService.GetStudentsAsync(tenantId, classId, status);
        return Ok(ApiResponse<List<Student>>.SuccessResponse(students));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStudent(int id)
    {
        var tenantId = GetTenantId();
        var student = await _studentService.GetStudentByIdAsync(id, tenantId);
        if (student == null)
            return NotFound(ApiResponse<Student>.ErrorResponse("Student not found"));
        
        return Ok(ApiResponse<Student>.SuccessResponse(student));
    }

    [HttpPost]
    public async Task<IActionResult> CreateStudent([FromBody] Student student)
    {
        var validationResult = await _validator.ValidateAsync(student);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Student>.ErrorResponse("Validation failed", errors));
        }

        student.TenantId = GetTenantId();
        var created = await _studentService.CreateStudentAsync(student);
        return CreatedAtAction(nameof(GetStudent), new { id = created.Id },
            ApiResponse<Student>.SuccessResponse(created, "Student created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStudent(int id, [FromBody] Student student)
    {
        var validationResult = await _validator.ValidateAsync(student);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Student>.ErrorResponse("Validation failed", errors));
        }

        var tenantId = GetTenantId();
        if (id != student.Id || student.TenantId != tenantId)
            return BadRequest(ApiResponse<Student>.ErrorResponse("Invalid student data"));

        var updated = await _studentService.UpdateStudentAsync(student);
        return Ok(ApiResponse<Student>.SuccessResponse(updated, "Student updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        var tenantId = GetTenantId();
        var deleted = await _studentService.DeleteStudentAsync(id, tenantId);
        if (!deleted)
            return NotFound(ApiResponse<object>.ErrorResponse("Student not found"));

        return Ok(ApiResponse<object>.SuccessResponse(null, "Student deleted successfully"));
    }

    [HttpGet("{id}/fees")]
    public async Task<IActionResult> GetStudentFees(int id)
    {
        var tenantId = GetTenantId();
        var fees = await _studentService.GetStudentFeesAsync(id, tenantId);
        return Ok(ApiResponse<List<Fee>>.SuccessResponse(fees));
    }

    [HttpPut("{id}/discount")]
    public async Task<IActionResult> UpdateStudentDiscount(int id, [FromBody] UpdateStudentDiscountRequest request)
    {
        var tenantId = GetTenantId();
        var student = await _studentService.GetStudentByIdAsync(id, tenantId);
        
        if (student == null)
            return NotFound(ApiResponse<Student>.ErrorResponse("Student not found"));

        student.DiscountPercentage = request.DiscountPercentage;
        student.DiscountAmount = request.DiscountAmount;
        student.DiscountReason = request.DiscountReason;
        student.IsDiscountActive = request.IsDiscountActive ?? true;

        var updated = await _studentService.UpdateStudentAsync(student);
        return Ok(ApiResponse<Student>.SuccessResponse(updated, "Student discount updated successfully"));
    }

    [HttpGet("{id}/outstanding")]
    public async Task<IActionResult> GetStudentOutstanding(int id)
    {
        var tenantId = GetTenantId();
        var outstanding = await _studentService.GetStudentOutstandingAsync(id, tenantId);
        return Ok(ApiResponse<decimal>.SuccessResponse(outstanding));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class UpdateStudentDiscountRequest
{
    public decimal? DiscountPercentage { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string? DiscountReason { get; set; }
    public bool? IsDiscountActive { get; set; }
}

