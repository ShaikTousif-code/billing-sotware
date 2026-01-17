namespace BillingAPI.Models;

// Hotel/Restaurant Module
public class Table
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Status { get; set; } = "Available"; // Available, Occupied, Reserved, Cleaning
    public int? CurrentInvoiceId { get; set; }
    public string? Location { get; set; } // Floor, Section, etc.
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public Invoice? CurrentInvoice { get; set; }
}

