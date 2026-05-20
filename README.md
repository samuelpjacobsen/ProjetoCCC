# Oficina ELLP

Sistema de gestao de oficinas de programacao do projeto ELLP (Ensino Ludico de Logica e Programacao) da UTFPR-CP.

Controla o ciclo completo: cadastro de alunos, criacao de oficinas, matriculas, registro de presenca por aula e relatorios de frequencia com calculo automatico de aprovacao (75%).

**Autor:** Samuel Jacobsen
**Disciplina:** Certificadora Comum

---

## Arquitetura

Monorepo com frontend e backend separados, ambos deployados na Vercel via GitHub Actions.

```
┌──────────────────────────────────────────────────────┐
│                      Vercel                          │
│                                                      │
│   ┌─────────────┐          ┌──────────────────┐      │
│   │   Frontend   │  fetch   │     Backend      │      │
│   │   Next.js    │────────> │  Express API     │      │
│   │   React 19   │  JSON    │  Serverless Fn   │      │
│   │   Tailwind   │ <────── │  /api/*           │      │
│   └─────────────┘          └────────┬─────────┘      │
│                                     │                │
└─────────────────────────────────────┼────────────────┘
                                      │ SQL
                                      ▼
                              ┌──────────────┐
                              │  PostgreSQL   │
                              │  (Supabase /  │
                              │   Docker)     │
                              └──────────────┘
```

### Frontend

- **Next.js 16** com App Router e React 19
- **shadcn/ui** + Tailwind CSS 4 para componentes
- **Recharts** para graficos no dashboard e relatorios
- Autenticacao via JWT armazenado no localStorage
- Rotas protegidas por role no layout

### Backend

- **Express** rodando como Serverless Function na Vercel
- **PostgreSQL** via `pg` (node-postgres)
- Autenticacao com **JWT** + hash de senha com **bcrypt**
- Migrations manuais em SQL puro
- Documentacao da API com **Swagger** em `/api/docs`

### Banco de Dados

Tabelas principais: `profiles`, `user_roles`, `alunos`, `oficinas`, `oficina_tutores`, `aulas`, `matriculas`, `presencas`.

View materializada `matriculas_stats` calcula frequencia por aluno/oficina.

### CI/CD

GitHub Actions faz deploy automatico na Vercel a cada push na `main`. Frontend e backend deployam em paralelo como projetos separados.

---

## Controle de Acesso

| Papel     | Permissoes                                                       |
| --------- | ---------------------------------------------------------------- |
| Admin     | Acesso total + gerenciamento de cargos                           |
| Professor | CRUD completo (oficinas, alunos, matriculas, presenca)           |
| Tutor     | Mesmo que professor (edita oficinas que participa)               |
| Pendente  | Sem acesso ate aprovacao por admin                               |

---

## Rodando local

**Banco:**

```bash
docker compose up -d
```

**Backend:**

```bash
cd backend
cp .env.example .env   # ajustar DATABASE_URL e JWT_SECRET
npm install
npm run migrate
npm run dev             # http://localhost:3001
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev             # http://localhost:3000
```

O primeiro usuario registrado recebe papel de admin automaticamente.

---

## Variaveis de ambiente

### Backend (`.env`)

| Variavel       | Descricao                          |
| -------------- | ---------------------------------- |
| `PORT`         | Porta do servidor (default: 3001)  |
| `DATABASE_URL` | Connection string do PostgreSQL    |
| `JWT_SECRET`   | Chave secreta para assinar tokens  |

### Frontend

| Variavel               | Descricao                          |
| ---------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`  | URL base da API (default: localhost:3001/api) |

---

## Endpoints principais

A documentacao completa esta disponivel em `/api/docs` (Swagger UI).

| Metodo | Rota                  | Descricao                    |
| ------ | --------------------- | ---------------------------- |
| POST   | `/api/auth/register`  | Cadastro de usuario          |
| POST   | `/api/auth/login`     | Login (retorna JWT)          |
| GET    | `/api/oficinas`       | Listar oficinas              |
| GET    | `/api/alunos`         | Listar alunos                |
| POST   | `/api/matriculas`     | Matricular aluno em oficina  |
| POST   | `/api/presencas/toggle` | Registrar presenca         |
| GET    | `/api/presencas/stats`  | Estatisticas de frequencia |
| GET    | `/api/relatorios`       | Relatorio geral            |
