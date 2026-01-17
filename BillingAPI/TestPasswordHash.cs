// Temporary test file to verify password hash
// Run this to get the correct hash for "Password123!"

using System;
using System.Security.Cryptography;
using System.Text;

class TestPasswordHash
{
    static void Main()
    {
        string password = "Password123!";
        string hash = HashPassword(password);
        Console.WriteLine($"Password: {password}");
        Console.WriteLine($"Hash: {hash}");
        
        // Test verification
        string testHash = "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=";
        Console.WriteLine($"Expected hash: {testHash}");
        Console.WriteLine($"Match: {hash == testHash}");
        
        // Also test Admin@123
        string adminPassword = "Admin@123";
        string adminHash = HashPassword(adminPassword);
        Console.WriteLine($"\nPassword: {adminPassword}");
        Console.WriteLine($"Hash: {adminHash}");
        string expectedAdminHash = "6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=";
        Console.WriteLine($"Expected hash: {expectedAdminHash}");
        Console.WriteLine($"Match: {adminHash == expectedAdminHash}");
    }

    static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}

