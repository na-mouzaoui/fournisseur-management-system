using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/referentiels")]
[Authorize]
public class ReferentielController : ControllerBase
{
    private readonly IReferentielService _referentielService;

    public ReferentielController(IReferentielService referentielService)
    {
        _referentielService = referentielService;
    }

    [HttpGet("roles")]
    public async Task<ActionResult<List<RoleDto>>> GetRoles()
    {
        return Ok(await _referentielService.GetRolesAsync());
    }

    [HttpGet("secteurs")]
    public async Task<ActionResult<List<SecteurActiviteDto>>> GetSecteurs()
    {
        return Ok(await _referentielService.GetSecteursAsync());
    }

    [HttpGet("statuts")]
    public async Task<ActionResult<List<StatutDto>>> GetStatuts()
    {
        return Ok(await _referentielService.GetStatutsAsync());
    }

    [HttpPost("secteurs")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<SecteurActiviteDto>> CreateSecteur([FromBody] CreateLibelleRequest request)
    {
        return Ok(await _referentielService.CreateSecteurAsync(request.Libelle));
    }

    [HttpPost("statuts")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<StatutDto>> CreateStatut([FromBody] CreateLibelleRequest request)
    {
        return Ok(await _referentielService.CreateStatutAsync(request.Libelle));
    }
}

public class CreateLibelleRequest
{
    public string Libelle { get; set; } = string.Empty;
}
