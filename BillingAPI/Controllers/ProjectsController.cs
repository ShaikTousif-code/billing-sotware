using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects([FromQuery] int? clientId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var projects = await _projectService.GetProjectsAsync(tenantId, clientId, status);
        return Ok(ApiResponse<List<Project>>.SuccessResponse(projects));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var tenantId = GetTenantId();
        var project = await _projectService.GetProjectByIdAsync(id, tenantId);
        if (project == null)
            return NotFound(ApiResponse<Project>.ErrorResponse("Project not found"));
        
        return Ok(ApiResponse<Project>.SuccessResponse(project));
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] Project project)
    {
        project.TenantId = GetTenantId();
        var created = await _projectService.CreateProjectAsync(project);
        return CreatedAtAction(nameof(GetProject), new { id = created.Id },
            ApiResponse<Project>.SuccessResponse(created, "Project created successfully"));
    }

    [HttpPost("{id}/invoice")]
    public async Task<IActionResult> CreateInvoice(int id, [FromBody] ProjectInvoice invoice)
    {
        invoice.TenantId = GetTenantId();
        invoice.ProjectId = id;
        invoice.CreatedById = GetUserId();
        var created = await _projectService.CreateProjectInvoiceAsync(invoice);
        return CreatedAtAction(nameof(GetProject), new { id },
            ApiResponse<ProjectInvoice>.SuccessResponse(created, "Invoice created successfully"));
    }

    [HttpPost("{id}/expense")]
    public async Task<IActionResult> AddExpense(int id, [FromBody] ProjectExpense expense)
    {
        expense.TenantId = GetTenantId();
        expense.ProjectId = id;
        expense.CreatedById = GetUserId();
        var created = await _projectService.AddProjectExpenseAsync(expense);
        return CreatedAtAction(nameof(GetProject), new { id },
            ApiResponse<ProjectExpense>.SuccessResponse(created, "Expense added successfully"));
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

