# =====================================================================
# Activation de FILESTREAM pour le stockage des documents
# À exécuter APRÈS le redémarrage de Windows (l'API requiert un reboot
# pour que le pilote RsFx0800 soit correctement chargé).
# =====================================================================
$ErrorActionPreference = "Stop"
$Instance = "localhost\SQLEXPRESS"
$BackendDir = "C:\Users\nazim_mouzaoui\Downloads\fournisseur-management-system\backend"

Write-Host "=== Vérification du niveau FILESTREAM ===" -ForegroundColor Cyan
$level = sqlcmd -S $Instance -E -C -h -1 -Q "SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('FilestreamConfiguredLevel') AS int);" -W 2>&1 | Select-Object -Last 1

if ($level -eq "2") {
    Write-Host "[OK] FILESTREAM actif (niveau 2)." -ForegroundColor Green
} else {
    Write-Host "[!] FILESTREAM n'est pas actif (niveau = $level)." -ForegroundColor Red
    Write-Host "    Vérifiez la configuration dans SQL Server Configuration Manager"
    Write-Host "    (instances -> SQL Server (SQLEXPRESS) -> Propriétés -> onglet FILESTREAM,"
    Write-Host "    cochez 'Activer FILESTREAM pour l'accès Transact-SQL'),"
    Write-Host "    puis redémarrez Windows et relancez ce script."
    exit 1
}

Write-Host ""
Write-Host "=== Application de la migration EnableFilestreamDocuments ===" -ForegroundColor Cyan
Push-Location $BackendDir
try {
    dotnet ef database update
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Terminé. Lancez ensuite 'dotnet run' dans le dossier backend puis 'npm run dev' dans frontend." -ForegroundColor Green
