using OfficeOpenXml;
using BillingAPI.Models;
using System.Globalization;

namespace BillingAPI.Services;

public class ExcelService : IExcelService
{
    public ExcelService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<byte[]> ExportProductsToExcelAsync(List<Product> products)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Products");

        // Headers
        worksheet.Cells[1, 1].Value = "Name";
        worksheet.Cells[1, 2].Value = "SKU";
        worksheet.Cells[1, 3].Value = "Category";
        worksheet.Cells[1, 4].Value = "Cost Price";
        worksheet.Cells[1, 5].Value = "Selling Price";
        worksheet.Cells[1, 6].Value = "Tax Rate";
        worksheet.Cells[1, 7].Value = "Stock Quantity";
        worksheet.Cells[1, 8].Value = "Unit";

        // Style header
        using (var range = worksheet.Cells[1, 1, 1, 8])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        // Data
        for (int i = 0; i < products.Count; i++)
        {
            var row = i + 2;
            worksheet.Cells[row, 1].Value = products[i].Name;
            worksheet.Cells[row, 2].Value = products[i].SKU;
            worksheet.Cells[row, 3].Value = products[i].Category?.Name;
            worksheet.Cells[row, 4].Value = products[i].CostPrice;
            worksheet.Cells[row, 5].Value = products[i].SellingPrice;
            worksheet.Cells[row, 6].Value = products[i].TaxRate;
            worksheet.Cells[row, 7].Value = products[i].StockQuantity;
            worksheet.Cells[row, 8].Value = products[i].Unit;
        }

