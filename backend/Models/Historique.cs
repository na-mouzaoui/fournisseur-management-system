namespace SupplierManagement.API.Models;

public class Historique
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public int OperateurId { get; set; }
    public OperateurEconomique? Operateur { get; set; }
    public int PrestationId { get; set; }
    public Prestation? Prestation { get; set; }
    public int Annee { get; set; }
    public int? CreatedBy { get; set; }
    public Utilisateur? Createur { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
