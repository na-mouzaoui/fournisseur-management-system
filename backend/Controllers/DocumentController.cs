using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IDossierService _dossierService;

    public DocumentController(IDocumentService documentService, IDossierService dossierService)
    {
        _documentService = documentService;
        _dossierService = dossierService;
    }

    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<DocumentDto>> Upload(
        [FromForm] IFormFile fichier,
        [FromForm] int dossierId,
        [FromForm] string typeCode,
        [FromForm] DateTime? dateExpiration = null)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

        using var ms = new MemoryStream();
        await fichier.CopyToAsync(ms);

        var document = await _documentService.UploadDocumentAsync(new CreateDocumentRequest
        {
            DossierId = dossierId,
            TypeCode = typeCode,
            NomFichier = fichier.FileName,
            DateExpiration = dateExpiration
        }, ms.ToArray(), userId);

        return CreatedAtAction(nameof(Download), new { id = document.Id }, document);
    }

    [HttpPut("{dossierId}/types/{typeCode}")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<DocumentDto>> UploadReplacement(
        int dossierId,
        string typeCode,
        [FromForm] IFormFile fichier,
        [FromForm] DateTime? dateExpiration = null)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

        using var ms = new MemoryStream();
        await fichier.CopyToAsync(ms);

        var document = await _documentService.UploadDocumentReplacementAsync(
            dossierId, typeCode, ms.ToArray(), fichier.FileName, dateExpiration, userId);

        return Ok(document);
    }

    [HttpGet("{id}/download")]
    public async Task<ActionResult> Download(int id)
    {
        var result = await _documentService.DownloadDocumentAsync(id);
        if (result == null)
            return NotFound();

        return File(result.Value.Contenu, "application/pdf", result.Value.NomFichier);
    }

    [HttpPatch("{id}/date-expiration")]
    public async Task<ActionResult<DocumentDto>> UpdateDateExpiration(int id, [FromBody] UpdateDocumentDateExpirationRequest request)
    {
        var document = await _documentService.UpdateDateExpirationAsync(id, request.DateExpiration);
        if (document == null)
            return NotFound();

        return Ok(document);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _documentService.DeleteDocumentAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }

    [HttpGet("operateurs/{operateurId}")]
    public async Task<ActionResult<List<DocumentDto>>> GetByOperateur(int operateurId)
    {
        var dossier = await _dossierService.GetOrCreateForOperateurAsync(operateurId);
        return Ok(dossier.Documents);
    }

    [HttpPost("operateurs/{operateurId}")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<DocumentDto>> UploadForOperateur(
        int operateurId,
        [FromForm] IFormFile fichier,
        [FromForm] string typeCode,
        [FromForm] DateTime? dateExpiration = null)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

        var dossier = await _dossierService.GetOrCreateForOperateurAsync(operateurId);

        using var ms = new MemoryStream();
        await fichier.CopyToAsync(ms);

        var document = await _documentService.UploadDocumentAsync(new CreateDocumentRequest
        {
            DossierId = dossier.Id,
            TypeCode = typeCode,
            NomFichier = fichier.FileName,
            DateExpiration = dateExpiration
        }, ms.ToArray(), userId);

        return CreatedAtAction(nameof(Download), new { id = document.Id }, document);
    }
}
