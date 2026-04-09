import { Hono } from "hono";
import { type RegistryConfig, loadConfig } from "./config.js";
import { createDb, type RegistryDb } from "./db/connection.js";
import {
  createFsBlobStore,
  type BlobStore,
} from "./storage/blob-store.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createRoutes } from "./routes/index.js";

export interface AppContext {
  config: RegistryConfig;
  db: RegistryDb;
  blobStore: BlobStore;
}

export function createApp(overrides?: Partial<AppContext>) {
  const config = overrides?.config ?? loadConfig();
  const db = overrides?.db ?? createDb(config);
  const blobStore = overrides?.blobStore ?? createFsBlobStore(config.dataDir);

  const ctx: AppContext = { config, db, blobStore };

  const app = new Hono();
  app.onError(errorHandler);

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.route("/", createRoutes(ctx));

  return app;
}
