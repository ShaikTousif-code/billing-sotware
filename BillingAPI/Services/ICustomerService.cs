using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ICustomerService
{
    Task<List<Customer>> GetCustomersAsync(int tenantId);
    Task<Customer?> GetCustomerByIdAsync(int id, int tenantId);
    Task<Customer> CreateCustomerAsync(Customer customer);
    Task<Customer> UpdateCustomerAsync(Customer customer);
    Task<bool> DeleteCustomerAsync(int id, int tenantId);
}

