using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<Utilisateur?> GetCurrentUserAsync(int userId);
}

public interface IOperateurService
{
    Task<OperateurPagedResult> GetAllOperateursAsync(int page, int pageSize, string? search);
    Task<OperateurEconomiqueDto?> GetOperateurByIdAsync(int id);
    Task<OperateurEconomiqueDto> CreateOperateurAsync(CreateOperateurRequest request, int createdBy);
    Task<OperateurEconomiqueDto> UpdateOperateurAsync(int id, UpdateOperateurRequest request);
    Task<bool> DeleteOperateurAsync(int id);
}

public interface IDossierService
{
    Task<DossierPagedResult> GetAllDossiersAsync(int page, int pageSize, int? statutId);
    Task<DossierDto?> GetDossierByIdAsync(int id);
    Task<DossierDto> CreateDossierAsync(CreateDossierRequest request);
    Task<DossierDto?> UpdateDossierAsync(int id, UpdateDossierRequest request);
    Task<bool> DeleteDossierAsync(int id);
}

public interface IDocumentService
{
    Task<DocumentDto> UploadDocumentAsync(CreateDocumentRequest request, byte[] contenu, int uploaderId);
    Task<DocumentDto> UploadDocumentReplacementAsync(int dossierId, string typeCode, byte[] contenu, string nomFichier, DateTime? dateExpiration, int uploaderId);
    Task<(byte[] Contenu, string NomFichier)?> DownloadDocumentAsync(int documentId);
}

public interface INotificationService
{
    Task<List<NotificationDto>> GetNotificationsAsync(int utilisateurId);
    Task MarkAsReadAsync(int id, int utilisateurId);
}

public interface IReferentielService
{
    Task<List<RoleDto>> GetRolesAsync();
    Task<List<SecteurActiviteDto>> GetSecteursAsync();
    Task<List<StatutDto>> GetStatutsAsync();
    Task<SecteurActiviteDto> CreateSecteurAsync(string libelle);
    Task<StatutDto> CreateStatutAsync(string libelle);
}

public interface IUtilisateurService
{
    Task<List<UtilisateurDto>> GetAllUtilisateursAsync();
    Task<UtilisateurDto?> GetUtilisateurByIdAsync(int id);
    Task<UtilisateurDto> CreateUtilisateurAsync(CreateUtilisateurRequest request);
    Task<UtilisateurDto> UpdateUtilisateurAsync(int id, UpdateUtilisateurRequest request);
    Task<bool> DeleteUtilisateurAsync(int id);
    Task<bool> ResetPasswordAsync(int id, ResetPasswordRequest request);
}
