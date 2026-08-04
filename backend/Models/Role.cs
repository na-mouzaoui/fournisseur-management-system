namespace SupplierManagement.API.Models;

public class Role
{
    public int Id { get; set; }
    public string Libelle { get; set; } = string.Empty;
    public string? Description { get; set; }

    public List<Utilisateur> Utilisateurs { get; set; } = new();
}
