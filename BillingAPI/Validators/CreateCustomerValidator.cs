using FluentValidation;
using BillingAPI.Models;

namespace BillingAPI.Validators;

public class CreateCustomerValidator : AbstractValidator<Customer>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Customer name is required")
            .MaximumLength(200).WithMessage("Customer name cannot exceed 200 characters");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email address")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .Matches(@"^[0-9+\-\s()]+$").WithMessage("Invalid phone number format")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.GSTIN)
            .Matches(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
            .WithMessage("Invalid GSTIN format")
            .When(x => !string.IsNullOrEmpty(x.GSTIN));

        RuleFor(x => x.OutstandingBalance)
            .GreaterThanOrEqualTo(0).WithMessage("Outstanding balance cannot be negative");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit limit cannot be negative");
    }
}

