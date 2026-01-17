namespace BillingAPI.Models;

public class CreditNoteItem
{
    public int Id { get; set; }
    public int CreditNoteId { get; set; }
    public int InvoiceItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public CreditNote? CreditNote { get; set; }
    public Product? Product { get; set; }
}

