import { mkdir, readFile, unlink, open } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { AuthenticationError, normalizeCookie } from "@wic-energy/core";
export function sessionPath() {
  return path.resolve(
    process.env.WIC_SESSION_FILE ??
      path.join(homedir(), ".config/wic-energy/session.json"),
  );
}
export async function readSession(file: string, baseUrl: string) {
  try {
    const data = JSON.parse(await readFile(file, "utf8"));
    if (data.baseUrl !== baseUrl)
      throw new AuthenticationError("会话所属学校地址已变化，请重新登录");
    return normalizeCookie(data.cookie);
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError("没有可用的本地会话，请先执行 login");
  }
}
export async function saveSession(
  file: string,
  cookie: string,
  baseUrl: string,
) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  // Open existing files without following symlinks and restrict before writing.
  const handle = await open(
    file,
    constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await handle.chmod(0o600);
    await handle.truncate(0);
    await handle.writeFile(
      JSON.stringify({
        cookie: normalizeCookie(cookie),
        baseUrl,
        savedAt: new Date().toISOString(),
      }) + "\n",
    );
  } finally {
    await handle.close();
  }
}
export async function clearSession(file: string) {
  try {
    await unlink(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
