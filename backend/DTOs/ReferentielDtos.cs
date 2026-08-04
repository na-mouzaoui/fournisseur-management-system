namespace SupplierManagement.API.DTOs;

public class NotificationDto
{
    public int Id { get; set; }
    public int UtilisateurId { get; set; }
    public int? DossierId { get; set; }
    public string? Type { get; set; }
    public string? Message { get; set; }
    public bool Lu { get; set; }
    public DateTime DateCreation { get; set; }
}

public class RoleDto
{
    public int Id { get; set; }
    public string Libelle { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class SecteurActiviteDto
{
    public int Id { get; set; }
    public string Libelle { get; set; } = string.Empty;
}

public class StatutDto
{
    public int Id { get; set; }
    public string Libelle { get; set; } = string.Empty;
}
