import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { oficina_id } = req.query;

    let query = `
      SELECT m.*, a.nome AS aluno_nome, o.nome AS oficina_nome
      FROM matriculas m
      JOIN alunos a ON a.id = m.aluno_id
      JOIN oficinas o ON o.id = m.oficina_id
    `;
    const params: string[] = [];

    if (oficina_id) {
      query += " WHERE m.oficina_id = $1";
      params.push(oficina_id as string);
    }

    query += " ORDER BY m.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro listando matriculas:", error);
    res.status(500).json({ error: "Erro ao carregar matrículas" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { aluno_id, oficina_id } = req.body;

  if (!aluno_id || !oficina_id) {
    res.status(400).json({ error: "Aluno e oficina são obrigatórios" });
    return;
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM matriculas WHERE aluno_id = $1 AND oficina_id = $2",
      [aluno_id, oficina_id]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Aluno já está matriculado nesta oficina" });
      return;
    }

    const result = await pool.query(
      "INSERT INTO matriculas (aluno_id, oficina_id) VALUES ($1, $2) RETURNING *",
      [aluno_id, oficina_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Falha ao matricular aluno:", error);
    res.status(500).json({ error: "Não foi possível realizar a matrícula" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM matriculas WHERE id = $1 RETURNING id", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Matrícula não encontrada" });
      return;
    }

    res.json({ message: "Matrícula removida com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar matricula:", error);
    res.status(500).json({ error: "Erro ao excluir matrícula" });
  }
});

export default router;
