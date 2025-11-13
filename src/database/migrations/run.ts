import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  '001_init.sql',
  '002_guilds.sql',
  '003_characters.sql',
];

async function runMigrations() {
  console.log('Starting migrations...');
  
  const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/chainz';
  // Extract database name from URL
  const dbMatch = dbUrl.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  const dbName = dbMatch ? dbMatch[5] : 'chainz';
  
  for (const migration of migrations) {
    try {
      const sqlPath = join(__dirname, migration);
      
      console.log(`Running migration: ${migration}`);
      
      // Execute via psql
      execSync(`psql -d ${dbName} -f "${sqlPath}"`, {
        stdio: 'inherit',
        env: process.env
      });
      
      console.log(`✓ Migration ${migration} completed`);
    } catch (error) {
      console.error(`✗ Migration ${migration} failed:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed!');
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});

