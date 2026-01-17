using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class DocumentService : IDocumentService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(ApplicationDbContext context, IWebHostEnvironment environment, ILogger<DocumentService> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    public async Task<Document> UploadDocumentAsync(IFormFile file, string documentType, string? entityType, int? entityId, int tenantId, int createdById, string? description = null)
    {
        if (file == null || file.Length == 0)
            throw new Exception("No file provided");

        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", tenantId.ToString());
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var document = new Document
        {
            TenantId = tenantId,
            DocumentType = documentType,
            EntityType = entityType,
            EntityId = entityId,
            FileName = fileName,
            OriginalFileName = file.FileName,
            FilePath = filePath,
            FileType = Path.GetExtension(file.FileName).TrimStart('.'),
            FileSize = file.Length,
            Description = description,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<Document?> GetDocumentByIdAsync(int id, int tenantId)
    {
        return await _context.Documents
            .Include(d => d.CreatedBy)
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);
    }

    public async Task<List<Document>> GetDocumentsAsync(int tenantId, string? documentType = null, string? entityType = null, int? entityId = null)
    {
        var query = _context.Documents
            .Include(d => d.CreatedBy)
            .Where(d => d.TenantId == tenantId);

        if (!string.IsNullOrEmpty(documentType))
            query = query.Where(d => d.DocumentType == documentType);

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(d => d.EntityType == entityType);

        if (entityId.HasValue)
            query = query.Where(d => d.EntityId == entityId.Value);

        return await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
    }

    public async Task<bool> DeleteDocumentAsync(int id, int tenantId)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);

        if (document == null) return false;

        // Delete physical file
        if (File.Exists(document.FilePath))
        {
            try
            {
                File.Delete(document.FilePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FilePath}", document.FilePath);
            }
        }

        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<byte[]> DownloadDocumentAsync(int id, int tenantId)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);

        if (document == null || !File.Exists(document.FilePath))
            throw new Exception("Document not found");

        return await File.ReadAllBytesAsync(document.FilePath);
    }
}

