namespace BillingAPI.Models;

// Project Expenses for Offices
public class ProjectExpense
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProjectId { get; set; }
    public string ExpenseType { get; set; } = string.Empty; // Travel, Material, Labor, etc.
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Vendor { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? PaymentMode { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Paid
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Project? Project { get; set; }
    public User? CreatedBy { get; set; }
}

