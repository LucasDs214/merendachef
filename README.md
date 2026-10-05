# 🍳 MerendaChef

Plataforma web para gestão de concurso culinário: inscrição de candidatos em etapas,
avaliação técnica e ranking automático com critérios de desempate.

> Versão de portfólio, sem credenciais nem dados reais. O sistema original foi desenvolvido
> para a rede FAETEC.

## Funcionalidades

**Candidato**
- Cadastro com CPF validado pelo algoritmo oficial
- Wizard de inscrição em 5 etapas, mobile-first (unidade, comprovante de vínculo, receita, ingredientes, aceite LGPD)
- Bloqueio de segunda inscrição pelo mesmo CPF
- Upload restrito a PDF, JPG e PNG
- Recuperação de senha por e-mail

**Administrador**
- Visualização das fichas técnicas e habilitação técnica (com motivo de eliminação)
- Pontuação por critério: Viabilidade de Preparo, Criatividade, Cultura Regional e Alimentos In Natura
- Ranking automático com desempate: In Natura → Viabilidade → Criatividade → Regional
- Convocação para a 2ª fase com envio de e-mail

## Stack

| Camada | Tecnologias |
|---|---|
| Back-end | ASP.NET Core 8 (C#), Entity Framework Core, PostgreSQL, JWT, BCrypt, MailKit |
| Front-end | React 18, TypeScript, Tailwind CSS, Zustand, Axios |
| Infra | Docker Compose (3 containers: banco, API e nginx) |

## Estrutura

```
backend/    Controllers (Auth, Candidatos, Inscricoes, Admin), Models, Data (EF Core + seed), Services (e-mail)
frontend/   components (wizard, admin), pages, hooks (auth), utils (cliente da API)
infra/      init.sql
```

## Como rodar

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env      # preencha os valores com senhas de teste
docker-compose up --build -d
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3100 |
| API | http://localhost:8181 |
| PostgreSQL | localhost:5433 (somente local) |

O administrador inicial é criado a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env`.
O Swagger só fica disponível com `ASPNETCORE_ENVIRONMENT=Development`.

## Segurança

- Senhas com BCrypt e autenticação JWT (HS256, expiração de 8h)
- Segredos exclusivamente por variáveis de ambiente (`.env` fora do Git)
- Validação de CPF, restrição de tipos de arquivo e CORS configurável por variável de ambiente
- Termo de consentimento LGPD na inscrição

## Próximos passos

- [ ] Testes automatizados (validação de CPF, ranking) e CI com GitHub Actions
- [ ] Migrations do EF Core no lugar de `EnsureCreated()`
- [ ] Acesso autenticado aos arquivos enviados
- [ ] Rate limiting nas rotas de autenticação
- [ ] Modularizar o `App.tsx`
