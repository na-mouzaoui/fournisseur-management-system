using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public ActionResult Logout()
    {
        return Ok(new { message = "Déconnexion réussie" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UtilisateurDto>> GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
        var user = await _authService.GetCurrentUserAsync(userId);

        if (user == null)
            return NotFound();

        return Ok(AuthService.MapToUtilisateurDto(user));
    }
}
