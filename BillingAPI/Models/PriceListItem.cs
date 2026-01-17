namespace BillingAPI.Models;

public class PriceListItem
{
    public int Id { get; set; }
    public int PriceListId { get; set; }
    public int ProductId { get; set; }
    public decimal Price { get; set; }
    public decimal? MinimumQuantity { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }

    public PriceList? PriceList { get; set; }
    public Product? Product { get; set; }
}

