using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Drawing;
using BillingAPI.Models;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using System.Reflection;
using System.IO;
using System.Text;
using DocumentModel = BillingAPI.Models.Document;
using QuestDocument = QuestPDF.Fluent.Document;

namespace BillingAPI.Services;

public class PdfService : IPdfService
{
    public PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // Register Unicode-compatible fonts
        RegisterFonts();
    }

        private void RegisterFonts()
        {
            try
            {
            // Register Lato fonts from the project if they exist (these are Unicode-compatible)
            var latoFontDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "LatoFont");
            if (Directory.Exists(latoFontDir))
            {
                var latoFonts = Directory.GetFiles(latoFontDir, "*.ttf");
                Console.WriteLine($"Found {latoFonts.Length} Lato fonts to register");
                foreach (var fontFile in latoFonts)
                {
                    try
                    {
                        using var stream = new MemoryStream(File.ReadAllBytes(fontFile));
                        FontManager.RegisterFont(stream);
                        Console.WriteLine($"Registered Lato font: {Path.GetFileName(fontFile)}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to register Lato font {Path.GetFileName(fontFile)}: {ex.Message}");
                    }
                }
            }

            // Try to register fonts from our custom fonts directory
            var customFontDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "fonts");
            if (Directory.Exists(customFontDir))
            {
                var customFonts = Directory.GetFiles(customFontDir, "*.*");
                foreach (var fontFile in customFonts)
                {
                    try
                    {
                        var extension = Path.GetExtension(fontFile).ToLower();
                        if (extension == ".ttf" || extension == ".otf")
                        {
                            using var stream = new MemoryStream(File.ReadAllBytes(fontFile));
                            FontManager.RegisterFont(stream);
                            Console.WriteLine($"Registered custom font: {Path.GetFileName(fontFile)}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to register custom font {Path.GetFileName(fontFile)}: {ex.Message}");
                    }
                }
            }

            // Try to register system fonts that support Unicode
            // First, try Arial Unicode MS if available (best for Unicode support)
            var arialUnicodePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), "arialuni.ttf");
            if (File.Exists(arialUnicodePath))
            {
                try
                {
                    using var stream = new MemoryStream(File.ReadAllBytes(arialUnicodePath));
                    FontManager.RegisterFont(stream);
                    Console.WriteLine("Registered Arial Unicode MS font");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to register Arial Unicode MS: {ex.Message}");
                }
            }

                // Try to register Segoe UI (good Unicode support on Windows)
                var segoeUiPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), "segoeui.ttf");
                if (File.Exists(segoeUiPath))
                {
                    try
                    {
                        using var stream = new MemoryStream(File.ReadAllBytes(segoeUiPath));
                        FontManager.RegisterFont(stream);
                        Console.WriteLine("Registered Segoe UI font");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to register Segoe UI: {ex.Message}");
                    }
                }

                // Fallback: Try to register Arial if available
                var arialPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), "arial.ttf");
                if (File.Exists(arialPath))
                {
                    using var stream = new MemoryStream(File.ReadAllBytes(arialPath));
                    FontManager.RegisterFont(stream);
                }

                // Also try to register other Unicode-supporting fonts
                var fontsToTry = new[] { "tahoma.ttf", "verdana.ttf", "times.ttf", "cour.ttf" };
                foreach (var fontFile in fontsToTry)
                {
                    var fontPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), fontFile);
                    if (File.Exists(fontPath))
                    {
                        using var stream = new MemoryStream(File.ReadAllBytes(fontPath));
                        FontManager.RegisterFont(stream);
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail - PDF generation should still work with default fonts
                Console.WriteLine($"Warning: Failed to register custom fonts: {ex.Message}");
            }
        }


    public async Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice)
    {
        // Ensure proper Unicode handling for special characters
        var sanitizedInvoice = SanitizeInvoiceData(invoice);

        // Set culture to ensure proper Unicode handling
        System.Threading.Thread.CurrentThread.CurrentCulture = System.Globalization.CultureInfo.GetCultureInfo("en-US");
        System.Threading.Thread.CurrentThread.CurrentUICulture = System.Globalization.CultureInfo.GetCultureInfo("en-US");

        // Ensure UTF-8 encoding is used
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

        // Log font information for debugging
        Console.WriteLine("Generating PDF for invoice with special character handling");
        Console.WriteLine($"Original Customer Name: {invoice.CustomerName}");
        Console.WriteLine($"Sanitized Customer Name: {sanitizedInvoice.CustomerName}");
        Console.WriteLine($"Invoice Number: {sanitizedInvoice.InvoiceNumber}");

        // Test Unicode normalization
        if (!string.IsNullOrEmpty(sanitizedInvoice.CustomerName) &&
            sanitizedInvoice.CustomerName != invoice.CustomerName)
        {
            Console.WriteLine("Unicode normalization applied to customer name");
        }

        var document = QuestDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x =>
                    x.FontSize(10)
                     .FontColor(Colors.Black)
                     .NormalWeight()
                     .FontFamily("Arial Unicode MS", "Arial", "Segoe UI", "Lato", "Times New Roman")
                );

                page.Header()
                    .Column(column =>
                    {
                        column.Item().Text($"Invoice #{sanitizedInvoice.InvoiceNumber}")
                            .FontSize(20)
                            .Bold()
                            .AlignCenter();

                        column.Item().Text($"Date: {sanitizedInvoice.InvoiceDate:dd/MM/yyyy}")
                            .FontSize(12)
                            .AlignCenter();
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        // Customer Info
                        column.Item().Text($"Customer: {sanitizedInvoice.CustomerName ?? "Walk-in Customer"}")
                            .FontSize(12)
                            .Bold();

                        column.Spacing(0.5f, Unit.Centimetre);

                        // Items Table
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            // Header
                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Product").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Qty").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Price").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Tax").Bold();
                                header.Cell().Element(CellStyle).AlignRight().Text("Total").Bold();
                            });

                            // Items
                            foreach (var item in sanitizedInvoice.Items!)
                            {
                                table.Cell().Element(CellStyle).Text(item.ProductName);
                                table.Cell().Element(CellStyle).AlignRight().Text(item.Quantity.ToString("0.00"));
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{item.UnitPrice:F2}");
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{item.TaxAmount:F2}");
                                table.Cell().Element(CellStyle).AlignRight().Text($"₹{item.TotalAmount:F2}");
                            }
                        });

                        column.Spacing(0.5f, Unit.Centimetre);

                        // Totals
                        column.Item().AlignRight().Column(totals =>
                        {
                            totals.Item().Text($"Subtotal: ₹{sanitizedInvoice.SubTotal:F2}").FontSize(10);
                            if (sanitizedInvoice.DiscountAmount > 0)
                                totals.Item().Text($"Discount: ₹{sanitizedInvoice.DiscountAmount:F2}").FontSize(10);
                            if (sanitizedInvoice.BillLevelDiscount > 0)
                                totals.Item().Text($"Bill Discount: ₹{sanitizedInvoice.BillLevelDiscount:F2}").FontSize(10);
                            totals.Item().Text($"Tax: ₹{sanitizedInvoice.TaxAmount:F2}").FontSize(10);
                            if (sanitizedInvoice.ServiceCharge > 0)
                                totals.Item().Text($"Service Charge: ₹{sanitizedInvoice.ServiceCharge:F2}").FontSize(10);
                            if (sanitizedInvoice.Tips > 0)
                                totals.Item().Text($"Tips: ₹{sanitizedInvoice.Tips:F2}").FontSize(10);
                            if (sanitizedInvoice.RoundOff != 0)
                                totals.Item().Text($"Round Off: ₹{sanitizedInvoice.RoundOff:F2}").FontSize(10);
                            totals.Item().Text($"Total: ₹{sanitizedInvoice.TotalAmount:F2}").FontSize(14).Bold();
                            totals.Item().Text($"Paid: ₹{sanitizedInvoice.PaidAmount:F2}").FontSize(10);
                            totals.Item().Text($"Balance: ₹{sanitizedInvoice.BalanceAmount:F2}").FontSize(10).Bold();
                        });

                        // QR Code
                        if (sanitizedInvoice.Status == "Completed")
                        {
                            try
                            {
                                var qrCodeBytes = GenerateQrCodeImage(sanitizedInvoice);
                                column.Item().PaddingTop(1, Unit.Centimetre).AlignCenter().Image(qrCodeBytes);
                            }
                            catch
                            {
                                // QR code generation failed, skip it
                            }
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Thank you for your business!")
                         .FontSize(10);
                    });
            });
        });

        // Generate PDF with proper settings
        var pdfBytes = document.GeneratePdf();

        // Log successful generation
        Console.WriteLine($"PDF generated successfully. Size: {pdfBytes.Length} bytes");

        return pdfBytes;
    }

    public async Task<byte[]> GenerateCreditNotePdfAsync(CreditNote creditNote)
    {
        var document = QuestDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);

                page.Header()
                    .Text($"Credit Note #{creditNote.CreditNoteNumber}")
                    .FontSize(20)
                    .Bold()
                    .AlignCenter();

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Item().Text($"Date: {creditNote.CreditNoteDate:dd/MM/yyyy}");
                        column.Item().Text($"Reason: {creditNote.Reason}");
                        column.Item().Text($"Amount: ₹{creditNote.TotalAmount:F2}").Bold();
                    });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<string> GenerateInvoiceQrCodeAsync(Invoice invoice)
    {
        var qrData = $"Invoice:{invoice.InvoiceNumber}|Amount:{invoice.TotalAmount}|Date:{invoice.InvoiceDate:yyyy-MM-dd}";
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(qrData, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var qrCodeBytes = qrCode.GetGraphic(20);
        return Convert.ToBase64String(qrCodeBytes);
    }

    private byte[] GenerateQrCodeImage(Invoice invoice)
    {
        var qrData = $"Invoice:{invoice.InvoiceNumber}|Amount:{invoice.TotalAmount}|Date:{invoice.InvoiceDate:yyyy-MM-dd}";
        // Sanitize QR data to ensure proper encoding
        qrData = SanitizeText(qrData);
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(qrData, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }

    private static IContainer CellStyle(IContainer container)
    {
        return container
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(5)
            .PaddingHorizontal(5);
    }

    private Invoice SanitizeInvoiceData(Invoice invoice)
    {
        // Create a copy of the invoice with sanitized text data
        var sanitized = new Invoice
        {
            Id = invoice.Id,
            TenantId = invoice.TenantId,
            InvoiceNumber = SanitizeText(invoice.InvoiceNumber),
            InvoiceDate = invoice.InvoiceDate,
            CustomerId = invoice.CustomerId,
            CustomerName = SanitizeText(invoice.CustomerName ?? "Walk-in Customer"),
            PatientId = invoice.PatientId,
            MedicalRecordId = invoice.MedicalRecordId,
            Status = invoice.Status,
            SubTotal = invoice.SubTotal,
            TaxAmount = invoice.TaxAmount,
            DiscountAmount = invoice.DiscountAmount,
            BillLevelDiscount = invoice.BillLevelDiscount,
            ServiceCharge = invoice.ServiceCharge,
            Tips = invoice.Tips,
            RoundOff = invoice.RoundOff,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = invoice.PaidAmount,
            BalanceAmount = invoice.BalanceAmount,
            PaymentMode = SanitizeText(invoice.PaymentMode),
            Notes = SanitizeText(invoice.Notes),
            CreatedById = invoice.CreatedById,
            CreatedAt = invoice.CreatedAt,
            CancelledAt = invoice.CancelledAt,
            CancellationReason = SanitizeText(invoice.CancellationReason),
            Tenant = invoice.Tenant,
            Customer = invoice.Customer,
            Patient = invoice.Patient,
            MedicalRecord = invoice.MedicalRecord,
            CreatedBy = invoice.CreatedBy,
            Payments = invoice.Payments,
            Items = invoice.Items?.Select(item => new InvoiceItem
            {
                Id = item.Id,
                InvoiceId = item.InvoiceId,
                ProductId = item.ProductId,
                ProductName = SanitizeText(item.ProductName),
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountAmount = item.DiscountAmount,
                TaxRate = item.TaxRate,
                TaxAmount = item.TaxAmount,
                TotalAmount = item.TotalAmount,
                Invoice = item.Invoice,
                Product = item.Product
            }).ToList()
        };

        return sanitized;
    }

    private string SanitizeText(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return text ?? string.Empty;

        try
        {
            // Normalize Unicode characters to ensure proper display
            // This handles various Unicode normalization forms
            var normalized = text.Normalize(NormalizationForm.FormC);

            // Ensure the string is properly encoded as UTF-8
            var bytes = System.Text.Encoding.UTF8.GetBytes(normalized);
            var result = System.Text.Encoding.UTF8.GetString(bytes);

            // Log if normalization changed the text
            if (result != text)
            {
                Console.WriteLine($"Text normalized: '{text}' -> '{result}'");
            }

            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sanitizing text '{text}': {ex.Message}");
            return text; // Return original text if sanitization fails
        }
    }

}

