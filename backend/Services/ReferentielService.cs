using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class ReferentielService : IReferentielService
{
    private readonly ApplicationDbContext _context;

    public ReferentielService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        var roles = await _context.Roles.AsNoTracking().OrderBy(r => r.Libelle).ToListAsync();
        return roles.Select(r => new RoleDto
        {
            Id = r.Id,
            Libelle = r.Libelle,
            Description = r.Description
        }).ToList();
    }

    public async Task<List<SecteurActiviteDto>> GetSecteursAsync()
    {
        var secteurs = await _context.SecteursActivite.AsNoTracking().OrderBy(s => s.Libelle).ToListAsync();
        return secteurs.Select(s => new SecteurActiviteDto
        {
            Id = s.Id,
            Code = s.Code,
            Libelle = s.Libelle
        }).ToList();
    }

    public async Task<List<StatutDto>> GetStatutsAsync()
    {
        var statuts = await _context.Statuts.AsNoTracking().OrderBy(s => s.Libelle).ToListAsync();
        return statuts.Select(s => new StatutDto
        {
            Id = s.Id,
            Libelle = s.Libelle
        }).ToList();
    }

    public async Task<SecteurActiviteDto> CreateSecteurAsync(string libelle)
    {
        var secteur = new SecteurActivite { Libelle = libelle };
        _context.SecteursActivite.Add(secteur);
        await _context.SaveChangesAsync();
        return new SecteurActiviteDto { Id = secteur.Id, Libelle = secteur.Libelle };
    }

    public async Task<StatutDto> CreateStatutAsync(string libelle)
    {
        var statut = new Statut { Libelle = libelle };
        _context.Statuts.Add(statut);
        await _context.SaveChangesAsync();
        return new StatutDto { Id = statut.Id, Libelle = statut.Libelle };
    }
}
