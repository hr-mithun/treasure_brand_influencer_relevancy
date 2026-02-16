import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().optional(),
  MONGODB_URI: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().min(1).default("llama-3.3-70b-versatile"),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid env: ${msg}`);
  }
  return parsed.data;
}
