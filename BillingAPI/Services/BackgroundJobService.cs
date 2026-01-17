using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class BackgroundJobService : IBackgroundJobService
{
    private readonly ApplicationDbContext _context;
    private readonly IRecurringInvoiceService _recurringInvoiceService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<BackgroundJobService> _logger;

    public BackgroundJobService(
        ApplicationDbContext context,
        IRecurringInvoiceService recurringInvoiceService,
        INotificationService notificationService,
        ILogger<BackgroundJobService> logger)
    {
        _context = context;
        _recurringInvoiceService = recurringInvoiceService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task GenerateRecurringInvoicesJobAsync()
    {
        _logger.LogInformation("Starting recurring invoice generation job");

        var tenants = await _context.Tenants.Where(t => t.IsActive).ToListAsync();

        foreach (var tenant in tenants)
        {
            try
            {
                var invoices = await _recurringInvoiceService.GenerateRecurringInvoicesAsync(tenant.Id);
                _logger.LogInformation($"Generated {invoices.Count} invoices for tenant {tenant.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating invoices for tenant {tenant.Id}");
            }
        }

        _logger.LogInformation("Completed recurring invoice generation job");
    }

    public async Task SendFeeRemindersJobAsync()
    {
        _logger.LogInformation("Starting fee reminder job");

        var tenants = await _context.Tenants.Where(t => t.IsActive).ToListAsync();

        foreach (var tenant in tenants)
        {
            try
            {
                var overdueFees = await _context.Fees
                    .Include(f => f.Student)
                    .Where(f => f.TenantId == tenant.Id
                        && f.Status != "Paid"
                        && f.DueDate < DateTime.UtcNow
                        && f.BalanceAmount > 0)
                    .ToListAsync();

                foreach (var fee in overdueFees)
                {
                    if (fee.Student != null)
                    {
                        await _notificationService.SendFeeReminderAsync(
                            tenant.Id,
                            fee.StudentId,
                            fee.Id,
                            fee.BalanceAmount,
                            fee.DueDate
                        );
                    }
                }

                _logger.LogInformation($"Sent {overdueFees.Count} fee reminders for tenant {tenant.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending fee reminders for tenant {tenant.Id}");
            }
        }

        _logger.LogInformation("Completed fee reminder job");
    }

    public async Task SendContractRenewalRemindersJobAsync()
    {
        _logger.LogInformation("Starting contract renewal reminder job");

        var tenants = await _context.Tenants.Where(t => t.IsActive).ToListAsync();

        foreach (var tenant in tenants)
        {
            try
            {
                var expiringContracts = await _recurringInvoiceService.GetExpiringContractsAsync(tenant.Id, 30);

                foreach (var contract in expiringContracts)
                {
                    await _notificationService.SendContractRenewalReminderAsync(
                        tenant.Id,
                        contract.Id,
                        contract.EndDate
                    );
                }

                _logger.LogInformation($"Sent {expiringContracts.Count} contract renewal reminders for tenant {tenant.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending contract reminders for tenant {tenant.Id}");
            }
        }

        _logger.LogInformation("Completed contract renewal reminder job");
    }

    public async Task UpdateOverdueFeesStatusJobAsync()
    {
        _logger.LogInformation("Starting overdue fees status update job");

        var overdueFees = await _context.Fees
            .Where(f => f.Status != "Paid"
                && f.DueDate < DateTime.UtcNow
                && f.BalanceAmount > 0)
            .ToListAsync();

        foreach (var fee in overdueFees)
        {
            fee.Status = "Overdue";
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation($"Updated {overdueFees.Count} fees to overdue status");
    }
}

public interface IBackgroundJobService
{
    Task GenerateRecurringInvoicesJobAsync();
    Task SendFeeRemindersJobAsync();
    Task SendContractRenewalRemindersJobAsync();
    Task UpdateOverdueFeesStatusJobAsync();
}

