namespace BillingAPI.Models;

// Kitchen Order Ticket for Hotel/Restaurant
public class KOT
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int TableId { get; set; }
    public int? InvoiceId { get; set; }
    public string KOTNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending"; // Pending, Preparing, Ready, Served
    public string? Notes { get; set; }

    public Tenant? Tenant { get; set; }
    public Table? Table { get; set; }
    public Invoice? Invoice { get; set; }
    public ICollection<KOTItem> Items { get; set; } = new List<KOTItem>();
}

public class KOTItem
{
    public int Id { get; set; }
    public int KOTId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? SpecialInstructions { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Preparing, Ready

    public KOT? KOT { get; set; }
    public Product? Product { get; set; }
}

