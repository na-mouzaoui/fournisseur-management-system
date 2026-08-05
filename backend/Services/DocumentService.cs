using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class DocumentService : IDocumentService
{
    private readonly ApplicationDbContext _context;

    public DocumentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DocumentDto> UploadDocumentAsync(CreateDocumentRequest request, byte[] contenu, int uploaderId)
    {
        // Un seul document par (dossier_id, type_code) : on remplace la ligne existante.
        var existing = await _context.Documents
            .FirstOrDefaultAsync(d => d.DossierId == request.DossierId && d.TypeCode == request.TypeCode);

        if (existing != null)
        {
            return await UploadDocumentReplacementAsync(
                request.DossierId, request.TypeCode, contenu, request.NomFichier, request.DateExpiration, uploaderId);
        }

        var document = new Document
        {
            DossierId = request.DossierId,
            TypeCode = request.TypeCode,
            NomFichier = request.NomFichier,
            ContenuFichier = contenu,
            DateExpiration = request.DateExpiration,
            UserUploader = uploaderId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        return MapToDto(document);
    }

    public async Task<DocumentDto> UploadDocumentReplacementAsync(
        int dossierId, string typeCode, byte[] contenu, string nomFichier, DateTime? dateExpiration, int uploaderId)
    {
        var existing = await _context.Documents
            .FirstOrDefaultAsync(d => d.DossierId == dossierId && d.TypeCode == typeCode);

        if (existing == null)
        {
            return await UploadDocumentAsync(new CreateDocumentRequest
            {
                DossierId = dossierId,
                TypeCode = typeCode,
                NomFichier = nomFichier,
                DateExpiration = dateExpiration
            }, contenu, uploaderId);
        }

        existing.NomFichier = nomFichier;
        existing.ContenuFichier = contenu;
        existing.DateExpiration = dateExpiration;
        existing.UserUploader = uploaderId;
        existing.CreatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(existing);
    }

    public async Task<(byte[] Contenu, string NomFichier)?> DownloadDocumentAsync(int documentId)
    {
        var document = await _context.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document?.ContenuFichier == null)
            return null;

        return (document.ContenuFichier, document.NomFichier);
    }

    public async Task<DocumentDto?> UpdateDateExpirationAsync(int documentId, DateTime? dateExpiration)
    {
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == documentId);
        if (document == null)
            return null;

        document.DateExpiration = dateExpiration;
        await _context.SaveChangesAsync();

        return MapToDto(document);
    }

    public async Task<bool> DeleteDocumentAsync(int documentId)
    {
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == documentId);
        if (document == null)
            return false;

        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
        return true;
    }

    public static DocumentDto MapToDto(Document document)
    {
        return new DocumentDto
        {
            Id = document.Id,
            DossierId = document.DossierId,
            TypeCode = document.TypeCode,
            NomFichier = document.NomFichier,
            FileID = document.FileID,
            DateExpiration = document.DateExpiration,
            UserUploader = document.UserUploader,
            CreatedAt = document.CreatedAt
        };
    }
}
