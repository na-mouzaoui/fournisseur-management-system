using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class PrestationService : IPrestationService
{
    private readonly ApplicationDbContext _context;

    public PrestationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PrestationPagedResult> GetAllPrestationsAsync(int page, int pageSize, string? search)
    {
        var query = _context.Prestations
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                c.Reference.Contains(term) ||
                c.Operateur != null && c.Operateur.RaisonSociale.Contains(term) ||
                c.Operateur != null && c.Operateur.NumeroImmatriculation.Contains(term));
        }

        var total = await query.CountAsync();

        var items = await query
            .Include(c => c.Operateur)
            .Include(c => c.Etape)
            .OrderByDescending(c => c.DateDebut)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PrestationPagedResult
        {
            Data = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PrestationDto?> GetPrestationByIdAsync(int id)
    {
        var prestation = await _context.Prestations
            .Include(c => c.Operateur)
            .Include(c => c.Etape)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        return prestation == null ? null : MapToDto(prestation);
    }

    public async Task<PrestationDto> CreatePrestationAsync(CreatePrestationRequest request, int userId)
    {
        var operateur = await _context.OperateursEconomiques.FindAsync(request.OperateurId);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Fournisseur non trouvé");

        ValidateDates(request.DateDebut, request.DateFin);

        if (request.EtapeId.HasValue && !await _context.Etapes.AnyAsync(e => e.Id == request.EtapeId.Value))
            throw new InvalidOperationException("Étape invalide");

        var prestation = new Prestation
        {
            Reference = request.Reference,
            StructureContractante = request.StructureContractante,
            Description = request.Description,
            OperateurId = request.OperateurId,
            EtapeId = request.EtapeId,
            DateDebut = request.DateDebut,
            DateFin = request.DateFin,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Prestations.Add(prestation);
        await _context.SaveChangesAsync();

        return (await GetPrestationByIdAsync(prestation.Id))!;
    }

    public async Task<PrestationDto> UpdatePrestationAsync(int id, UpdatePrestationRequest request)
    {
        var prestation = await _context.Prestations.FindAsync(id);
        if (prestation == null)
            throw new KeyNotFoundException("Prestation non trouvée");

        var operateur = await _context.OperateursEconomiques.FindAsync(request.OperateurId);
        if (operateur == null || operateur.DateSuppression != null)
            throw new KeyNotFoundException("Fournisseur non trouvé");

        ValidateDates(request.DateDebut, request.DateFin);

        if (request.EtapeId.HasValue && !await _context.Etapes.AnyAsync(e => e.Id == request.EtapeId.Value))
            throw new InvalidOperationException("Étape invalide");

        prestation.Reference = request.Reference;
        prestation.StructureContractante = request.StructureContractante;
        prestation.Description = request.Description;
        prestation.OperateurId = request.OperateurId;
        prestation.EtapeId = request.EtapeId;
        prestation.DateDebut = request.DateDebut;
        prestation.DateFin = request.DateFin;
        prestation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (await GetPrestationByIdAsync(id))!;
    }

    public async Task<bool> DeletePrestationAsync(int id)
    {
        var prestation = await _context.Prestations.FindAsync(id);
        if (prestation == null)
            return false;

        _context.Prestations.Remove(prestation);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void ValidateDates(DateTime dateDebut, DateTime? dateFin)
    {
        if (dateFin.HasValue && dateFin.Value.Date < dateDebut.Date)
            throw new InvalidOperationException("La date de fin doit être postérieure à la date de début");
    }

    private static PrestationDto MapToDto(Prestation prestation)
    {
        return new PrestationDto
        {
            Id = prestation.Id,
            Reference = prestation.Reference,
            StructureContractante = prestation.StructureContractante,
            Description = prestation.Description,
            OperateurId = prestation.OperateurId,
            OperateurRaisonSociale = prestation.Operateur?.RaisonSociale,
            OperateurNumeroImmatriculation = prestation.Operateur?.NumeroImmatriculation,
            EtapeId = prestation.EtapeId,
            EtapeLibelle = prestation.Etape?.Libelle,
            DateDebut = prestation.DateDebut,
            DateFin = prestation.DateFin,
            CreatedBy = prestation.CreatedBy,
            CreatedAt = prestation.CreatedAt,
            UpdatedAt = prestation.UpdatedAt
        };
    }
}
