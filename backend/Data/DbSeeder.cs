using SupplierManagement.API.Models;

namespace SupplierManagement.API.Data;

public static class DbSeeder
{
    public static void Seed(ApplicationDbContext context)
    {
        // Ajouter les statuts manquants
        var requiredStatuts = new[] { "actif", "blacklisté", "archivé", "en cours", "validé", "rejeté", "suspendu" };
        var existingStatuts = context.Statuts.Select(s => s.Libelle).ToList();
        var missingStatuts = requiredStatuts
            .Where(s => !existingStatuts.Contains(s))
            .Select(s => new Statut { Libelle = s })
            .ToList();
        if (missingStatuts.Any())
        {
            context.Statuts.AddRange(missingStatuts);
            context.SaveChanges();
        }

        if (context.Roles.Any())
            return;

        // Referentiel des roles
        var adminRole = new Role
        {
            Libelle = "admin",
            Description = "Administrateur du registre"
        };
        var agentRole = new Role
        {
            Libelle = "agent",
            Description = "Agent chargé du traitement des dossiers"
        };
        context.Roles.AddRange(adminRole, agentRole);

        // Referentiel des secteurs d'activité
        context.SecteursActivite.AddRange(
            new SecteurActivite { Libelle = "Informatique" },
            new SecteurActivite { Libelle = "Bâtiment" },
            new SecteurActivite { Libelle = "Logistique" },
            new SecteurActivite { Libelle = "Énergie" }
        );

        context.SaveChanges();

        // Utilisateurs de test
        var adminUser = new Utilisateur
        {
            Nom = "Mouzaoui",
            Prenom = "Nazim",
            Identifiant = "nazim.mouzaoui",
            Email = "nazim.mouzaoui@gmail.dz",
            MotDePasseHash = BCrypt.Net.BCrypt.HashPassword("N@zim2002"),
            RoleId = adminRole.Id,
            Statut = "actif",
            DateCreation = DateTime.UtcNow
        };

        var agentUser = new Utilisateur
        {
            Nom = "Manager",
            Prenom = "Ahmed",
            Identifiant = "manager",
            Email = "manager@example.com",
            MotDePasseHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
            RoleId = agentRole.Id,
            Statut = "actif",
            DateCreation = DateTime.UtcNow
        };

        context.Utilisateurs.AddRange(adminUser, agentUser);
        context.SaveChanges();
    }
}
