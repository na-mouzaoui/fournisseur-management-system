namespace SupplierManagement.API.DTOs;

public class HistoriqueDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public int OperateurId { get; set; }
    public string? OperateurRaisonSociale { get; set; }
    public string? OperateurNumeroImmatriculation { get; set; }
    public int PrestationId { get; set; }
    public string? PrestationReference { get; set; }
    public string? PrestationStructureContractante { get; set; }
    public int Annee { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreateurNom { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateHistoriqueRequest
{
    public string Action { get; set; } = string.Empty;
    public int OperateurId { get; set; }
    public int PrestationId { get; set; }
    public int Annee { get; set; }
}

public class UpdateHistoriqueRequest
{
    public string Action { get; set; } = string.Empty;
    public int OperateurId { get; set; }
    public int PrestationId { get; set; }
    public int Annee { get; set; }
}

public class HistoriquePagedResult
{
    public List<HistoriqueDto> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
