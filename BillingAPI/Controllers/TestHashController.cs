using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestHashController : ControllerBase
{
    [HttpGet("hash/{password}")]
    public IActionResult GetHash(string password)
    {
        var hash = HashPassword(password);
        return Ok(new { password, hash });
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

