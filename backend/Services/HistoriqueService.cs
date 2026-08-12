using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class HistoriqueService : IHistoriqueService
{
    private readonly ApplicationDbContext _context;

    public HistoriqueService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<HistoriquePagedResult> GetAllHistoriquesAsync(int page, int pageSize, int? operateurId, string? search)
    {
        var query = _context.Historiques
            .AsNoTracking()
            .AsQueryable();

        if (operateurId.HasValue)
            query = query.Where(h => h.OperateurId == operateurId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(h =>
                h.Action.Contains(term) ||
                h.Prestation != null && h.Prestation.Reference.Contains(term) ||
                h.Operateur != null && h.Operateur.RaisonSociale.Contains(term));
        }

        var total = await query.CountAsync();

        var items = await query
            .Include(h => h.Operateur)
            .Include(h => h.Prestation)
            .Include(h => h.Createur)
            .OrderByDescending(h => h.Annee)
            .ThenByDescending(h => h.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new HistoriquePagedResult
        {
            Data = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<HistoriqueDto?> GetHistoriqueByIdAsync(int id)
    {
        var historique = await _context.Historiques
            .Include(h => h.Operateur)
            .Include(h => h.Prestation)
            .Include(h => h.Createur)
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == id);

        return historique == null ? null : MapToDto(historique);
    }

    public async Task<HistoriqueDto> CreateHistoriqueAsync(CreateHistoriqueRequest request, int userId)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(request.OperateurId);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Fournisseur non trouvé");

        var prestation = await _context.Prestations.FindAsync(request.PrestationId);
        if (prestation == null)
            throw new KeyNotFoundException("Contrat non trouvé");

        Validate(request.Action, request.Annee);

        var historique = new Historique
        {
            Action = request.Action.Trim(),
            OperateurId = request.OperateurId,
            PrestationId = request.PrestationId,
            Annee = request.Annee,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Historiques.Add(historique);
        await _context.SaveChangesAsync();

        return (await GetHistoriqueByIdAsync(historique.Id))!;
    }

    public async Task<HistoriqueDto> UpdateHistoriqueAsync(int id, UpdateHistoriqueRequest request)
    {
        var historique = await _context.Historiques.FindAsync(id);
        if (historique == null)
            throw new KeyNotFoundException("Élément d'historique non trouvé");

        var operateur = await _context.OperateursEconomiques.FindAsync(request.OperateurId);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Fournisseur non trouvé");

        var prestation = await _context.Prestations.FindAsync(request.PrestationId);
        if (prestation == null)
            throw new KeyNotFoundException("Contrat non trouvé");

        Validate(request.Action, request.Annee);

        historique.Action = request.Action.Trim();
        historique.OperateurId = request.OperateurId;
        historique.PrestationId = request.PrestationId;
        historique.Annee = request.Annee;

        await _context.SaveChangesAsync();

        return (await GetHistoriqueByIdAsync(id))!;
    }

    public async Task<bool> DeleteHistoriqueAsync(int id)
    {
        var historique = await _context.Historiques.FindAsync(id);
        if (historique == null)
            return false;

        _context.Historiques.Remove(historique);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void Validate(string action, int annee)
    {
        if (string.IsNullOrWhiteSpace(action))
            throw new InvalidOperationException("L'action est requise");

        if (annee < 1900 || annee > DateTime.UtcNow.Year + 10)
            throw new InvalidOperationException("Année invalide");
    }

    private static HistoriqueDto MapToDto(Historique historique)
    {
        return new HistoriqueDto
        {
            Id = historique.Id,
            Action = historique.Action,
            OperateurId = historique.OperateurId,
            OperateurRaisonSociale = historique.Operateur?.RaisonSociale,
            OperateurNumeroImmatriculation = historique.Operateur?.NumeroImmatriculation,
            PrestationId = historique.PrestationId,
            PrestationReference = historique.Prestation?.Reference,
            PrestationStructureContractante = historique.Prestation?.StructureContractante,
            Annee = historique.Annee,
            CreatedBy = historique.CreatedBy,
            CreateurNom = historique.Createur != null
                ? string.IsNullOrWhiteSpace(historique.Createur.Prenom)
                    ? historique.Createur.Nom
                    : $"{historique.Createur.Prenom} {historique.Createur.Nom}"
                : null,
            CreatedAt = historique.CreatedAt
        };
    }
}
