import { Router } from "express";
import { TOOL_REGISTRY } from "../tools/registry.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    tools: TOOL_REGISTRY.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema._def, // lightweight; good enough for internal use
    }))
  });
});

export default router;
