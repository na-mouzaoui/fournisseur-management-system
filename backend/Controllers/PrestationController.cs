using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/prestations")]
[Authorize]
public class PrestationController : ControllerBase
{
    private readonly IPrestationService _prestationService;

    public PrestationController(IPrestationService prestationService)
    {
        _prestationService = prestationService;
    }

    [HttpGet]
    public async Task<ActionResult<PrestationPagedResult>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var result = await _prestationService.GetAllPrestationsAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PrestationDto>> GetById(int id)
    {
        var prestation = await _prestationService.GetPrestationByIdAsync(id);
        if (prestation == null)
            return NotFound();
        return Ok(prestation);
    }

    [HttpPost]
    public async Task<ActionResult<PrestationDto>> Create([FromBody] CreatePrestationRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var prestation = await _prestationService.CreatePrestationAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = prestation.Id }, prestation);
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
    public async Task<ActionResult<PrestationDto>> Update(int id, [FromBody] UpdatePrestationRequest request)
    {
        try
        {
            var prestation = await _prestationService.UpdatePrestationAsync(id, request);
            return Ok(prestation);
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
        var success = await _prestationService.DeletePrestationAsync(id);
        if (!success)
            return NotFound();
        return NoContent();
    }
}
