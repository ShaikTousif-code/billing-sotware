using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FilesController> _logger;

    public FilesController(IWebHostEnvironment environment, ILogger<FilesController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file, [FromQuery] string folder = "products")
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Invalid file type. Only images are allowed." });

        var maxSize = 5 * 1024 * 1024; // 5MB
        if (file.Length > maxSize)
            return BadRequest(new { message = "File size exceeds 5MB limit" });

        var tenantId = GetTenantId();
        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", tenantId.ToString(), folder);
        
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{tenantId}/{folder}/{fileName}";
        return Ok(new { url, fileName });
    }

    [HttpGet("download/{*filePath}")]
    public IActionResult DownloadFile(string filePath)
    {
        var tenantId = GetTenantId();
        var fullPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", tenantId.ToString(), filePath);

        if (!System.IO.File.Exists(fullPath))
            return NotFound();

        var fileBytes = System.IO.File.ReadAllBytes(fullPath);
        var contentType = GetContentType(fullPath);
        
        return File(fileBytes, contentType, Path.GetFileName(fullPath));
    }

    private string GetContentType(string path)
    {
        var extension = Path.GetExtension(path).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

