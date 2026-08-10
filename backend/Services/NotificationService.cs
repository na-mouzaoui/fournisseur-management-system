using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(int utilisateurId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UtilisateurId == utilisateurId)
            .OrderByDescending(n => n.DateCreation)
            .ToListAsync();

        return notifications.Select(MapToDto).ToList();
    }

    public async Task MarkAsReadAsync(int id, int utilisateurId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UtilisateurId == utilisateurId);

        if (notification != null)
        {
            notification.Lu = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task CreateForAllUsersAsync(string type, string message, int? dossierId = null)
    {
        var utilisateurs = await _context.Utilisateurs
            .Where(u => u.Statut == "actif")
            .ToListAsync();

        if (utilisateurs.Count == 0)
            return;

        var notifications = utilisateurs.Select(u => new Notification
        {
            UtilisateurId = u.Id,
            DossierId = dossierId,
            Type = type,
            Message = message,
            Lu = false,
            DateCreation = DateTime.UtcNow
        }).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task NotifyExpiringDocumentsAsync()
    {
        var limit = DateTime.UtcNow.AddMonths(1);

        var documents = await _context.Documents
            .AsNoTracking()
            .Include(d => d.Dossier)
                .ThenInclude(d => d!.Operateur)
            .Where(d => d.DateExpiration.HasValue && d.DateExpiration.Value <= limit)
            .ToListAsync();

        if (documents.Count == 0)
            return;

        var dejaNotifies = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.Type == "expiration_document")
            .Select(n => n.Message)
            .ToListAsync();

        var utilisateurs = await _context.Utilisateurs
            .Where(u => u.Statut == "actif")
            .ToListAsync();

        if (utilisateurs.Count == 0)
            return;

        var aAjouter = new List<Notification>();
        foreach (var document in documents)
        {
            var marqueur = $"[doc:{document.Id}]";
            if (dejaNotifies.Any(m => m != null && m.Contains(marqueur)))
                continue;

            var operateur = document.Dossier?.Operateur;
            var message = $"Le document du fournisseur « {operateur?.RaisonSociale ?? "inconnu"} » expire le {document.DateExpiration:dd/MM/yyyy}. {marqueur}";

            foreach (var utilisateur in utilisateurs)
            {
                aAjouter.Add(new Notification
                {
                    UtilisateurId = utilisateur.Id,
                    DossierId = document.DossierId,
                    Type = "expiration_document",
                    Message = message,
                    Lu = false,
                    DateCreation = DateTime.UtcNow
                });
            }
        }

        if (aAjouter.Count > 0)
        {
            _context.Notifications.AddRange(aAjouter);
            await _context.SaveChangesAsync();
        }
    }

    public static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            UtilisateurId = notification.UtilisateurId,
            DossierId = notification.DossierId,
            Type = notification.Type,
            Message = notification.Message,
            Lu = notification.Lu,
            DateCreation = notification.DateCreation
        };
    }
}
