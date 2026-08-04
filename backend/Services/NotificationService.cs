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
