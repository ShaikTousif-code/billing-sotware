namespace BillingAPI.Models;

// Installment Payment Plans for Fees
public class InstallmentPlan
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int FeeId { get; set; }
    public int StudentId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public int NumberOfInstallments { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal InstallmentAmount { get; set; }
    public DateTime StartDate { get; set; }
    public string Frequency { get; set; } = "Monthly"; // Monthly, Quarterly, Weekly
    public string Status { get; set; } = "Active"; // Active, Completed, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Fee? Fee { get; set; }
    public Student? Student { get; set; }
    public ICollection<Installment> Installments { get; set; } = new List<Installment>();
}

public class Installment
{
    public int Id { get; set; }
    public int InstallmentPlanId { get; set; }
    public int InstallmentNumber { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime? PaidDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Paid, Overdue
    public string? PaymentReference { get; set; }
    
    // Navigation properties
    public InstallmentPlan? InstallmentPlan { get; set; }
}

