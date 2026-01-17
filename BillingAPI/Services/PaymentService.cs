using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;

    public PaymentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Payment>> GetPaymentsAsync(int tenantId, int? invoiceId = null)
    {
        var query = _context.Payments
            .Include(p => p.Invoice)
            .Where(p => p.TenantId == tenantId);

        if (invoiceId.HasValue)
        {
            query = query.Where(p => p.InvoiceId == invoiceId.Value);
        }

        return await query.OrderByDescending(p => p.PaymentDate).ToListAsync();
    }

    public async Task<Payment> CreatePaymentAsync(Payment payment)
    {
        _context.Payments.Add(payment);

        // Update invoice paid amount
        var invoice = await _context.Invoices.FindAsync(payment.InvoiceId);
        if (invoice != null)
        {
            invoice.PaidAmount += payment.Amount;
            invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
            
            if (invoice.BalanceAmount <= 0)
            {
                invoice.Status = "Completed";
                // Ensure balanceAmount is exactly 0 for completed invoices
                invoice.BalanceAmount = 0;
                // Ensure paidAmount equals totalAmount for completed invoices
                if (invoice.PaidAmount < invoice.TotalAmount)
                {
                    invoice.PaidAmount = invoice.TotalAmount;
                }
            }
        }

        await _context.SaveChangesAsync();
        return payment;
    }

    public async Task<Payment> CreateSplitPaymentAsync(int invoiceId, int tenantId, List<SplitPaymentRequest> payments)
    {
        var invoice = await _context.Invoices.FindAsync(invoiceId);
        if (invoice == null)
            throw new Exception("Invoice not found");

        decimal totalAmount = payments.Sum(p => p.Amount);
        if (totalAmount > invoice.BalanceAmount)
            throw new Exception("Total payment amount exceeds invoice balance");

        Payment? firstPayment = null;
        foreach (var paymentRequest in payments)
        {
            var payment = new Payment
            {
                TenantId = tenantId,
                InvoiceId = invoiceId,
                Amount = paymentRequest.Amount,
                PaymentMode = paymentRequest.PaymentMode,
                TransactionId = paymentRequest.TransactionId,
                PaymentDate = DateTime.UtcNow,
                CreatedById = 1 // TODO: Get from context
            };

            _context.Payments.Add(payment);
            if (firstPayment == null)
                firstPayment = payment;
        }

        // Update invoice
        invoice.PaidAmount += totalAmount;
        invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
        if (invoice.BalanceAmount <= 0)
        {
            invoice.Status = "Completed";
            // Ensure balanceAmount is exactly 0 for completed invoices
            invoice.BalanceAmount = 0;
            // Ensure paidAmount equals totalAmount for completed invoices
            if (invoice.PaidAmount < invoice.TotalAmount)
            {
                invoice.PaidAmount = invoice.TotalAmount;
            }
        }

        await _context.SaveChangesAsync();
        return firstPayment!;
    }

    public async Task<bool> DeletePaymentAsync(int id, int tenantId)
    {
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (payment == null) return false;

        // Update invoice
        var invoice = await _context.Invoices.FindAsync(payment.InvoiceId);
        if (invoice != null)
        {
            invoice.PaidAmount -= payment.Amount;
            invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
        }

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> GetTotalPaidAsync(int invoiceId)
    {
        return await _context.Payments
            .Where(p => p.InvoiceId == invoiceId)
            .SumAsync(p => p.Amount);
    }
}

