namespace SupplierManagement.API.Models;

public class Evaluation
{
    public int Id { get; set; }
    public int OperateurId { get; set; }
    public OperateurEconomique Operateur { get; set; } = null!;
    public int NoteConformite { get; set; }
    public int NoteDelai { get; set; }
    public int NotePrixConsultation { get; set; }
    public int NotePrixContrat { get; set; }
    public int NoteHse { get; set; }
    public int NoteService { get; set; }
    public double NoteGlobale { get; set; }
    public int? Annee { get; set; }
    public string? Semestre { get; set; }
    public int? PrestationId { get; set; }
    public Prestation? Prestation { get; set; }
    public string? Commentaire { get; set; }
    public int? EvaluateurId { get; set; }
    public Utilisateur? Evaluateur { get; set; }
    public DateTime DateEvaluation { get; set; } = DateTime.UtcNow;
}
