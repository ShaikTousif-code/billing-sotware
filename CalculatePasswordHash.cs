using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main()
    {
        Console.WriteLine("Calculating password hashes...");
        Console.WriteLine();
        Console.WriteLine("Password123! hash: " + HashPassword("Password123!"));
        Console.WriteLine("Admin@123 hash: " + HashPassword("Admin@123"));
    }

    static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

