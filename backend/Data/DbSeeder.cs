using SupplierManagement.API.Models;

namespace SupplierManagement.API.Data;

public static class DbSeeder
{
    public static void Seed(ApplicationDbContext context)
    {
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

        // Referentiel des statuts de dossier
        context.Statuts.AddRange(
            new Statut { Libelle = "en cours" },
            new Statut { Libelle = "validé" },
            new Statut { Libelle = "rejeté" },
            new Statut { Libelle = "suspendu" },
            new Statut { Libelle = "archivé" }
        );

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
