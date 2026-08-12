using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/historiques")]
[Authorize]
public class HistoriqueController : ControllerBase
{
    private readonly IHistoriqueService _historiqueService;

    public HistoriqueController(IHistoriqueService historiqueService)
    {
        _historiqueService = historiqueService;
    }

    [HttpGet]
    public async Task<ActionResult<HistoriquePagedResult>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? operateurId = null,
        [FromQuery] string? search = null)
    {
        var result = await _historiqueService.GetAllHistoriquesAsync(page, pageSize, operateurId, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HistoriqueDto>> GetById(int id)
    {
        var historique = await _historiqueService.GetHistoriqueByIdAsync(id);
        if (historique == null)
            return NotFound();
        return Ok(historique);
    }

    [HttpPost]
    public async Task<ActionResult<HistoriqueDto>> Create([FromBody] CreateHistoriqueRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var historique = await _historiqueService.CreateHistoriqueAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = historique.Id }, historique);
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

    [HttpPut("{id}")]
    public async Task<ActionResult<HistoriqueDto>> Update(int id, [FromBody] UpdateHistoriqueRequest request)
    {
        try
        {
            var historique = await _historiqueService.UpdateHistoriqueAsync(id, request);
            return Ok(historique);
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
        var success = await _historiqueService.DeleteHistoriqueAsync(id);
        if (!success)
            return NotFound();
        return NoContent();
    }
}
