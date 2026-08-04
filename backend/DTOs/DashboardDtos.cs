namespace SupplierManagement.API.DTOs;

public class DashboardStatsDto
{
    public int TotalOperateurs { get; set; }
    public int OperateursBlacklistes { get; set; }
    public int Nouveaux30Jours { get; set; }
    public List<EvolutionMensuelleDto> EvolutionMensuelle { get; set; } = new();
    public List<SecteurRepartitionDto> RepartitionSecteurs { get; set; } = new();
    public List<DernierFournisseurDto> DerniersFournisseurs { get; set; } = new();
}

public class EvolutionMensuelleDto
{
    public string Mois { get; set; } = string.Empty; // format: YYYY-MM
    public int Nouveaux { get; set; }
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
