import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import authRoutes from "./routes/auth.js";
import alunosRoutes from "./routes/alunos.js";
import oficinasRoutes from "./routes/oficinas.js";
import matriculasRoutes from "./routes/matriculas.js";
import aulasRoutes from "./routes/aulas.js";
import presencasRoutes from "./routes/presencas.js";
import relatoriosRoutes from "./routes/relatorios.js";
import usersRoutes from "./routes/users.js";
import { authMiddleware, rejectPendente, roleMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "API Oficina ELLP",
  customCss: ".swagger-ui .topbar { display: none }",
}));

app.use("/api/auth", authRoutes);
app.use("/api/alunos", authMiddleware, rejectPendente, roleMiddleware("admin", "professor"), alunosRoutes);
app.use("/api/oficinas", authMiddleware, rejectPendente, oficinasRoutes);
app.use("/api/matriculas", authMiddleware, rejectPendente, roleMiddleware("admin", "professor"), matriculasRoutes);
app.use("/api/aulas", authMiddleware, rejectPendente, roleMiddleware("admin", "professor"), aulasRoutes);
app.use("/api/presencas", authMiddleware, rejectPendente, presencasRoutes);
app.use("/api/relatorios", authMiddleware, rejectPendente, relatoriosRoutes);
app.use("/api/users", authMiddleware, usersRoutes);

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export { authMiddleware, rejectPendente, roleMiddleware };
export default app;
