import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Runs once before the entire Playwright test suite.
 * Seeds the database with deterministic test personas.
 */
export default async function globalSetup(): Promise<void> {
  const client = new Client({
    user: process.env.DB_USER ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    database: process.env.DB_NAME ?? 'serpapi-app',
    password: process.env.DB_PASSWORD ?? '123456',
    port: Number(process.env.DB_PORT ?? 5432),
  });

  await client.connect();

  const seedPath = path.join(__dirname, 'fixtures', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf-8');

  // Split on statement-ending semicolons (handles multi-statement SQL files)
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.query(stmt);
  }

  await client.end();

  console.log('[global-setup] DB seed complete.');
}
