import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { aula_id, oficina_id } = req.query;

  if (!aula_id) {
    res.status(400).json({ error: "aula_id é obrigatório" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT p.*, m.aluno_id, a.nome AS aluno_nome
       FROM presencas p
       JOIN matriculas m ON m.id = p.matricula_id
       JOIN alunos a ON a.id = m.aluno_id
       WHERE p.aula_id = $1
       ORDER BY a.nome ASC`,
      [aula_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar presenças:", error);
    res.status(500).json({ error: "Falha ao carregar presenças" });
  }
});

router.post("/toggle", async (req: Request, res: Response) => {
  const { matricula_id, aula_id, presente } = req.body;

  if (!matricula_id || !aula_id || typeof presente !== "boolean") {
    res.status(400).json({ error: "matricula_id, aula_id e presente são obrigatórios" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO presencas (matricula_id, aula_id, presente)
       VALUES ($1, $2, $3)
       ON CONFLICT (matricula_id, aula_id)
       DO UPDATE SET presente = $3
       RETURNING *`,
      [matricula_id, aula_id, presente]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao registrar presença:", error);
    res.status(500).json({ error: "Erro ao registrar presença" });
  }
});

router.get("/stats", async (req: Request, res: Response) => {
  const { oficina_id } = req.query;

  if (!oficina_id) {
    res.status(400).json({ error: "oficina_id é obrigatório" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT ms.*, a.nome AS aluno_nome
       FROM matriculas_stats ms
       JOIN alunos a ON a.id = ms.aluno_id
       WHERE ms.oficina_id = $1
       ORDER BY a.nome ASC`,
      [oficina_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.post("/recalcular", async (req: Request, res: Response) => {
  const { oficina_id } = req.body;

  if (!oficina_id) {
    res.status(400).json({ error: "oficina_id é obrigatório" });
    return;
  }

  try {
    const stats = await pool.query(
      "SELECT * FROM matriculas_stats WHERE oficina_id = $1",
      [oficina_id]
    );

    let aprovados = 0;
    let reprovados = 0;

    for (const row of stats.rows) {
      let newStatus: string;

      if (row.total_aulas === 0 || row.total_aulas === "0") {
        newStatus = "ativa";
      } else if (parseFloat(row.percentual_presenca) >= 75) {
        newStatus = "aprovado";
        aprovados++;
      } else {
        newStatus = "reprovado";
        reprovados++;
      }

      await pool.query(
        "UPDATE matriculas SET status = $1, updated_at = NOW() WHERE id = $2",
        [newStatus, row.matricula_id]
      );
    }

    res.json({
      message: "Aprovação recalculada com sucesso",
      aprovados,
      reprovados,
      total: stats.rows.length,
    });
  } catch (error) {
    console.error("Erro ao recalcular aprovação:", error);
    res.status(500).json({ error: "Erro ao recalcular aprovação" });
  }
});

export default router;
