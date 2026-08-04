namespace SupplierManagement.API.DTOs;

public class OperateurEconomiqueDto
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
    public string? SecteurActiviteLibelle { get; set; }
    public string? Adresse { get; set; }
    public string? Wilaya { get; set; }
    public string? Telephone { get; set; }
    public string? Email { get; set; }
    public DateTime? DateCreationEntreprise { get; set; }
    public DateTime DateImmatriculation { get; set; }
    public int? StatutId { get; set; }
    public string? StatutLibelle { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateOperateurRequest
{
    public string NumeroImmatriculation { get; set; } = string.Empty;
    public string RaisonSociale { get; set; } = string.Empty;
    public string? TypeOperateur { get; set; }
    public string? FormeJuridique { get; set; }
    public string? Nif { get; set; }
    public string? Nis { get; set; }
    public string? RegistreCommerce { get; set; }
    public int? SecteurActiviteId { get; set; }
    public string? Adresse { get; set; }
    public string? Wilaya { get; set; }
    public string? Telephone { get; set; }
    public string? Email { get; set; }
    public DateTime? DateCreationEntreprise { get; set; }
    public DateTime DateImmatriculation { get; set; }
    public int? StatutId { get; set; }
}

public class UpdateOperateurRequest
{
    public string RaisonSociale { get; set; } = string.Empty;
    public string? TypeOperateur { get; set; }
    public string? FormeJuridique { get; set; }
    public string? Nif { get; set; }
    public string? Nis { get; set; }
    public string? RegistreCommerce { get; set; }
    public int? SecteurActiviteId { get; set; }
    public string? Adresse { get; set; }
    public string? Wilaya { get; set; }
    public string? Telephone { get; set; }
    public string? Email { get; set; }
    public DateTime? DateCreationEntreprise { get; set; }
    public DateTime DateImmatriculation { get; set; }
    public int? StatutId { get; set; }
}

public class OperateurPagedResult
{
    public List<OperateurEconomiqueDto> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
