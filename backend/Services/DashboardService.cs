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
        var operateurs = await _context.OperateursEconomiques
            .AsNoTracking()
            .Include(o => o.Statut)
            .Include(o => o.SecteurActivite)
            .ToListAsync();

        var total = operateurs.Count;
        var blacklistes = operateurs.Count(o =>
            o.Statut != null && (o.Statut.Libelle == "rejeté" || o.Statut.Libelle == "suspendu"));
        var nouveaux30Jours = operateurs.Count(o => o.CreatedAt >= DateTime.UtcNow.AddDays(-30));

        // Évolution mensuelle des 12 derniers mois
        var aujourdHui = DateTime.UtcNow.Date;
        var debut = new DateTime(aujourdHui.Year, aujourdHui.Month, 1).AddMonths(-11);
        var evolution = new List<EvolutionMensuelleDto>();
        for (var i = 0; i < 12; i++)
        {
            var debutMois = debut.AddMonths(i);
            var finMois = debutMois.AddMonths(1);
            evolution.Add(new EvolutionMensuelleDto
            {
                Mois = debutMois.ToString("yyyy-MM"),
                Nouveaux = operateurs.Count(o => o.CreatedAt >= debutMois && o.CreatedAt < finMois)
            });
        }

        // Répartition par secteur d'activité
        var secteurs = operateurs
            .GroupBy(o => o.SecteurActivite?.Libelle ?? "Non défini")
            .Select(g => new SecteurRepartitionDto
            {
                Secteur = g.Key,
                Nombre = g.Count()
            })
            .OrderByDescending(s => s.Nombre)
            .ToList();

        // Derniers fournisseurs ajoutés
        var derniers = operateurs
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
            EvolutionMensuelle = evolution,
            RepartitionSecteurs = secteurs,
            DerniersFournisseurs = derniers
        };
    }
}
