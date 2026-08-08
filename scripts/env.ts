/**
 * Loads .env.local with the same precedence Next.js uses.
 *
 * Must be imported before anything that reads process.env, since ES
 * modules evaluate imports in declaration order, before the importing
 * file's body runs. `dotenv/config` would not work here — it only reads
 * .env, not .env.local.
 *
 * @next/env ships with Next, so there is nothing extra to install.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
