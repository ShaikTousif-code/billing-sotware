using FluentValidation;
using BillingAPI.Models;

namespace BillingAPI.Validators;

public class CreatePaymentValidator : AbstractValidator<Payment>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.InvoiceId)
            .GreaterThan(0).WithMessage("Invoice ID is required");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Payment amount must be greater than zero")
            .LessThanOrEqualTo(1000000).WithMessage("Payment amount is too large");

        RuleFor(x => x.PaymentMode)
            .NotEmpty().WithMessage("Payment mode is required")
            .Must(mode => new[] { "Cash", "UPI", "Card", "BankTransfer", "Wallet" }.Contains(mode))
            .WithMessage("Invalid payment mode");

        RuleFor(x => x.TransactionId)
            .MaximumLength(200).WithMessage("Transaction ID cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.TransactionId));
    }
}

