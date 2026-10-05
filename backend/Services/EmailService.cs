namespace MerendaChef.Api.Services;

public interface IEmailService
{
    Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha);
    Task EnviarConvocacaoSegundaFaseAsync(string destinatario, string nome, string nomeReceita, DateTime data, string local);
    Task EnviarComprovanteInscricaoAsync(string destinatario, string nome, string nomeReceita, string hash, DateTime dataInscricao);
}

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;
    private static readonly TimeZoneInfo BrasiliaZone =
        TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private static DateTime ParaBrasilia(DateTime utc)
    {
        var dt = utc.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(utc, DateTimeKind.Utc)
            : utc;
        return TimeZoneInfo.ConvertTimeFromUtc(dt, BrasiliaZone);
    }

    private async Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
    {
        var host = _config["Email:SmtpHost"];
        var port = int.Parse(_config["Email:SmtpPort"] ?? "587");
        var user = _config["Email:User"];
        var pass = _config["Email:Password"];
        var from = _config["Email:From"];

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var client = new MailKit.Net.Smtp.SmtpClient();

        await client.ConnectAsync(host, port, false, cts.Token);
        await client.AuthenticateAsync(user, pass, cts.Token);

        var message = new MimeKit.MimeMessage();
        message.From.Add(new MimeKit.MailboxAddress("MerendaChef - Não Responda", from));
        message.To.Add(MimeKit.MailboxAddress.Parse(destinatario));
        message.Subject = assunto;
        message.Body = new MimeKit.TextPart("html") { Text = corpoHtml };

        await client.SendAsync(message, cts.Token);
        await client.DisconnectAsync(true, cts.Token);
        _logger.LogInformation("✅ E-mail enviado para {Email}: {Assunto}", destinatario, assunto);
    }

    public async Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha)
    {
        var html = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#e85d24;padding:20px;text-align:center'>
                <h1 style='color:white;margin:0'>🍳 MerendaChef</h1>
                <p style='color:white;margin:5px 0'>Concurso Culinário FAETEC 2026</p>
            </div>
            <div style='padding:30px;background:#fff'>
                <h2>Olá, {nome}!</h2>
                <p>Seu cadastro foi realizado com sucesso.</p>
                <p>Sua senha temporária é:</p>
                <div style='background:#f5f5f5;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:3px;border-radius:8px'>
                    {senha}
                </div>
                <p style='margin-top:20px'>Acesse o sistema e troque sua senha no primeiro login.</p>
                <p style='color:#e85d24;font-weight:bold'>⚠️ Você deverá alterar sua senha no primeiro acesso.</p>
            </div>
            <div style='padding:15px;background:#f5f5f5;text-align:center;font-size:12px;color:#666'>
                FAETEC — Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro
            </div>
        </div>";
        await EnviarAsync(destinatario, "MerendaChef — Sua senha temporária", html);
    }

    public async Task EnviarComprovanteInscricaoAsync(string destinatario, string nome, string nomeReceita, string hash, DateTime dataInscricao)
    {
        var dataBrasilia = ParaBrasilia(dataInscricao);
        var html = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#e85d24;padding:20px;text-align:center'>
                <h1 style='color:white;margin:0'>🍳 MerendaChef</h1>
                <p style='color:white;margin:5px 0'>Concurso Culinário FAETEC 2026</p>
            </div>
            <div style='padding:30px;background:#fff'>
                <h2>✅ Inscrição Confirmada!</h2>
                <p>Olá, <strong>{nome}</strong>!</p>
                <p>Sua inscrição no Concurso Culinário FAETEC 2026 foi recebida com sucesso.</p>
                <div style='background:#fff8f0;border:2px solid #e85d24;padding:20px;border-radius:8px;margin:20px 0'>
                    <p style='margin:5px 0'><strong>🍽️ Receita:</strong> {nomeReceita}</p>
                    <p style='margin:5px 0'><strong>📅 Data:</strong> {dataBrasilia:dd/MM/yyyy 'às' HH:mm} (horário de Brasília)</p>
                    <p style='margin:5px 0'><strong>🔑 Código de Verificação:</strong></p>
                    <div style='background:#f5f5f5;padding:10px;text-align:center;font-size:18px;font-weight:bold;letter-spacing:2px;border-radius:6px;margin-top:8px'>
                        {hash}
                    </div>
                </div>
                <p style='color:#666;font-size:13px'>Guarde este e-mail. O código de verificação poderá ser solicitado para comprovar sua inscrição.</p>
            </div>
            <div style='padding:15px;background:#f5f5f5;text-align:center;font-size:12px;color:#666'>
                FAETEC — Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro
            </div>
        </div>";
        await EnviarAsync(destinatario, "MerendaChef — Comprovante de Inscrição", html);
    }

    public async Task EnviarConvocacaoSegundaFaseAsync(string destinatario, string nome, string nomeReceita, DateTime data, string local)
    {
        var html = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#e85d24;padding:20px;text-align:center'>
                <h1 style='color:white;margin:0'>🍳 MerendaChef</h1>
                <p style='color:white;margin:5px 0'>Concurso Culinário FAETEC 2026</p>
            </div>
            <div style='padding:30px;background:#fff'>
                <h2>🏆 Parabéns, {nome}!</h2>
                <p>Sua receita <strong>{nomeReceita}</strong> foi selecionada entre as 20 melhores!</p>
                <div style='background:#fff8f0;border:2px solid #e85d24;padding:20px;border-radius:8px;margin:20px 0'>
                    <p style='margin:5px 0'><strong>📅 Data:</strong> {data:dd/MM/yyyy 'às' HH:mm} (horário de Brasília)</p>
                    <p style='margin:5px 0'><strong>📍 Local:</strong> {local}</p>
                </div>
                <div style='background:#fef3cd;border:1px solid #ffc107;padding:15px;border-radius:8px;margin:15px 0'>
                    <p style='margin:0;color:#856404;font-weight:bold'>⚠️ Instruções Importantes:</p>
                    <ul style='color:#856404;margin:10px 0;padding-left:20px'>
                        <li>Compareça com <strong>no mínimo 30 minutos de antecedência</strong></li>
                        <li>Traga documento de identidade com foto</li>
                        <li>O não comparecimento implicará na desclassificação</li>
                    </ul>
                </div>
            </div>
            <div style='padding:15px;background:#f5f5f5;text-align:center;font-size:12px;color:#666'>
                FAETEC — Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro
            </div>
        </div>";
        await EnviarAsync(destinatario, "🏆 MerendaChef — Convocado para a 2ª Fase!", html);
    }
}