/**
 * Dev server launcher. Sets TLS bypass before Next.js starts so server actions
 * can reach Supabase on networks with SSL inspection / broken cert chains.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const args = ["dev", ...process.argv.slice(2)];

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

child.on("exit", (code) => process.exit(code ?? 0));
