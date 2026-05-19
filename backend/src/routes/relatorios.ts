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
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const [alunos, oficinas, matriculas, presenca, porOficina] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM alunos"),
      pool.query("SELECT COUNT(*) FROM oficinas WHERE status IN ('planejada', 'em_andamento')"),
      pool.query("SELECT COUNT(*) FROM matriculas WHERE status = 'ativa'"),
      pool.query("SELECT COALESCE(AVG(percentual_presenca), 0) AS media FROM matriculas_stats"),
      pool.query(`
        SELECT
          o.id, o.nome, o.status,
          COUNT(DISTINCT m.id) AS total_matriculas,
          COUNT(DISTINCT a.id) AS total_aulas,
          COALESCE(ROUND(AVG(ms.percentual_presenca)::numeric, 1), 0) AS media_presenca
        FROM oficinas o
        LEFT JOIN matriculas m ON m.oficina_id = o.id AND m.status = 'ativa'
        LEFT JOIN aulas a ON a.oficina_id = o.id
        LEFT JOIN matriculas_stats ms ON ms.oficina_id = o.id
        WHERE o.status IN ('planejada', 'em_andamento')
        GROUP BY o.id, o.nome, o.status
        ORDER BY o.nome ASC
      `),
    ]);

    res.json({
      total_alunos: parseInt(alunos.rows[0].count),
      oficinas_ativas: parseInt(oficinas.rows[0].count),
      matriculas_ativas: parseInt(matriculas.rows[0].count),
      media_presenca: parseFloat(parseFloat(presenca.rows[0].media).toFixed(1)),
      por_oficina: porOficina.rows.map((r: any) => ({
        id: r.id,
        nome: r.nome,
        status: r.status,
        total_matriculas: parseInt(r.total_matriculas),
        total_aulas: parseInt(r.total_aulas),
        media_presenca: parseFloat(r.media_presenca),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    res.status(500).json({ error: "Falha ao carregar dados do dashboard" });
  }
});

export default router;
