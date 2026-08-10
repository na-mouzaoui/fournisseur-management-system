namespace SupplierManagement.API.DTOs;

public class CreateEvaluationRequest
{
    public int OperateurId { get; set; }
    public int NoteConformite { get; set; }
    public int NoteDelai { get; set; }
    public int NotePrixConsultation { get; set; }
    public int NotePrixContrat { get; set; }
    public int NoteHse { get; set; }
    public int NoteService { get; set; }
    public string? Commentaire { get; set; }
}

public class EvaluationDto
{
    public int Id { get; set; }
    public int OperateurId { get; set; }
    public string? OperateurRaisonSociale { get; set; }
    public int NoteConformite { get; set; }
    public int NoteDelai { get; set; }
    public int NotePrixConsultation { get; set; }
    public int NotePrixContrat { get; set; }
    public int NoteHse { get; set; }
    public int NoteService { get; set; }
    public double NoteGlobale { get; set; }
    public string? Commentaire { get; set; }
    public int? EvaluateurId { get; set; }
    public string? EvaluateurNom { get; set; }
    public DateTime DateEvaluation { get; set; }
}

public class EvaluationStatsDto
{
    public int TotalEvaluations { get; set; }
    public double? NoteGlobaleActuelle { get; set; }
    public double? DerniereNote { get; set; }
}
