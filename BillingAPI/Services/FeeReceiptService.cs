using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using DocumentModel = BillingAPI.Models.Document;
using QuestDocument = QuestPDF.Fluent.Document;

namespace BillingAPI.Services;

public class FeeReceiptService : IFeeReceiptService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public FeeReceiptService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateFeeReceiptPdfAsync(FeePayment payment)
    {
        var paymentWithDetails = await _context.FeePayments
            .Include(p => p.Student)
            .ThenInclude(s => s!.Class)
            .Include(p => p.Fee)
            .ThenInclude(f => f!.FeeStructure)
            .Include(p => p.Tenant)
            .FirstOrDefaultAsync(p => p.Id == payment.Id);

        if (paymentWithDetails == null || paymentWithDetails.Student == null)
            throw new Exception("Payment not found");

        // Get institution details
        var institution = await _context.Institutions
            .FirstOrDefaultAsync(i => i.TenantId == paymentWithDetails.TenantId && i.IsActive);

        var document = QuestDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Column(column =>
                    {
                        // Institution Logo (if available)
                        if (institution != null && !string.IsNullOrEmpty(institution.LogoUrl))
                        {
                            // Note: Logo URL would need to be converted to image bytes
                            // For now, we'll just show the name
                        }

                        // Institution Name
                        column.Item().Text(institution?.Name ?? paymentWithDetails.Tenant?.Name ?? "School/College")
                            .FontSize(20)
                            .Bold()
                            .AlignCenter();

                        // Institution Address
                        if (institution != null && !string.IsNullOrEmpty(institution.Address))
                        {
                            column.Item().Text(institution.Address)
                                .FontSize(9)
                                .AlignCenter();
                            
                            var addressParts = new List<string>();
                            if (!string.IsNullOrEmpty(institution.City)) addressParts.Add(institution.City);
                            if (!string.IsNullOrEmpty(institution.State)) addressParts.Add(institution.State);
                            if (!string.IsNullOrEmpty(institution.Pincode)) addressParts.Add(institution.Pincode);
                            
                            if (addressParts.Any())
                            {
                                column.Item().Text(string.Join(", ", addressParts))
                                    .FontSize(9)
                                    .AlignCenter();
                            }
                        }

                        // Institution Contact
                        if (institution != null)
                        {
                            var contactInfo = new List<string>();
                            if (!string.IsNullOrEmpty(institution.Phone)) contactInfo.Add($"Phone: {institution.Phone}");
                            if (!string.IsNullOrEmpty(institution.Email)) contactInfo.Add($"Email: {institution.Email}");
                            
                            if (contactInfo.Any())
                            {
                                column.Item().Text(string.Join(" | ", contactInfo))
                                    .FontSize(8)
                                    .AlignCenter();
                            }
                        }

                        column.Item().PaddingTop(10);
                        column.Item().Text("FEE PAYMENT RECEIPT")
                            .FontSize(16)
                            .Bold()
                            .AlignCenter();
                        column.Item().PaddingTop(5);
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        // Receipt Details
                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Receipt Number: {paymentWithDetails.ReceiptNumber}").Bold();
                                c.Item().Text($"Date: {paymentWithDetails.PaymentDate:dd/MM/yyyy}");
                                c.Item().Text($"Payment Mode: {paymentWithDetails.PaymentMode}");
                            });
                        });

                        column.Item().PaddingTop(10);

                        // Student Information
                        column.Item().Text("Student Information").FontSize(12).Bold();
                        column.Item().PaddingTop(5);
                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Student ID: {paymentWithDetails.Student.StudentId}");
                                c.Item().Text($"Name: {paymentWithDetails.Student.FirstName} {paymentWithDetails.Student.LastName}");
                                c.Item().Text($"Class: {paymentWithDetails.Student.Class?.Name ?? "N/A"}");
                                if (!string.IsNullOrEmpty(paymentWithDetails.Student.Section))
                                    c.Item().Text($"Section: {paymentWithDetails.Student.Section}");
                            });
                        });

                        column.Item().PaddingTop(10);

                        // Fee Details
                        column.Item().Text("Fee Details").FontSize(12).Bold();
                        column.Item().PaddingTop(5);
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Description").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Amount").Bold();
                            });

                            table.Cell().Element(CellStyle).Text(paymentWithDetails.Fee?.FeeType ?? "Fee Payment");
                            table.Cell().Element(CellStyle).AlignRight().Text($"₹{paymentWithDetails.Amount:F2}");
                        });

                        column.Item().PaddingTop(10);

                        // Payment Summary
                        column.Item().Row(row =>
                        {
                            row.RelativeItem();
                            row.AutoItem().Column(c =>
                            {
                                c.Item().Text($"Total Amount: ₹{paymentWithDetails.Amount:F2}").FontSize(12).Bold();
                            });
                        });

                        if (!string.IsNullOrEmpty(paymentWithDetails.TransactionId))
                        {
                            column.Item().PaddingTop(5);
                            column.Item().Text($"Transaction ID: {paymentWithDetails.TransactionId}").FontSize(9);
                        }

                        // Outstanding Balance Information
                        column.Item().PaddingTop(10);
                        column.Item().Row(row =>
                        {
                            row.RelativeItem();
                            row.AutoItem().Column(c =>
                            {
                                c.Item().Text("Outstanding Balance").FontSize(12).Bold();
                                c.Item().PaddingTop(5);

                                // Calculate total outstanding fees for the student
                                var outstandingAmount = paymentWithDetails.Student.OutstandingFees;
                                var remainingBalance = Math.Max(0, outstandingAmount - paymentWithDetails.Amount);

                                c.Item().Text($"Previous Outstanding: ₹{outstandingAmount:F2}").FontSize(10);
                                c.Item().Text($"Amount Paid: ₹{paymentWithDetails.Amount:F2}").FontSize(10);
                                c.Item().PaddingTop(3);
                                c.Item().Text($"Remaining Balance: ₹{remainingBalance:F2}").FontSize(11).Bold();
                            });
                        });

                        if (!string.IsNullOrEmpty(paymentWithDetails.Notes))
                        {
                            column.Item().PaddingTop(10);
                            column.Item().Text($"Notes: {paymentWithDetails.Notes}").FontSize(9);
                        }

                        // QR Code removed
                    });

                page.Footer()
                    .AlignCenter()
                    .Column(column =>
                    {
                        if (institution != null && !string.IsNullOrEmpty(institution.RegistrationNumber))
                        {
                            column.Item().Text($"Registration: {institution.RegistrationNumber}")
                                .FontSize(8)
                                .FontColor(Colors.Grey.Medium);
                        }
                        
                        if (institution != null && !string.IsNullOrEmpty(institution.UDISE))
                        {
                            column.Item().Text($"UDISE Code: {institution.UDISE}")
                                .FontSize(8)
                                .FontColor(Colors.Grey.Medium);
                        }

                        column.Item().PaddingTop(5);
                        column.Item().Text(x =>
                        {
                            x.Span("This is a computer-generated receipt. ")
                             .FontSize(8)
                             .FontColor(Colors.Grey.Medium);
                            x.Span("No signature required.")
                             .FontSize(8)
                             .FontColor(Colors.Grey.Medium);
                        });
                    });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateFeeStatementPdfAsync(int studentId, int tenantId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var student = await _context.Students
            .Include(s => s.Class)
            .Include(s => s.Fees)
            .ThenInclude(f => f.FeeStructure)
            .Include(s => s.FeePayments)
            .FirstOrDefaultAsync(s => s.Id == studentId && s.TenantId == tenantId);

        if (student == null)
            throw new Exception("Student not found");

        var fees = student.Fees.AsQueryable();
        var payments = student.FeePayments.AsQueryable();

        if (fromDate.HasValue)
        {
            fees = fees.Where(f => f.CreatedAt >= fromDate.Value);
            payments = payments.Where(p => p.PaymentDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            fees = fees.Where(f => f.CreatedAt <= toDate.Value);
            payments = payments.Where(p => p.PaymentDate <= toDate.Value);
        }

        var feesList = await fees.OrderBy(f => f.DueDate).ToListAsync();
        var paymentsList = await payments.OrderBy(p => p.PaymentDate).ToListAsync();

        var document = QuestDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Column(column =>
                    {
                        column.Item().Text("FEE STATEMENT").FontSize(18).Bold().AlignCenter();
                        column.Item().Text($"Student: {student.FirstName} {student.LastName} ({student.StudentId})").AlignCenter();
                        column.Item().Text($"Class: {student.Class?.Name ?? "N/A"}").AlignCenter();
                        if (fromDate.HasValue || toDate.HasValue)
                        {
                            column.Item().Text($"Period: {fromDate?.ToString("dd/MM/yyyy") ?? "All"} to {toDate?.ToString("dd/MM/yyyy") ?? "All"}").AlignCenter();
                        }
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        // Outstanding Fees
                        column.Item().Text("Outstanding Fees").FontSize(12).Bold();
                        column.Item().PaddingTop(5);
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Fee Type").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Amount").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Paid").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Balance").Bold();
                            });

                            foreach (var fee in feesList)
                            {
                                table.Cell().Element(CellStyle).Text(fee.FeeType);
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{fee.NetAmount:F2}");
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{fee.PaidAmount:F2}");
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{fee.BalanceAmount:F2}");
                            }

                            table.Footer(footer =>
                            {
                                footer.Cell().Element(CellStyle).Text("Total").Bold();
                                footer.Cell().Element(CellStyle).AlignRight().Text($"₹{feesList.Sum(f => f.NetAmount):F2}").Bold();
                                footer.Cell().Element(CellStyle).AlignRight().Text($"₹{feesList.Sum(f => f.PaidAmount):F2}").Bold();
                                footer.Cell().Element(CellStyle).AlignRight().Text($"₹{feesList.Sum(f => f.BalanceAmount):F2}").Bold();
                            });
                        });

                        column.Item().PaddingTop(15);

                        // Payment History
                        column.Item().Text("Payment History").FontSize(12).Bold();
                        column.Item().PaddingTop(5);
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Date").Bold();
                                header.Cell().Element(CellStyle).Text("Receipt No").Bold();
                                header.Cell().Element(CellStyle).Text("Mode").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Amount").Bold();
                            });

                            foreach (var payment in paymentsList)
                            {
                                table.Cell().Element(CellStyle).Text(payment.PaymentDate.ToString("dd/MM/yyyy"));
                                table.Cell().Element(CellStyle).Text(payment.ReceiptNumber);
                                table.Cell().Element(CellStyle).Text(payment.PaymentMode);
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{payment.Amount:F2}");
                            }

                            table.Footer(footer =>
                            {
                                footer.Cell().Element(CellStyle).Text("Total").Bold();
                                footer.Cell().Element(CellStyle);
                                footer.Cell().Element(CellStyle);
                                footer.Cell().Element(CellStyle).AlignRight().Text($"₹{paymentsList.Sum(p => p.Amount):F2}").Bold();
                            });
                        });
                    });
            });
        });

        return document.GeneratePdf();
    }

    public async Task SendFeeReceiptEmailAsync(int paymentId, int tenantId)
    {
        var payment = await _context.FeePayments
            .Include(p => p.Student)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.TenantId == tenantId);

        if (payment == null || payment.Student == null) return;

        var pdfBytes = await GenerateFeeReceiptPdfAsync(payment);
        
        // TODO: Attach PDF to email
        var subject = $"Fee Payment Receipt - {payment.ReceiptNumber}";
        var body = $@"
Dear {payment.Student.FirstName} {payment.Student.LastName},

Your fee payment of ₹{payment.Amount:F2} has been received successfully.

Receipt Number: {payment.ReceiptNumber}
Payment Date: {payment.PaymentDate:dd/MM/yyyy}
Payment Mode: {payment.PaymentMode}

Please find the receipt attached.

Thank you!
";

        if (!string.IsNullOrEmpty(payment.Student.Email))
        {
            await _notificationService.SendEmailAsync(payment.Student.Email, subject, body);
        }

        if (!string.IsNullOrEmpty(payment.Student.ParentEmail))
        {
            await _notificationService.SendEmailAsync(payment.Student.ParentEmail, subject, body);
        }
    }

    private static IContainer CellStyle(IContainer container)
    {
        return container
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(5)
            .PaddingHorizontal(5);
    }

}

