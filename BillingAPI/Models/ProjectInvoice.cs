namespace BillingAPI.Models;

// Project-based Invoices for Offices
public class ProjectInvoice
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProjectId { get; set; }
    public int ClientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public string? Milestone { get; set; }
    public string? Description { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Sent, Paid, Overdue, Cancelled
    public DateTime? DueDate { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Project? Project { get; set; }
    public OfficeClient? Client { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<ProjectInvoiceItem> Items { get; set; } = new List<ProjectInvoiceItem>();
}

public class ProjectInvoiceItem
{
    public int Id { get; set; }
    public int ProjectInvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    
    public ProjectInvoice? ProjectInvoice { get; set; }
}

