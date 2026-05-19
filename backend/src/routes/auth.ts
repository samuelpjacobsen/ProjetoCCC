import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../database/connection.js";
import { generateToken } from "../middleware/auth.js";
import type { AppRole } from "../types/index.js";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
    return;
  }

  if (senha.length < 6) {
    res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM profiles WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email já cadastrado" });
      return;
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      "INSERT INTO profiles (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, hashedPassword]
    );

    const user = result.rows[0];

    const userCount = await pool.query("SELECT COUNT(*) FROM profiles");
    const isFirstUser = parseInt(userCount.rows[0].count) === 1;
    const role: AppRole = isFirstUser ? "admin" : "professor";

    await pool.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [user.id, role]);

    const token = generateToken({ userId: user.id, email: user.email, role });

    res.status(201).json({ user: { id: user.id, nome: user.nome, email: user.email, role }, token });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro no cadastro do usuário" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ error: "Email e senha são obrigatórios" });
    return;
  }

  try {
    const result = await pool.query("SELECT * FROM profiles WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(senha, user.senha);

    if (!validPassword) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const roleResult = await pool.query(
      "SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1",
      [user.id]
    );
    const role: AppRole = roleResult.rows[0]?.role || "professor";

    const token = generateToken({ userId: user.id, email: user.email, role });

    res.json({ user: { id: user.id, nome: user.nome, email: user.email, role }, token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const result = await pool.query(
      "SELECT id, nome, email FROM profiles WHERE id = $1",
      [user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const roleResult = await pool.query(
      "SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1",
      [user.userId]
    );

    res.json({
      ...result.rows[0],
      role: roleResult.rows[0]?.role || "professor",
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

export default router;
