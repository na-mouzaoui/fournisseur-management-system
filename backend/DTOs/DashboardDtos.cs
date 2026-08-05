namespace SupplierManagement.API.DTOs;

public class DashboardStatsDto
{
    public int TotalOperateurs { get; set; }
    public int OperateursBlacklistes { get; set; }
    public int Nouveaux30Jours { get; set; }
    public int NouveauxMoisEnCours { get; set; }
    public int SupprimesMoisEnCours { get; set; }
    public List<SecteurRepartitionDto> RepartitionSecteurs { get; set; } = new();
    public List<DernierFournisseurDto> DerniersFournisseurs { get; set; } = new();
}

public class SecteurRepartitionDto
{
    public string Secteur { get; set; } = string.Empty;
    public int Nombre { get; set; }
}

public class DernierFournisseurDto
{
    public int Id { get; set; }
    public string RaisonSociale { get; set; } = string.Empty;
    public string? Secteur { get; set; }
    public string? Statut { get; set; }
    public DateTime DateCreation { get; set; }
}
