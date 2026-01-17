namespace BillingAPI.Models;

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // products.create, invoices.view, etc.
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty; // Products, Invoices, Reports, etc.
}

