import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const { Client } = pg;
const connectionString = "postgresql://gg_user:gg_dev_password@localhost:5432/placement";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Dropping and recreating public schema...");
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");

  console.log("Schema reset. Running Prisma migrations...");
  execSync('pnpm --filter @workspace/db-prisma run migrate:deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: connectionString }
  });

  console.log("Prisma migrations applied. Applying Drizzle migrations (merging schemas)...");
  const sqlFile = path.join('lib', 'db', 'drizzle', '0000_early_speed.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  const statements = sqlContent.split('--> statement-breakpoint');

  for (let statement of statements) {
    statement = statement.trim();
    if (!statement) continue;
    try {
      await client.query(statement);
    } catch (err) {
      // 42P07: relation already exists
      // 42710: type already exists
      // 42P16: multiple primary keys (if trying to add primary key to existing table)
      // 42701: column already exists
      if (['42P07', '42710', '42P16', '42701'].includes(err.code)) {
        // Ignore expected duplicate definition errors during merge
      } else {
        console.error(`Error executing statement:\n${statement}\n`, err);
      }
    }
  }

  console.log("Drizzle migrations merged successfully!");
  await client.end();
}

run().catch(console.error);
