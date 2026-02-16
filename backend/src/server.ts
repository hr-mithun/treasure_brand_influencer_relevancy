import dotenv from "dotenv";
dotenv.config();

import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

async function main() {
  const env = getEnv();

  await connectDb(env.MONGODB_URI);

  const app = createApp();
  const port = Number(env.PORT || 4000);
  app.listen(port, () => console.log(`🚀 API running http://localhost:${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
