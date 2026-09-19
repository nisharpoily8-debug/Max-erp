-- ==============================================================================
-- Maxerp: Supabase PostgreSQL Schema for Hostinger Node.js Web Apps
-- Run this SQL in your Supabase Project Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Main ERP JSON snapshot table for resilient cross-device state synchronization
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

-- 2. Audit Trail & Sync Events Table (Immutable ledger)
CREATE TABLE IF NOT EXISTS erp_sync_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(128),
  actor_id VARCHAR(64),
  actor_name VARCHAR(128),
  payload JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Trigger for automatically updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_erp_snapshots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_erp_snapshots_timestamp ON erp_snapshots;
CREATE TRIGGER trigger_erp_snapshots_timestamp
BEFORE UPDATE ON erp_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_erp_snapshots_timestamp();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE erp_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sync_events ENABLE ROW LEVEL SECURITY;

-- Allow service role and anon key access (for authorized API backend)
CREATE POLICY "Allow server backend full access to erp_snapshots"
ON erp_snapshots FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow server backend full access to erp_sync_events"
ON erp_sync_events FOR ALL
USING (true)
WITH CHECK (true);
