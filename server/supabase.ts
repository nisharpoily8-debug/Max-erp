import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

// Lazy client references
let supabaseClient: SupabaseClient | null = null;
let pgPool: pg.Pool | null = null;

/**
 * Returns a configured Supabase client using environment variables.
 * Fails safely if environment variables are not yet provided.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}

/**
 * Returns a direct PostgreSQL connection pool for Supabase Postgres.
 * Fails safely if DATABASE_URL is not yet provided.
 */
export function getPgPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    return null;
  }

  if (!pgPool) {
    pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Supabase SSL connections
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pgPool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
    });
  }

  return pgPool;
}

/**
 * Checks connection health to Supabase and PostgreSQL.
 * Safe diagnostics that never expose credentials or passwords.
 */
export async function checkDatabaseHealth(): Promise<{
  configured: boolean;
  type: 'supabase_rest' | 'postgres_direct' | 'none';
  connected: boolean;
  message: string;
}> {
  const pool = getPgPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query('SELECT current_database(), version()');
        return {
          configured: true,
          type: 'postgres_direct',
          connected: true,
          message: `Connected to PostgreSQL database: ${res.rows[0]?.current_database || 'supabase'}`,
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      return {
        configured: true,
        type: 'postgres_direct',
        connected: false,
        message: `PostgreSQL connection error: ${err.message}`,
      };
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      // Query a public system/test endpoint or check auth health
      const { error } = await supabase.from('erp_snapshots').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
        return {
          configured: true,
          type: 'supabase_rest',
          connected: false,
          message: `Supabase query error: ${error.message}`,
        };
      }
      return {
        configured: true,
        type: 'supabase_rest',
        connected: true,
        message: 'Supabase REST API connected successfully.',
      };
    } catch (err: any) {
      return {
        configured: true,
        type: 'supabase_rest',
        connected: false,
        message: `Supabase connection error: ${err.message}`,
      };
    }
  }

  return {
    configured: false,
    type: 'none',
    connected: false,
    message: 'Database not yet configured. Set SUPABASE_URL & SUPABASE_ANON_KEY or DATABASE_URL in environment variables.',
  };
}

/**
 * Initializes required tables in PostgreSQL if direct pool connection is available.
 */
export async function initializeDatabaseTables(): Promise<{ success: boolean; message: string }> {
  const pool = getPgPool();
  if (!pool) {
    return {
      success: false,
      message: 'Direct PostgreSQL pool is not available. Please provide DATABASE_URL in environment variables.',
    };
  }

  const initSql = `
    CREATE TABLE IF NOT EXISTS erp_snapshots (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'default_org',
      company_data JSONB NOT NULL,
      partners JSONB NOT NULL DEFAULT '[]'::jsonb,
      products JSONB NOT NULL DEFAULT '[]'::jsonb,
      sales_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
      purchase_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
      inventory_movements JSONB NOT NULL DEFAULT '[]'::jsonb,
      journal_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
      delivery_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
      audit_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS erp_sync_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(64) NOT NULL,
      entity_id VARCHAR(128),
      payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    try {
      await client.query(initSql);
      return {
        success: true,
        message: 'Database tables verified and initialized successfully in Supabase PostgreSQL.',
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to initialize tables: ${err.message}`,
    };
  }
}
