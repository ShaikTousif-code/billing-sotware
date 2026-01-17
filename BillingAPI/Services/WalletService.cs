using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class WalletService : IWalletService
{
    private readonly ApplicationDbContext _context;

    public WalletService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<WalletTransaction>> GetWalletTransactionsAsync(int tenantId, int customerId)
    {
        return await _context.WalletTransactions
            .Where(wt => wt.TenantId == tenantId && wt.CustomerId == customerId)
            .OrderByDescending(wt => wt.TransactionDate)
            .ToListAsync();
    }

    public async Task<WalletTransaction> AddWalletCreditAsync(int tenantId, int customerId, decimal amount, string? notes, int createdById)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null)
            throw new Exception("Customer not found");

        var currentBalance = await GetWalletBalanceAsync(customerId);
        var newBalance = currentBalance + amount;

        var transaction = new WalletTransaction
        {
            TenantId = tenantId,
            CustomerId = customerId,
            TransactionType = "Credit",
            Amount = amount,
            BalanceAfter = newBalance,
            ReferenceType = "Manual",
            Notes = notes,
            TransactionDate = DateTime.UtcNow,
            CreatedById = createdById
        };

        customer.WalletBalance = newBalance;
        _context.WalletTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return transaction;
    }

    public async Task<WalletTransaction> AddWalletDebitAsync(int tenantId, int customerId, decimal amount, string? notes, int createdById)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null)
            throw new Exception("Customer not found");

        var currentBalance = await GetWalletBalanceAsync(customerId);
        if (currentBalance < amount)
            throw new Exception("Insufficient wallet balance");

        var newBalance = currentBalance - amount;

        var transaction = new WalletTransaction
        {
            TenantId = tenantId,
            CustomerId = customerId,
            TransactionType = "Debit",
            Amount = amount,
            BalanceAfter = newBalance,
            ReferenceType = "Manual",
            Notes = notes,
            TransactionDate = DateTime.UtcNow,
            CreatedById = createdById
        };

        customer.WalletBalance = newBalance;
        _context.WalletTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return transaction;
    }

    public async Task<decimal> GetWalletBalanceAsync(int customerId)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        return customer?.WalletBalance ?? 0;
    }

    public async Task<bool> UseWalletPaymentAsync(int tenantId, int customerId, int invoiceId, decimal amount, int createdById)
    {
        var currentBalance = await GetWalletBalanceAsync(customerId);
        if (currentBalance < amount)
            return false;

        var newBalance = currentBalance - amount;

        var transaction = new WalletTransaction
        {
            TenantId = tenantId,
            CustomerId = customerId,
            TransactionType = "Debit",
            Amount = amount,
            BalanceAfter = newBalance,
            ReferenceType = "Payment",
            ReferenceId = invoiceId,
            TransactionDate = DateTime.UtcNow,
            CreatedById = createdById
        };

        var customer = await _context.Customers.FindAsync(customerId);
        if (customer != null)
        {
            customer.WalletBalance = newBalance;
        }

        _context.WalletTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return true;
    }
}

