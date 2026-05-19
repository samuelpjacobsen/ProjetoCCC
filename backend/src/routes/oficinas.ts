import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
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
      LEFT JOIN tutores t ON t.id = ot.tutor_id
      GROUP BY o.id, p.nome
      ORDER BY o.created_at DESC
    `);

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
      LEFT JOIN tutores t ON t.id = ot.tutor_id
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

router.post("/", async (req: Request, res: Response) => {
  const { nome, descricao, professor_id, tutor_ids, data_inicio, data_fim, vagas, status } = req.body;

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
      [nome, descricao || null, professor_id || null, data_inicio || null, data_fim || null, vagas || 20, status || "planejada"]
    );

    const oficina = result.rows[0];

    if (tutor_ids && Array.isArray(tutor_ids)) {
      const limitedTutors = tutor_ids.slice(0, 2);
      for (const tutorId of limitedTutors) {
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

router.put("/:id", async (req: Request, res: Response) => {
  const { nome, descricao, professor_id, tutor_ids, data_inicio, data_fim, vagas, status } = req.body;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE oficinas SET nome = $1, descricao = $2, professor_id = $3,
       data_inicio = $4, data_fim = $5, vagas = $6, status = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [nome, descricao || null, professor_id || null, data_inicio || null, data_fim || null, vagas || 20, status || "planejada", req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Oficina não encontrada" });
      return;
    }

    await client.query("DELETE FROM oficina_tutores WHERE oficina_id = $1", [req.params.id]);

    if (tutor_ids && Array.isArray(tutor_ids)) {
      const limitedTutors = tutor_ids.slice(0, 2);
      for (const tutorId of limitedTutors) {
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

router.delete("/:id", async (req: Request, res: Response) => {
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
