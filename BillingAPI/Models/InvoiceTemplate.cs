namespace BillingAPI.Models;

public class InvoiceTemplate
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TemplateType { get; set; } = "Default"; // Default, Custom, Thermal
    public string? TemplateContent { get; set; } // HTML/JSON template
    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
}

