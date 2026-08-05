using SupplierManagement.API.Services;

namespace SupplierManagement.API.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditMiddleware> _logger;

    private static readonly HashSet<string> WriteMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    public AuditMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory, ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;

        // On ne journalise que les écritures (création, modification, suppression).
        if (!WriteMethods.Contains(method))
        {
            await _next(context);
            return;
        }

        await _next(context);

        var status = context.Response.StatusCode;
        if (status < 200 || status >= 300)
            return; // Échec : on ne journalise pas l'action.

        var (action, entite, entiteId) = Resolve(method, path);
        if (action == null || entite == null)
            return; // Route non gérée (ex. login/logout).

        var userId = GetUserId(context);
        var identifiant = context.User.Identity?.Name ?? string.Empty;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
            await auditService.LogAsync(userId, identifiant, action, entite, entiteId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la journalisation de l'audit");
        }
    }

    private static int? GetUserId(HttpContext context)
    {
        var value = context.User.FindFirst("userId")?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    // Renvoie (ActionFR, Entite, EntiteId).
    private static (string? Action, string? Entite, int? EntiteId) Resolve(string method, string path)
    {
        if (path.StartsWith("/api/auth/", StringComparison.OrdinalIgnoreCase))
            return (null, null, null);

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length < 2 || !segments[0].Equals("api", StringComparison.OrdinalIgnoreCase))
            return (null, null, null);

        var ressource = segments[1].ToLowerInvariant();

        switch (ressource)
        {
            case "operateurs":
                if (method == "POST") return ("Créer un fournisseur", "Fournisseur", null);
                if (segments.Length >= 3)
                {
                    var id = ParseId(segments[2]);
                    if (method == "PUT") return ("Modifier un fournisseur", "Fournisseur", id);
                    if (method == "DELETE") return ("Supprimer un fournisseur", "Fournisseur", id);
                }
                break;

            case "utilisateurs":
                if (method == "POST") return ("Créer un utilisateur", "Utilisateur", null);
                if (segments.Length >= 3)
                {
                    var id = ParseId(segments[2]);
                    if (method == "DELETE") return ("Supprimer un utilisateur", "Utilisateur", id);
                    if (method == "PUT") return ("Modifier un utilisateur", "Utilisateur", id);
                    if (method == "PATCH" && segments.Length >= 4 && segments[3].Equals("reset-password", StringComparison.OrdinalIgnoreCase))
                        return ("Réinitialiser le mot de passe", "Utilisateur", id);
                }
                break;

            case "dossiers":
                if (method == "POST") return ("Créer un dossier", "Dossier", null);
                if (segments.Length >= 3)
                {
                    var id = ParseId(segments[2]);
                    if (method == "PUT") return ("Modifier un dossier", "Dossier", id);
                    if (method == "DELETE") return ("Supprimer un dossier", "Dossier", id);
                }
                break;

            case "documents":
                if (method == "POST") return ("Ajouter un document", "Document", null);
                if (method == "PUT") return ("Remplacer un document", "Document", null);
                break;

            case "notifications":
                if (method == "PATCH" && segments.Length >= 3)
                    return ("Marquer une notification comme lue", "Notification", ParseId(segments[2]));
                break;

            case "referentiels":
                if (segments.Length >= 3)
                {
                    var sousRessource = segments[2].ToLowerInvariant();
                    if (method == "POST" && sousRessource == "secteurs") return ("Ajouter un secteur d'activité", "Secteur d'activité", null);
                    if (method == "POST" && sousRessource == "statuts") return ("Ajouter un statut", "Statut", null);
                }
                break;
        }

        return (null, null, null);
    }

    private static int? ParseId(string segment)
    {
        return int.TryParse(segment, out var id) ? id : null;
    }
}