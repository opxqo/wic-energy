import express from "express";
import { createApp } from "../../apps/web/src/app.js";

const app = express();
app.disable("x-powered-by");

// EdgeOne mounts this catch-all function at /api and may pass the path to
// Express either with or without that mount prefix. Normalize both forms to
// the routes shared with the local server and Vercel adapter.
app.use((req, _res, next) => {
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});

app.use(createApp());

export default app;
