using FluentValidation;
using BillingAPI.Models;

namespace BillingAPI.Validators;

public class CreateInvoiceValidator : AbstractValidator<Invoice>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.InvoiceDate)
            .NotEmpty().WithMessage("Invoice date is required")
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Invoice date cannot be in the future");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required")
            .Must(items => items != null && items.Count > 0).WithMessage("Invoice must have at least one item");

        RuleForEach(x => x.Items)
            .SetValidator(new InvoiceItemValidator());

        RuleFor(x => x.TotalAmount)
            .GreaterThan(0).WithMessage("Total amount must be greater than zero");

        RuleFor(x => x.BillLevelDiscount)
            .GreaterThanOrEqualTo(0).WithMessage("Bill level discount cannot be negative");

        RuleFor(x => x.ServiceCharge)
            .GreaterThanOrEqualTo(0).WithMessage("Service charge cannot be negative");

        RuleFor(x => x.Tips)
            .GreaterThanOrEqualTo(0).WithMessage("Tips cannot be negative");
    }
}

public class InvoiceItemValidator : AbstractValidator<InvoiceItem>
{
    public InvoiceItemValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThanOrEqualTo(0).WithMessage("Product ID cannot be negative");

        RuleFor(x => x.ProductName)
            .NotEmpty().WithMessage("Product name is required")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative");

        RuleFor(x => x.DiscountAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Discount cannot be negative");

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("Tax rate must be between 0 and 100");

        RuleFor(x => x.TotalAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Total amount cannot be negative");
    }
}

