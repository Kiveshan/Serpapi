import { Client } from 'pg';

function makeClient(): Client {
  return new Client({
    user: process.env.DB_USER ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    database: process.env.DB_NAME ?? 'serpapi-app',
    password: process.env.DB_PASSWORD ?? '123456',
    port: Number(process.env.DB_PORT ?? 5432),
  });
}

/**
 * Remove a test user by email. Call in afterEach for tests that INSERT new users
 * (e.g., registration happy-path with a real DB call) to keep the DB clean.
 */
export async function deleteTestUser(email: string): Promise<void> {
  const client = makeClient();
  await client.connect();
  await client.query('DELETE FROM user_table WHERE institutionemail = $1', [email]);
  await client.end();
}

/**
 * Fetch a user row by email. Useful for asserting DB state after registration.
 */
export async function getTestUser(email: string): Promise<Record<string, unknown> | null> {
  const client = makeClient();
  await client.connect();
  const result = await client.query(
    'SELECT * FROM user_table WHERE institutionemail = $1',
    [email]
  );
  await client.end();
  return result.rows[0] ?? null;
}
