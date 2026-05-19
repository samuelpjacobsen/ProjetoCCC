import { Router, Request, Response } from "express";
import pool from "../database/connection.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM tutores ORDER BY nome ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro listando tutores:", error);
    res.status(500).json({ error: "Erro ao carregar tutores" });
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
    console.error("Falha ao salvar tutor:", error);
    res.status(500).json({ error: "Erro ao criar tutor" });
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
    console.error("Erro atualizando tutor:", error);
    res.status(500).json({ error: "Falha ao atualizar tutor" });
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
    console.error("Erro ao excluir tutor:", error);
    res.status(500).json({ error: "Não foi possível excluir o tutor" });
  }
});

export default router;
