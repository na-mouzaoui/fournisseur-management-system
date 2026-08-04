namespace SupplierManagement.API.Models;

public class SecteurActivite
{
    public int Id { get; set; }
    public string Libelle { get; set; } = string.Empty;

    public List<OperateurEconomique> Operateurs { get; set; } = new();
}
