import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { oficina_id } = req.query;

  if (!oficina_id) {
    res.status(400).json({ error: "oficina_id é obrigatório" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT * FROM aulas WHERE oficina_id = $1 ORDER BY data ASC",
      [oficina_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar aulas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { oficina_id, data, topico } = req.body;

  if (!oficina_id || !data) {
    res.status(400).json({ error: "Oficina e data são obrigatórios" });
    return;
  }

  try {
    const result = await pool.query(
      "INSERT INTO aulas (oficina_id, data, topico) VALUES ($1, $2, $3) RETURNING *",
      [oficina_id, data, topico || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar aula:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM aulas WHERE id = $1 RETURNING id", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Aula não encontrada" });
      return;
    }

    res.json({ message: "Aula removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover aula:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
