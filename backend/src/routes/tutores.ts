import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM tutores ORDER BY nome ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar tutores:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { nome, email, telefone, area_atuacao } = req.body;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO tutores (nome, email, telefone, area_atuacao)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, email || null, telefone || null, area_atuacao || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar tutor:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const { nome, email, telefone, area_atuacao } = req.body;

  if (!nome || nome.length < 2) {
    res.status(400).json({ error: "Nome é obrigatório (mínimo 2 caracteres)" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE tutores SET nome = $1, email = $2, telefone = $3,
       area_atuacao = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [nome, email || null, telefone || null, area_atuacao || null, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tutor não encontrado" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar tutor:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM tutores WHERE id = $1 RETURNING id", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tutor não encontrado" });
      return;
    }

    res.json({ message: "Tutor removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover tutor:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
