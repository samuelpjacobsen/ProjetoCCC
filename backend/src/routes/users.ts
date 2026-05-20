import { Router, Request, Response } from "express";
import pool from "../database/connection.js";
import { adminOnly } from "../middleware/auth.js";
import type { JwtPayload } from "../types/index.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const roleFilter = req.query.role as string | undefined;
    let query = `
      SELECT p.id, p.nome, p.email,
        COALESCE(ur.role, 'pendente') AS role
      FROM profiles p
      LEFT JOIN user_roles ur ON ur.user_id = p.id
    `;
    const params: string[] = [];

    if (roleFilter) {
      query += ` WHERE ur.role = $1`;
      params.push(roleFilter);
    }

    query += ` ORDER BY p.nome ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

router.put("/:id/role", adminOnly, async (req: Request, res: Response) => {
  const currentUser = (req as any).user as JwtPayload;
  const { role } = req.body;
  const targetId = req.params.id;

  const validRoles = ["admin", "professor", "tutor"];
  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ error: "Papel inválido. Use: admin, professor ou tutor" });
    return;
  }

  if (currentUser.userId === targetId && role !== "admin") {
    res.status(400).json({ error: "Você não pode remover seu próprio papel de admin" });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM user_roles WHERE user_id = $1", [targetId]);

    if (existing.rows.length > 0) {
      await pool.query("UPDATE user_roles SET role = $1 WHERE user_id = $2", [role, targetId]);
    } else {
      await pool.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [targetId, role]);
    }

    res.json({ message: `Papel alterado para ${role}` });
  } catch (error) {
    console.error("Erro ao alterar papel:", error);
    res.status(500).json({ error: "Erro ao alterar papel do usuário" });
  }
});

export default router;
