namespace BillingAPI.Models;

// Goods Receipt Note
public class GRN
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int PurchaseOrderId { get; set; }
    public string GRNNumber { get; set; } = string.Empty;
    public DateTime GRNDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending"; // Pending, Received, Partial, Rejected
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }

    public Tenant? Tenant { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<GRNItem> Items { get; set; } = new List<GRNItem>();
}

public class GRNItem
{
    public int Id { get; set; }
    public int GRNId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal OrderedQuantity { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public decimal RejectedQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }

    public GRN? GRN { get; set; }
    public Product? Product { get; set; }
}

