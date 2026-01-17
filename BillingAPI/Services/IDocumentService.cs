using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IDocumentService
{
    Task<Document> UploadDocumentAsync(IFormFile file, string documentType, string? entityType, int? entityId, int tenantId, int createdById, string? description = null);
    Task<Document?> GetDocumentByIdAsync(int id, int tenantId);
    Task<List<Document>> GetDocumentsAsync(int tenantId, string? documentType = null, string? entityType = null, int? entityId = null);
    Task<bool> DeleteDocumentAsync(int id, int tenantId);
    Task<byte[]> DownloadDocumentAsync(int id, int tenantId);
}

