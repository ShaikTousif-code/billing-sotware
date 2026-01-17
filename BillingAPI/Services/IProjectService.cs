using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IProjectService
{
    Task<List<Project>> GetProjectsAsync(int tenantId, int? clientId = null, string? status = null);
    Task<Project?> GetProjectByIdAsync(int id, int tenantId);
    Task<Project> CreateProjectAsync(Project project);
    Task<Project> UpdateProjectAsync(Project project);
    Task<bool> DeleteProjectAsync(int id, int tenantId);
    Task<string> GenerateProjectCodeAsync(int tenantId);
    Task<ProjectInvoice> CreateProjectInvoiceAsync(ProjectInvoice invoice);
    Task<ProjectExpense> AddProjectExpenseAsync(ProjectExpense expense);
}

