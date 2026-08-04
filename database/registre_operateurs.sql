-- =============================================================================
-- REGISTRE DES OPERATEURS ECONOMIQUES (FOURNISSEURS) - SQL Server
-- =============================================================================
-- Ce script cree la base de donnees complete telle que demandee.
-- Les documents PDF sont stockes via FILESTREAM.
--
-- ORDRE D'EXECUTION :
--   1. Pre-requis FILESTREAM (section 0) : niveau instance + niveau base.
--   2. Creation des tables (sections 1 a 8).
--   3. Index de recherche (section 9).
-- =============================================================================

-- =============================================================================
-- SECTION 0 : PRE-REQUIS FILESTREAM
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0.1) NIVEAU INSTANCE SQL SERVER
-- -----------------------------------------------------------------------------
-- Active le stockage FILESTREAM pour les transactions transact-SQL.
-- Valeurs possibles de 'filestream access level' :
--   0 = desactive, 1 = T-SQL uniquement, 2 = T-SQL + acces Win32.
-- ATTENTION : un REDEMARRAGE du service SQL Server est necessaire pour que
-- ce changement prenne effet.
EXEC sp_configure 'filestream access level', 2;
RECONFIGURE;
GO

-- -----------------------------------------------------------------------------
-- 0.2) NIVEAU BASE : CREER LE GROUPE DE FICHIERS FILESTREAM
-- -----------------------------------------------------------------------------
-- (A executer une seule fois, AVANT le script de creation des tables.)
-- NB : la base de donnees doit deja exister.
-- Remplacez [registre_operateurs] par le vrai nom de votre base.
-- Remplacez le chemin du fichier par un dossier vide cree au prealable
-- (le repertoire parent doit exister sur le disque).

ALTER DATABASE [registre_operateurs]
ADD FILEGROUP [FILESTREAM_GROUP] CONTAINS FILESTREAM;
GO

ALTER DATABASE [registre_operateurs]
ADD FILE (
    NAME     = N'filestream_data',
    FILENAME = N'C:\SQLData\registre_operateurs_fs'
) TO FILEGROUP [FILESTREAM_GROUP];
GO

-- (Optionnel) Acces NON transactionnel Win32 pour le rendu des PDF.
-- OFF par defaut (les acces FILESTREAM se font alors via transactions T-SQL).
-- A n'activer que si vos fichiers sont lus en direct par l'OS.
-- ALTER DATABASE [registre_operateurs]
--   SET FILESTREAM ( NON_TRANSACTED_ACCESS = OFF );
-- GO

-- =============================================================================
-- SECTION 1 : TABLE role
-- =============================================================================

CREATE TABLE role (
    id          INT IDENTITY(1,1) NOT NULL,
    libelle     NVARCHAR(100)     NOT NULL,
    description NVARCHAR(500)     NULL,
    CONSTRAINT PK_role PRIMARY KEY (id)
);
GO

-- =============================================================================
-- SECTION 2 : TABLE secteur_activite
-- =============================================================================

CREATE TABLE secteur_activite (
    id      INT IDENTITY(1,1) NOT NULL,
    libelle NVARCHAR(100)     NOT NULL,
    CONSTRAINT PK_secteur_activite PRIMARY KEY (id)
);
GO

-- =============================================================================
-- SECTION 3 : TABLE statut (referentiel des statuts de dossier)
--             Valeurs prevues : en cours, valide, rejete, suspendu, archive
-- =============================================================================

CREATE TABLE statut (
    id      INT IDENTITY(1,1) NOT NULL,
    libelle NVARCHAR(50)      NOT NULL,
    CONSTRAINT PK_statut PRIMARY KEY (id)
);
GO

-- =============================================================================
-- SECTION 4 : TABLE utilisateur
-- =============================================================================

CREATE TABLE utilisateur (
    id                INT IDENTITY(1,1) NOT NULL,
    nom               NVARCHAR(100)     NOT NULL,
    prenom            NVARCHAR(100)     NULL,
    identifiant       NVARCHAR(100)     NOT NULL,
    mot_de_passe_hash NVARCHAR(255)     NOT NULL,
    email             NVARCHAR(255)     NULL,
    role_id           INT               NOT NULL,
    statut            NVARCHAR(20)      NOT NULL CONSTRAINT DF_utilisateur_statut DEFAULT N'actif',
    date_creation     DATETIME          NOT NULL CONSTRAINT DF_utilisateur_date_creation DEFAULT GETDATE(),
    CONSTRAINT PK_utilisateur PRIMARY KEY (id),
    CONSTRAINT UQ_utilisateur_identifiant UNIQUE (identifiant),
    CONSTRAINT FK_utilisateur_role FOREIGN KEY (role_id) REFERENCES role (id),
    CONSTRAINT CK_utilisateur_statut CHECK (statut IN (N'actif', N'inactif'))
);
GO

-- =============================================================================
-- SECTION 5 : TABLE operateur_economique
-- =============================================================================

