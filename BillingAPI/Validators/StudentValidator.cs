using FluentValidation;
using BillingAPI.Models;

namespace BillingAPI.Validators;

public class StudentValidator : AbstractValidator<Student>
{
    public StudentValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name cannot exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name cannot exceed 100 characters");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email address")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .Matches(@"^[0-9+\-\s()]+$").WithMessage("Invalid phone number format")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.UtcNow).WithMessage("Date of birth cannot be in the future");

        RuleFor(x => x.AcademicYear)
            .NotEmpty().WithMessage("Academic year is required");

        RuleFor(x => x.TotalFees)
            .GreaterThanOrEqualTo(0).WithMessage("Total fees cannot be negative");

        RuleFor(x => x.PaidFees)
            .GreaterThanOrEqualTo(0).WithMessage("Paid fees cannot be negative")
            .LessThanOrEqualTo(x => x.TotalFees).WithMessage("Paid fees cannot exceed total fees");
    }
}

