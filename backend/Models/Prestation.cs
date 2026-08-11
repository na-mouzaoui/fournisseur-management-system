namespace SupplierManagement.API.Models;

public class Prestation
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string StructureContractante { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OperateurId { get; set; }
    public OperateurEconomique Operateur { get; set; } = null!;
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public int? CreatedBy { get; set; }
    public Utilisateur? Createur { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
