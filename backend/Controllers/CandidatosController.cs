using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MerendaChef.Api.Data;

namespace MerendaChef.Api.Controllers;

// Dados funcionais + comprovante de vínculo do candidato — preenchidos uma única vez
// (não a cada receita), e editáveis depois via "Meus Dados". Edital, itens 4.1.b/c e 5.2
// (habilitação documental verifica o comprovante uma vez por PARTICIPANTE, não por receita).
[ApiController]
[Route("api/candidatos")]
[Authorize(Roles = "Candidato")]
public class CandidatosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public CandidatosController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db; _env = env;
    }

    [HttpGet("perfil")]
    public async Task<IActionResult> GetPerfil()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var candidato = await _db.Candidatos.FindAsync(userId);
        if (candidato == null) return Unauthorized();

        return Ok(new
        {
            nome = candidato.Nome,
            cpf = candidato.Cpf.Length == 11 ? $"{candidato.Cpf[..3]}.{candidato.Cpf[3..6]}.{candidato.Cpf[6..9]}-{candidato.Cpf[9..]}" : candidato.Cpf,
            email = candidato.Email,
            telefone = candidato.Telefone,
            unidadeEscolar = candidato.UnidadeEscolar,
            nomeDiretor = candidato.NomeDiretor,
            matricula = candidato.Matricula,
            cargo = candidato.Cargo,
            comprovanteVinculo = candidato.ComprovanteVinculo,
            cadastroCompleto = candidato.CadastroCompleto
        });
    }

    [HttpPut("perfil")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> AtualizarPerfil([FromForm] PerfilFormDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var candidato = await _db.Candidatos.FindAsync(userId);
        if (candidato == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.UnidadeEscolar) || string.IsNullOrWhiteSpace(dto.NomeDiretor) ||
            string.IsNullOrWhiteSpace(dto.Matricula) || string.IsNullOrWhiteSpace(dto.Cargo) ||
            string.IsNullOrWhiteSpace(dto.Telefone))
            return BadRequest(new { error = "Preencha todos os dados funcionais." });

        if (dto.ComprovanteVinculo == null && string.IsNullOrEmpty(candidato.ComprovanteVinculo))
            return BadRequest(new { error = "É necessário anexar o comprovante de vínculo." });

        candidato.UnidadeEscolar = dto.UnidadeEscolar;
        candidato.NomeDiretor = dto.NomeDiretor;
        candidato.Matricula = dto.Matricula;
        candidato.Cargo = dto.Cargo;
        candidato.Telefone = dto.Telefone;

        if (dto.ComprovanteVinculo != null)
        {
            var novoComprovante = await SalvarArquivo(dto.ComprovanteVinculo, userId);
            if (novoComprovante != null) candidato.ComprovanteVinculo = novoComprovante;
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = "Dados atualizados com sucesso!", cadastroCompleto = candidato.CadastroCompleto });
    }

    private async Task<string?> SalvarArquivo(IFormFile? file, Guid userId)
    {
        if (file == null) return null;
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
        if (!allowed.Contains(ext)) return null;

        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", userId.ToString());
        Directory.CreateDirectory(uploadsDir);

        var nome = $"{Guid.NewGuid()}{ext}";
        var path = Path.Combine(uploadsDir, nome);
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        return $"{userId}/{nome}";
    }
}

public class PerfilFormDto
{
    public string? UnidadeEscolar { get; set; }
    public string? NomeDiretor { get; set; }
    public string? Matricula { get; set; }
    public string? Cargo { get; set; }
    public string? Telefone { get; set; }
    public IFormFile? ComprovanteVinculo { get; set; }
}