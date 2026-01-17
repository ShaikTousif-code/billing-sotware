using Microsoft.Extensions.DependencyInjection;

namespace BillingAPI.Infrastructure;

public static class HangfireJobExecutor
{
    private static IServiceProvider? _serviceProvider;

    public static void Initialize(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public static async Task ExecuteGenerateRecurringInvoicesJobAsync()
    {
        if (_serviceProvider == null)
            throw new InvalidOperationException("HangfireJobExecutor not initialized. Call Initialize() during app startup.");

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<BillingAPI.Services.IBackgroundJobService>();
        await service.GenerateRecurringInvoicesJobAsync();
    }

    public static async Task ExecuteSendFeeRemindersJobAsync()
    {
        if (_serviceProvider == null)
            throw new InvalidOperationException("HangfireJobExecutor not initialized. Call Initialize() during app startup.");

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<BillingAPI.Services.IBackgroundJobService>();
        await service.SendFeeRemindersJobAsync();
    }

    public static async Task ExecuteSendContractRenewalRemindersJobAsync()
    {
        if (_serviceProvider == null)
            throw new InvalidOperationException("HangfireJobExecutor not initialized. Call Initialize() during app startup.");

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<BillingAPI.Services.IBackgroundJobService>();
        await service.SendContractRenewalRemindersJobAsync();
    }

    public static async Task ExecuteUpdateOverdueFeesStatusJobAsync()
    {
        if (_serviceProvider == null)
            throw new InvalidOperationException("HangfireJobExecutor not initialized. Call Initialize() during app startup.");

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<BillingAPI.Services.IBackgroundJobService>();
        await service.UpdateOverdueFeesStatusJobAsync();
    }
}

