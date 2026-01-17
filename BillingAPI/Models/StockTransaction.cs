namespace BillingAPI.Models;

public class StockTransaction
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public int? VariantCombinationId { get; set; } // For variant-specific transactions
    public string TransactionType { get; set; } = string.Empty; // In, Out, Adjustment
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public string? ReferenceType { get; set; } // Purchase, Sale, Adjustment, Return, Exchange
    public int? ReferenceId { get; set; }
    public string? Size { get; set; } // For tracking size in transactions
    public string? Color { get; set; } // For tracking color in transactions
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public int CreatedById { get; set; }

    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
    public ProductVariantCombination? VariantCombination { get; set; }
}

