namespace BillingAPI.Models;

public class TaxConfiguration
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // GST 5%, GST 12%, etc.
    public decimal Rate { get; set; }
    public string Type { get; set; } = "GST"; // GST, VAT, Service Tax
    public bool IsActive { get; set; } = true;

    public Tenant? Tenant { get; set; }
}

