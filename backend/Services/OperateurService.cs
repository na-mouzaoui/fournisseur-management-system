using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class OperateurService : IOperateurService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public OperateurService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<OperateurPagedResult> GetAllOperateursAsync(int page, int pageSize, string? search)
    {
        var query = _context.OperateursEconomiques
            .AsNoTracking()
            .Where(o => o.DateSuppression == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(o =>
                o.RaisonSociale.Contains(term) ||
                o.NumeroImmatriculation.Contains(term) ||
                o.Wilaya != null && o.Wilaya.Contains(term));
        }

        var total = await query.CountAsync();

        var items = await query
            .Include(o => o.SecteurActivite)
            .Include(o => o.Statut)
            .Include(o => o.Dossiers)
                .ThenInclude(d => d.Documents)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        await _notificationService.NotifyExpiringDocumentsAsync();

        var ids = items.Select(o => o.Id).ToList();
        var blacklistEntries = await _context.BlacklistEntries
            .AsNoTracking()
            .Where(b => ids.Contains(b.OperateurId) && b.DateFin != null)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return new OperateurPagedResult
        {
            Data = items.Select(o => MapToDto(o, blacklistEntries.FirstOrDefault(b => b.OperateurId == o.Id))).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<OperateurEconomiqueDto?> GetOperateurByIdAsync(int id)
    {
        var operateur = await _context.OperateursEconomiques
            .Include(o => o.SecteurActivite)
            .Include(o => o.Statut)
            .Include(o => o.Dossiers)
                .ThenInclude(d => d.Documents)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id);

        if (operateur == null)
            return null;

        var blacklistEntry = await _context.BlacklistEntries
            .AsNoTracking()
            .Where(b => b.OperateurId == id && b.DateFin != null)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();

        return MapToDto(operateur, blacklistEntry);
    }

    public async Task<OperateurEconomiqueDto> CreateOperateurAsync(CreateOperateurRequest request, int createdBy)
    {
        // Statut par défaut : 'actif' à la création
        if (request.StatutId == null)
        {
            var statutActif = await _context.Statuts.FirstOrDefaultAsync(s => s.Libelle == "actif");
            request.StatutId = statutActif?.Id;
        }

        var operateur = new OperateurEconomique
        {
            NumeroImmatriculation = request.NumeroImmatriculation,
            RaisonSociale = request.RaisonSociale,
            TypeOperateur = request.TypeOperateur,
            TypeFournisseur = request.TypeFournisseur,
            Gerant = request.Gerant,
            FormeJuridique = request.FormeJuridique,
            Nif = request.Nif,
            Nis = request.Nis,
            RegistreCommerce = request.RegistreCommerce,
            SecteurActiviteId = request.SecteurActiviteId,
            Adresse = request.Adresse,
            Wilaya = request.Wilaya,
            Telephone = request.Telephone,
            Email = request.Email,
            DateCreationEntreprise = request.DateCreationEntreprise,
            DateImmatriculation = request.DateImmatriculation == default ? DateTime.UtcNow : request.DateImmatriculation,
            StatutId = request.StatutId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow
        };

        _context.OperateursEconomiques.Add(operateur);
        await _context.SaveChangesAsync();

        return await GetOperateurByIdAsync(operateur.Id) ?? MapToDto(operateur);
    }

    public async Task<OperateurEconomiqueDto> UpdateOperateurAsync(int id, UpdateOperateurRequest request)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(id);
        if (operateur == null)
            throw new KeyNotFoundException("Opérateur économique non trouvé");

        if (operateur.IsArchived)
            throw new InvalidOperationException("Opérateur économique archivé et verrouillé");

        operateur.RaisonSociale = request.RaisonSociale;
        operateur.TypeOperateur = request.TypeOperateur;
        operateur.TypeFournisseur = request.TypeFournisseur;
        operateur.Gerant = request.Gerant;
        operateur.FormeJuridique = request.FormeJuridique;
        operateur.Nif = request.Nif;
        operateur.Nis = request.Nis;
        operateur.RegistreCommerce = request.RegistreCommerce;
        operateur.SecteurActiviteId = request.SecteurActiviteId;
        operateur.Adresse = request.Adresse;
        operateur.Wilaya = request.Wilaya;
        operateur.Telephone = request.Telephone;
        operateur.Email = request.Email;
        operateur.DateCreationEntreprise = request.DateCreationEntreprise;
        operateur.DateImmatriculation = request.DateImmatriculation;
        operateur.StatutId = request.StatutId;
        operateur.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetOperateurByIdAsync(id) ?? MapToDto(operateur);
    }

    public async Task<bool> DeleteOperateurAsync(int id)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(id);
        if (operateur == null || operateur.DateSuppression != null || operateur.IsArchived)
            return false;

        operateur.DateSuppression = DateTime.UtcNow;
        operateur.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<OperateurEconomiqueDto> ArchiveOperateurAsync(int id, bool isArchived)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(id);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Opérateur économique non trouvé");

        operateur.IsArchived = isArchived;
        operateur.UpdatedAt = DateTime.UtcNow;

        if (isArchived)
        {
            var statutArchive = await _context.Statuts.FirstOrDefaultAsync(s => s.Libelle == "archivé");
            if (statutArchive != null)
                operateur.StatutId = statutArchive.Id;
        }

        await _context.SaveChangesAsync();

        return await GetOperateurByIdAsync(id) ?? MapToDto(operateur);
    }

    public async Task<BlacklistEntryDto> BlacklistOperateurAsync(int id, BlacklistRequest request, int userId)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(id);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Opérateur économique non trouvé");

        var statutBlackliste = await _context.Statuts.FirstOrDefaultAsync(s => s.Libelle == "blacklisté");
        if (statutBlackliste == null)
            throw new InvalidOperationException("Statut 'blacklisté' non trouvé");

        var entry = new BlacklistEntry
        {
            OperateurId = id,
            Motif = request.Motif,
            DateDebut = request.DateDebut,
            DateFin = request.DateFin,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.BlacklistEntries.Add(entry);

        operateur.StatutId = statutBlackliste.Id;
        operateur.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _notificationService.CreateForAllUsersAsync(
            "blacklistage",
            $"Le fournisseur « {operateur.RaisonSociale} » a été blacklisté." +
            (string.IsNullOrWhiteSpace(request.Motif) ? "" : $" Motif : {request.Motif}"));

        return new BlacklistEntryDto
        {
            Id = entry.Id,
            OperateurId = entry.OperateurId,
            Motif = entry.Motif,
            DateDebut = entry.DateDebut,
            DateFin = entry.DateFin,
            CreatedBy = entry.CreatedBy,
            CreatedAt = entry.CreatedAt
        };
    }

    public async Task<OperateurEconomiqueDto> ReactivateOperateurAsync(int id)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(id);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Opérateur économique non trouvé");

        var statutActif = await _context.Statuts.FirstOrDefaultAsync(s => s.Libelle == "actif");
        if (statutActif == null)
            throw new InvalidOperationException("Statut 'actif' non trouvé");

        operateur.StatutId = statutActif.Id;
        operateur.IsArchived = false;
        operateur.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _notificationService.CreateForAllUsersAsync(
            "reactivation",
            $"Le fournisseur « {operateur.RaisonSociale} » a été réactivé (dé-blacklisté).");

        return await GetOperateurByIdAsync(id) ?? MapToDto(operateur);
    }

    public static OperateurEconomiqueDto MapToDto(OperateurEconomique operateur)
        => MapToDto(operateur, null);

    public static OperateurEconomiqueDto MapToDto(OperateurEconomique operateur, BlacklistEntry? blacklistEntry)
    {
        var dto = new OperateurEconomiqueDto
        {
            Id = operateur.Id,
            NumeroImmatriculation = operateur.NumeroImmatriculation,
            RaisonSociale = operateur.RaisonSociale,
            TypeOperateur = operateur.TypeOperateur,
            TypeFournisseur = operateur.TypeFournisseur,
            Gerant = operateur.Gerant,
            FormeJuridique = operateur.FormeJuridique,
            Nif = operateur.Nif,
            Nis = operateur.Nis,
            RegistreCommerce = operateur.RegistreCommerce,
            SecteurActiviteId = operateur.SecteurActiviteId,
            SecteurActiviteLibelle = operateur.SecteurActivite?.Libelle,
            SecteurActiviteCode = operateur.SecteurActivite?.Code,
            Adresse = operateur.Adresse,
            Wilaya = operateur.Wilaya,
            Telephone = operateur.Telephone,
            Email = operateur.Email,
            DateCreationEntreprise = operateur.DateCreationEntreprise,
            DateImmatriculation = operateur.DateImmatriculation,
            StatutId = operateur.StatutId,
            StatutLibelle = operateur.Statut?.Libelle,
            CreatedBy = operateur.CreatedBy,
            CreatedAt = operateur.CreatedAt,
            UpdatedAt = operateur.UpdatedAt,
            IsArchived = operateur.IsArchived,
            DateSuppression = operateur.DateSuppression
        };

        var now = DateTime.UtcNow;
        var limit = now.AddMonths(1);
        var expirationsProches = operateur.Dossiers
            .SelectMany(d => d.Documents)
            .Where(d => d.DateExpiration.HasValue && d.DateExpiration.Value <= limit)
            .Select(d => d.DateExpiration!.Value)
            .ToList();

        dto.HasDocumentExpiringSoon = expirationsProches.Count > 0;
        dto.ProchainDocumentExpiration = expirationsProches.Count > 0 ? expirationsProches.Min() : null;

        if (blacklistEntry != null && blacklistEntry.DateFin.HasValue)
        {
            dto.BlacklistDateFin = blacklistEntry.DateFin;
            dto.BlacklistEndsSoon = blacklistEntry.DateFin.Value <= limit;
        }

        return dto;
    }
}
