namespace SupplierManagement.API.Models;

public class OperateurEconomique
{
    public int Id { get; set; }
    public string NumeroImmatriculation { get; set; } = string.Empty;
    public string RaisonSociale { get; set; } = string.Empty;
    public string? TypeOperateur { get; set; }
    public string? FormeJuridique { get; set; }
    public string? Nif { get; set; }
    public string? Nis { get; set; }
    public string? RegistreCommerce { get; set; }
    public int? SecteurActiviteId { get; set; }
    public SecteurActivite? SecteurActivite { get; set; }
    public string? Adresse { get; set; }
    public string? Wilaya { get; set; }
    public string? Telephone { get; set; }
    public string? Email { get; set; }
    public DateTime? DateCreationEntreprise { get; set; }
    public DateTime DateImmatriculation { get; set; }
    public int? StatutId { get; set; }
    public Statut? Statut { get; set; }
    public int? CreatedBy { get; set; }
    public Utilisateur? Createur { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public List<Dossier> Dossiers { get; set; } = new();
}
