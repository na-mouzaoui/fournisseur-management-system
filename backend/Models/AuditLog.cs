namespace SupplierManagement.API.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int? UtilisateurId { get; set; }
    public string UtilisateurIdentifiant { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Entite { get; set; } = string.Empty;
    public int? EntiteId { get; set; }
    public string? Details { get; set; }
    public DateTime DateHeure { get; set; } = DateTime.UtcNow;
}