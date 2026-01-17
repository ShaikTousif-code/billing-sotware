namespace BillingAPI.Models;

// Serial Number Tracking
public class SerialNumber
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public string SerialNumberValue { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // Available, Sold, Returned, Defective
    public int? InvoiceId { get; set; }
    public int? InvoiceItemId { get; set; }
    public int? CustomerId { get; set; }
    public DateTime? SoldDate { get; set; }
    public DateTime? WarrantyExpiryDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
    public Invoice? Invoice { get; set; }
    public InvoiceItem? InvoiceItem { get; set; }
    public Customer? Customer { get; set; }
}

