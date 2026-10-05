# 🍳 MerendaChef — Plataforma de Concurso Culinário FAETEC

Sistema completo para gerenciar o concurso culinário da rede FAETEC, com módulo de inscrição para candidatos e painel administrativo completo.

---

## 🏗️ Arquitetura
merendachef/
├── backend/                  # ASP.NET Core 8 (C#)
│   ├── Controllers/
│   │   ├── AuthController.cs       # Login, registro, troca de senha
│   │   ├── InscricoesController.cs # Wizard de inscrição + ingredientes
│   │   └── AdminController.cs      # Gestão, notas, ranking
│   ├── Models/
│   │   └── Entities.cs             # Candidato, Inscricao, Ingrediente...
│   ├── Data/
│   │   └── AppDbContext.cs         # EF Core + Seed Anexo I
│   ├── Services/
│   │   └── EmailService.cs         # Serviço de e-mail SMTP
│   └── Program.cs                  # DI, JWT, CORS, Migrations
│
├── frontend/                 # React 18 + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx                 # Roteamento + todas as páginas
│       ├── components/
│       │   ├── wizard/
│       │   │   └── InscricaoWizard.tsx  # Wizard 5 passos mobile-first
│       │   └── admin/
│       │       └── AdminPanel.tsx       # Painel completo + modal
│       ├── hooks/useAuth.ts        # Zustand auth store
│       ├── utils/api.ts            # Axios client + endpoints
│       └── types/index.ts          # TypeScript interfaces
│
├── infra/
│   └── init.sql                    # PostgreSQL init
└── docker-compose.yml              # 3 containers orquestrados

---

## 🚀 Como Rodar

### Pré-requisitos
- Docker Engine 24+
- Docker Compose v2

### Configurar variáveis de ambiente

Antes de subir, configure as variáveis no `docker-compose.yml`:

```env
DB_PASSWORD=           # Senha do PostgreSQL
JWT_SECRET=            # Chave secreta JWT (mín. 32 caracteres)
SMTP_HOST=             # Servidor SMTP
SMTP_PORT=             # Porta SMTP
SMTP_USER=             # Usuário SMTP
SMTP_PASS=             # Senha SMTP
```

### Subir tudo com um comando

```bash
cd merendachef
docker-compose up --build -d
```

| Serviço     | URL                            |
|-------------|--------------------------------|
| Frontend    | http://localhost:3000          |
| Backend API | http://localhost:8080          |
| Swagger     | http://localhost:8080/swagger  |
| PostgreSQL  | localhost:5432                 |

### Desenvolvimento local (sem Docker)

```bash
# Backend
cd backend
dotnet ef database update
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```

---

## 👤 Acesso Inicial

Um administrador padrão é criado automaticamente na primeira inicialização do sistema.

> ⚠️ Altere as credenciais padrão antes de ir para produção!

---

## 📋 Fluxo do Sistema

### Candidato
1. **Registro** → CPF + e-mail → senha temporária enviada por e-mail
2. **Primeiro acesso** → troca obrigatória de senha
3. **Wizard de Inscrição** (5 passos):
   - Passo 1: Unidade FAETEC, nome do diretor, matrícula, cargo
   - Passo 2: Upload comprovante de vínculo (PDF/imagem)
   - Passo 3: Nome da receita + descrição + foto opcional
   - Passo 4: Seleção de ingredientes do Anexo I (Pregão)
   - Passo 5: Aceite LGPD + autorização de uso de imagem
4. **Unicidade**: sistema bloqueia 2ª inscrição pelo mesmo CPF

### Administrador
1. **Visualização** de fichas técnicas (Anexo II)
2. **Habilitação técnica**: Habilitada ✅ ou Eliminada ❌ (com motivo)
3. **Pontuação** (0–50 por critério):
   - Viabilidade de Preparo
   - Criatividade
   - Cultura Regional
   - Alimentos In Natura
4. **Ranking automático** com desempate:
   1º In Natura → 2º Viabilidade → 3º Criatividade → 4º Regional
5. **Convocação** para 2ª fase com data, local e envio automático de e-mail

---

## 🔐 Segurança

- Senhas hasheadas com **BCrypt**
- Autenticação via **JWT** (HS256, expiração 8h)
- Validação de **CPF** pelo algoritmo oficial
- Upload restrito a `.pdf`, `.jpg`, `.jpeg`, `.png`
- Sanitização de arquivos por MIME type + extensão
- **LGPD**: termo explícito na inscrição
- CORS configurado via variáveis de ambiente

---

## 🌱 Ingredientes (Seed Automático)

O sistema popula automaticamente o banco com os ingredientes do Anexo I agrupados por categoria:

- Grãos e Cereais
- Proteínas Animais
- Hortaliças — In Natura
- Frutas — In Natura
- Laticínios e Derivados
- Temperos e Condimentos
- Leguminosas

---

## 🗃️ Banco de Dados

O `Program.cs` cria as tabelas automaticamente via `EnsureCreated()` ao subir o container.

Para migrations manuais:

```bash
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## 🐳 Infraestrutura

Três containers orquestrados via Docker Compose:

| Container | Imagem | Função |
|-----------|--------|--------|
| `merendachef_db` | postgres:16-alpine | Banco de dados |
| `merendachef_api` | ASP.NET Core 8 | API REST |
| `merendachef_web` | nginx:alpine | Frontend React |
