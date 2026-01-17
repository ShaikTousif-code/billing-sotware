using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IExcelService
{
    Task<byte[]> ExportProductsToExcelAsync(List<Product> products);
    Task<byte[]> ExportCustomersToExcelAsync(List<Customer> customers);
    Task<byte[]> ExportInvoicesToExcelAsync(List<Invoice> invoices);
    Task<List<Product>> ImportProductsFromExcelAsync(Stream fileStream, int tenantId);
    Task<List<Customer>> ImportCustomersFromExcelAsync(Stream fileStream, int tenantId);
    Task<byte[]> ExportFeesToExcelAsync(List<Fee> fees);
    Task<byte[]> ExportStudentsToExcelAsync(List<Student> students);
    Task<List<Fee>> ImportFeesFromExcelAsync(Stream stream, int tenantId);
}

