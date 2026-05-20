import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

app.get("/api/docs/swagger.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.get("/api/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>API Oficina ELLP</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>body{margin:0} .topbar{display:none}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/swagger.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>`);
});

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
