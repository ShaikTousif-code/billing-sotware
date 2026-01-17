namespace BillingAPI.Models;

// Client Management for Offices
public class OfficeClient
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string ClientCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? AlternatePhone { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Country { get; set; }
    public string? GSTIN { get; set; }
    public string? PAN { get; set; }
    public string ClientType { get; set; } = "Corporate"; // Corporate, Individual, Government
    public string Status { get; set; } = "Active"; // Active, Inactive, Suspended
    public decimal CreditLimit { get; set; }
    public decimal OutstandingBalance { get; set; }
    public string? PaymentTerms { get; set; } // Net 30, Net 60, etc.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<ServiceContract> Contracts { get; set; } = new List<ServiceContract>();
}