CREATE TABLE operateur_economique (
    id                      INT IDENTITY(1,1) NOT NULL,
    numero_immatriculation  NVARCHAR(50)      NOT NULL,
    raison_sociale          NVARCHAR(255)     NOT NULL,
    type_operateur          NVARCHAR(20)      NULL,
    forme_juridique         NVARCHAR(100)     NULL,
    nif                     NVARCHAR(50)      NULL,
    nis                     NVARCHAR(50)      NULL,
    registre_commerce       NVARCHAR(100)     NULL,
    secteur_activite_id     INT               NULL,
    adresse                 NVARCHAR(500)     NULL,
    wilaya                  NVARCHAR(100)     NULL,
    telephone               NVARCHAR(30)      NULL,
    email                   NVARCHAR(255)     NULL,
    date_creation_entreprise DATE              NULL,
    date_immatriculation    DATE              NOT NULL,
    statut_id               INT               NULL,
    created_by              INT               NULL,
    created_at              DATETIME          NOT NULL CONSTRAINT DF_operateur_created_at DEFAULT GETDATE(),
    updated_at              DATETIME          NOT NULL CONSTRAINT DF_operateur_updated_at DEFAULT GETDATE(),
    CONSTRAINT PK_operateur_economique PRIMARY KEY (id),
    CONSTRAINT UQ_operateur_numero_immatriculation UNIQUE (numero_immatriculation),
    CONSTRAINT UQ_operateur_nif UNIQUE (nif),
    CONSTRAINT FK_operateur_secteur FOREIGN KEY (secteur_activite_id) REFERENCES secteur_activite (id),
    CONSTRAINT FK_operateur_statut FOREIGN KEY (statut_id) REFERENCES statut (id),
    CONSTRAINT FK_operateur_created_by FOREIGN KEY (created_by) REFERENCES utilisateur (id),
    CONSTRAINT CK_operateur_type_operateur CHECK (type_operateur IN (N'physique', N'morale'))
);
GO

-- =============================================================================
-- SECTION 6 : TABLE dossier
-- =============================================================================

CREATE TABLE dossier (
    id                 INT IDENTITY(1,1) NOT NULL,
    operateur_id       INT               NOT NULL,
    statut_id          INT               NOT NULL,
    agent_affecte_id   INT               NULL,
    date_creation      DATETIME          NOT NULL CONSTRAINT DF_dossier_date_creation DEFAULT GETDATE(),
    CONSTRAINT PK_dossier PRIMARY KEY (id),
    CONSTRAINT FK_dossier_operateur FOREIGN KEY (operateur_id) REFERENCES operateur_economique (id),
    CONSTRAINT FK_dossier_statut FOREIGN KEY (statut_id) REFERENCES statut (id),
    CONSTRAINT FK_dossier_agent FOREIGN KEY (agent_affecte_id) REFERENCES utilisateur (id)
);
GO

-- =============================================================================
-- SECTION 7 : TABLE document (stockage PDF via FILESTREAM)
-- -----------------------------------------------------------------------------
--  - VARBINARY(MAX) FILESTREAM : le contenu binaire vit dans le filegroup FS.
--  - FileID ROWGUIDCOL : requis par SQL Server pour toute table FILESTREAM.
--  - Un seul document par (dossier_id, type_code) : contrainte UNIQUE.
--    Un nouvel upload remplace la ligne existante via UPDATE (pas de version).
--  - FILESTREAM_ON [FILESTREAM_GROUP] : le filegroup cree en section 0.2.
-- =============================================================================

CREATE TABLE document (
    id              INT IDENTITY(1,1) NOT NULL,
    dossier_id      INT               NOT NULL,
    type_code       VARCHAR(30)       NOT NULL,
    nom_fichier     NVARCHAR(255)     NOT NULL,
    contenu_fichier VARBINARY(MAX)    FILESTREAM NULL,
    FileID          UNIQUEIDENTIFIER  ROWGUIDCOL NOT NULL CONSTRAINT DF_document_FileID DEFAULT NEWID(),
    date_expiration DATE              NULL,
    user_uploader   INT               NOT NULL,
    created_at      DATETIME          NOT NULL CONSTRAINT DF_document_created_at DEFAULT GETDATE(),
    CONSTRAINT PK_document PRIMARY KEY (id),
    CONSTRAINT UQ_document_FileID UNIQUE (FileID),
    CONSTRAINT UQ_document_dossier_type UNIQUE (dossier_id, type_code),
    CONSTRAINT FK_document_dossier FOREIGN KEY (dossier_id) REFERENCES dossier (id),
    CONSTRAINT FK_document_user_uploader FOREIGN KEY (user_uploader) REFERENCES utilisateur (id),
    CONSTRAINT CK_document_type_code CHECK (
        type_code IN (
            N'REGISTRE_COMMERCE',
            N'STATUTS_SOCIETE',
            N'ATTESTATION_NIF',
            N'ATTESTATION_NIS',
            N'CASIER_JUDICIAIRE',
            N'PIECE_IDENTITE'
        )
    )
)
FILESTREAM_ON [FILESTREAM_GROUP];
GO

-- =============================================================================
-- SECTION 8 : TABLE notification
-- =============================================================================

CREATE TABLE notification (
    id              INT IDENTITY(1,1) NOT NULL,
    utilisateur_id  INT               NOT NULL,
    dossier_id      INT               NULL,
    type            NVARCHAR(50)      NULL,
    message         NVARCHAR(1000)    NULL,
    lu              BIT               NOT NULL CONSTRAINT DF_notification_lu DEFAULT 0,
    date_creation   DATETIME          NOT NULL CONSTRAINT DF_notification_date_creation DEFAULT GETDATE(),
    CONSTRAINT PK_notification PRIMARY KEY (id),
    CONSTRAINT FK_notification_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id),
    CONSTRAINT FK_notification_dossier FOREIGN KEY (dossier_id) REFERENCES dossier (id)
);
GO

-- =============================================================================
-- SECTION 9 : INDEX DE RECHERCHE
-- =============================================================================

CREATE NONCLUSTERED INDEX IX_operateur_raison_sociale ON operateur_economique (raison_sociale);
GO

CREATE NONCLUSTERED INDEX IX_operateur_nif ON operateur_economique (nif);
GO

CREATE NONCLUSTERED INDEX IX_operateur_wilaya ON operateur_economique (wilaya);
GO

-- =============================================================================
-- FIN DU SCRIPT
-- =============================================================================
