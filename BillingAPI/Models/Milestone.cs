namespace BillingAPI.Models;

// Project Milestones & Deliverables
public class Milestone
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime TargetDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal PercentageComplete { get; set; }
    public string Status { get; set; } = "Not Started"; // Not Started, In Progress, Completed, Delayed, Cancelled
    public decimal? BillingAmount { get; set; }
    public bool IsBilled { get; set; }
    public int? InvoiceId { get; set; } // Link to ProjectInvoice
    public int? CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Project? Project { get; set; }
    public ProjectInvoice? Invoice { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<Deliverable> Deliverables { get; set; } = new List<Deliverable>();
}

public class Deliverable
{
    public int Id { get; set; }
    public int MilestoneId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed, Rejected
    public DateTime? CompletedDate { get; set; }
    public string? FileUrl { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public Milestone? Milestone { get; set; }
}

