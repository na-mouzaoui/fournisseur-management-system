using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/dossiers")]
[Authorize]
public class DossierController : ControllerBase
{
    private readonly IDossierService _dossierService;

    public DossierController(IDossierService dossierService)
    {
        _dossierService = dossierService;
    }

    [HttpGet]
    public async Task<ActionResult<DossierPagedResult>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? statutId = null,
        [FromQuery] int? operateurId = null)
    {
        if (operateurId.HasValue)
        {
            var dossier = await _dossierService.GetOrCreateForOperateurAsync(operateurId.Value);
            return Ok(dossier);
        }
        var result = await _dossierService.GetAllDossiersAsync(page, pageSize, statutId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DossierDto>> GetById(int id)
    {
        var dossier = await _dossierService.GetDossierByIdAsync(id);
        if (dossier == null)
            return NotFound();
        return Ok(dossier);
    }

    [HttpPost]
    public async Task<ActionResult<DossierDto>> Create([FromBody] CreateDossierRequest request)
    {
        var dossier = await _dossierService.CreateDossierAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = dossier.Id }, dossier);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DossierDto>> Update(int id, [FromBody] UpdateDossierRequest request)
    {
        var dossier = await _dossierService.UpdateDossierAsync(id, request);
        if (dossier == null)
            return NotFound();
        return Ok(dossier);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _dossierService.DeleteDossierAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }
}
