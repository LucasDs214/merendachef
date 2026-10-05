using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features; // Adicionado para acessar o FormOptions
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MerendaChef.Api.Data;
using MerendaChef.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Aumentar limite global de requisição do Kestrel (Exemplo: 50MB)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 52428800; // 50 MB em bytes
});

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt => {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });

// 2. Aumentar limite de leitura de formulários/arquivos no .NET (Exemplo: 50MB)
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50 MB em bytes
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins)
     .AllowAnyHeader()
     .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (!db.Admins.Any())
    {
        var adminEmail = app.Configuration["Admin:Email"];
        var adminSenha = app.Configuration["Admin:Password"];

        if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminSenha))
        {
            db.Admins.Add(new MerendaChef.Api.Models.Admin
            {
                Nome = "Administrador",
                Email = adminEmail,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(adminSenha)
            });
            db.SaveChanges();
            Console.WriteLine("Admin inicial criado.");
        }
        else
        {
            Console.WriteLine("Nenhum admin criado: defina Admin__Email e Admin__Password.");
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/uploads/{userId:guid}/{fileName}", (Guid userId, string fileName, IWebHostEnvironment env) =>
{
    var safeName = Path.GetFileName(fileName);
    var ext = Path.GetExtension(safeName).ToLowerInvariant();
    var contentType = ext switch
    {
        ".pdf" => "application/pdf",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        _ => null
    };
    if (contentType is null) return Results.NotFound();

    var root = Path.GetFullPath(Path.Combine(env.ContentRootPath, "uploads"));
    var path = Path.GetFullPath(Path.Combine(root, userId.ToString(), safeName));
    if (!path.StartsWith(root + Path.DirectorySeparatorChar) || !File.Exists(path))
        return Results.NotFound();

    return Results.File(path, contentType, enableRangeProcessing: true);
});

app.Run();