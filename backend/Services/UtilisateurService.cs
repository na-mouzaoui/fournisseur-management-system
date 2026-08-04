using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class UtilisateurService : IUtilisateurService
{
    private readonly ApplicationDbContext _context;

    public UtilisateurService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UtilisateurDto>> GetAllUtilisateursAsync()
    {
        var users = await _context.Utilisateurs
            .Include(u => u.Role)
            .Where(u => u.Statut == "actif")
            .ToListAsync();

        return users.Select(AuthService.MapToUtilisateurDto).ToList();
    }

    public async Task<UtilisateurDto?> GetUtilisateurByIdAsync(int id)
    {
        var user = await _context.Utilisateurs
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user != null && user.Statut == "actif" ? AuthService.MapToUtilisateurDto(user) : null;
    }

    public async Task<UtilisateurDto> CreateUtilisateurAsync(CreateUtilisateurRequest request)
    {
        var existing = await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Identifiant == request.Identifiant);
        if (existing != null)
            throw new InvalidOperationException("Un utilisateur avec cet identifiant existe déjà");

        var motDePasse = string.IsNullOrWhiteSpace(request.Password) ? "123456789" : request.Password;

        var user = new Utilisateur
        {
            Nom = request.Nom,
            Prenom = request.Prenom,
            Identifiant = request.Identifiant,
            Email = request.Email,
            MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(motDePasse),
            RoleId = request.RoleId,
            Statut = "actif",
            DateCreation = DateTime.UtcNow
        };

        _context.Utilisateurs.Add(user);
        await _context.SaveChangesAsync();

        return AuthService.MapToUtilisateurDto(user);
    }

    public async Task<UtilisateurDto> UpdateUtilisateurAsync(int id, UpdateUtilisateurRequest request)
    {
        var user = await _context.Utilisateurs.FindAsync(id);
        if (user == null)
            throw new KeyNotFoundException("Utilisateur non trouvé");

        user.Nom = request.Nom;
        if (request.Prenom != null)
            user.Prenom = request.Prenom;
        if (request.Email != null)
            user.Email = request.Email;
        if (request.RoleId.HasValue)
            user.RoleId = request.RoleId.Value;
        if (!string.IsNullOrEmpty(request.Statut))
            user.Statut = request.Statut;

        await _context.SaveChangesAsync();

        return AuthService.MapToUtilisateurDto(user);
    }

    public async Task<bool> DeleteUtilisateurAsync(int id)
    {
        var user = await _context.Utilisateurs.FindAsync(id);
        if (user == null)
            return false;

        user.Statut = "inactif";
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetPasswordAsync(int id, ResetPasswordRequest request)
    {
        var user = await _context.Utilisateurs.FindAsync(id);
        if (user == null)
            return false;

        user.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return true;
    }
}
