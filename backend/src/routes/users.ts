import { Router, Request, Response } from "express";
import pool from "../database/connection.js";
import type { JwtPayload } from "../types/index.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nome, p.email,
        COALESCE(ur.role, 'professor') AS role
      FROM profiles p
      LEFT JOIN user_roles ur ON ur.user_id = p.id
      ORDER BY p.nome ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/:id/promote", async (req: Request, res: Response) => {
  const currentUser = (req as any).user as JwtPayload;

  if (currentUser.role !== "admin") {
    res.status(403).json({ error: "Acesso restrito a administradores" });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [req.params.id]
    );

    res.json({ message: "Usuário promovido a administrador" });
  } catch (error) {
    console.error("Erro ao promover usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/:id/demote", async (req: Request, res: Response) => {
  const currentUser = (req as any).user as JwtPayload;

  if (currentUser.role !== "admin") {
    res.status(403).json({ error: "Acesso restrito a administradores" });
    return;
  }

  if (currentUser.userId === req.params.id) {
    res.status(400).json({ error: "Você não pode remover seu próprio papel de admin" });
    return;
  }

  try {
    await pool.query(
      "DELETE FROM user_roles WHERE user_id = $1 AND role = 'admin'",
      [req.params.id]
    );

    res.json({ message: "Papel de administrador removido" });
  } catch (error) {
    console.error("Erro ao rebaixar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
