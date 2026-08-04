namespace SupplierManagement.API.Models;

public class Dossier
{
    public int Id { get; set; }
    public int OperateurId { get; set; }
    public OperateurEconomique? Operateur { get; set; }
    public int StatutId { get; set; }
    public Statut? Statut { get; set; }
    public int? AgentAffecteId { get; set; }
    public Utilisateur? AgentAffecte { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    public List<Document> Documents { get; set; } = new();
    public List<Notification> Notifications { get; set; } = new();
}
