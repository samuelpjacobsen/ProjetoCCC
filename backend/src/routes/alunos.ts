import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM alunos ORDER BY nome ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM alunos WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Aluno não encontrado" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { nome, email, telefone, ra, data_nascimento, observacoes } = req.body;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO alunos (nome, email, telefone, ra, data_nascimento, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nome, email || null, telefone || null, ra || null, data_nascimento || null, observacoes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const { nome, email, telefone, ra, data_nascimento, observacoes } = req.body;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE alunos SET nome = $1, email = $2, telefone = $3, ra = $4,
       data_nascimento = $5, observacoes = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [nome, email || null, telefone || null, ra || null, data_nascimento || null, observacoes || null, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Aluno não encontrado" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM alunos WHERE id = $1 RETURNING id", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Aluno não encontrado" });
      return;
    }

    res.json({ message: "Aluno removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover aluno:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
