namespace BillingAPI.Models;

public class SalesExchangeItem
{
    public int Id { get; set; }
    public int SalesExchangeId { get; set; }
    public string Type { get; set; } = string.Empty; // Original or New
    public int? InvoiceItemId { get; set; } // For original items
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? VariantCombinationId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }

    // Navigation properties
    public SalesExchange? SalesExchange { get; set; }
    public InvoiceItem? InvoiceItem { get; set; }
    public Product? Product { get; set; }
    public ProductVariantCombination? VariantCombination { get; set; }
}

