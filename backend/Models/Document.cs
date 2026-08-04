namespace SupplierManagement.API.Models;

public class Document
{
    public int Id { get; set; }
    public int DossierId { get; set; }
    public Dossier? Dossier { get; set; }
    public string TypeCode { get; set; } = string.Empty;
    public string NomFichier { get; set; } = string.Empty;
    public byte[]? ContenuFichier { get; set; }
    public Guid RowGuid { get; set; } = Guid.NewGuid();
    public Guid FileID { get; set; } = Guid.NewGuid();
    public DateTime? DateExpiration { get; set; }
    public int UserUploader { get; set; }
    public Utilisateur? Uploader { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
