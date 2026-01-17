namespace BillingAPI.Models;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? BusinessType { get; set; } // Medical, Retail, Hotel, Grocery, Service
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? GSTIN { get; set; } // GST Number for the store/tenant
    public string? UPIId { get; set; } // UPI ID for receiving payments (e.g., store@paytm)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubscriptionExpiresAt { get; set; }
    public string? PlanType { get; set; } // Free, Basic, Premium
}

