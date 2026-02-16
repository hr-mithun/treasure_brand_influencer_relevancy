import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { errorHandler } from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import ingest from "./routes/ingest.js";
import recommendations from "./routes/recommendations.js";
import interactions from "./routes/interactions.js";
import graph from "./routes/graph.js";
import { requestId } from "./middlewares/requestId.js";
import tools from "./routes/tools.js";
import "../src/tools/specs.js"; // ensures registry is populated
import agent from "./routes/agent.js";
import agentSessions from "./routes/agentSessions.js";
import aiRoutes from "./routes/ai.js";
import campaignRoutes from "./routes/campaigns.js";
import aiOrchestrationsRoutes from "./routes/aiOrchestrations.js";
import aiModelsRoutes from "./routes/aiModels.js";








export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(pinoHttp());
  app.use(requestId);
  app.use("/api", apiLimiter);
  app.use("/api/ingest", ingest);
  app.use("/api/recommendations", recommendations);
  app.use("/api/interactions", interactions);
  app.use("/api/graph", graph);
  app.use("/api/tools", tools);
  app.use("/api/agent", agent);
  app.use("/api/agent/sessions", agentSessions);
  app.use("/api/ai", aiRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api", aiOrchestrationsRoutes);
  app.use("/api", aiModelsRoutes);







  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(errorHandler);
  return app;
}
