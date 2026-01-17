namespace BillingAPI.Models;

public class TenantConfiguration
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string FinancialYearStart { get; set; } = "04-01"; // MM-DD format
    public string InvoicePrefix { get; set; } = "INV";
    public int InvoiceNumberStart { get; set; } = 1;
    public string? InvoiceTemplate { get; set; }
    public string Currency { get; set; } = "INR";
    public int DecimalPlaces { get; set; } = 2;
    public bool EnableInventory { get; set; } = true;
    public bool EnableGST { get; set; } = true;
    public string? Language { get; set; } = "en";

    public Tenant? Tenant { get; set; }
}

