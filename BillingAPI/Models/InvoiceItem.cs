namespace BillingAPI.Models;

public class InvoiceItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // RMG variant tracking
    public int? VariantCombinationId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }

    // Navigation properties
    public Invoice? Invoice { get; set; }
    public Product? Product { get; set; }
    public ProductVariantCombination? VariantCombination { get; set; }
}

