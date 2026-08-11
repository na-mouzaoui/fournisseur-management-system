using Microsoft.EntityFrameworkCore;
using SupplierManagement.API.Models;

namespace SupplierManagement.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Role> Roles { get; set; }
    public DbSet<Utilisateur> Utilisateurs { get; set; }
    public DbSet<SecteurActivite> SecteursActivite { get; set; }
    public DbSet<Statut> Statuts { get; set; }
    public DbSet<OperateurEconomique> OperateursEconomiques { get; set; }
    public DbSet<Dossier> Dossiers { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<BlacklistEntry> BlacklistEntries { get; set; }
    public DbSet<Evaluation> Evaluations { get; set; }
    public DbSet<Prestation> Prestations { get; set; }
    public DbSet<Etape> Etapes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureRole(modelBuilder);
        ConfigureSecteurActivite(modelBuilder);
        ConfigureStatut(modelBuilder);
        ConfigureUtilisateur(modelBuilder);
        ConfigureOperateurEconomique(modelBuilder);
        ConfigureDossier(modelBuilder);
        ConfigureDocument(modelBuilder);
        ConfigureNotification(modelBuilder);
        ConfigureAuditLog(modelBuilder);
        ConfigureBlacklistEntry(modelBuilder);
        ConfigureEvaluation(modelBuilder);
        ConfigurePrestation(modelBuilder);
        ConfigureEtape(modelBuilder);
    }

    private static void ConfigureRole(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(e =>
        {
            e.ToTable("role");
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.Libelle).HasColumnName("libelle").IsRequired();
            e.Property(r => r.Description).HasColumnName("description");
        });
    }

    private static void ConfigureSecteurActivite(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SecteurActivite>(e =>
        {
            e.ToTable("secteur_activite");
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.Code).HasColumnName("code").IsRequired().HasMaxLength(20);
            e.Property(s => s.Libelle).HasColumnName("libelle").IsRequired();
        });
    }

    private static void ConfigureStatut(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Statut>(e =>
        {
            e.ToTable("statut");
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.Libelle).HasColumnName("libelle").IsRequired();
        });
    }

    private static void ConfigureUtilisateur(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Utilisateur>(e =>
        {
            e.ToTable("utilisateur");
            e.Property(u => u.Id).HasColumnName("id");
            e.Property(u => u.Nom).HasColumnName("nom").IsRequired();
            e.Property(u => u.Prenom).HasColumnName("prenom");
            e.Property(u => u.Identifiant).HasColumnName("identifiant").IsRequired();
            e.Property(u => u.MotDePasseHash).HasColumnName("mot_de_passe_hash").IsRequired();
            e.Property(u => u.Email).HasColumnName("email");
            e.Property(u => u.RoleId).HasColumnName("role_id");
            e.Property(u => u.Statut).HasColumnName("statut").HasDefaultValue("actif");
            e.Property(u => u.DateCreation).HasColumnName("date_creation").HasDefaultValueSql("GETDATE()");

            e.HasIndex(u => u.Identifiant).IsUnique();
            e.ToTable(t => t.HasCheckConstraint("CK_utilisateur_statut", "statut IN (N'actif', N'inactif')"));

            e.HasOne(u => u.Role)
                .WithMany(r => r.Utilisateurs)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureOperateurEconomique(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OperateurEconomique>(e =>
        {
            e.ToTable("operateur_economique");
            e.Property(o => o.Id).HasColumnName("id");
            e.Property(o => o.NumeroImmatriculation).HasColumnName("numero_immatriculation").IsRequired();
            e.Property(o => o.RaisonSociale).HasColumnName("raison_sociale").IsRequired();
            e.Property(o => o.TypeOperateur).HasColumnName("type_operateur");
            e.Property(o => o.TypeFournisseur).HasColumnName("type_fournisseur");
            e.Property(o => o.Gerant).HasColumnName("gerant");
            e.Property(o => o.FormeJuridique).HasColumnName("forme_juridique");
            e.Property(o => o.Nif).HasColumnName("nif");
            e.Property(o => o.Nis).HasColumnName("nis");
            e.Property(o => o.RegistreCommerce).HasColumnName("registre_commerce");
            e.Property(o => o.SecteurActiviteId).HasColumnName("secteur_activite_id");
            e.Property(o => o.Adresse).HasColumnName("adresse");
            e.Property(o => o.Wilaya).HasColumnName("wilaya");
            e.Property(o => o.Telephone).HasColumnName("telephone");
            e.Property(o => o.Email).HasColumnName("email");
            e.Property(o => o.DateCreationEntreprise).HasColumnName("date_creation_entreprise");
            e.Property(o => o.DateImmatriculation).HasColumnName("date_immatriculation").IsRequired();
            e.Property(o => o.StatutId).HasColumnName("statut_id");
            e.Property(o => o.CreatedBy).HasColumnName("created_by");
            e.Property(o => o.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            e.Property(o => o.UpdatedAt).HasColumnName("updated_at");
            e.Property(o => o.IsArchived).HasColumnName("is_archived").HasDefaultValue(false);
            e.Property(o => o.DateSuppression).HasColumnName("date_suppression");

            e.HasIndex(o => o.NumeroImmatriculation).IsUnique();
            e.HasIndex(o => o.Nif).IsUnique();
            e.HasIndex(o => o.RaisonSociale);
            e.HasIndex(o => o.Wilaya);
            e.ToTable(t => t.HasCheckConstraint("CK_operateur_type_operateur", "type_operateur IN (N'physique', N'morale')"));

            e.HasOne(o => o.SecteurActivite)
                .WithMany(s => s.Operateurs)
                .HasForeignKey(o => o.SecteurActiviteId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(o => o.Statut)
                .WithMany(s => s.Operateurs)
                .HasForeignKey(o => o.StatutId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(o => o.Createur)
                .WithMany(u => u.OperateursCrees)
                .HasForeignKey(o => o.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureDossier(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Dossier>(e =>
        {
            e.ToTable("dossier");
            e.Property(d => d.Id).HasColumnName("id");
            e.Property(d => d.OperateurId).HasColumnName("operateur_id").IsRequired();
            e.Property(d => d.StatutId).HasColumnName("statut_id").IsRequired();
            e.Property(d => d.AgentAffecteId).HasColumnName("agent_affecte_id");
            e.Property(d => d.DateCreation).HasColumnName("date_creation").HasDefaultValueSql("GETDATE()");

            e.HasOne(d => d.Operateur)
                .WithMany(o => o.Dossiers)
                .HasForeignKey(d => d.OperateurId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(d => d.Statut)
                .WithMany(s => s.Dossiers)
                .HasForeignKey(d => d.StatutId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(d => d.AgentAffecte)
                .WithMany(u => u.DossiersAgents)
                .HasForeignKey(d => d.AgentAffecteId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureDocument(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Document>(e =>
        {
            e.ToTable("document");
            e.Property(d => d.Id).HasColumnName("id");
            e.Property(d => d.DossierId).HasColumnName("dossier_id").IsRequired();
            e.Property(d => d.TypeCode).HasColumnName("type_code").IsRequired().HasMaxLength(30);
            e.Property(d => d.NomFichier).HasColumnName("nom_fichier").IsRequired();
            e.Property(d => d.ContenuFichier).HasColumnName("contenu_fichier").HasColumnType("varbinary(max)");
            e.Property(d => d.RowGuid).HasColumnName("rowguid").IsRequired().HasDefaultValueSql("NEWID()");
            e.Property(d => d.FileID).HasColumnName("FileID").HasDefaultValueSql("NEWID()");
            e.Property(d => d.DateExpiration).HasColumnName("date_expiration");
            e.Property(d => d.UserUploader).HasColumnName("user_uploader").IsRequired();
            e.Property(d => d.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");

            e.HasIndex(d => new { d.DossierId, d.TypeCode }).IsUnique();
            e.HasAlternateKey(d => d.RowGuid);
            e.ToTable(t => t.HasCheckConstraint("CK_document_type_code",
                "type_code IN ('VALIDITE_COTISATIONS_CNAS', 'CERTIFICAT_MISE_A_JOUR_FISCAL', 'CERTIFICAT_QUALIFICATION')"));

            e.HasOne(d => d.Dossier)
                .WithMany(d => d.Documents)
                .HasForeignKey(d => d.DossierId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(d => d.Uploader)
                .WithMany(u => u.DocumentsUploades)
                .HasForeignKey(d => d.UserUploader)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureNotification(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notification");
            e.Property(n => n.Id).HasColumnName("id");
            e.Property(n => n.UtilisateurId).HasColumnName("utilisateur_id").IsRequired();
            e.Property(n => n.DossierId).HasColumnName("dossier_id");
            e.Property(n => n.Type).HasColumnName("type");
            e.Property(n => n.Message).HasColumnName("message");
            e.Property(n => n.Lu).HasColumnName("lu").HasDefaultValue(false);
            e.Property(n => n.DateCreation).HasColumnName("date_creation").HasDefaultValueSql("GETDATE()");

            e.HasOne(n => n.Utilisateur)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UtilisateurId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(n => n.Dossier)
                .WithMany(d => d.Notifications)
                .HasForeignKey(n => n.DossierId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureAuditLog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_log");
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.UtilisateurId).HasColumnName("utilisateur_id");
            e.Property(a => a.UtilisateurIdentifiant).HasColumnName("utilisateur_identifiant").HasMaxLength(255);
            e.Property(a => a.Action).HasColumnName("action").IsRequired().HasMaxLength(255);
            e.Property(a => a.Entite).HasColumnName("entite").IsRequired().HasMaxLength(100);
            e.Property(a => a.EntiteId).HasColumnName("entite_id");
            e.Property(a => a.Details).HasColumnName("details");
            e.Property(a => a.DateHeure).HasColumnName("date_heure").HasDefaultValueSql("GETDATE()");

            e.HasIndex(a => a.DateHeure);
        });
    }

    private static void ConfigureBlacklistEntry(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlacklistEntry>(e =>
        {
            e.ToTable("blacklist_entry");
            e.Property(b => b.Id).HasColumnName("id");
            e.Property(b => b.OperateurId).HasColumnName("operateur_id").IsRequired();
            e.Property(b => b.Motif).HasColumnName("motif").IsRequired().HasMaxLength(500);
            e.Property(b => b.DateDebut).HasColumnName("date_debut").IsRequired();
            e.Property(b => b.DateFin).HasColumnName("date_fin");
            e.Property(b => b.CreatedBy).HasColumnName("created_by");
            e.Property(b => b.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");

            e.HasOne(b => b.Operateur)
                .WithMany()
                .HasForeignKey(b => b.OperateurId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(b => b.Createur)
                .WithMany()
                .HasForeignKey(b => b.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureEvaluation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Evaluation>(e =>
        {
            e.ToTable("evaluation");
            e.Property(ev => ev.Id).HasColumnName("id");
            e.Property(ev => ev.OperateurId).HasColumnName("operateur_id").IsRequired();
            e.Property(ev => ev.NoteConformite).HasColumnName("note_conformite").IsRequired();
            e.Property(ev => ev.NoteDelai).HasColumnName("note_delai").IsRequired();
            e.Property(ev => ev.NotePrixConsultation).HasColumnName("note_prix_consultation").IsRequired();
            e.Property(ev => ev.NotePrixContrat).HasColumnName("note_prix_contrat").IsRequired();
            e.Property(ev => ev.NoteHse).HasColumnName("note_hse").IsRequired();
            e.Property(ev => ev.NoteService).HasColumnName("note_service").IsRequired();
            e.Property(ev => ev.NoteGlobale).HasColumnName("note_globale").IsRequired();
            e.Property(ev => ev.Annee).HasColumnName("annee");
            e.Property(ev => ev.Semestre).HasColumnName("semestre").HasMaxLength(10);
            e.Property(ev => ev.PrestationId).HasColumnName("prestation_id");
            e.Property(ev => ev.Commentaire).HasColumnName("commentaire").HasMaxLength(1000);
            e.Property(ev => ev.EvaluateurId).HasColumnName("evaluateur_id");
            e.Property(ev => ev.DateEvaluation).HasColumnName("date_evaluation").HasDefaultValueSql("GETDATE()");

            e.HasIndex(ev => ev.PrestationId);

            e.ToTable(t => t.HasCheckConstraint("CK_evaluation_notes",
                "note_conformite IN (0, 2, 4, 5) AND note_delai IN (0, 2, 4, 5) AND note_prix_consultation IN (0, 2, 4) AND note_prix_contrat IN (0, 3, 4) AND note_hse IN (0, 2) AND note_service IN (0, 2, 3, 4)"));

            e.HasOne(ev => ev.Operateur)
                .WithMany()
                .HasForeignKey(ev => ev.OperateurId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ev => ev.Evaluateur)
                .WithMany()
                .HasForeignKey(ev => ev.EvaluateurId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ev => ev.Prestation)
                .WithMany()
                .HasForeignKey(ev => ev.PrestationId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigurePrestation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Prestation>(e =>
        {
            e.ToTable("prestation");
            e.Property(c => c.Id).HasColumnName("id");
            e.Property(c => c.Reference).HasColumnName("reference").IsRequired().HasMaxLength(100);
            e.Property(c => c.StructureContractante).HasColumnName("structure_contractante").IsRequired().HasMaxLength(200);
            e.Property(c => c.Description).HasColumnName("description").HasMaxLength(1000);
            e.Property(c => c.OperateurId).HasColumnName("operateur_id").IsRequired();
            e.Property(c => c.EtapeId).HasColumnName("etape_id");
            e.Property(c => c.DateDebut).HasColumnName("date_debut").IsRequired();
            e.Property(c => c.DateFin).HasColumnName("date_fin");
            e.Property(c => c.CreatedBy).HasColumnName("created_by");
            e.Property(c => c.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            e.Property(c => c.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(c => c.Reference);
            e.HasIndex(c => c.OperateurId);
            e.HasIndex(c => c.EtapeId);

            e.HasOne(c => c.Operateur)
                .WithMany()
                .HasForeignKey(c => c.OperateurId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Etape)
                .WithMany()
                .HasForeignKey(c => c.EtapeId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Createur)
                .WithMany()
                .HasForeignKey(c => c.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureEtape(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Etape>(e =>
        {
            e.ToTable("etape");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Libelle).HasColumnName("libelle").IsRequired().HasMaxLength(100);
            e.Property(x => x.Ordre).HasColumnName("ordre").IsRequired();
        });
    }
}
