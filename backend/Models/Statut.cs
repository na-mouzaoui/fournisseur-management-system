namespace SupplierManagement.API.Models;

public class Statut
{
    public int Id { get; set; }
    public string Libelle { get; set; } = string.Empty;

    public List<OperateurEconomique> Operateurs { get; set; } = new();
    public List<Dossier> Dossiers { get; set; } = new();
}