        worksheet.Cells.AutoFitColumns();
        return await Task.FromResult(package.GetAsByteArray());
    }

    public async Task<byte[]> ExportCustomersToExcelAsync(List<Customer> customers)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Customers");

        worksheet.Cells[1, 1].Value = "Name";
        worksheet.Cells[1, 2].Value = "Email";
        worksheet.Cells[1, 3].Value = "Phone";
        worksheet.Cells[1, 4].Value = "Address";
        worksheet.Cells[1, 5].Value = "GSTIN";
        worksheet.Cells[1, 6].Value = "Outstanding Balance";

        using (var range = worksheet.Cells[1, 1, 1, 6])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        for (int i = 0; i < customers.Count; i++)
        {
            var row = i + 2;
            worksheet.Cells[row, 1].Value = customers[i].Name;
            worksheet.Cells[row, 2].Value = customers[i].Email;
            worksheet.Cells[row, 3].Value = customers[i].Phone;
            worksheet.Cells[row, 4].Value = customers[i].Address;
            worksheet.Cells[row, 5].Value = customers[i].GSTIN;
            worksheet.Cells[row, 6].Value = customers[i].OutstandingBalance;
        }

        worksheet.Cells.AutoFitColumns();
        return await Task.FromResult(package.GetAsByteArray());
    }

    public async Task<byte[]> ExportInvoicesToExcelAsync(List<Invoice> invoices)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Invoices");

        worksheet.Cells[1, 1].Value = "Invoice Number";
        worksheet.Cells[1, 2].Value = "Date";
        worksheet.Cells[1, 3].Value = "Customer";
        worksheet.Cells[1, 4].Value = "Status";
        worksheet.Cells[1, 5].Value = "Total Amount";
        worksheet.Cells[1, 6].Value = "Paid Amount";
        worksheet.Cells[1, 7].Value = "Balance";

        using (var range = worksheet.Cells[1, 1, 1, 7])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        for (int i = 0; i < invoices.Count; i++)
        {
            var row = i + 2;
            worksheet.Cells[row, 1].Value = invoices[i].InvoiceNumber;
            worksheet.Cells[row, 2].Value = invoices[i].InvoiceDate.ToString("dd/MM/yyyy");
            worksheet.Cells[row, 3].Value = invoices[i].CustomerName;
            worksheet.Cells[row, 4].Value = invoices[i].Status;
            worksheet.Cells[row, 5].Value = invoices[i].TotalAmount;
            worksheet.Cells[row, 6].Value = invoices[i].PaidAmount;
            worksheet.Cells[row, 7].Value = invoices[i].BalanceAmount;
        }

        worksheet.Cells.AutoFitColumns();
        return await Task.FromResult(package.GetAsByteArray());
    }

    public async Task<List<Product>> ImportProductsFromExcelAsync(Stream fileStream, int tenantId)
    {
        var products = new List<Product>();
        using var package = new ExcelPackage(fileStream);
        var worksheet = package.Workbook.Worksheets[0];

        for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
        {
            if (worksheet.Cells[row, 1].Value == null) break;

            products.Add(new Product
            {
                TenantId = tenantId,
                Name = worksheet.Cells[row, 1].Value?.ToString() ?? "",
                SKU = worksheet.Cells[row, 2].Value?.ToString(),
                CostPrice = decimal.Parse(worksheet.Cells[row, 4].Value?.ToString() ?? "0"),
                SellingPrice = decimal.Parse(worksheet.Cells[row, 5].Value?.ToString() ?? "0"),
                TaxRate = decimal.TryParse(worksheet.Cells[row, 6].Value?.ToString(), out var tax) ? tax : 0,
                StockQuantity = int.TryParse(worksheet.Cells[row, 7].Value?.ToString(), out var qty) ? qty : 0,
                Unit = worksheet.Cells[row, 8].Value?.ToString() ?? "PCS",
                IsActive = true,
                TrackInventory = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        return await Task.FromResult(products);
    }

    public async Task<List<Customer>> ImportCustomersFromExcelAsync(Stream fileStream, int tenantId)
    {
        var customers = new List<Customer>();
        using var package = new ExcelPackage(fileStream);
        var worksheet = package.Workbook.Worksheets[0];

        for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
        {
            if (worksheet.Cells[row, 1].Value == null) break;

            customers.Add(new Customer
            {
                TenantId = tenantId,
                Name = worksheet.Cells[row, 1].Value?.ToString() ?? "",
                Email = worksheet.Cells[row, 2].Value?.ToString(),
                Phone = worksheet.Cells[row, 3].Value?.ToString(),
                Address = worksheet.Cells[row, 4].Value?.ToString(),
                GSTIN = worksheet.Cells[row, 5].Value?.ToString(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        return await Task.FromResult(customers);
    }

    public async Task<byte[]> ExportFeesToExcelAsync(List<Fee> fees)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Fees");

        // Headers
        worksheet.Cells[1, 1].Value = "Fee Number";
        worksheet.Cells[1, 2].Value = "Student ID";
        worksheet.Cells[1, 3].Value = "Student Name";
        worksheet.Cells[1, 4].Value = "Fee Type";
        worksheet.Cells[1, 5].Value = "Amount";
        worksheet.Cells[1, 6].Value = "Paid Amount";
        worksheet.Cells[1, 7].Value = "Balance";
        worksheet.Cells[1, 8].Value = "Due Date";
        worksheet.Cells[1, 9].Value = "Status";

        // Style header
        using (var range = worksheet.Cells[1, 1, 1, 9])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        // Data
        for (int i = 0; i < fees.Count; i++)
        {
            var row = i + 2;
            worksheet.Cells[row, 1].Value = fees[i].FeeNumber;
            worksheet.Cells[row, 2].Value = fees[i].Student?.StudentId ?? "";
            worksheet.Cells[row, 3].Value = fees[i].Student != null ? $"{fees[i].Student.FirstName} {fees[i].Student.LastName}" : "";
            worksheet.Cells[row, 4].Value = fees[i].FeeType;
            worksheet.Cells[row, 5].Value = fees[i].NetAmount;
            worksheet.Cells[row, 6].Value = fees[i].PaidAmount;
            worksheet.Cells[row, 7].Value = fees[i].BalanceAmount;
            worksheet.Cells[row, 8].Value = fees[i].DueDate.ToString("dd/MM/yyyy");
            worksheet.Cells[row, 9].Value = fees[i].Status;
        }

        worksheet.Cells.AutoFitColumns();
        return await Task.FromResult(package.GetAsByteArray());
    }

    public async Task<byte[]> ExportStudentsToExcelAsync(List<Student> students)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Students");

        // Headers
        worksheet.Cells[1, 1].Value = "Student ID";
        worksheet.Cells[1, 2].Value = "First Name";
        worksheet.Cells[1, 3].Value = "Last Name";
        worksheet.Cells[1, 4].Value = "Email";
        worksheet.Cells[1, 5].Value = "Phone";
        worksheet.Cells[1, 6].Value = "Class";
        worksheet.Cells[1, 7].Value = "Academic Year";
        worksheet.Cells[1, 8].Value = "Total Fees";
        worksheet.Cells[1, 9].Value = "Paid Fees";
        worksheet.Cells[1, 10].Value = "Outstanding";

        // Style header
        using (var range = worksheet.Cells[1, 1, 1, 10])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        // Data
        for (int i = 0; i < students.Count; i++)
        {
            var row = i + 2;
            worksheet.Cells[row, 1].Value = students[i].StudentId;
            worksheet.Cells[row, 2].Value = students[i].FirstName;
            worksheet.Cells[row, 3].Value = students[i].LastName;
            worksheet.Cells[row, 4].Value = students[i].Email;
            worksheet.Cells[row, 5].Value = students[i].Phone;
            worksheet.Cells[row, 6].Value = students[i].Class?.Name ?? "";
            worksheet.Cells[row, 7].Value = students[i].AcademicYear;
            worksheet.Cells[row, 8].Value = students[i].TotalFees;
            worksheet.Cells[row, 9].Value = students[i].PaidFees;
            worksheet.Cells[row, 10].Value = students[i].OutstandingFees;
        }

        worksheet.Cells.AutoFitColumns();
        return await Task.FromResult(package.GetAsByteArray());
    }

    public async Task<List<Fee>> ImportFeesFromExcelAsync(Stream stream, int tenantId)
    {
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets[0];
        var fees = new List<Fee>();

        for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
        {
            var studentId = worksheet.Cells[row, 1].GetValue<string>();
            var feeType = worksheet.Cells[row, 2].GetValue<string>();
            var amount = worksheet.Cells[row, 3].GetValue<decimal>();
            var dueDate = worksheet.Cells[row, 4].GetValue<DateTime>();

            var fee = new Fee
            {
                TenantId = tenantId,
                FeeNumber = $"FEE-{DateTime.UtcNow:yyyy}-{row - 1:D6}",
                FeeType = feeType ?? "Tuition",
                Amount = amount,
                NetAmount = amount,
                BalanceAmount = amount,
                DueDate = dueDate,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            fees.Add(fee);
        }

        return await Task.FromResult(fees);
    }
}

