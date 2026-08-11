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
    Task<OperateurEconomiqueDto> ArchiveOperateurAsync(int id, bool isArchived);
    Task<BlacklistEntryDto> BlacklistOperateurAsync(int id, BlacklistRequest request, int userId);
    Task<OperateurEconomiqueDto> ReactivateOperateurAsync(int id);
}

public interface IDossierService
{
    Task<DossierPagedResult> GetAllDossiersAsync(int page, int pageSize, int? statutId);
    Task<DossierDto?> GetDossierByIdAsync(int id);
    Task<DossierDto> GetOrCreateForOperateurAsync(int operateurId);
    Task<DossierDto> CreateDossierAsync(CreateDossierRequest request);
    Task<DossierDto?> UpdateDossierAsync(int id, UpdateDossierRequest request);
    Task<bool> DeleteDossierAsync(int id);
}

public interface IDocumentService
{
    Task<DocumentDto> UploadDocumentAsync(CreateDocumentRequest request, byte[] contenu, int uploaderId);
    Task<DocumentDto> UploadDocumentReplacementAsync(int dossierId, string typeCode, byte[] contenu, string nomFichier, DateTime? dateExpiration, int uploaderId);
    Task<(byte[] Contenu, string NomFichier)?> DownloadDocumentAsync(int documentId);
    Task<DocumentDto?> UpdateDateExpirationAsync(int documentId, DateTime? dateExpiration);
    Task<bool> DeleteDocumentAsync(int documentId);
}

public interface INotificationService
{
    Task<List<NotificationDto>> GetNotificationsAsync(int utilisateurId);
    Task MarkAsReadAsync(int id, int utilisateurId);
    Task CreateForAllUsersAsync(string type, string message, int? dossierId = null);
    Task NotifyExpiringDocumentsAsync();
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

public interface IEvaluationService
{
    Task<List<EvaluationDto>> GetByOperateurAsync(int operateurId);
    Task<EvaluationStatsDto> GetStatsAsync(int operateurId);
    Task<EvaluationDto> CreateAsync(CreateEvaluationRequest request, int evaluateurId);
}

public interface IPrestationService
{
    Task<PrestationPagedResult> GetAllPrestationsAsync(int page, int pageSize, string? search);
    Task<PrestationDto?> GetPrestationByIdAsync(int id);
    Task<PrestationDto> CreatePrestationAsync(CreatePrestationRequest request, int userId);
    Task<PrestationDto> UpdatePrestationAsync(int id, UpdatePrestationRequest request);
    Task<bool> DeletePrestationAsync(int id);
}
