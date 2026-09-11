import { z } from "zod";
const schema = z
  .object({
    WIC_BASE_URL: z.string().url().default("http://sd.wic.edu.cn/mobile/"),
    WIC_TIMEOUT_MS: z.coerce.number().int().min(100).max(120000).default(15000),
  })
  .refine(
    (v) => ["http:", "https:"].includes(new URL(v.WIC_BASE_URL).protocol),
    "上游必须使用 HTTP 或 HTTPS",
  );
export function connectionConfig(env: NodeJS.ProcessEnv = process.env) {
  const value = schema.parse(env);
  return { baseUrl: value.WIC_BASE_URL, timeoutMs: value.WIC_TIMEOUT_MS };
}
