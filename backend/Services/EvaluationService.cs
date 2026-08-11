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
            .Include(ev => ev.Prestation)
            .OrderByDescending(ev => ev.DateEvaluation)
            .Select(ev => new EvaluationDto
            {
                Id = ev.Id,
                OperateurId = ev.OperateurId,
                OperateurRaisonSociale = ev.Operateur.RaisonSociale,
                NoteConformite = ev.NoteConformite,
                NoteDelai = ev.NoteDelai,
                NotePrixConsultation = ev.NotePrixConsultation,
                NotePrixContrat = ev.NotePrixContrat,
                NoteHse = ev.NoteHse,
                NoteService = ev.NoteService,
                NoteGlobale = ev.NoteGlobale,
                Semestre = ev.Semestre,
                PrestationId = ev.PrestationId,
                PrestationReference = ev.Prestation != null ? ev.Prestation.Reference : null,
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
        if (string.IsNullOrWhiteSpace(request.Semestre))
            throw new InvalidOperationException("Le semestre de l'évaluation est obligatoire");
        if (request.Semestre != "S1" && request.Semestre != "S2")
            throw new InvalidOperationException("Le semestre doit être S1 (juin) ou S2 (décembre)");
        if (request.PrestationId == null)
            throw new InvalidOperationException("La prestation à évaluer est obligatoire");

        var prestation = await _context.Prestations.FindAsync(request.PrestationId);
        if (prestation == null)
            throw new KeyNotFoundException("Prestation non trouvée");
        if (prestation.OperateurId != request.OperateurId)
            throw new InvalidOperationException("La prestation sélectionnée n'appartient pas à ce fournisseur");

        var noteGlobale = request.NoteConformite + request.NoteDelai + request.NotePrixConsultation + request.NotePrixContrat + request.NoteHse + request.NoteService;

        var evaluation = new Evaluation
        {
            OperateurId = request.OperateurId,
            NoteConformite = request.NoteConformite,
            NoteDelai = request.NoteDelai,
            NotePrixConsultation = request.NotePrixConsultation,
            NotePrixContrat = request.NotePrixContrat,
            NoteHse = request.NoteHse,
            NoteService = request.NoteService,
            NoteGlobale = noteGlobale,
            Semestre = request.Semestre,
            PrestationId = request.PrestationId,
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
            NoteConformite = evaluation.NoteConformite,
            NoteDelai = evaluation.NoteDelai,
            NotePrixConsultation = evaluation.NotePrixConsultation,
            NotePrixContrat = evaluation.NotePrixContrat,
            NoteHse = evaluation.NoteHse,
            NoteService = evaluation.NoteService,
            NoteGlobale = evaluation.NoteGlobale,
            Semestre = evaluation.Semestre,
            PrestationId = evaluation.PrestationId,
            PrestationReference = prestation.Reference,
            Commentaire = evaluation.Commentaire,
            EvaluateurId = evaluation.EvaluateurId,
            DateEvaluation = evaluation.DateEvaluation
        };
    }
}
