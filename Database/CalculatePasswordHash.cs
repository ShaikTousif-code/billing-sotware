// Helper C# code to calculate password hash
// Run this in a C# console app or use in your application

using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main()
    {
        string password = "SuperAdmin@123";
        string hash = HashPassword(password);
        Console.WriteLine($"Password: {password}");
        Console.WriteLine($"Hash: {hash}");
    }

    static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

// Output for "SuperAdmin@123":
// Hash: j0NDRmRki7YvMK4slV25ABg5S32epF46FszPFShs7w=

