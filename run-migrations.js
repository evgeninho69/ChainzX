// Production migration runner for Beget
// Usage: node run-migrations.js

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const migrations = [
  '001_init.sql',
  '002_guilds.sql',
  '003_characters.sql',
];

function runMigrations() {
  console.log('Starting migrations...');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  // Parse DATABASE_URL: postgresql://user:password@host:port/database
  const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  
  if (!urlMatch) {
    console.error('Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database');
    process.exit(1);
  }

  const [, dbUser, dbPassword, dbHost, dbPort, dbName] = urlMatch;
  
  // Set PGPASSWORD environment variable for psql
  process.env.PGPASSWORD = dbPassword;

  for (const migration of migrations) {
    try {
      const sqlPath = path.join(__dirname, 'dist', 'database', 'migrations', migration);
      
      // Check if compiled migration exists, otherwise use source
      const sourcePath = path.join(__dirname, 'src', 'database', 'migrations', migration);
      const migrationPath = fs.existsSync(sqlPath) ? sqlPath : sourcePath;
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found: ${migrationPath}`);
        process.exit(1);
      }
      
      console.log(`Running migration: ${migration}`);
      
      // Execute via psql
      const psqlCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${migrationPath}"`;
      
      execSync(psqlCommand, {
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
}

runMigrations();

