#!/usr/bin/env node
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { runCli } from "./cli.js";
async function ask(label: string, hidden = false): Promise<string> {
  if (!process.stdin.isTTY)
    throw new Error("交互登录需要终端；自动化查询请使用 --cookie");
  if (!hidden) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    try {
      return await rl.question(label);
    } finally {
      rl.close();
    }
  }
  process.stderr.write(label);
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error?: Error) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(wasRaw);
      process.stdin.pause();
      process.stderr.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          finish();
          return;
        }
        if (char === "\u0003" || char === "\u0004") {
          finish(new Error("登录已取消"));
          return;
        }
        if (char === "\u007f" || char === "\b")
          value = Array.from(value).slice(0, -1).join("");
        else if (char >= " ") value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}
runCli(process.argv.slice(2), {
  ask,
  print: (value) =>
    console.log(
      typeof value === "string" ? value : JSON.stringify(value, null, 2),
    ),
}).catch((error) => {
  console.error(
    JSON.stringify({
      error: { code: error.code ?? "CLI_ERROR", message: error.message },
    }),
  );
  process.exitCode = 1;
});
