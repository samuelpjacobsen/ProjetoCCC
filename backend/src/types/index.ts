export type AppRole = "admin" | "professor";
export type OficinaStatus = "planejada" | "em_andamento" | "concluida" | "cancelada";
export type MatriculaStatus = "ativa" | "aprovado" | "reprovado" | "desistente";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  ra: string | null;
  data_nascimento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tutor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  area_atuacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Oficina {
  id: string;
  nome: string;
  descricao: string | null;
  professor_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  vagas: number;
  status: OficinaStatus;
  created_at: string;
  updated_at: string;
}

export interface Aula {
  id: string;
  oficina_id: string;
  data: string;
  topico: string | null;
  created_at: string;
}

export interface Matricula {
  id: string;
  aluno_id: string;
  oficina_id: string;
  status: MatriculaStatus;
  created_at: string;
  updated_at: string;
}

export interface Presenca {
  id: string;
  matricula_id: string;
  aula_id: string;
  presente: boolean;
  created_at: string;
}

export interface MatriculaStats {
  matricula_id: string;
  aluno_id: string;
  oficina_id: string;
  status: MatriculaStatus;
  total_aulas: number;
  presencas: number;
  percentual_presenca: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: AppRole;
}
