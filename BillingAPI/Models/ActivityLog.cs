namespace BillingAPI.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, View, etc.
    public string EntityType { get; set; } = string.Empty; // Invoice, Product, Customer, etc.
    public int? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public User? User { get; set; }
}

