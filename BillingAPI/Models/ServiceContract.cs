namespace BillingAPI.Models;

// Service Contracts for Offices
public class ServiceContract
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ClientId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ContractType { get; set; } = "Monthly"; // Monthly, Quarterly, Annual, One-time
    public decimal ContractValue { get; set; }
    public decimal MonthlyAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool AutoRenewal { get; set; }
    public string Status { get; set; } = "Active"; // Active, Expired, Cancelled, Suspended
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public OfficeClient? Client { get; set; }
    public ICollection<ContractInvoice> Invoices { get; set; } = new List<ContractInvoice>();
}

public class ContractInvoice
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ContractId { get; set; }
    public int ClientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public string Period { get; set; } = string.Empty; // e.g., "January 2024"
    public decimal Amount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Paid, Overdue
    public DateTime? PaidDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ServiceContract? Contract { get; set; }
    public OfficeClient? Client { get; set; }
}

