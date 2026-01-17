using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ILoyaltyService
{
    Task<decimal> GetLoyaltyPointsAsync(int customerId);
    Task<decimal> EarnLoyaltyPointsAsync(int tenantId, int customerId, decimal invoiceAmount, int invoiceId);
    Task<bool> RedeemLoyaltyPointsAsync(int tenantId, int customerId, decimal pointsToRedeem, int invoiceId);
    Task<List<LoyaltyTransaction>> GetLoyaltyTransactionsAsync(int tenantId, int customerId);
}

public class LoyaltyService : ILoyaltyService
{
    private readonly ApplicationDbContext _context;

    public LoyaltyService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> GetLoyaltyPointsAsync(int customerId)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        return customer?.LoyaltyPoints ?? 0;
    }

    public async Task<decimal> EarnLoyaltyPointsAsync(int tenantId, int customerId, decimal invoiceAmount, int invoiceId)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null || customer.CustomerType != "B2C")
        {
            return 0;
        }

        // Earn 1 point per ₹100 spent (configurable - can be moved to tenant configuration)
        var pointsEarned = Math.Floor(invoiceAmount / 100);

        if (pointsEarned > 0)
        {
            customer.LoyaltyPoints += pointsEarned;
            customer.LoyaltyPointsEarned += pointsEarned;

            var transaction = new LoyaltyTransaction
            {
                TenantId = tenantId,
                CustomerId = customerId,
                TransactionType = "Earn",
                Points = pointsEarned,
                ReferenceType = "Invoice",
                ReferenceId = invoiceId,
                TransactionDate = DateTime.UtcNow,
                Notes = $"Earned from invoice #{invoiceId}"
            };

            _context.LoyaltyTransactions.Add(transaction);
            await _context.SaveChangesAsync();
        }

        return pointsEarned;
    }

    public async Task<bool> RedeemLoyaltyPointsAsync(int tenantId, int customerId, decimal pointsToRedeem, int invoiceId)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null || customer.CustomerType != "B2C")
        {
            return false;
        }

        if (customer.LoyaltyPoints < pointsToRedeem)
        {
            return false;
        }

        customer.LoyaltyPoints -= pointsToRedeem;
        customer.LoyaltyPointsRedeemed += pointsToRedeem;

        var transaction = new LoyaltyTransaction
        {
            TenantId = tenantId,
            CustomerId = customerId,
            TransactionType = "Redeem",
            Points = pointsToRedeem,
            ReferenceType = "Invoice",
            ReferenceId = invoiceId,
            TransactionDate = DateTime.UtcNow,
            Notes = $"Redeemed for invoice #{invoiceId}"
        };

        _context.LoyaltyTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<LoyaltyTransaction>> GetLoyaltyTransactionsAsync(int tenantId, int customerId)
    {
        return await _context.LoyaltyTransactions
            .Where(lt => lt.TenantId == tenantId && lt.CustomerId == customerId)
            .OrderByDescending(lt => lt.TransactionDate)
            .ToListAsync();
    }
}

