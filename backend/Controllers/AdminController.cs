using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MerendaChef.Api.Data;
using MerendaChef.Api.Models;
using MerendaChef.Api.Services;

namespace MerendaChef.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private static readonly TimeZoneInfo BrasiliaZone =
        TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    public AdminController(AppDbContext db, IEmailService email)
    {
        _db = db;
        _email = email;
    }

    [HttpGet("inscricoes")]
    public async Task<IActionResult> ListarInscricoes([FromQuery] StatusInscricao? status)
    {
        var query = _db.Inscricoes
            .Include(i => i.Candidato)
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(i => i.Status == status.Value);

        var inscricoes = await query.OrderBy(i => i.CriadaEm).ToListAsync();

        return Ok(inscricoes.Select(i => new
        {
            id = i.Id,
            candidato = new
            {
                id = i.Candidato.Id,
                nome = i.Candidato.Nome,
                cpf = MaskCpf(i.Candidato.Cpf),
                email = i.Candidato.Email,
                telefone = i.Candidato.Telefone,
                unidade = i.Candidato.UnidadeEscolar,
                diretor = i.Candidato.NomeDiretor,
                matricula = i.Candidato.Matricula,
                cargo = i.Candidato.Cargo,
                comprovante = i.Candidato.ComprovanteVinculo
            },
            receita = new
            {
                nome = i.NomeReceita,
                tipo = i.TipoReceita,
                descricao = i.Descricao,
                modoPreparo = i.ModoPreparo,
                foto = i.FotoReceita
            },
            ingredientes = i.Ingredientes.Select(ii => new
            {
                ii.Ingrediente.Id,
                ii.Ingrediente.Nome,
                ii.Ingrediente.Categoria,
                ii.Ingrediente.IsInNatura,
                ii.Quantidade
            }),
            status = i.Status.ToString(),
            motivoEliminacao = i.MotivoEliminacao,
            notas = new
            {
                viabilidade = i.NotaViabilidade,
                criatividade = i.NotaCriatividade,
                culturaRegional = i.NotaCulturaRegional,
                alimentosInNatura = i.NotaAlimentosInNatura,
                total = i.NotaTotal
            },
            criadaEm = i.CriadaEm,
            dataSegundaFase = i.DataSegundaFase,
            localSegundaFase = i.LocalSegundaFase
        }));
    }

    // Candidatos que se cadastraram (com login ativo) mas ainda não enviaram nenhuma receita —
    // útil para a organizadora entrar em contato antes do prazo de inscrições encerrar (item 6 do Edital).
    [HttpGet("candidatos-sem-receita")]
    public async Task<IActionResult> CandidatosSemReceita()
    {
        var candidatos = await _db.Candidatos
            .Where(c => !c.Inscricoes.Any())
            .OrderByDescending(c => c.CriadoEm)
            .ToListAsync();

        return Ok(candidatos.Select(c => new
        {
            id = c.Id,
            nome = c.Nome,
            cpf = MaskCpf(c.Cpf),
            email = c.Email,
            telefone = c.Telefone,
            unidadeEscolar = c.UnidadeEscolar,
            nomeDiretor = c.NomeDiretor,
            cadastroCompleto = c.CadastroCompleto,
            criadoEm = c.CriadoEm
        }));
    }

    [HttpPatch("inscricoes/{id:guid}/habilitar")]
    public async Task<IActionResult> Habilitar(Guid id)
    {
        var inscricao = await _db.Inscricoes.FindAsync(id);
        if (inscricao == null) return NotFound();
        inscricao.Status = StatusInscricao.Habilitada;
        inscricao.MotivoEliminacao = null;
        inscricao.AtualizadaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Inscrição habilitada." });
    }

    [HttpPatch("inscricoes/{id:guid}/eliminar")]
    public async Task<IActionResult> Eliminar(Guid id, [FromBody] EliminarDto dto)
    {
        var inscricao = await _db.Inscricoes.FindAsync(id);
        if (inscricao == null) return NotFound();
        inscricao.Status = StatusInscricao.Eliminada;
        inscricao.MotivoEliminacao = dto.Motivo;
        inscricao.AtualizadaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Inscrição eliminada." });
    }

    [HttpPatch("inscricoes/{id:guid}/notas")]
    public async Task<IActionResult> LancarNotas(Guid id, [FromBody] NotasDto dto)
    {
        var inscricao = await _db.Inscricoes.FindAsync(id);
        if (inscricao == null) return NotFound();
        if (inscricao.Status != StatusInscricao.Habilitada)
            return BadRequest(new { error = "Apenas inscrições habilitadas podem ser pontuadas." });

        if (dto.Viabilidade < 0 || dto.Viabilidade > 5)
            return BadRequest(new { error = "Viabilidade: 0 a 5 pontos." });
        if (dto.Criatividade < 0 || dto.Criatividade > 15)
            return BadRequest(new { error = "Criatividade: 0 a 15 pontos." });
        if (dto.CulturaRegional < 0 || dto.CulturaRegional > 10)
            return BadRequest(new { error = "Cultura Regional: 0 a 10 pontos." });
        if (dto.AlimentosInNatura < 0 || dto.AlimentosInNatura > 20)
            return BadRequest(new { error = "Alimentos In Natura: 0 a 20 pontos." });

        inscricao.NotaViabilidade = dto.Viabilidade;
        inscricao.NotaCriatividade = dto.Criatividade;
        inscricao.NotaCulturaRegional = dto.CulturaRegional;
        inscricao.NotaAlimentosInNatura = dto.AlimentosInNatura;
        inscricao.NotaTotal = dto.Viabilidade + dto.Criatividade + dto.CulturaRegional + dto.AlimentosInNatura;
        inscricao.AtualizadaEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { notaTotal = inscricao.NotaTotal });
    }

    [HttpGet("ranking")]
    public async Task<IActionResult> Ranking()
    {
        var inscricoes = await _db.Inscricoes
            .Include(i => i.Candidato)
            .Where(i =>
                (i.Status == StatusInscricao.Habilitada || i.Status == StatusInscricao.ConvocadoSegundaFase)
                && i.NotaTotal.HasValue)
            .ToListAsync();

        var rankingOrdenado = inscricoes
            .OrderByDescending(i => i.NotaTotal)
            .ThenByDescending(i => i.NotaAlimentosInNatura)
            .ThenByDescending(i => i.NotaViabilidade)
            .ThenByDescending(i => i.NotaCriatividade)
            .ThenByDescending(i => i.NotaCulturaRegional)
            .Select((i, idx) => new
            {
                posicao = idx + 1,
                candidato = i.Candidato.Nome,
                nomeReceita = i.NomeReceita,
                status = i.Status.ToString(),
                notas = new
                {
                    viabilidade = i.NotaViabilidade,
                    criatividade = i.NotaCriatividade,
                    culturaRegional = i.NotaCulturaRegional,
                    alimentosInNatura = i.NotaAlimentosInNatura,
                    total = i.NotaTotal
                }
            })
            .ToList();

        return Ok(rankingOrdenado);
    }

    [HttpPatch("inscricoes/{id:guid}/convocar")]
