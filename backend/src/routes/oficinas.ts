import { Router, Request, Response } from "express";
import pool from "../database/connection.js";
import { roleMiddleware } from "../middleware/auth.js";
import type { JwtPayload } from "../types/index.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;

  try {
    let whereClause = "";
    const params: string[] = [];

    if (user.role === "professor") {
      whereClause = "WHERE o.professor_id = $1";
      params.push(user.userId);
    } else if (user.role === "tutor") {
      whereClause = "WHERE o.id IN (SELECT oficina_id FROM oficina_tutores WHERE tutor_id = $1)";
      params.push(user.userId);
    }

    const oficinas = await pool.query(`
      SELECT o.*,
        p.nome AS professor_nome,
        COALESCE(
          json_agg(json_build_object('id', t.id, 'nome', t.nome))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tutores
      FROM oficinas o
      LEFT JOIN profiles p ON p.id = o.professor_id
      LEFT JOIN oficina_tutores ot ON ot.oficina_id = o.id
      LEFT JOIN profiles t ON t.id = ot.tutor_id
      ${whereClause}
      GROUP BY o.id, p.nome
      ORDER BY o.created_at DESC
    `, params);

    res.json(oficinas.rows);
  } catch (error) {
    console.error("Erro carregando oficinas:", error);
    res.status(500).json({ error: "Falha ao listar oficinas" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT o.*,
        p.nome AS professor_nome,
        COALESCE(
          json_agg(json_build_object('id', t.id, 'nome', t.nome))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tutores
      FROM oficinas o
      LEFT JOIN profiles p ON p.id = o.professor_id
      LEFT JOIN oficina_tutores ot ON ot.oficina_id = o.id
      LEFT JOIN profiles t ON t.id = ot.tutor_id
      WHERE o.id = $1
      GROUP BY o.id, p.nome
    `, [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Oficina não encontrada" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Oficina nao encontrada ou erro:", error);
    res.status(500).json({ error: "Erro ao buscar oficina" });
  }
});

router.post("/", roleMiddleware("admin", "professor", "tutor"), async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  const { nome, descricao, tutor_ids, data_inicio, data_fim, vagas, status } = req.body;
  const professor_id = req.body.professor_id || null;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO oficinas (nome, descricao, professor_id, data_inicio, data_fim, vagas, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nome, descricao || null, professor_id, data_inicio || null, data_fim || null, vagas || 20, status || "planejada"]
    );

    const oficina = result.rows[0];

    if (tutor_ids && Array.isArray(tutor_ids)) {
      for (const tutorId of tutor_ids.slice(0, 5)) {
        await client.query(
          "INSERT INTO oficina_tutores (oficina_id, tutor_id) VALUES ($1, $2)",
          [oficina.id, tutorId]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json(oficina);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Falha ao criar oficina:", error);
    res.status(500).json({ error: "Não foi possível criar a oficina" });
  } finally {
    client.release();
  }
});

router.put("/:id", roleMiddleware("admin", "professor", "tutor"), async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  const { nome, descricao, tutor_ids, data_inicio, data_fim, vagas, status } = req.body;
  const professor_id = req.body.professor_id || null;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  if (user.role === "professor") {
    const check = await pool.query("SELECT professor_id FROM oficinas WHERE id = $1", [req.params.id]);
    if (check.rows.length === 0 || check.rows[0].professor_id !== user.userId) {
      res.status(403).json({ error: "Você só pode editar suas próprias oficinas" });
      return;
    }
  }

  if (user.role === "tutor") {
    const check = await pool.query(
      "SELECT id FROM oficina_tutores WHERE oficina_id = $1 AND tutor_id = $2",
      [req.params.id, user.userId]
    );
    if (check.rows.length === 0) {
      res.status(403).json({ error: "Você só pode editar oficinas das quais participa" });
      return;
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE oficinas SET nome = $1, descricao = $2, professor_id = $3,
       data_inicio = $4, data_fim = $5, vagas = $6, status = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [nome, descricao || null, professor_id, data_inicio || null, data_fim || null, vagas || 20, status || "planejada", req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Oficina não encontrada" });
      return;
    }

    await client.query("DELETE FROM oficina_tutores WHERE oficina_id = $1", [req.params.id]);

    if (tutor_ids && Array.isArray(tutor_ids)) {
      for (const tutorId of tutor_ids.slice(0, 5)) {
        await client.query(
          "INSERT INTO oficina_tutores (oficina_id, tutor_id) VALUES ($1, $2)",
          [req.params.id, tutorId]
        );
      }
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro no update da oficina:", error);
    res.status(500).json({ error: "Erro ao salvar alterações da oficina" });
  } finally {
    client.release();
  }
});

router.delete("/:id", roleMiddleware("admin", "professor", "tutor"), async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;

  if (user.role === "professor") {
    const check = await pool.query("SELECT professor_id FROM oficinas WHERE id = $1", [req.params.id]);
    if (check.rows.length === 0 || check.rows[0].professor_id !== user.userId) {
      res.status(403).json({ error: "Você só pode remover suas próprias oficinas" });
      return;
    }
  }

  if (user.role === "tutor") {
    const check = await pool.query(
      "SELECT id FROM oficina_tutores WHERE oficina_id = $1 AND tutor_id = $2",
      [req.params.id, user.userId]
    );
    if (check.rows.length === 0) {
      res.status(403).json({ error: "Você só pode remover oficinas das quais participa" });
      return;
    }
  }

  try {
    const result = await pool.query("DELETE FROM oficinas WHERE id = $1 RETURNING id", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Oficina não encontrada" });
      return;
    }

    res.json({ message: "Oficina removida com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar oficina:", error);
    res.status(500).json({ error: "Erro ao remover oficina" });
  }
});

export default router;
