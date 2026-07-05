/**
 * Phase 16 Database Migration
 * Creates: subscription_plans, tenant_subscriptions, tenant_usages, workspace_invites
 * Alters: tenant_settings (adds new workspace config columns)
 * Safe: All operations use IF NOT EXISTS / IF NOT EXISTS column checks
 */
import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://gg_user:gg_dev_password@localhost:5432/placement' });
await client.connect();

const steps = [
  {
    name: "Extend tenant_settings with workspace columns",
    sql: `
      ALTER TABLE tenant_settings
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS favicon_url TEXT,
        ADD COLUMN IF NOT EXISTS primary_color TEXT,
        ADD COLUMN IF NOT EXISTS company_name TEXT,
        ADD COLUMN IF NOT EXISTS company_website TEXT,
        ADD COLUMN IF NOT EXISTS company_address TEXT,
        ADD COLUMN IF NOT EXISTS company_phone TEXT,
        ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
        ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
        ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
        ADD COLUMN IF NOT EXISTS email_from_name TEXT,
        ADD COLUMN IF NOT EXISTS email_from_address TEXT,
        ADD COLUMN IF NOT EXISTS email_reply_to TEXT,
        ADD COLUMN IF NOT EXISTS email_signature TEXT,
        ADD COLUMN IF NOT EXISTS ai_provider TEXT NOT NULL DEFAULT 'openai',
        ADD COLUMN IF NOT EXISTS ai_model TEXT,
        ADD COLUMN IF NOT EXISTS ai_base_url TEXT,
        ADD COLUMN IF NOT EXISTS ai_api_key_encrypted TEXT,
        ADD COLUMN IF NOT EXISTS notify_on_new_candidate BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_on_stage_change BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_on_offer_release BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_on_assessment BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_on_joining BOOLEAN NOT NULL DEFAULT true;
    `
  },
  {
    name: "Create subscription_plans table",
    sql: `
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                     TEXT UNIQUE NOT NULL,
        display_name             TEXT NOT NULL,
        price_monthly            DECIMAL(10,2) NOT NULL DEFAULT 0,
        price_yearly             DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active                BOOLEAN NOT NULL DEFAULT true,
        max_recruiters           INT,
        max_candidates           INT,
        max_companies            INT,
        max_jobs                 INT,
        max_storage_mb           INT,
        max_ai_credits_monthly   INT,
        max_assessments          INT,
        max_active_pipelines     INT,
        max_resume_parses_monthly INT,
        max_ai_matches_monthly   INT,
        max_emails_monthly       INT,
        features                 JSONB NOT NULL DEFAULT '{}',
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  },
  {
    name: "Seed default subscription plans",
    sql: `
      INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly,
        max_recruiters, max_candidates, max_companies, max_jobs, max_storage_mb,
        max_ai_credits_monthly, max_assessments, max_active_pipelines,
        max_resume_parses_monthly, max_ai_matches_monthly, max_emails_monthly,
        features)
      VALUES
        ('FREE',         'Free',         0,      0,     2,    100,   10,   5,   500,   50,   20,   20,   10,   10,   100,
         '{"clientPortal":false,"candidatePortal":false,"customBranding":false,"apiAccess":false,"advancedAnalytics":false}'),
        ('STARTER',      'Starter',      2999,   29990, 5,    1000,  50,   25,  2048,  500,  200,  100,  100,  100,  1000,
         '{"clientPortal":true,"candidatePortal":false,"customBranding":true,"apiAccess":false,"advancedAnalytics":false}'),
        ('PROFESSIONAL', 'Professional', 9999,   99990, 20,   10000, 500,  200, 20480, 2000, 2000, 500,  500,  500,  5000,
         '{"clientPortal":true,"candidatePortal":true,"customBranding":true,"apiAccess":true,"advancedAnalytics":true}'),
        ('ENTERPRISE',   'Enterprise',   0,      0,     NULL, NULL,  NULL, NULL,NULL,  NULL, NULL, NULL, NULL, NULL, NULL,
         '{"clientPortal":true,"candidatePortal":true,"customBranding":true,"apiAccess":true,"advancedAnalytics":true}')
      ON CONFLICT (name) DO NOTHING;
    `
  },
  {
    name: "Create tenant_subscriptions table",
    sql: `
      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id             UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_id               UUID NOT NULL REFERENCES subscription_plans(id),
        status                TEXT NOT NULL DEFAULT 'TRIAL',
        trial_ends_at         TIMESTAMPTZ,
        current_period_start  TIMESTAMPTZ NOT NULL,
        current_period_end    TIMESTAMPTZ NOT NULL,
        cancelled_at          TIMESTAMPTZ,
        stripe_customer_id    TEXT,
        stripe_subscription_id TEXT,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  },
  {
    name: "Create tenant_usages table",
    sql: `
      CREATE TABLE IF NOT EXISTS tenant_usages (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        period_month       INT NOT NULL,
        period_year        INT NOT NULL,
        ai_credits_used    INT NOT NULL DEFAULT 0,
        resume_parses_used INT NOT NULL DEFAULT 0,
        ai_matches_used    INT NOT NULL DEFAULT 0,
        emails_sent_used   INT NOT NULL DEFAULT 0,
        storage_mb_used    DECIMAL(12,2) NOT NULL DEFAULT 0,
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, period_month, period_year)
      );
    `
  },
  {
    name: "Create workspace_invites table",
    sql: `
      CREATE TABLE IF NOT EXISTS workspace_invites (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email        TEXT NOT NULL,
        role_id      UUID NOT NULL REFERENCES roles(id),
        token        TEXT UNIQUE NOT NULL,
        invited_by_id UUID NOT NULL REFERENCES users(id),
        expires_at   TIMESTAMPTZ NOT NULL,
        accepted_at  TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
      CREATE INDEX IF NOT EXISTS idx_workspace_invites_tenant ON workspace_invites(tenant_id);
    `
  },
  {
    name: "Back-fill existing tenants with FREE subscription",
    sql: `
      INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
      SELECT
        t.id,
        (SELECT id FROM subscription_plans WHERE name = 'FREE'),
        'TRIAL',
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '30 days'
      FROM tenants t
      WHERE NOT EXISTS (SELECT 1 FROM tenant_subscriptions ts WHERE ts.tenant_id = t.id)
        AND t.deleted_at IS NULL;
    `
  },
];

let success = 0;
for (const step of steps) {
  try {
    await client.query(step.sql);
    console.log(`✅ ${step.name}`);
    success++;
  } catch (err) {
    console.error(`❌ ${step.name}: ${err.message}`);
  }
}

console.log(`\n${success}/${steps.length} migration steps completed`);
await client.end();
