namespace SupplierManagement.API.DTOs;

public class DossierDto
{
    public int Id { get; set; }
    public int OperateurId { get; set; }
    public string? OperateurRaisonSociale { get; set; }
    public string? OperateurNumeroImmatriculation { get; set; }
    public int StatutId { get; set; }
    public string? StatutLibelle { get; set; }
    public int? AgentAffecteId { get; set; }
    public string? AgentAffecteNom { get; set; }
    public DateTime DateCreation { get; set; }
    public List<DocumentDto> Documents { get; set; } = new();
}

public class CreateDossierRequest
{
    public int OperateurId { get; set; }
    public int StatutId { get; set; }
    public int? AgentAffecteId { get; set; }
}

public class UpdateDossierRequest
{
    public int? StatutId { get; set; }
    public int? AgentAffecteId { get; set; }
}

public class DossierPagedResult
{
    public List<DossierDto> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class DocumentDto
{
    public int Id { get; set; }
    public int DossierId { get; set; }
    public string TypeCode { get; set; } = string.Empty;
    public string NomFichier { get; set; } = string.Empty;
    public Guid FileID { get; set; }
    public DateTime? DateExpiration { get; set; }
    public int UserUploader { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDocumentRequest
{
    public int DossierId { get; set; }
    public string TypeCode { get; set; } = string.Empty;
    public string NomFichier { get; set; } = string.Empty;
    public DateTime? DateExpiration { get; set; }
}
