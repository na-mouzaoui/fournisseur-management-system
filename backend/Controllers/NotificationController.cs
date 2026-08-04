using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetMine()
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        var notifications = await _notificationService.GetNotificationsAsync(userId);
        return Ok(notifications);
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult> MarkAsRead(int id)
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        await _notificationService.MarkAsReadAsync(id, userId);
        return NoContent();
    }
}
