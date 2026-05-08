import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { oficina_id } = req.query;

  try {
    let query = `
      SELECT ms.*, a.nome AS aluno_nome, o.nome AS oficina_nome
      FROM matriculas_stats ms
      JOIN alunos a ON a.id = ms.aluno_id
      JOIN oficinas o ON o.id = ms.oficina_id
    `;
    const params: string[] = [];

    if (oficina_id) {
      query += " WHERE ms.oficina_id = $1";
      params.push(oficina_id as string);
    }

    query += " ORDER BY o.nome ASC, a.nome ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const [alunos, oficinas, matriculas, presenca] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM alunos"),
      pool.query("SELECT COUNT(*) FROM oficinas WHERE status IN ('planejada', 'em_andamento')"),
      pool.query("SELECT COUNT(*) FROM matriculas WHERE status = 'ativa'"),
      pool.query("SELECT COALESCE(AVG(percentual_presenca), 0) AS media FROM matriculas_stats"),
    ]);

    res.json({
      total_alunos: parseInt(alunos.rows[0].count),
      oficinas_ativas: parseInt(oficinas.rows[0].count),
      matriculas_ativas: parseInt(matriculas.rows[0].count),
      media_presenca: parseFloat(parseFloat(presenca.rows[0].media).toFixed(1)),
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
