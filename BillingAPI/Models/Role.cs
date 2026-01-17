namespace BillingAPI.Models;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Owner, Manager, Cashier, Accountant
    public string? Description { get; set; }
}

