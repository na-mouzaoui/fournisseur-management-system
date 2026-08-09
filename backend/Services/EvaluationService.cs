using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public class EvaluationService : IEvaluationService
{
    private readonly ApplicationDbContext _context;

    public EvaluationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<EvaluationDto>> GetByOperateurAsync(int operateurId)
    {
        return await _context.Evaluations
            .AsNoTracking()
            .Where(ev => ev.OperateurId == operateurId)
            .Include(ev => ev.Operateur)
            .Include(ev => ev.Evaluateur)
            .OrderByDescending(ev => ev.DateEvaluation)
            .Select(ev => new EvaluationDto
            {
                Id = ev.Id,
                OperateurId = ev.OperateurId,
                OperateurRaisonSociale = ev.Operateur.RaisonSociale,
                NoteQualite = ev.NoteQualite,
                NoteDelai = ev.NoteDelai,
                NotePrix = ev.NotePrix,
                NoteService = ev.NoteService,
                NoteGlobale = ev.NoteGlobale,
                Commentaire = ev.Commentaire,
                EvaluateurId = ev.EvaluateurId,
                EvaluateurNom = ev.Evaluateur != null ? ev.Evaluateur.Nom : null,
                DateEvaluation = ev.DateEvaluation
            })
            .ToListAsync();
    }

    public async Task<EvaluationStatsDto> GetStatsAsync(int operateurId)
    {
        var evals = await _context.Evaluations
            .AsNoTracking()
            .Where(ev => ev.OperateurId == operateurId)
            .OrderByDescending(ev => ev.DateEvaluation)
            .ToListAsync();

        if (evals.Count == 0)
            return new EvaluationStatsDto { TotalEvaluations = 0 };

        return new EvaluationStatsDto
        {
            TotalEvaluations = evals.Count,
            NoteGlobaleActuelle = evals.Average(ev => ev.NoteGlobale),
            DerniereNote = evals.First().NoteGlobale
        };
    }

    public async Task<EvaluationDto> CreateAsync(CreateEvaluationRequest request, int evaluateurId)
    {
        var noteGlobale = (request.NoteQualite + request.NoteDelai + request.NotePrix + request.NoteService) / 4.0;

        var evaluation = new Evaluation
        {
            OperateurId = request.OperateurId,
            NoteQualite = request.NoteQualite,
            NoteDelai = request.NoteDelai,
            NotePrix = request.NotePrix,
            NoteService = request.NoteService,
            NoteGlobale = noteGlobale,
            Commentaire = request.Commentaire,
            EvaluateurId = evaluateurId,
            DateEvaluation = DateTime.UtcNow
        };

        _context.Evaluations.Add(evaluation);
        await _context.SaveChangesAsync();

        var operateur = await _context.OperateursEconomiques.FindAsync(request.OperateurId);

        return new EvaluationDto
        {
            Id = evaluation.Id,
            OperateurId = evaluation.OperateurId,
            OperateurRaisonSociale = operateur?.RaisonSociale,
            NoteQualite = evaluation.NoteQualite,
            NoteDelai = evaluation.NoteDelai,
            NotePrix = evaluation.NotePrix,
            NoteService = evaluation.NoteService,
            NoteGlobale = evaluation.NoteGlobale,
            Commentaire = evaluation.Commentaire,
            EvaluateurId = evaluation.EvaluateurId,
            DateEvaluation = evaluation.DateEvaluation
        };
    }
}
