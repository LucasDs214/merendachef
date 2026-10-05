using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MerendaChef.Api.Data;
using MerendaChef.Api.Models;
using MerendaChef.Api.Services;

namespace MerendaChef.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, IConfiguration config, IEmailService email, ILogger<AuthController> logger)
    {
        _db = db; _config = config; _email = email; _logger = logger;
    }

    [HttpPost("registro")]
    public async Task<IActionResult> Registrar([FromBody] RegistroDto dto)
    {
        var cpf = dto.Cpf.Replace(".", "").Replace("-", "");
        if (!ValidarCpf(cpf)) return BadRequest(new { error = "CPF inválido." });

        if (!ValidarSenha(dto.Senha, out var senhaErro))
            return BadRequest(new { error = senhaErro });

        if (await _db.Candidatos.AnyAsync(c => c.Cpf == cpf))
            return Conflict(new { error = "CPF já cadastrado." });

        if (await _db.Candidatos.AnyAsync(c => c.Email == dto.Email))
            return Conflict(new { error = "E-mail já cadastrado." });

        var candidato = new Candidato
        {
            Nome = dto.Nome,
            Cpf = cpf,
            Email = dto.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            PrimeiroAcesso = false
        };

        _db.Candidatos.Add(candidato);
        await _db.SaveChangesAsync();

        _logger.LogInformation("✅ Candidato cadastrado: {Email}", dto.Email);
        return Ok(new { message = "Cadastro realizado com sucesso!" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var cpf = dto.Cpf.Replace(".", "").Replace("-", "");
        var candidato = await _db.Candidatos.FirstOrDefaultAsync(c => c.Cpf == cpf);

        if (candidato == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, candidato.SenhaHash))
            return Unauthorized(new { error = "CPF ou senha inválidos." });

        var token = GerarToken(candidato.Id.ToString(), candidato.Email, "Candidato");
        return Ok(new
        {
            token,
            primeiroAcesso = candidato.PrimeiroAcesso,
            nome = candidato.Nome,
            id = candidato.Id
        });
    }

    [HttpPost("trocar-senha")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> TrocarSenha([FromBody] TrocarSenhaDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var candidato = await _db.Candidatos.FindAsync(Guid.Parse(userId!));
        if (candidato == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, candidato.SenhaHash))
            return BadRequest(new { error = "Senha atual incorreta." });

        if (!ValidarSenha(dto.NovaSenha, out var senhaErro))
            return BadRequest(new { error = senhaErro });

        candidato.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        candidato.PrimeiroAcesso = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Senha alterada com sucesso." });
    }

    [HttpPost("admin/login")]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDto dto)
    {
        var admin = await _db.Admins.FirstOrDefaultAsync(a => a.Email == dto.Email);
        if (admin == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, admin.SenhaHash))
            return Unauthorized(new { error = "Credenciais inválidas." });

        var token = GerarToken(admin.Id.ToString(), admin.Email, "Admin");
        return Ok(new { token, nome = admin.Nome });
    }

    [HttpPost("reset-senha")]
    public async Task<IActionResult> ResetSenha([FromBody] ResetSenhaDto dto)
    {
        var cpf = dto.Cpf.Replace(".", "").Replace("-", "");
        var candidato = await _db.Candidatos.FirstOrDefaultAsync(c => c.Cpf == cpf);
        if (candidato == null)
            return NotFound(new { error = "CPF não encontrado." });

        var novaSenha = GerarSenhaTemporaria();
        candidato.SenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);
        candidato.PrimeiroAcesso = true;
        await _db.SaveChangesAsync();

        var emailDestino = candidato.Email;
        var emailNome = candidato.Nome;
        var emailService = _email;

        _ = Task.Run(async () =>
        {
            try { await emailService.EnviarSenhaTemporariaAsync(emailDestino, emailNome, novaSenha); }
            catch (Exception ex) { Console.WriteLine($"📧 [EMAIL FALHOU] {ex.Message}"); }
        });

        return Ok(new { message = "Nova senha enviada para o e-mail cadastrado." });
    }

    private string GerarToken(string id, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, id),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GerarSenhaTemporaria()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
        var rng = new Random();
        return new string(Enumerable.Range(0, 10).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
    }

    private static bool ValidarSenha(string senha, out string erro)
    {
        erro = string.Empty;
        if (senha.Length < 8) { erro = "A senha deve ter no mínimo 8 caracteres."; return false; }
        if (!senha.Any(char.IsUpper)) { erro = "A senha deve conter ao menos uma letra maiúscula."; return false; }
        if (!senha.Any(char.IsLower)) { erro = "A senha deve conter ao menos uma letra minúscula."; return false; }
        if (!senha.Any(c => !char.IsLetterOrDigit(c))) { erro = "A senha deve conter ao menos um símbolo (@, #, !, etc)."; return false; }
        return true;
    }

    private static bool ValidarCpf(string cpf)
    {
        if (cpf.Length != 11 || cpf.All(c => c == cpf[0])) return false;
        int[] mult1 = [10,9,8,7,6,5,4,3,2];
        int[] mult2 = [11,10,9,8,7,6,5,4,3,2];
        var sum = cpf.Take(9).Select((c, i) => (c - '0') * mult1[i]).Sum();
        var r1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (r1 != cpf[9] - '0') return false;
        sum = cpf.Take(10).Select((c, i) => (c - '0') * mult2[i]).Sum();
        var r2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return r2 == cpf[10] - '0';
    }
}

public record RegistroDto(string Nome, string Cpf, string Email, string Senha);
public record LoginDto(string Cpf, string Senha);
public record TrocarSenhaDto(string SenhaAtual, string NovaSenha);
public record AdminLoginDto(string Email, string Senha);
public record ResetSenhaDto(string Cpf);