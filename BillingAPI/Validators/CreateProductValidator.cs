using FluentValidation;
using BillingAPI.Models;

namespace BillingAPI.Validators;

public class CreateProductValidator : AbstractValidator<Product>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters");

        RuleFor(x => x.SKU)
            .MaximumLength(100).WithMessage("SKU cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.SKU));

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost price cannot be negative");

        RuleFor(x => x.SellingPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Selling price cannot be negative")
            .GreaterThanOrEqualTo(x => x.CostPrice)
            .When(x => x.CostPrice > 0)
            .WithMessage("Selling price should be greater than or equal to cost price");

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("Tax rate must be between 0 and 100")
            .When(x => x.TaxRate.HasValue);

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative")
            .When(x => x.StockQuantity.HasValue);

        RuleFor(x => x.LowStockAlert)
            .GreaterThanOrEqualTo(0).WithMessage("Low stock alert cannot be negative")
            .When(x => x.LowStockAlert.HasValue);
    }
}

