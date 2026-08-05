namespace SupplierManagement.API.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public UtilisateurDto User { get; set; } = new();
}

public class UtilisateurDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Prenom { get; set; }
    public string Identifiant { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; }
}

public class CreateUtilisateurRequest
{
    public string Nom { get; set; } = string.Empty;
    public string? Prenom { get; set; }
    public string Identifiant { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Email { get; set; }
    public int RoleId { get; set; }
}

public class UpdateUtilisateurRequest
{
    public string Nom { get; set; } = string.Empty;
    public string? Prenom { get; set; }
    public string? Email { get; set; }
    public int? RoleId { get; set; }
    public string? Statut { get; set; }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
