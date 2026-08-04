using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/utilisateurs")]
[Authorize]
public class UtilisateurController : ControllerBase
{
    private readonly IUtilisateurService _utilisateurService;

    public UtilisateurController(IUtilisateurService utilisateurService)
    {
        _utilisateurService = utilisateurService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UtilisateurDto>>> GetAll()
    {
        return Ok(await _utilisateurService.GetAllUtilisateursAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UtilisateurDto>> GetById(int id)
    {
        var user = await _utilisateurService.GetUtilisateurByIdAsync(id);
        if (user == null)
            return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UtilisateurDto>> Create([FromBody] CreateUtilisateurRequest request)
    {
        try
        {
            var user = await _utilisateurService.CreateUtilisateurAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UtilisateurDto>> Update(int id, [FromBody] UpdateUtilisateurRequest request)
    {
        try
        {
            var user = await _utilisateurService.UpdateUtilisateurAsync(id, request);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _utilisateurService.DeleteUtilisateurAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }

    [HttpPatch("{id}/reset-password")]
    public async Task<ActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        var success = await _utilisateurService.ResetPasswordAsync(id, request);
        if (!success)
            return NotFound();

        return Ok(new { message = "Mot de passe réinitialisé" });
    }
}
