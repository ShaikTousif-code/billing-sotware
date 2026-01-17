namespace BillingAPI.Models;

public class PriceList
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // Retail, Wholesale, VIP, etc.
    public string? Description { get; set; }
    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public ICollection<PriceListItem> Items { get; set; } = new List<PriceListItem>();
}

