using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MerendaChef.Api.Data;
using MerendaChef.Api.Models;
using MerendaChef.Api.Services;

namespace MerendaChef.Api.Controllers;

[ApiController]
[Route("api/inscricoes")]
public class InscricoesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _email;

    public InscricoesController(AppDbContext db, IWebHostEnvironment env, IEmailService email)
    {
        _db = db; _env = env; _email = email;
    }

    [HttpPost]
    [Authorize(Roles = "Candidato")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Inscrever([FromForm] InscricaoFormDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var candidato = await _db.Candidatos.FindAsync(userId);
        if (candidato == null) return Unauthorized();

        // Edital, item 4.9: "Cada PARTICIPANTE poderá enviar quantas receitas desejar."
        // (removido o bloqueio de inscrição única — múltiplas receitas por participante são permitidas)

        // Dados funcionais + comprovante são preenchidos uma única vez, via /api/candidatos/perfil
        // — não são mais reenviados a cada receita.
        if (!candidato.CadastroCompleto)
            return BadRequest(new { error = "Complete seu cadastro (dados funcionais e comprovante de vínculo) antes de enviar uma receita.", cadastroIncompleto = true });

        if (!TiposReceitaValidos.Contains(dto.TipoReceita))
            return BadRequest(new { error = "Selecione o tipo da receita: Prato Principal, Acompanhamento ou ambos (Edital, item 4.5)." });

        if (!dto.AceitouLgpd || !dto.AutorizouUsoImagem || !dto.AceitouTermosUso || !dto.DeclarouSemParentesco)
            return BadRequest(new { error = "É necessário aceitar todos os termos (LGPD, uso de imagem, termos de uso e declaração de ausência de parentesco) para concluir a inscrição." });

        // Verifica prazo
        var config = await _db.Configuracoes.FirstOrDefaultAsync();
        if (config?.PrazoEdicaoInscricao.HasValue == true && DateTime.UtcNow > config.PrazoEdicaoInscricao.Value)
            return BadRequest(new { error = "O prazo para inscrições encerrou." });

        candidato.AceitouTermosUso = dto.AceitouTermosUso;

        string? fotoNome = dto.FotoReceita != null
            ? await SalvarArquivo(dto.FotoReceita, userId)
            : null;

        var inscricao = new Inscricao
        {
            CandidatoId = userId,
            NomeReceita = dto.NomeReceita ?? string.Empty,
            TipoReceita = dto.TipoReceita,
            Descricao = dto.Descricao ?? string.Empty,
            ModoPreparo = dto.ModoPreparo ?? string.Empty,
            FotoReceita = fotoNome,
            AceitouLgpd = dto.AceitouLgpd,
            AutorizouUsoImagem = dto.AutorizouUsoImagem,
            DeclarouSemParentesco = dto.DeclarouSemParentesco,
            Status = StatusInscricao.Pendente,
            Ingredientes = dto.Ingredientes.Select(i => new InscricaoIngrediente
            {
                IngredienteId = i.Id,
                Quantidade = i.Quantidade
            }).ToList()
        };

        _db.Inscricoes.Add(inscricao);
        await _db.SaveChangesAsync();

        var hash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes($"{candidato.Cpf}{inscricao.Id}{DateTime.UtcNow}")
            )
        )[..12].ToUpper();

        inscricao.HashInscricao = hash;
        inscricao.DataConfirmacao = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        try
        {
            await _email.EnviarComprovanteInscricaoAsync(
                candidato.Email, candidato.Nome, inscricao.NomeReceita, hash, inscricao.CriadaEm);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"📧 [EMAIL FALHOU] {ex.Message}");
        }

        return Ok(new { id = inscricao.Id, hash, message = "Inscrição salva com sucesso!" });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Candidato")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> AtualizarInscricao(Guid id, [FromForm] InscricaoFormDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Verifica prazo
        var config = await _db.Configuracoes.FirstOrDefaultAsync();
        if (config?.PrazoEdicaoInscricao.HasValue == true && DateTime.UtcNow > config.PrazoEdicaoInscricao.Value)
            return BadRequest(new { error = "O prazo para edição de inscrições encerrou." });

        var inscricao = await _db.Inscricoes
            .Include(i => i.Ingredientes)
            .FirstOrDefaultAsync(i => i.Id == id && i.CandidatoId == userId);

        // Não revela se o id existe e pertence a outro candidato — sempre 404 nesse caso
        if (inscricao == null) return NotFound(new { error = "Inscrição não encontrada." });

        var candidato = await _db.Candidatos.FindAsync(userId);
        if (candidato == null) return Unauthorized();

        if (!dto.AceitouLgpd || !dto.AutorizouUsoImagem || !dto.AceitouTermosUso || !dto.DeclarouSemParentesco)
            return BadRequest(new { error = "É necessário manter todos os termos aceitos (LGPD, uso de imagem, termos de uso e declaração de ausência de parentesco) para salvar a inscrição." });

        // Atualiza receita
        if (!string.IsNullOrEmpty(dto.NomeReceita)) inscricao.NomeReceita = dto.NomeReceita;
        if (!string.IsNullOrEmpty(dto.TipoReceita))
        {
            if (!TiposReceitaValidos.Contains(dto.TipoReceita))
                return BadRequest(new { error = "Selecione o tipo da receita: Prato Principal, Acompanhamento ou ambos (Edital, item 4.5)." });
            inscricao.TipoReceita = dto.TipoReceita;
        }
        if (!string.IsNullOrEmpty(dto.Descricao)) inscricao.Descricao = dto.Descricao;
        if (!string.IsNullOrEmpty(dto.ModoPreparo)) inscricao.ModoPreparo = dto.ModoPreparo;
        inscricao.AceitouLgpd = dto.AceitouLgpd;
        inscricao.AutorizouUsoImagem = dto.AutorizouUsoImagem;
        inscricao.DeclarouSemParentesco = dto.DeclarouSemParentesco;

        // Atualiza foto se enviada
        if (dto.FotoReceita != null)
            inscricao.FotoReceita = await SalvarArquivo(dto.FotoReceita, userId);

        // Atualiza ingredientes
        if (dto.Ingredientes.Any())
        {
            _db.RemoveRange(inscricao.Ingredientes);
            inscricao.Ingredientes = dto.Ingredientes.Select(i => new InscricaoIngrediente
            {
                InscricaoId = inscricao.Id,
                IngredienteId = i.Id,
                Quantidade = i.Quantidade
            }).ToList();
        }

        inscricao.AtualizadaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Inscrição atualizada com sucesso!" });
    }

    [HttpGet("minhas")]
    [Authorize(Roles = "Candidato")]
    public async Task<IActionResult> MinhasInscricoes()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inscricoes = await _db.Inscricoes
            .Include(i => i.Candidato)
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .Where(i => i.CandidatoId == userId)
            .OrderByDescending(i => i.CriadaEm)
            .ToListAsync();

        var config = await _db.Configuracoes.FirstOrDefaultAsync();
        var prazoExpirado = config?.PrazoEdicaoInscricao.HasValue == true
            && DateTime.UtcNow > config.PrazoEdicaoInscricao.Value;

        var resultado = inscricoes.Select(inscricao =>
        {
            var c = inscricao.Candidato;
            return new
            {
                id = inscricao.Id,
                candidato = new {
                    nome = c.Nome,
                    cpf = c.Cpf.Length == 11 ? $"{c.Cpf[..3]}.{c.Cpf[3..6]}.{c.Cpf[6..9]}-{c.Cpf[9..]}" : c.Cpf,
                    email = c.Email,
                    telefone = c.Telefone,
                    unidadeEscolar = c.UnidadeEscolar,
                    nomeDiretor = c.NomeDiretor,
                    matricula = c.Matricula,
                    cargo = c.Cargo,
                    comprovanteVinculo = c.ComprovanteVinculo
                },
                nomeReceita = inscricao.NomeReceita,
                tipoReceita = inscricao.TipoReceita,
                descricao = inscricao.Descricao,
                modoPreparo = inscricao.ModoPreparo,
                fotoReceita = inscricao.FotoReceita,
                aceitouLgpd = inscricao.AceitouLgpd,
                autorizouUsoImagem = inscricao.AutorizouUsoImagem,
                aceitouTermosUso = c.AceitouTermosUso,
                declarouSemParentesco = inscricao.DeclarouSemParentesco,
                hashInscricao = inscricao.HashInscricao,
                dataConfirmacao = inscricao.DataConfirmacao,
                status = inscricao.Status.ToString(),
                motivoEliminacao = inscricao.MotivoEliminacao,
                dataSegundaFase = inscricao.DataSegundaFase,
                localSegundaFase = inscricao.LocalSegundaFase,
                convocadoEm = inscricao.ConvocadoEm,
                ingredientes = inscricao.Ingredientes.Select(ii => new {
                    ii.Ingrediente.Id,
                    ii.Ingrediente.Nome,
                    ii.Ingrediente.IsInNatura,
                    ii.Quantidade
                }),
                criadaEm = inscricao.CriadaEm,
                podeEditar = !prazoExpirado,
                prazoEdicao = config?.PrazoEdicaoInscricao
            };
        });

        return Ok(resultado);
    }

    [HttpGet("ingredientes")]
    public async Task<IActionResult> ListarIngredientes()
    {
        var ingredientes = await _db.Ingredientes
            .OrderBy(i => i.Categoria).ThenBy(i => i.Nome)
            .Select(i => new { i.Id, i.Nome, i.Categoria, i.IsInNatura, i.UnidadeMedida })
            .ToListAsync();
        return Ok(ingredientes);
    }

    [HttpGet("habilitadas")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ListarHabilitadas()
    {
        var inscricoes = await _db.Inscricoes
            .Where(i => i.Status == StatusInscricao.Habilitada)
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .Select(i => new
            {
                id = i.Id,
                nomeReceita = i.NomeReceita,
                descricao = i.Descricao,
                fotoReceita = i.FotoReceita,
                ingredientes = i.Ingredientes.Select(ii => ii.Ingrediente.Nome),
                notaTotal = i.NotaTotal
            })
            .ToListAsync();
        return Ok(inscricoes);
    }

    // Edital, item 4.5: "receitas que se caracterizem como preparação culinária apta
    // ao contexto da alimentação escolar, abrangendo prato principal e/ou acompanhamento"
    private static readonly HashSet<string> TiposReceitaValidos = new()
    {
        "PratoPrincipal", "Acompanhamento", "PratoPrincipalEAcompanhamento"
    };

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

public class InscricaoFormDto
{
    public string? NomeReceita { get; set; }
    public string TipoReceita { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? ModoPreparo { get; set; }
    public IFormFile? FotoReceita { get; set; }
    public List<IngredienteItemDto> Ingredientes { get; set; } = new();
    public bool AceitouLgpd { get; set; }
    public bool AutorizouUsoImagem { get; set; }
    public bool AceitouTermosUso { get; set; }
    public bool DeclarouSemParentesco { get; set; }
}

public class IngredienteItemDto
{
    public int Id { get; set; }
    public string Quantidade { get; set; } = string.Empty;
}