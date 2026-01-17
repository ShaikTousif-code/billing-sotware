namespace BillingAPI.Models;

public class SalesReturnItem
{
    public int Id { get; set; }
    public int SalesReturnId { get; set; }
    public int InvoiceItemId { get; set; } // Original invoice item
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? VariantCombinationId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Reason { get; set; }

    // Navigation properties
    public SalesReturn? SalesReturn { get; set; }
    public InvoiceItem? InvoiceItem { get; set; }
    public Product? Product { get; set; }
    public ProductVariantCombination? VariantCombination { get; set; }
}

