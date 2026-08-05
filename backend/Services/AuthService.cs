using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SupplierManagement.API.Data;
using SupplierManagement.API.DTOs;
using SupplierManagement.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SupplierManagement.API.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Utilisateurs
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email || u.Identifiant == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.MotDePasseHash))
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect");

        if (user.Statut != "actif")
            throw new UnauthorizedAccessException("L'utilisateur est inactif");

        var token = GenerateJwtToken(user);

        return new LoginResponse
        {
            Token = token,
            ExpiresIn = 3600,
            User = MapToUtilisateurDto(user)
        };
    }

    public async Task<Utilisateur?> GetCurrentUserAsync(int userId)
    {
        return await _context.Utilisateurs
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Statut == "actif");
    }

    private string GenerateJwtToken(Utilisateur user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"] ?? throw new InvalidOperationException());

        var role = _context.Roles.FirstOrDefault(r => r.Id == user.RoleId);

        var claims = new List<Claim>
        {
            new Claim("userId", user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Identifiant),
            new Claim(ClaimTypes.Role, role?.Libelle ?? "utilisateur")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public static UtilisateurDto MapToUtilisateurDto(Utilisateur user)
    {
        return new UtilisateurDto
        {
            Id = user.Id,
            Nom = user.Nom,
            Prenom = user.Prenom,
            Identifiant = user.Identifiant,
            Email = user.Email,
            Role = user.Role?.Libelle ?? string.Empty,
            Statut = user.Statut,
            DateCreation = user.DateCreation
        };
    }
}
