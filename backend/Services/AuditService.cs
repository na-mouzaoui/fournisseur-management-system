using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public interface IAuditService
{
    Task LogAsync(int? utilisateurId, string utilisateurIdentifiant, string action, string entite, int? entiteId = null, string? details = null);
    Task<List<AuditLogDto>> GetAllAsync();
}

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;

    public AuditService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(int? utilisateurId, string utilisateurIdentifiant, string action, string entite, int? entiteId = null, string? details = null)
    {
        var log = new AuditLog
        {
            UtilisateurId = utilisateurId,
            UtilisateurIdentifiant = utilisateurIdentifiant,
            Action = action,
            Entite = entite,
            EntiteId = entiteId,
            Details = details,
            DateHeure = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AuditLogDto>> GetAllAsync()
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.DateHeure)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                UtilisateurId = a.UtilisateurId,
                UtilisateurIdentifiant = a.UtilisateurIdentifiant,
                Action = a.Action,
                Entite = a.Entite,
                EntiteId = a.EntiteId,
                Details = a.Details,
                DateHeure = a.DateHeure
            })
            .ToListAsync();
    }
}
