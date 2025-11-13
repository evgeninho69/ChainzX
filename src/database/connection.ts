import { Pool } from 'pg';
import { config } from 'dotenv';

// Load .env file explicitly, overriding any system env vars
const envResult = config({ override: true });
if (envResult.error) {
  console.warn('Warning: .env file not found or error loading it');
}

// Parse DATABASE_URL or use individual parameters
let poolConfig: any = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  const username = url.username || process.env.DB_USER || process.env.USER || 'evgeniyzotkin';
  
  poolConfig = {
    ...poolConfig,
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // Remove leading /
    user: username,
    password: url.password || process.env.DB_PASSWORD,
  };
  
  console.log(`Connecting to DB as user: ${username}, database: ${url.pathname.slice(1)}`);
} else {
  poolConfig = {
    ...poolConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'chainz',
    user: process.env.DB_USER || 'evgeniyzotkin',
    password: process.env.DB_PASSWORD,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;

