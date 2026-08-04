using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class DossierService : IDossierService
{
    private readonly ApplicationDbContext _context;

    public DossierService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DossierPagedResult> GetAllDossiersAsync(int page, int pageSize, int? statutId)
    {
        var query = _context.Dossiers.AsNoTracking().AsQueryable();

        if (statutId.HasValue)
            query = query.Where(d => d.StatutId == statutId.Value);

        var total = await query.CountAsync();

        var items = await query
            .Include(d => d.Operateur)
            .Include(d => d.Statut)
            .Include(d => d.AgentAffecte)
            .Include(d => d.Documents)
            .OrderByDescending(d => d.DateCreation)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new DossierPagedResult
        {
            Data = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DossierDto?> GetDossierByIdAsync(int id)
    {
        var dossier = await _context.Dossiers
            .Include(d => d.Operateur)
            .Include(d => d.Statut)
            .Include(d => d.AgentAffecte)
            .Include(d => d.Documents)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        return dossier != null ? MapToDto(dossier) : null;
    }

    public async Task<DossierDto> CreateDossierAsync(CreateDossierRequest request)
    {
        var dossier = new Dossier
        {
            OperateurId = request.OperateurId,
            StatutId = request.StatutId,
            AgentAffecteId = request.AgentAffecteId,
            DateCreation = DateTime.UtcNow
        };

        _context.Dossiers.Add(dossier);
        await _context.SaveChangesAsync();

        return await GetDossierByIdAsync(dossier.Id) ?? MapToDto(dossier);
    }

    public async Task<DossierDto?> UpdateDossierAsync(int id, UpdateDossierRequest request)
    {
        var dossier = await _context.Dossiers.FindAsync(id);
        if (dossier == null)
            return null;

        if (request.StatutId.HasValue)
            dossier.StatutId = request.StatutId.Value;

        if (request.AgentAffecteId.HasValue)
            dossier.AgentAffecteId = request.AgentAffecteId.Value;

        await _context.SaveChangesAsync();

        return await GetDossierByIdAsync(id);
    }

    public async Task<bool> DeleteDossierAsync(int id)
    {
        var dossier = await _context.Dossiers.FindAsync(id);
        if (dossier == null)
            return false;

        _context.Dossiers.Remove(dossier);
        await _context.SaveChangesAsync();
        return true;
    }

    public static DossierDto MapToDto(Dossier dossier)
    {
        return new DossierDto
        {
            Id = dossier.Id,
            OperateurId = dossier.OperateurId,
            OperateurRaisonSociale = dossier.Operateur?.RaisonSociale,
            OperateurNumeroImmatriculation = dossier.Operateur?.NumeroImmatriculation,
            StatutId = dossier.StatutId,
            StatutLibelle = dossier.Statut?.Libelle,
            AgentAffecteId = dossier.AgentAffecteId,
            AgentAffecteNom = dossier.AgentAffecte != null
                ? $"{dossier.AgentAffecte.Nom} {dossier.AgentAffecte.Prenom}".Trim()
                : null,
            DateCreation = dossier.DateCreation,
            Documents = dossier.Documents.Select(DocumentService.MapToDto).ToList()
        };
    }
}
