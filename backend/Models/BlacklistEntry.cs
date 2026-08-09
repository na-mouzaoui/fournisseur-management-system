namespace SupplierManagement.API.Models;

public class BlacklistEntry
{
    public int Id { get; set; }
    public int OperateurId { get; set; }
    public OperateurEconomique Operateur { get; set; } = null!;
    public string Motif { get; set; } = string.Empty;
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public int? CreatedBy { get; set; }
    public Utilisateur? Createur { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
