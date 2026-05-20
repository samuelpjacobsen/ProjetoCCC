import pool from "./connection.js";

const migration = `
  DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'professor', 'tutor', 'pendente');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    CREATE TYPE oficina_status AS ENUM ('planejada', 'em_andamento', 'concluida', 'cancelada');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    CREATE TYPE matricula_status AS ENUM ('ativa', 'aprovado', 'reprovado', 'desistente');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'professor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
  );

  CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ra VARCHAR(50),
    data_nascimento DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS oficinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    professor_id UUID REFERENCES profiles(id),
    data_inicio DATE,
    data_fim DATE,
    vagas INTEGER DEFAULT 20,
    status oficina_status DEFAULT 'planejada',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS oficina_tutores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oficina_id UUID NOT NULL REFERENCES oficinas(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(oficina_id, tutor_id)
  );

  CREATE TABLE IF NOT EXISTS aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oficina_id UUID NOT NULL REFERENCES oficinas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    topico VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    oficina_id UUID NOT NULL REFERENCES oficinas(id) ON DELETE CASCADE,
    status matricula_status DEFAULT 'ativa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aluno_id, oficina_id)
  );

  CREATE TABLE IF NOT EXISTS presencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(matricula_id, aula_id)
  );

  CREATE OR REPLACE VIEW matriculas_stats AS
  SELECT
    m.id AS matricula_id,
    m.aluno_id,
    m.oficina_id,
    m.status,
    COUNT(a.id) AS total_aulas,
    COUNT(CASE WHEN p.presente = true THEN 1 END) AS presencas,
    CASE
      WHEN COUNT(a.id) = 0 THEN 0
      ELSE ROUND((COUNT(CASE WHEN p.presente = true THEN 1 END)::NUMERIC / COUNT(a.id)) * 100, 1)
    END AS percentual_presenca
  FROM matriculas m
  LEFT JOIN aulas a ON a.oficina_id = m.oficina_id
  LEFT JOIN presencas p ON p.matricula_id = m.id AND p.aula_id = a.id
  GROUP BY m.id, m.aluno_id, m.oficina_id, m.status;
`;

async function runMigration() {
  console.log("Executando migrations...");
  try {
    await pool.query(migration);
    console.log("Migrations executadas com sucesso!");
  } catch (error) {
    console.error("Erro ao executar migrations:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
