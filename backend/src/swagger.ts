import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Oficina ELLP",
      version: "1.0.0",
      description: "API do Sistema de Controle de Oficinas de Programacao — Projeto ELLP (UTFPR-CP)",
    },
    servers: [
      { url: "/api", description: "API Base" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nome: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "professor", "tutor", "pendente"] },
          },
        },
        Aluno: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nome: { type: "string" },
            email: { type: "string" },
            telefone: { type: "string" },
            ra: { type: "string" },
            data_nascimento: { type: "string", format: "date" },
            observacoes: { type: "string" },
          },
        },
        Oficina: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nome: { type: "string" },
            descricao: { type: "string" },
            professor_id: { type: "string", format: "uuid" },
            professor_nome: { type: "string" },
            tutores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  nome: { type: "string" },
                },
              },
            },
            data_inicio: { type: "string", format: "date" },
            data_fim: { type: "string", format: "date" },
            vagas: { type: "integer" },
            status: { type: "string", enum: ["planejada", "em_andamento", "concluida", "cancelada"] },
          },
        },
        Aula: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            oficina_id: { type: "string", format: "uuid" },
            data: { type: "string", format: "date" },
            topico: { type: "string" },
          },
        },
        Matricula: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            aluno_id: { type: "string", format: "uuid" },
            aluno_nome: { type: "string" },
            oficina_id: { type: "string", format: "uuid" },
            oficina_nome: { type: "string" },
            status: { type: "string", enum: ["ativa", "aprovado", "reprovado", "desistente"] },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Autenticacao"],
          summary: "Cadastrar novo usuario",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nome", "email", "senha"],
                  properties: {
                    nome: { type: "string", minLength: 1 },
                    email: { type: "string", format: "email" },
                    senha: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Usuario criado. Primeiro usuario = admin, demais = pendente" },
            "409": { description: "Email ja cadastrado" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Autenticacao"],
          summary: "Login",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "senha"],
                  properties: {
                    email: { type: "string", format: "email" },
                    senha: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Token JWT e dados do usuario" },
            "401": { description: "Credenciais invalidas" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Autenticacao"],
          summary: "Dados do usuario autenticado",
          responses: {
            "200": { description: "Perfil do usuario", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          },
        },
      },
      "/users": {
        get: {
          tags: ["Usuarios"],
          summary: "Listar usuarios",
          parameters: [
            { name: "role", in: "query", schema: { type: "string", enum: ["admin", "professor", "tutor", "pendente"] }, description: "Filtrar por papel" },
          ],
          responses: {
            "200": { description: "Lista de usuarios", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
          },
        },
      },
      "/users/{id}/role": {
        put: {
          tags: ["Usuarios"],
          summary: "Alterar papel do usuario (admin only)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["role"],
                  properties: { role: { type: "string", enum: ["admin", "professor", "tutor"] } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Papel alterado" },
            "403": { description: "Acesso restrito a administradores" },
          },
        },
      },
      "/alunos": {
        get: {
          tags: ["Alunos"],
          summary: "Listar alunos",
          parameters: [{ name: "search", in: "query", schema: { type: "string" }, description: "Busca por nome" }],
          responses: { "200": { description: "Lista de alunos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Aluno" } } } } } },
        },
        post: {
          tags: ["Alunos"],
          summary: "Cadastrar aluno",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["nome"], properties: { nome: { type: "string" }, email: { type: "string" }, telefone: { type: "string" }, ra: { type: "string" }, data_nascimento: { type: "string", format: "date" }, observacoes: { type: "string" } } } } },
          },
          responses: { "201": { description: "Aluno criado" } },
        },
      },
      "/alunos/{id}": {
        get: {
          tags: ["Alunos"],
          summary: "Buscar aluno por ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Dados do aluno" }, "404": { description: "Aluno nao encontrado" } },
        },
        put: {
          tags: ["Alunos"],
          summary: "Atualizar aluno",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["nome"], properties: { nome: { type: "string" }, email: { type: "string" }, telefone: { type: "string" }, ra: { type: "string" }, data_nascimento: { type: "string", format: "date" }, observacoes: { type: "string" } } } } } },
          responses: { "200": { description: "Aluno atualizado" } },
        },
        delete: {
          tags: ["Alunos"],
          summary: "Remover aluno",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Aluno removido" } },
        },
      },
      "/oficinas": {
        get: {
          tags: ["Oficinas"],
          summary: "Listar oficinas (filtrado por papel do usuario)",
          responses: { "200": { description: "Lista de oficinas", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Oficina" } } } } } },
        },
        post: {
          tags: ["Oficinas"],
          summary: "Criar oficina (admin/professor)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["nome"], properties: { nome: { type: "string" }, descricao: { type: "string" }, professor_id: { type: "string", format: "uuid" }, tutor_ids: { type: "array", items: { type: "string", format: "uuid" } }, data_inicio: { type: "string", format: "date" }, data_fim: { type: "string", format: "date" }, vagas: { type: "integer" }, status: { type: "string", enum: ["planejada", "em_andamento", "concluida", "cancelada"] } } } } },
          },
          responses: { "201": { description: "Oficina criada" } },
        },
      },
      "/oficinas/{id}": {
        get: {
          tags: ["Oficinas"],
          summary: "Buscar oficina por ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Dados da oficina" } },
        },
        put: {
          tags: ["Oficinas"],
          summary: "Atualizar oficina (admin/professor dono)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["nome"], properties: { nome: { type: "string" }, descricao: { type: "string" }, professor_id: { type: "string", format: "uuid" }, tutor_ids: { type: "array", items: { type: "string", format: "uuid" } }, data_inicio: { type: "string", format: "date" }, data_fim: { type: "string", format: "date" }, vagas: { type: "integer" }, status: { type: "string" } } } } } },
          responses: { "200": { description: "Oficina atualizada" }, "403": { description: "Sem permissao" } },
        },
        delete: {
          tags: ["Oficinas"],
          summary: "Remover oficina (admin/professor dono)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Oficina removida" } },
        },
      },
      "/matriculas": {
        get: {
          tags: ["Matriculas"],
          summary: "Listar matriculas",
          parameters: [{ name: "oficina_id", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por oficina" }],
          responses: { "200": { description: "Lista de matriculas" } },
        },
        post: {
          tags: ["Matriculas"],
          summary: "Matricular aluno em oficina",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["aluno_id", "oficina_id"], properties: { aluno_id: { type: "string", format: "uuid" }, oficina_id: { type: "string", format: "uuid" } } } } } },
          responses: { "201": { description: "Matricula criada" }, "409": { description: "Aluno ja matriculado" } },
        },
      },
      "/matriculas/{id}": {
        delete: {
          tags: ["Matriculas"],
          summary: "Remover matricula",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Matricula removida" } },
        },
      },
      "/aulas": {
        get: {
          tags: ["Aulas"],
          summary: "Listar aulas de uma oficina",
          parameters: [{ name: "oficina_id", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Lista de aulas" } },
        },
        post: {
          tags: ["Aulas"],
          summary: "Criar aula",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["oficina_id", "data"], properties: { oficina_id: { type: "string", format: "uuid" }, data: { type: "string", format: "date" }, topico: { type: "string" } } } } } },
          responses: { "201": { description: "Aula criada" } },
        },
      },
      "/aulas/{id}": {
        delete: {
          tags: ["Aulas"],
          summary: "Remover aula",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Aula removida" } },
        },
      },
      "/presencas": {
        get: {
          tags: ["Presencas"],
          summary: "Listar presencas de uma aula",
          parameters: [{ name: "aula_id", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Lista de presencas" } },
        },
      },
      "/presencas/toggle": {
        post: {
          tags: ["Presencas"],
          summary: "Registrar/alterar presenca",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["matricula_id", "aula_id", "presente"], properties: { matricula_id: { type: "string", format: "uuid" }, aula_id: { type: "string", format: "uuid" }, presente: { type: "boolean" } } } } } },
          responses: { "200": { description: "Presenca registrada" } },
        },
      },
      "/presencas/stats": {
        get: {
          tags: ["Presencas"],
          summary: "Estatisticas de presenca por oficina",
          parameters: [{ name: "oficina_id", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Estatisticas de frequencia" } },
        },
      },
      "/presencas/recalcular": {
        post: {
          tags: ["Presencas"],
          summary: "Recalcular aprovacao (admin/professor)",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["oficina_id"], properties: { oficina_id: { type: "string", format: "uuid" } } } } } },
          responses: { "200": { description: "Aprovacao recalculada" } },
        },
      },
      "/relatorios": {
        get: {
          tags: ["Relatorios"],
          summary: "Relatorio de frequencia e aprovacao",
          parameters: [{ name: "oficina_id", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por oficina" }],
          responses: { "200": { description: "Dados do relatorio" } },
        },
      },
      "/relatorios/dashboard": {
        get: {
          tags: ["Relatorios"],
          summary: "Dashboard com metricas gerais",
          responses: { "200": { description: "Metricas do sistema" } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
