import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import alunosRoutes from "./routes/alunos.js";
import tutoresRoutes from "./routes/tutores.js";
import oficinasRoutes from "./routes/oficinas.js";
import matriculasRoutes from "./routes/matriculas.js";
import aulasRoutes from "./routes/aulas.js";
import presencasRoutes from "./routes/presencas.js";
import relatoriosRoutes from "./routes/relatorios.js";
import usersRoutes from "./routes/users.js";
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/alunos", authMiddleware, alunosRoutes);
app.use("/api/tutores", authMiddleware, tutoresRoutes);
app.use("/api/oficinas", authMiddleware, oficinasRoutes);
app.use("/api/matriculas", authMiddleware, matriculasRoutes);
app.use("/api/aulas", authMiddleware, aulasRoutes);
app.use("/api/presencas", authMiddleware, presencasRoutes);
app.use("/api/relatorios", authMiddleware, relatoriosRoutes);
app.use("/api/users", authMiddleware, usersRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export { authMiddleware };
export default app;
