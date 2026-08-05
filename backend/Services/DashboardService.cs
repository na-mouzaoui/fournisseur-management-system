using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;

namespace SupplierManagement.API.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var maintenant = DateTime.UtcNow;

        var actifs = await _context.OperateursEconomiques
            .AsNoTracking()
            .Where(o => o.DateSuppression == null)
            .Include(o => o.Statut)
            .Include(o => o.SecteurActivite)
            .ToListAsync();

        var total = actifs.Count(o => !o.IsArchived);
        var blacklistes = actifs.Count(o =>
            !o.IsArchived && o.Statut != null &&
            (o.Statut.Libelle == "rejeté" || o.Statut.Libelle == "suspendu"));
        var nouveaux30Jours = actifs.Count(o =>
            !o.IsArchived && o.CreatedAt >= maintenant.AddDays(-30));

        // Évolution du mois en cours : créés - supprimés
        var nouveauxMoisEnCours = actifs.Count(o =>
            o.CreatedAt.Year == maintenant.Year && o.CreatedAt.Month == maintenant.Month);
        var supprimesMoisEnCours = await _context.OperateursEconomiques
            .AsNoTracking()
            .CountAsync(o =>
                o.DateSuppression != null &&
                o.DateSuppression.Value.Year == maintenant.Year &&
                o.DateSuppression.Value.Month == maintenant.Month);

        // Répartition par secteur d'activité
        var secteurs = actifs
            .Where(o => !o.IsArchived)
            .GroupBy(o => o.SecteurActivite?.Libelle ?? "Non défini")
            .Select(g => new SecteurRepartitionDto
            {
                Secteur = g.Key,
                Nombre = g.Count()
            })
            .OrderByDescending(s => s.Nombre)
            .ToList();

        // Derniers fournisseurs ajoutés
        var derniers = actifs
            .Where(o => !o.IsArchived)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new DernierFournisseurDto
            {
                Id = o.Id,
                RaisonSociale = o.RaisonSociale,
                Secteur = o.SecteurActivite?.Libelle,
                Statut = o.Statut?.Libelle,
                DateCreation = o.CreatedAt
            })
            .ToList();

        return new DashboardStatsDto
        {
            TotalOperateurs = total,
            OperateursBlacklistes = blacklistes,
            Nouveaux30Jours = nouveaux30Jours,
            NouveauxMoisEnCours = nouveauxMoisEnCours,
            SupprimesMoisEnCours = supprimesMoisEnCours,
            RepartitionSecteurs = secteurs,
            DerniersFournisseurs = derniers
        };
    }
}
