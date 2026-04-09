import path from "node:path";

export interface RegistryConfig {
  port: number;
  dataDir: string;
  databasePath: string;
  baseUrl: string;
  defaultOwner: string;
  maxPackSize: number;
}

export function loadConfig(): RegistryConfig {
  const dataDir = process.env["DATA_DIR"] ?? "./.data";
  return {
    port: parseInt(process.env["PORT"] ?? "3002", 10),
    dataDir,
    databasePath:
      process.env["DATABASE_PATH"] ?? path.join(dataDir, "registry.db"),
    baseUrl: process.env["BASE_URL"] ?? "http://localhost:3002",
    defaultOwner: process.env["DEFAULT_OWNER"] ?? "local",
    maxPackSize: parseInt(
      process.env["MAX_PACK_SIZE"] ?? "104857600",
      10,
    ),
  };
}