public async Task<IActionResult> Convocar(Guid id, [FromBody] ConvocarDto dto)
{
    var inscricao = await _db.Inscricoes
        .Include(i => i.Candidato)
        .FirstOrDefaultAsync(i => i.Id == id);

    if (inscricao == null) return NotFound();
    if (inscricao.Status != StatusInscricao.Habilitada)
        return BadRequest(new { error = "Apenas inscrições habilitadas podem ser convocadas." });

    var dataUtc = DateTime.SpecifyKind(dto.DataSegundaFase, DateTimeKind.Unspecified);
    var dataLocalBrasilia = TimeZoneInfo.ConvertTimeToUtc(dataUtc, BrasiliaZone);

    inscricao.Status = StatusInscricao.ConvocadoSegundaFase;
    inscricao.DataSegundaFase = dataLocalBrasilia;
    inscricao.LocalSegundaFase = dto.LocalSegundaFase;
    inscricao.ConvocadoEm = DateTime.UtcNow;
    inscricao.AtualizadaEm = DateTime.UtcNow;

    await _db.SaveChangesAsync();

    // Fire-and-forget — não bloqueia a resposta
    var emailDestino = inscricao.Candidato.Email;
    var emailNome = inscricao.Candidato.Nome;
    var emailReceita = inscricao.NomeReceita;
    var emailLocal = dto.LocalSegundaFase;
    var dataParaEmail = TimeZoneInfo.ConvertTimeFromUtc(dataLocalBrasilia, BrasiliaZone);
    var emailService = _email;

    _ = Task.Run(async () =>
    {
        try
        {
            await emailService.EnviarConvocacaoSegundaFaseAsync(
                emailDestino, emailNome, emailReceita, dataParaEmail, emailLocal);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"📧 [EMAIL FALHOU] {ex.Message}");
        }
    });

    return Ok(new { message = "Candidato convocado com sucesso!" });
}


    [HttpPost("admins")]
    public async Task<IActionResult> CriarAdmin([FromBody] CriarAdminDto dto)
    {
        if (await _db.Admins.AnyAsync(a => a.Email == dto.Email))
            return Conflict(new { error = "E-mail já cadastrado." });

        var admin = new Admin
        {
            Nome = dto.Nome,
            Email = dto.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha)
        };
        _db.Admins.Add(admin);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Admin criado com sucesso!", id = admin.Id });
    }

    [HttpGet("admins")]
    public async Task<IActionResult> ListarAdmins()
    {
        var admins = await _db.Admins
            .OrderBy(a => a.Nome)
            .Select(a => new { a.Id, a.Nome, a.Email, a.CriadoEm })
            .ToListAsync();
        return Ok(admins);
    }

    [HttpPost("candidatos/{id:guid}/reset-senha")]
    public async Task<IActionResult> ResetSenhaCandidato(Guid id, [FromBody] ResetSenhaCandidatoDto dto)
    {
        var candidato = await _db.Candidatos.FindAsync(id);
        if (candidato == null) return NotFound(new { error = "Candidato não encontrado." });

        if (!ValidarSenha(dto.NovaSenha, out var erro))
            return BadRequest(new { error = erro });

        candidato.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        candidato.PrimeiroAcesso = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Senha resetada com sucesso." });
    }

    [HttpGet("configuracoes")]
    public async Task<IActionResult> GetConfiguracoes()
    {
        var config = await _db.Configuracoes.FirstOrDefaultAsync();
        return Ok(new {
            prazoEdicaoInscricao = config?.PrazoEdicaoInscricao,
            inscricoesAbertas = config?.InscricoesAbertas ?? true
        });
    }

    [HttpPatch("configuracoes")]
    public async Task<IActionResult> SalvarConfiguracoes([FromBody] ConfiguracoesDto dto)
    {
        var config = await _db.Configuracoes.FirstOrDefaultAsync();
        if (config == null)
        {
            config = new Configuracao();
            _db.Configuracoes.Add(config);
        }
        config.PrazoEdicaoInscricao = dto.PrazoEdicaoInscricao;
        config.InscricoesAbertas = dto.InscricoesAbertas;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Configurações salvas." });
    }

    private static bool ValidarSenha(string senha, out string erro)
    {
        erro = string.Empty;
        if (senha.Length < 8) { erro = "A senha deve ter no mínimo 8 caracteres."; return false; }
        if (!senha.Any(char.IsUpper)) { erro = "Deve conter ao menos uma letra maiúscula."; return false; }
        if (!senha.Any(char.IsLower)) { erro = "Deve conter ao menos uma letra minúscula."; return false; }
        if (!senha.Any(c => !char.IsLetterOrDigit(c))) { erro = "Deve conter ao menos um símbolo."; return false; }
        return true;
    }

    private static string MaskCpf(string cpf) =>
        cpf.Length == 11 ? $"{cpf[..3]}.{cpf[3..6]}.{cpf[6..9]}-{cpf[9..]}" : cpf;
}

// ── DTOs ──────────────────────────────────────────────────────
public record CriarAdminDto(string Nome, string Email, string Senha);
public record ConvocarDto(DateTime DataSegundaFase, string LocalSegundaFase);
public record EliminarDto(string Motivo);
public record NotasDto(decimal Viabilidade, decimal Criatividade, decimal CulturaRegional, decimal AlimentosInNatura);
public record ResetSenhaCandidatoDto(string NovaSenha);
public record ConfiguracoesDto(DateTime? PrazoEdicaoInscricao, bool InscricoesAbertas);