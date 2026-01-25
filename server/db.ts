import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          rancher_api_url VARCHAR(500),
          rancher_api_token VARCHAR(500),
          rancher_cluster_id VARCHAR(255),
          namespace_counter INT DEFAULT 0
        );
      `);

      // Create deployments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS deployments (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          namespace VARCHAR(255) NOT NULL,
          yaml_config TEXT NOT NULL,
          deployment_config JSONB,
          status VARCHAR(50) DEFAULT 'pending',
          environment VARCHAR(50) DEFAULT 'production',
          workloads_count INT DEFAULT 0,
          resources_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add deployment_config column if it doesn't exist (migration)
      await client.query(`
        ALTER TABLE deployments ADD COLUMN IF NOT EXISTS deployment_config JSONB;
      `);

      // Create index for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
      `);

      console.log("✅ Database initialized successfully");
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err.code === "ECONNREFUSED") {
      console.warn(
        "⚠️  PostgreSQL not running. Database will initialize when connection is available.",
      );
    } else if (err.message?.includes("already exists")) {
      console.log("✅ Database tables already exist");
    } else {
      console.error("❌ Database initialization error:", err.message);
    }
  }
}

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}

export async function getPool() {
  return pool;
}
