import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as httpsServer } from "node:https";
import { createApp } from "./app.js";
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT 无效");
const { SSL_CERT, SSL_KEY } = process.env;
if (Boolean(SSL_CERT) !== Boolean(SSL_KEY))
  throw new Error("SSL_CERT 和 SSL_KEY 必须同时设置");
const app = createApp();
const server =
  SSL_CERT && SSL_KEY
    ? httpsServer(
        { cert: await readFile(SSL_CERT), key: await readFile(SSL_KEY) },
        app,
      )
    : createServer(app);
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, host, () =>
  console.log(
    "WIC Energy: " + (SSL_CERT ? "https" : "http") + "://" + host + ":" + port,
  ),
);
