using Microsoft.EntityFrameworkCore;
using MerendaChef.Api.Models;

namespace MerendaChef.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Candidato> Candidatos => Set<Candidato>();
    public DbSet<Inscricao> Inscricoes => Set<Inscricao>();
    public DbSet<Ingrediente> Ingredientes => Set<Ingrediente>();
    public DbSet<InscricaoIngrediente> InscricaoIngredientes => Set<InscricaoIngrediente>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Configuracao> Configuracoes => Set<Configuracao>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Candidato
        mb.Entity<Candidato>(e => {
            e.HasIndex(c => c.Cpf).IsUnique();
            e.HasIndex(c => c.Email).IsUnique();
            e.Property(c => c.Cpf).HasMaxLength(11);
        });

        // Inscricao -> Candidato N:1 (Edital, item 4.9: cada participante pode enviar quantas receitas desejar)
        mb.Entity<Inscricao>(e => {
            e.HasOne(i => i.Candidato)
             .WithMany(c => c.Inscricoes)
             .HasForeignKey(i => i.CandidatoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // InscricaoIngrediente composite PK
        mb.Entity<InscricaoIngrediente>(e => {
            e.HasKey(ii => new { ii.InscricaoId, ii.IngredienteId });
            e.HasOne(ii => ii.Inscricao).WithMany(i => i.Ingredientes).HasForeignKey(ii => ii.InscricaoId);
            e.HasOne(ii => ii.Ingrediente).WithMany().HasForeignKey(ii => ii.IngredienteId);
        });

        // Seed Ingredientes (Anexo I - Insumos do Pregão FAETEC)
        mb.Entity<Ingrediente>().HasData(SeedIngredientes());
    }

    // ═══════════════════════════════════════════════════════════════════
    // ATENÇÃO: esta lista é o ANEXO I do Edital nº 01/2026 (Insumos do
    // Pregão destinado à merenda escolar). NÃO adicione, remova ou altere
    // nomes/unidades sem antes verificar a versão vigente do Anexo I —
    // itens 3.2, 4.6, 5.2 e 5.3 do Edital exigem uso EXCLUSIVO desta lista.
    // Última conferência: Edital 01/2026 (versão final - Adriana), 24/08/2026.
    // ═══════════════════════════════════════════════════════════════════
    private static List<Ingrediente> SeedIngredientes()
    {
        var list = new List<Ingrediente>();
        int id = 1;

        void Add(string nome, string cat, bool inNatura, string unidade) =>
            list.Add(new Ingrediente { Id = id++, Nome = nome, Categoria = cat, IsInNatura = inNatura, UnidadeMedida = unidade });

        // Frutas
        Add("Abacaxi", "Frutas", true, "kg");
        Add("Banana prata", "Frutas", true, "kg");
        Add("Caqui", "Frutas", true, "kg");
        Add("Laranja pera", "Frutas", true, "kg");
        Add("Laranja seleta", "Frutas", true, "kg");
        Add("Limão casca fina", "Frutas", true, "kg");
        Add("Maçã nacional", "Frutas", true, "kg");
        Add("Mamão Comum", "Frutas", true, "kg");
        Add("Manga Espada", "Frutas", true, "kg");
        Add("Melancia", "Frutas", true, "kg");
        Add("Melão", "Frutas", true, "kg");
        Add("Pera Portuguesa", "Frutas", true, "kg");
        Add("Tangerina ponkan", "Frutas", true, "kg");

        // Legumes e Verduras
        Add("Abóbora Pescoço", "Legumes e Verduras", true, "kg");
        Add("Abobrinha Alongada", "Legumes e Verduras", true, "kg");
        Add("Agrião", "Legumes e Verduras", true, "kg");
        Add("Aipim", "Legumes e Verduras", true, "kg");
        Add("Alface Crespa", "Legumes e Verduras", true, "kg");
        Add("Alho, branco ou roxo", "Legumes e Verduras", true, "kg");
        Add("Batata doce", "Legumes e Verduras", true, "kg");
        Add("Batata inglesa", "Legumes e Verduras", true, "kg");
        Add("Beterraba, sem rama", "Legumes e Verduras", true, "kg");
        Add("Cebola", "Legumes e Verduras", true, "kg");
        Add("Cenoura", "Legumes e Verduras", true, "kg");
        Add("Chuchu", "Legumes e Verduras", true, "kg");
        Add("Couve-flor, sem rama", "Legumes e Verduras", true, "kg");
        Add("Couve comum", "Legumes e Verduras", true, "kg");
        Add("Espinafre", "Legumes e Verduras", true, "kg");
        Add("Inhame", "Legumes e Verduras", true, "kg");
        Add("Pepino", "Legumes e Verduras", true, "kg");
        Add("Pimentão verde", "Legumes e Verduras", true, "kg");
        Add("Quiabo", "Legumes e Verduras", true, "kg");
        Add("Repolho Branco", "Legumes e Verduras", true, "kg");
        Add("Tomate", "Legumes e Verduras", true, "kg");
        Add("Vagem manteiga", "Legumes e Verduras", true, "kg");

        // Temperos e Ervas
        Add("Alecrim", "Temperos e Ervas", true, "kg");
        Add("Cheiro verde (composto por salsa e cebolinha)", "Temperos e Ervas", true, "kg");
        Add("Coentro", "Temperos e Ervas", true, "kg");
        Add("Hortelã em folhas", "Temperos e Ervas", true, "kg");
        Add("Louro", "Temperos e Ervas", true, "kg");
        Add("Manjericão", "Temperos e Ervas", true, "kg");
        Add("Orégano 3g", "Temperos e Ervas", true, "unid");

        // Proteínas Animais
        Add("Carne Bovina, Coxão Mole (Chã)", "Proteínas Animais", true, "kg");
        Add("Carne Bovina, Patinho", "Proteínas Animais", true, "kg");
        Add("Carne de Frango, Filé de Peito", "Proteínas Animais", true, "kg");
        Add("Fígado de Bovino, Congelado", "Proteínas Animais", true, "kg");
        Add("Ovo de Galinha, Branco", "Proteínas Animais", true, "dz");
        Add("Peixe - Filé de pescada congelado", "Proteínas Animais", true, "kg");

        // Grãos, Cereais e Massas
        Add("Arroz Parboilizado", "Grãos, Cereais e Massas", true, "kg");
        Add("Farinha de Mandioca, Tipo I, torrada, Fina", "Grãos, Cereais e Massas", true, "kg");
        Add("Farinha de Trigo", "Grãos, Cereais e Massas", true, "kg");
        Add("Feijão Branco 500g", "Grãos, Cereais e Massas", true, "pct");
        Add("Feijão Carioca 1Kg", "Grãos, Cereais e Massas", true, "kg");
        Add("Feijão Fradinho 500g", "Grãos, Cereais e Massas", true, "pct");
        Add("Feijão Preto", "Grãos, Cereais e Massas", true, "kg");
        Add("Fubá de Milho 1Kg", "Grãos, Cereais e Massas", true, "kg");
        Add("Lentilha - 500g", "Grãos, Cereais e Massas", true, "pct");
        Add("Macarrão p/ sopa parafuso COM OVOS - 500g", "Grãos, Cereais e Massas", false, "pct");
        Add("Macarrão espagueti COM OVOS - 500g", "Grãos, Cereais e Massas", false, "pct");
        Add("Macarrão talharim COM OVOS - 500g", "Grãos, Cereais e Massas", false, "pct");
        Add("Trigo para Quibe", "Grãos, Cereais e Massas", false, "pct");

        // Laticínios
        Add("Creme de Leite 200g", "Laticínios", false, "unid");
        Add("Leite de Coco, Concentrado 200ml", "Laticínios", false, "unid");
        Add("Leite Integral; Embalagem 1 litro", "Laticínios", true, "litro");
        Add("Queijo Muçarela", "Laticínios", false, "kg");

        // Óleos, Condimentos e Mercearia
        Add("Azeite de Oliva 500ml", "Óleos, Condimentos e Mercearia", false, "unid");
        Add("Extrato de Tomate Sachê - 340g", "Óleos, Condimentos e Mercearia", false, "unid");
        Add("Fermento Químico 100g", "Óleos, Condimentos e Mercearia", false, "unid");
        Add("Margarina Vegetal 500g", "Óleos, Condimentos e Mercearia", false, "unid");
        Add("Óleo de Soja; Refinado; Embal. 900ml", "Óleos, Condimentos e Mercearia", false, "unid");
        Add("Sal, Iodado, Refinado", "Óleos, Condimentos e Mercearia", false, "kg");
        Add("Vinagre de Álcool - 750ml (branco ou colorido)", "Óleos, Condimentos e Mercearia", false, "unid");

        // Conservas e Enlatados
        Add("Atum em lata com 170g easy off sólido", "Conservas e Enlatados", false, "unid");
        Add("Azeitona Verde 500g", "Conservas e Enlatados", false, "unid");
        Add("Ervilha em conserva lata - 170g", "Conservas e Enlatados", false, "unid");
        Add("Milho verde conserva lata - 170g", "Conservas e Enlatados", false, "unid");

        // Doces e Sobremesas
        Add("Doce de leite tradicional – embalagem de 5 kg", "Doces e Sobremesas", false, "unid");
        Add("Doce goiabada - Embalagem com 7kg", "Doces e Sobremesas", false, "unid");

        // Processados
        Add("Batata Frita Palha 1Kg", "Processados", false, "pct");

        return list;
    }
}