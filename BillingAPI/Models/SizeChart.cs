namespace BillingAPI.Models;

public class SizeChart
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // Indian, US, UK, EU, etc.
    public string SizeValues { get; set; } = string.Empty; // JSON array of sizes: ["S","M","L","XL","XXL"]
    public string? Description { get; set; }
    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
}

