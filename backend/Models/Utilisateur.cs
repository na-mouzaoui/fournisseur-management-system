namespace SupplierManagement.API.Models;

public class Utilisateur
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Prenom { get; set; }
    public string Identifiant { get; set; } = string.Empty;
    public string MotDePasseHash { get; set; } = string.Empty;
    public string? Email { get; set; }
    public int RoleId { get; set; }
    public Role? Role { get; set; }
    public string Statut { get; set; } = "actif";
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    public List<OperateurEconomique> OperateursCrees { get; set; } = new();
    public List<Dossier> DossiersAgents { get; set; } = new();
    public List<Document> DocumentsUploades { get; set; } = new();
    public List<Notification> Notifications { get; set; } = new();
}
