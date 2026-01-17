namespace BillingAPI.Models;

// Service Business Module
public class JobCard
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int CustomerId { get; set; }
    public string JobCardNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string Status { get; set; } = "Open"; // Open, InProgress, Completed, Cancelled
    public string? Description { get; set; }
    public int? AssignedToUserId { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public int? InvoiceId { get; set; }

    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public User? AssignedTo { get; set; }
    public Invoice? Invoice { get; set; }
    public ICollection<JobCardItem> Items { get; set; } = new List<JobCardItem>();
}

public class JobCardItem
{
    public int Id { get; set; }
    public int JobCardId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }

    public JobCard? JobCard { get; set; }
    public Product? Product { get; set; }
}

