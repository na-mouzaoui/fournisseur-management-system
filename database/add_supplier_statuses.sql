-- Ajout des statuts fournisseur manquants
IF NOT EXISTS (SELECT 1 FROM statut WHERE libelle = N'actif')
    INSERT INTO statut (libelle) VALUES (N'actif');

IF NOT EXISTS (SELECT 1 FROM statut WHERE libelle = N'blacklisté')
    INSERT INTO statut (libelle) VALUES (N'blacklisté');

-- Vérification
SELECT id, libelle FROM statut ORDER BY id;
