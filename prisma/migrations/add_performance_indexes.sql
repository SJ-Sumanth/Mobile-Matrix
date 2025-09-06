-- Performance optimization indexes for MobileMatrix database
-- This migration adds indexes to improve query performance

-- Indexes for Brand table
CREATE INDEX IF NOT EXISTS "idx_brands_name" ON "brands" ("name");
CREATE INDEX IF NOT EXISTS "idx_brands_slug" ON "brands" ("slug");
CREATE INDEX IF NOT EXISTS "idx_brands_active" ON "brands" ("isActive");

-- Indexes for Phone table
CREATE INDEX IF NOT EXISTS "idx_phones_brand_id" ON "phones" ("brandId");
CREATE INDEX IF NOT EXISTS "idx_phones_model" ON "phones" ("model");
CREATE INDEX IF NOT EXISTS "idx_phones_availability" ON "phones" ("availability");
CREATE INDEX IF NOT EXISTS "idx_phones_active" ON "phones" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_phones_price" ON "phones" ("currentPrice");
CREATE INDEX IF NOT EXISTS "idx_phones_launch_date" ON "phones" ("launchDate");
CREATE INDEX IF NOT EXISTS "idx_phones_brand_model" ON "phones" ("brandId", "model");
CREATE INDEX IF NOT EXISTS "idx_phones_search" ON "phones" ("brandId", "model", "variant", "isActive");

-- Composite index for phone search queries
CREATE INDEX IF NOT EXISTS "idx_phones_search_composite" ON "phones" 
  ("isActive", "brandId", "model", "currentPrice", "launchDate");

-- Full-text search index for phone model (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS "idx_phones_model_gin" ON "phones" 
  USING gin(to_tsvector('english', "model"));

-- Indexes for PhoneSpecification table
CREATE INDEX IF NOT EXISTS "idx_phone_specs_phone_id" ON "phone_specifications" ("phoneId");
CREATE INDEX IF NOT EXISTS "idx_phone_specs_processor" ON "phone_specifications" ("processor");
CREATE INDEX IF NOT EXISTS "idx_phone_specs_battery" ON "phone_specifications" ("batteryCapacity");
CREATE INDEX IF NOT EXISTS "idx_phone_specs_display" ON "phone_specifications" ("displaySize", "displayType");

-- Indexes for ChatSession table
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_session_id" ON "chat_sessions" ("sessionId");
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_user_id" ON "chat_sessions" ("userId");
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_active" ON "chat_sessions" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_created" ON "chat_sessions" ("createdAt");

-- Indexes for ChatMessage table
CREATE INDEX IF NOT EXISTS "idx_chat_messages_session_id" ON "chat_messages" ("chatSessionId");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_role" ON "chat_messages" ("role");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_created" ON "chat_messages" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_session_created" ON "chat_messages" ("chatSessionId", "createdAt");

-- Indexes for PhoneComparison table
CREATE INDEX IF NOT EXISTS "idx_phone_comparisons_session_id" ON "phone_comparisons" ("chatSessionId");
CREATE INDEX IF NOT EXISTS "idx_phone_comparisons_phone1" ON "phone_comparisons" ("phone1Id");
CREATE INDEX IF NOT EXISTS "idx_phone_comparisons_phone2" ON "phone_comparisons" ("phone2Id");
CREATE INDEX IF NOT EXISTS "idx_phone_comparisons_share_token" ON "phone_comparisons" ("shareToken");
CREATE INDEX IF NOT EXISTS "idx_phone_comparisons_created" ON "phone_comparisons" ("createdAt");

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS "idx_phones_active_available" ON "phones" ("brandId", "model") 
  WHERE "isActive" = true AND "availability" = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS "idx_chat_sessions_active_recent" ON "chat_sessions" ("userId", "createdAt") 
  WHERE "isActive" = true;

-- Indexes for array columns (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS "idx_phone_specs_ram_gin" ON "phone_specifications" 
  USING gin("ramOptions");

CREATE INDEX IF NOT EXISTS "idx_phone_specs_storage_gin" ON "phone_specifications" 
  USING gin("storageOptions");

CREATE INDEX IF NOT EXISTS "idx_phone_specs_colors_gin" ON "phone_specifications" 
  USING gin("colors");

-- Statistics update for better query planning
ANALYZE "brands";
ANALYZE "phones";
ANALYZE "phone_specifications";
ANALYZE "chat_sessions";
ANALYZE "chat_messages";
ANALYZE "phone_comparisons";