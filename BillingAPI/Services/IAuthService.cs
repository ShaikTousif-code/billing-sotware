using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IAuthService
{
    Task<(string token, User user)> LoginAsync(string email, string password, int? tenantId = null);
    Task<User> RegisterAsync(User user, string password);
    Task<User?> GetUserByEmailAsync(string email, int tenantId);
}

