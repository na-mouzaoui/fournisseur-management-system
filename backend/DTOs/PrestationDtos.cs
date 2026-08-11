namespace SupplierManagement.API.DTOs;

public class PrestationDto
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string StructureContractante { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OperateurId { get; set; }
    public string? OperateurRaisonSociale { get; set; }
    public string? OperateurNumeroImmatriculation { get; set; }
    public int? EtapeId { get; set; }
    public string? EtapeLibelle { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePrestationRequest
{
    public string Reference { get; set; } = string.Empty;
    public string StructureContractante { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OperateurId { get; set; }
    public int? EtapeId { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
}

public class UpdatePrestationRequest
{
    public string Reference { get; set; } = string.Empty;
    public string StructureContractante { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OperateurId { get; set; }
    public int? EtapeId { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
}

public class PrestationPagedResult
{
    public List<PrestationDto> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
