namespace BillingAPI.Models;

// Project Management for Offices
public class Project
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ClientId { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ProjectType { get; set; } = "Fixed"; // Fixed, Time & Material, Retainer
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, On Hold, Completed, Cancelled
    public decimal Budget { get; set; }
    public decimal BilledAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string? ProjectManager { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public OfficeClient? Client { get; set; }
    public ICollection<ProjectInvoice> Invoices { get; set; } = new List<ProjectInvoice>();
    public ICollection<ProjectExpense> Expenses { get; set; } = new List<ProjectExpense>();
}

