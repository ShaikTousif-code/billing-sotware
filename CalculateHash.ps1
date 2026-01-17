# PowerShell script to calculate SHA256 + Base64 hash
Add-Type -AssemblyName System.Security

function Get-PasswordHash {
    param([string]$Password)
    
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Password)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash($bytes)
    $hashString = [Convert]::ToBase64String($hashBytes)
    
    return $hashString
}

Write-Host "Password123! hash: $(Get-PasswordHash -Password 'Password123!')"
Write-Host "Admin@123 hash: $(Get-PasswordHash -Password 'Admin@123')"

