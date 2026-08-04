namespace SupplierManagement.API.Models;

public class Notification
{
    public int Id { get; set; }
    public int UtilisateurId { get; set; }
    public Utilisateur? Utilisateur { get; set; }
    public int? DossierId { get; set; }
    public Dossier? Dossier { get; set; }
    public string? Type { get; set; }
    public string? Message { get; set; }
    public bool Lu { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
}
