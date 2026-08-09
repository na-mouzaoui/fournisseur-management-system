using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/operateurs")]
[Authorize]
public class OperateurController : ControllerBase
{
    private readonly IOperateurService _operateurService;

    public OperateurController(IOperateurService operateurService)
    {
        _operateurService = operateurService;
    }

    [HttpGet]
    public async Task<ActionResult<OperateurPagedResult>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var result = await _operateurService.GetAllOperateursAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OperateurEconomiqueDto>> GetById(int id)
    {
        var operateur = await _operateurService.GetOperateurByIdAsync(id);
        if (operateur == null)
            return NotFound();
        return Ok(operateur);
    }

    [HttpPost]
    public async Task<ActionResult<OperateurEconomiqueDto>> Create([FromBody] CreateOperateurRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var operateur = await _operateurService.CreateOperateurAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = operateur.Id }, operateur);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<OperateurEconomiqueDto>> Update(int id, [FromBody] UpdateOperateurRequest request)
    {
        try
        {
            var operateur = await _operateurService.UpdateOperateurAsync(id, request);
            return Ok(operateur);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _operateurService.DeleteOperateurAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }

    [HttpPost("{id}/archive")]
    public async Task<ActionResult<OperateurEconomiqueDto>> Archive(int id, [FromBody] ArchiveOperateurRequest request)
    {
        try
        {
            var operateur = await _operateurService.ArchiveOperateurAsync(id, request.IsArchived);
            return Ok(operateur);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/blacklist")]
    public async Task<ActionResult<BlacklistEntryDto>> Blacklist(int id, [FromBody] BlacklistRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var entry = await _operateurService.BlacklistOperateurAsync(id, request, userId);
            return Ok(entry);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reactivate")]
    public async Task<ActionResult<OperateurEconomiqueDto>> Reactivate(int id)
    {
        try
        {
            var operateur = await _operateurService.ReactivateOperateurAsync(id);
            return Ok(operateur);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
