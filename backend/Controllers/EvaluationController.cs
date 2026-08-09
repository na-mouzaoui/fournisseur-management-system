using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Services;

namespace SupplierManagement.API.Controllers;

[ApiController]
[Route("api/evaluations")]
[Authorize]
public class EvaluationController : ControllerBase
{
    private readonly IEvaluationService _evaluationService;

    public EvaluationController(IEvaluationService evaluationService)
    {
        _evaluationService = evaluationService;
    }

    [HttpGet("operateur/{operateurId}")]
    public async Task<ActionResult<List<EvaluationDto>>> GetByOperateur(int operateurId)
    {
        var result = await _evaluationService.GetByOperateurAsync(operateurId);
        return Ok(result);
    }

    [HttpGet("operateur/{operateurId}/stats")]
    public async Task<ActionResult<EvaluationStatsDto>> GetStats(int operateurId)
    {
        var result = await _evaluationService.GetStatsAsync(operateurId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EvaluationDto>> Create([FromBody] CreateEvaluationRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            var result = await _evaluationService.CreateAsync(request, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
