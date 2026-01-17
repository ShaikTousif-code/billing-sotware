using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadDocument([FromForm] IFormFile file, [FromForm] string documentType, [FromForm] string? entityType, [FromForm] int? entityId, [FromForm] string? description)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.ErrorResponse("No file provided"));

        var tenantId = GetTenantId();
        var userId = GetUserId();

        var document = await _documentService.UploadDocumentAsync(
            file, documentType, entityType, entityId, tenantId, userId, description);

        return CreatedAtAction(nameof(GetDocument), new { id = document.Id },
            ApiResponse<Document>.SuccessResponse(document, "Document uploaded successfully"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDocument(int id)
    {
        var tenantId = GetTenantId();
        var document = await _documentService.GetDocumentByIdAsync(id, tenantId);
        if (document == null)
            return NotFound(ApiResponse<Document>.ErrorResponse("Document not found"));
        
        return Ok(ApiResponse<Document>.SuccessResponse(document));
    }

    [HttpGet]
    public async Task<IActionResult> GetDocuments([FromQuery] string? documentType, [FromQuery] string? entityType, [FromQuery] int? entityId)
    {
        var tenantId = GetTenantId();
        var documents = await _documentService.GetDocumentsAsync(tenantId, documentType, entityType, entityId);
        return Ok(ApiResponse<List<Document>>.SuccessResponse(documents));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(int id)
    {
        var tenantId = GetTenantId();
        var deleted = await _documentService.DeleteDocumentAsync(id, tenantId);
        if (!deleted)
            return NotFound(ApiResponse<object>.ErrorResponse("Document not found"));
        
        return Ok(ApiResponse<object>.SuccessResponse(null, "Document deleted successfully"));
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadDocument(int id)
    {
        var tenantId = GetTenantId();
        try
        {
            var document = await _documentService.GetDocumentByIdAsync(id, tenantId);
            if (document == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Document not found"));

            var fileBytes = await _documentService.DownloadDocumentAsync(id, tenantId);
            return File(fileBytes, $"application/{document.FileType}", document.OriginalFileName);
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

